import type { MessageRow } from "@/apis/types";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useMatch } from "react-router";
import { appRoutes } from "@/config";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { showInfoToast } from "@/utils/showToast";
import { useQueryClient } from "@tanstack/react-query";
import { ticketMessagesKey, type ChatMessage } from "@/hooks/messages/useTicketMessages";

interface RealtimeContextValue {
    unreadCount: number;
    openTicketId: string | null;
    openTicket: (ticketId: string) => void;
    closeTicket: () => void;
    resetUnread: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {

    const { user } = useAuth();
    const queryClient = useQueryClient();

    // NOTE: the original code compared `location.pathname === appRoutes.MESSAGES_TICKET`
    // directly, twice (a copy-paste no-op). MESSAGES_TICKET is a dynamic route
    // ("/messages/:ticketId"), so that comparison could never actually match.
    // useMatch does the real route matching instead.
    const onMessagesPage = Boolean(useMatch(appRoutes.MESSAGES_TICKET));

    const [unreadCount, setUnreadCount] = useState(0);
    const [openTicketId, setOpenTicketId] = useState<string | null>(null);

    // dedupe: our own INSERT (and any supabase redelivery) comes back through the same feed
    const seenIdsRef = useRef<Set<number>>(new Set());
    // refs so the subscription callback always reads fresh values without re-subscribing
    const openTicketIdRef = useRef<string | null>(null);
    const onMessagesPageRef = useRef(false);

    useEffect(() => {
        openTicketIdRef.current = openTicketId;
    }, [openTicketId]);

    useEffect(() => {
        onMessagesPageRef.current = onMessagesPage;
    }, [onMessagesPage]);

    const openTicket = useCallback((ticketId: string) => {
        setOpenTicketId(ticketId);
    }, []);

    const closeTicket = useCallback(() => {
        setOpenTicketId(null);
    }, []);

    const resetUnread = useCallback(() => setUnreadCount(0), []);

    // Single global channel: postgres_changes on the messages table.
    // Instead of refetching a ticket's message list on every insert (expensive,
    // and unnecessary), we patch the react-query cache for that ticket directly.
    // If that ticket's query isn't currently mounted, there's nothing to patch —
    // it'll simply be fetched fresh (including this row) next time it's opened.
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel("messages-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload: RealtimePostgresChangesPayload<MessageRow>) => {

                    const row = payload.new as ChatMessage;
                    if (seenIdsRef.current.has(row.id)) return;
                    seenIdsRef.current.add(row.id);

                    const isMine = row.sender_id === user.id;
                    const isCurrentTicket = openTicketIdRef.current === row.ticket_id;

                    queryClient.setQueryData<ChatMessage[]>(
                        ticketMessagesKey(row.ticket_id),
                        (old) => {
                            if (!old) return old;
                            if (old.some((m) => m.id === row.id)) return old;
                            return [...old, row];
                        }
                    );

                    if (!(isCurrentTicket && onMessagesPageRef.current) && !isMine) {
                        // feature 4: toast + badge while away
                        setUnreadCount((n) => n + 1);
                        if (!onMessagesPageRef.current) {
                            showInfoToast(`New message from ${row.sender?.username ?? "a user"}`);
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, queryClient]);

    // reaching the messages page clears the badge
    useEffect(() => {
        if (onMessagesPage) setUnreadCount(0);
    }, [onMessagesPage]);

    return (
        <RealtimeContext.Provider
            value={{ unreadCount, openTicketId, openTicket, closeTicket, resetUnread }}
        >
            {children}
        </RealtimeContext.Provider>
    );
}

export function useRealtime(): RealtimeContextValue {
    const ctx = useContext(RealtimeContext);
    if (!ctx) throw new Error("useRealtime must be used within a <RealtimeProvider>");
    return ctx;
}