import type { MessageRow } from "@/apis/types";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router";
import { appRoutes } from "@/config";
import { findMessagesForTicket } from "@/apis/messages";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { showInfoToast } from "@/utils/showToast";



// add the sender username from the join
export interface ChatMessage extends MessageRow {
    sender: {username: string} | null;
}



interface RealtimeContextValue {
    messages : ChatMessage[],    
    unreadCount : number,
    openTicketId : string | null,
    openTicket : (ticketId : string) => Promise<void>,
    closeTicket: () => void,
    resetUnread: () => void,
    isMessagesLoading: boolean,
    setMessages: Dispatch<SetStateAction<ChatMessage[]>>
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);


export function RealtimeProvider({ children }: { children: ReactNode }) {

    const { user } = useAuth();
    const location = useLocation();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openTicketId, setOpenTicketId] = useState<string | null>(null);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);

    // dedupe: your own INSERT comes back through the same feed
    const seenIdsRef = useRef<Set<number>>(new Set());
    // refs so the subscription callback always sees fresh values
    const openTicketIdRef = useRef<string | null>(null);
    const onMessagesPageRef = useRef(false);

    useEffect(() => { 
        openTicketIdRef.current = openTicketId; 
    }, [openTicketId]);

    useEffect(() => {
        onMessagesPageRef.current = location.pathname === appRoutes.MESSAGES_TICKET || location.pathname === appRoutes.MESSAGES_TICKET;
    }, [location.pathname]);


    const openTicket = useCallback(async (ticketId: string) => {
        setIsMessagesLoading(true);
        setOpenTicketId(ticketId);
        seenIdsRef.current.clear();

        try {
            const res = await findMessagesForTicket(ticketId);
            if (res.status === "success") {
                const rows = res.data as ChatMessage[];
                rows.forEach((m) => seenIdsRef.current.add(m.id));
                setMessages(rows);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        } finally {
            setIsMessagesLoading(false);
        }
    }, []);


    const closeTicket = useCallback(() => {
        setOpenTicketId(null);
        setMessages([]);
    }, []);


    const resetUnread = useCallback(() => setUnreadCount(0), [])
    ;

    // global channel: postgres_changes on the messages table
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

                    if (isCurrentTicket && onMessagesPageRef.current) {
                        // feature 1: live append while on the messages page
                        setMessages((prev) => [...prev, row]);
                    } else if (!isMine) {
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
    }, [user]);

    // reaching the messages page clears the badge
    useEffect(() => {
        if (location.pathname === appRoutes.MESSAGES_TICKET || location.pathname === appRoutes.MESSAGES_TICKET) setUnreadCount(0);
    }, [location.pathname]);

    return (
        <RealtimeContext.Provider
            value={{ messages, setMessages, unreadCount, openTicketId, openTicket, closeTicket, resetUnread, isMessagesLoading }}
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