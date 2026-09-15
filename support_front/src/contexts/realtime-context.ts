import { createContext } from "react";

export interface RealtimeContextValue {
    unreadCount: number;
    unreadByTicket: Record<string, number>;
    openTicketId: string | null;
    openTicket: (ticketId: string) => void;
    closeTicket: (ticketId?: string) => void;
    resetUnread: () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);
