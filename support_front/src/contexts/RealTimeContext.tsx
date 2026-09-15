import type { MessageRow, Profile, TicketUnreadData, UserConversation, UserTicket } from "@/apis/types";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/context/useAuth";
import { RealtimeContext } from "@/contexts/realtime-context";
import { useMatch, useNavigate } from "react-router";
import { appRoutes } from "@/config";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { showMessageToast } from "@/utils/messageToast";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { ticketMessagesKey, type ChatMessage } from "@/hooks/messages/useTicketMessages";
import { findProfile } from "@/apis/public";
import { conversationKey } from "@/hooks/messages/useConversations";
import { fetchUnreadCounts, findConversationById, findUserTicket, markTicketRead } from "@/apis/messages";

const profileCache: Record<string, Profile> = {};
const ticketUsersCache: Record<string, UserTicket | undefined> = {};

/**
 * Load the profile in a local cache to avoid refetching every time
 * @param senderId 
 * @returns 
 */
const loadProfileById = async (senderId : string) => {
    if (profileCache[senderId]) {
        return profileCache[senderId]
    }
    const dbProfile = (await findProfile(senderId)).data;
    // cache profile for next realtime updates
    if (dbProfile) {
        profileCache[senderId] = dbProfile;
    }
    return dbProfile;
}


/**
 * Load the ticket participants (client + agent ids) of the given ticket and cache result.
 * Uses the membership-scoped `findUserTicket` RPC: callers who are not part
 * of the ticket get `null` (even admins, who can see every ticket via RLS),
 * so realtime filtering below never fires for unrelated tickets.
 * @param ticketId
 * @returns
 */
const loadTicketUsersById = async (ticketId : string) => {
    const cachedEntry = ticketUsersCache[ticketId];
    if (cachedEntry) {
        return cachedEntry
    }
    const ticketUsers = (await findUserTicket(ticketId)).data as UserTicket | null;
    // cache ticket users for next realtime updates
    // (agent assignment is append-only per ticket: unassigned -> assigned,
    // so refresh the entry once an agent appears)
    if (ticketUsers) {
        const prev = ticketUsersCache[ticketId];
        if (!prev || (!prev.agent_id && ticketUsers.agent_id)) {
            ticketUsersCache[ticketId] = ticketUsers;
            return ticketUsers;
        }
        return prev;
    }
    return null;
}


