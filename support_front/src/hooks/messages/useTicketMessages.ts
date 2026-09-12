import { useQuery } from "@tanstack/react-query";
import { findMessagesForTicket, findTicketUsers } from "@/apis/messages";
import type { MessageRow, TicketUser, UserRole } from "@/apis/types";

// add the sender username from the join
export interface ChatMessage extends MessageRow {
    sender: { username: string, role: UserRole } | null;
}

/**
 * Stable query key factory — used both by the query itself and by anything
 * that needs to patch the cache from outside (e.g. the realtime subscription,
 * the send-message mutation).
 */
export const ticketMessagesKey = (ticketId?: string) => ["ticket-messages", ticketId] as const;

/**
 * Idem but for ticket users
 * @param ticketId 
 * @returns 
 */
export const ticketUsersKey = (ticketId?: string) => ["ticket-users", ticketId] as const;

/**
 * Fetches the message history for a ticket.
 *
 * Caching is intentionally kept minimal (staleTime/gcTime: 0) so that
 * switching between tickets — or reopening one after a while — always shows
 * fresh data instead of a possibly-stale snapshot from a previous visit.
 *
 * This does NOT mean every new message triggers a refetch: live inserts are
 * applied as a surgical `queryClient.setQueryData` patch from the realtime
 * subscription (see RealTimeContext) and from the send-message mutation
 * (see useMessages), so the network is only hit once per ticket-open, not
 * once per message.
 */
export function useTicketMessagesQuery(ticketId: string | undefined) {
    return useQuery({
        queryKey: ticketMessagesKey(ticketId),
        queryFn: async (): Promise<ChatMessage[]> => {
            const res = await findMessagesForTicket(ticketId as string);
            if (res.status !== "success") {
                throw new Error(res.errorMsg ?? "Failed to load messages");
            }
            return res.data as ChatMessage[];
        },
        enabled: Boolean(ticketId),
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false, 
    });
}


/**
 * Load client and agent 
 * @param ticketId 
 * @returns 
 */
export function useTickeUsersQuery(ticketId: string | undefined) {
    return useQuery({
        queryKey: ticketUsersKey(ticketId),
        queryFn: async (): Promise<TicketUser | null> => {
            const res = await findTicketUsers(ticketId as string);
            if (res.status !== "success") {
                throw new Error(res.errorMsg ?? "Failed to ticket users");
            }

            if (!res.data) {
                return null;
            }

            const ticketUsers = res.data as {agent: {username: string} | null, client: {username: string}}
            return {
                // agent is null until the ticket is claimed/assigned
                agentName: ticketUsers.agent?.username ?? null,
                clientName: ticketUsers.client.username,
            }
        },
        enabled: Boolean(ticketId),
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false, 
    });
}