export function RealtimeProvider({ children }: { children: ReactNode }) {

    const { user } = useAuth();
    const queryClient = useQueryClient();

    const onMessagesPage = Boolean(useMatch(appRoutes.MESSAGES_TICKET));
    const onConversationPage = Boolean(useMatch(appRoutes.MESSAGES));
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
    const [openTicketId, setOpenTicketId] = useState<string | null>(null);

    // dedupe: our own INSERT (and any supabase redelivery) comes back through the same feed
    const seenIdsRef = useRef<Set<string>>(new Set());
    // refs so the subscription callback always reads fresh values without re-subscribing.
    const userRef = useRef(user);
    const openTicketIdRef = useRef<string | null>(null);
    const onMessagesPageRef = useRef(false);
    const onConversationPageRef = useRef(false);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        openTicketIdRef.current = openTicketId;
    }, [openTicketId]);

    useEffect(() => {
        onConversationPageRef.current = onConversationPage;
    }, [onConversationPage]);

    useEffect(() => {
        onMessagesPageRef.current = onMessagesPage;
    }, [onMessagesPage]);


    const openTicket = useCallback((ticketId: string) => {
        setOpenTicketId(ticketId);
        // opening a ticket == read new messages
        const ticketUnreadCount = unreadByTicket[ticketId] ?? 0;
        setUnreadCount((n) => {
            return n - ticketUnreadCount
        })
        setUnreadByTicket((prev) => {
            if (!(ticketId in prev)) return prev;
            // extract ticketId entry and keep the rest in rest variable
            const { [ticketId]: _cleared, ...rest } = prev;
            return rest;
        });
        markTicketRead(ticketId); // fire and forget
    }, [unreadByTicket]);


    const closeTicket = useCallback((ticketId : string | undefined) => {
        setOpenTicketId(null);
        if (ticketId) {
            markTicketRead(ticketId); // update last_read_at when closing to avoid conflict if messages arrived by the realtime
        }
    }, []);

    const resetUnread = useCallback(() => setUnreadCount(0), []);

    // init unread counts at app boots for the current user
    useEffect(() => {
        if (!user) return;

        fetchUnreadCounts().then((rows) => {
            // silently break the logic
            if (rows.status === "fail") {
                return;
            }
            const byTicket: Record<string, number> = {};
            let total = 0;
            for (const row of rows.data as TicketUnreadData[]) {
                byTicket[row.ticket_id] = row.unread_count;
                total += row.unread_count;
            }
            setUnreadByTicket(byTicket);
            setUnreadCount(total);
        });
    }, [user]);


    // Single global channel: postgres_changes on the messages table.
    // Instead of refetching a ticket's message list on every insert (expensive,
    // and unnecessary), we patch the react-query cache for that ticket directly.
    // If that ticket's query isn't currently mounted, there's nothing to patch
    // it'll simply be fetched fresh (including this row) next time it's opened.
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel("messages-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                async (payload: RealtimePostgresChangesPayload<MessageRow>) => {

                    const row = payload.new as ChatMessage;
                    if (seenIdsRef.current.has(row.id)) return;
                    seenIdsRef.current.add(row.id); // ignore duplicated postgres signals

                    const currentUserId = userRef.current?.id;
                    const isMine = row.sender_id === currentUserId;
                    const isViewingTicket =
                        openTicketIdRef.current === row.ticket_id && onMessagesPageRef.current;

                    // patch the message list
                    const senderProfile = await loadProfileById(row.sender_id);
                    const ticketUsers = await loadTicketUsersById(row.ticket_id);
                    const isTicketMember = currentUserId != null && ticketUsers != null &&
                        (ticketUsers.client_id === currentUserId || ticketUsers.agent_id === currentUserId);
                    // patch the message list (for all)
                    queryClient.setQueryData<ChatMessage[]>(
                        ticketMessagesKey(row.ticket_id),
                        (old) => {
                            if (!old) return old;
                            if (old.some((m) => m.id === row.id)) return old;
                            return [
                                ...old, 
                                {...row, sender: senderProfile ? {username: senderProfile.username, role: senderProfile.role} : null}
                            ]; // add the new message to the list
                        }
                    );

                    // patch the conversation list 
                    const listKey = conversationKey(currentUserId ?? "");
                    const cached = queryClient.getQueryData<InfiniteData<UserConversation[]>>(listKey);

                    if (cached && isTicketMember) {
                        // extract ticket ids from all the loaded pages (list of pages containing list of ids)
                        const loadedIds = new Set(cached.pages.flat().map((c) => c.id));

                        // already loaded --> refresh preview + bump to top
                        if (loadedIds.has(row.ticket_id)) {
                            queryClient.setQueryData<InfiniteData<UserConversation[]>>(listKey, (old) => {
                                if (!old) return old;
                                const flat = old.pages.flat();
                                const existing = flat.find((c) => c.id === row.ticket_id);
                                if (!existing) return old; // safe guard, should be included if the set returns true
                                
                                const updated: UserConversation = {
                                    ...existing,
                                    last_message_content: row.content,
                                    last_message_at: row.created_at,
                                    last_message_username: senderProfile?.username ?? "anonymous"
                                };
                                // remove the conversation from pages
                                const pages = old.pages.map((page) =>
                                    page.filter((c) => c.id !== row.ticket_id)
                                );
                                // add it to the top
                                pages[0] = [updated, ...pages[0]];
                                return { ...old, pages };
                            });
                        } else {
                            // not loaded yet --> fetch its summary, then insert once resolved
                            const res = await findConversationById(row.ticket_id);
                            if (res.status === "success" && res.data) {
                                queryClient.setQueryData<InfiniteData<UserConversation[]>>(listKey, (old) => {
                                    if (!old) return old;
                                    // inner set to avoid race condition if 2 messages are sent simultanously to avoid adding twice the conversation
                                    const alreadyThere = new Set(old.pages.flat().map((c) => c.id));
                                    if (alreadyThere.has(row.ticket_id)) return old; // deduped
                                    const pages = [...old.pages];
                                    pages[0] = [res.data as UserConversation, ...pages[0]];
                                    return { ...old, pages };
                                });
                            }
                        }
                    }

                    // fire notification if not on the message page and add badge count.
                    if (!isViewingTicket && !isMine && isTicketMember) {
                        setUnreadCount((n) => n + 1);
                        setUnreadByTicket((prev) => ({
                            ...prev,
                            [row.ticket_id]: (prev[row.ticket_id] ?? 0) + 1,
                        }));
                        showMessageToast(
                            senderProfile,
                            row.content ?? "",
                            () => navigate(appRoutes.MESSAGES_TICKET.replace(":ticketId", row.ticket_id)),
                            row.attachment_mime_type, 
                            row.attachment_url, 
                            row.attachment_name
                        );
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, queryClient, navigate]);

    return (
        <RealtimeContext.Provider
            value={{ unreadCount, unreadByTicket, openTicketId, openTicket, closeTicket, resetUnread }}
        >
            {children}
        </RealtimeContext.Provider>
    );
}