import { claimTicket, closeTicket, deleteTicket, findAssignedTicketsByAgent, findTicketById, findTicketsByClient, findUnassignedTicket, inProgressTicket } from "@/apis/public";
import type { Ticket, TicketById } from "@/apis/types";
import { useConfirm } from "@/contexts/ConfirmationDialogContext";
import { useAuth } from "@/contexts/AuthContext";
import { showErrorToast, showSuccessToast } from "@/utils/showToast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationKey } from "../messages/useConversations";

export const getFindTicketByIdKey = (ticketId: string) => [ticketId, "find-ticket-by-id"];
export const getFindAssignedTicketKey = (userId : string) => ["agent", userId, "find-assigned-tickets"]

export default function useTickets() {

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    // query to find all the tickets of the current client
    const findClientTicketQuery = useQuery({
        queryKey: [{"client": user?.id, "action": "find-tickets"}],
        staleTime: 60 * 5 * 1000, // 5 minutes
        queryFn: async (): Promise<Ticket[]> => {
            if (!user) {
                return []
            }

            const res = await findTicketsByClient(user.id);
            if (res.status === "fail") {
                console.error("[ERROR] Cannot find client's tickets", res.errorMsg);
                return [];
            }

            return res.data as Ticket[];
        },
    });


    const findUnassignedTicketQuery = useQuery({
        queryKey: [{"action": "find-unassigned-tickets"}],
        staleTime: 60 * 5 * 1000, // 5 minutes
        queryFn: async (): Promise<Ticket[]> => {
            if (!user) {
                return []
            }

            const res = await findUnassignedTicket();
            if (res.status === "fail") {
                console.error("[ERROR] Cannot find unassigned tickets", res.errorMsg);
                return [];
            }

            return res.data as Ticket[];
        },
    });


    // query to find the tickets assigned to the current agent
    const findAssignedTicketQuery = useQuery({
        queryKey: getFindAssignedTicketKey(user?.id ?? "anon"),
        staleTime: 60 * 5 * 1000, // 5 minutes
        queryFn: async (): Promise<Ticket[]> => {
            if (!user) {
                return []
            }

            const res = await findAssignedTicketsByAgent(user.id);
            if (res.status === "fail") {
                console.error("[ERROR] Cannot find assigned tickets", res.errorMsg);
                return [];
            }

            return res.data as Ticket[];
        },
    });

    // mutation to claim (assign to himself) an unassigned ticket
    const claimTicketQuery = useMutation({
        mutationFn: ({ ticketId }: { ticketId: string }) => claimTicket(
            ticketId,
            user?.id ?? "",
        ),
        onSuccess: (res) => {
            if (res.status === "fail") {
                showErrorToast(`Error, cannot claim the ticket because: ${res.errorMsg}`);
                return;
            }
            // invalidate cache queries to refresh unassigned and assigned lists
            queryClient.invalidateQueries({queryKey: [{"action": "find-unassigned-tickets"}]})
            queryClient.invalidateQueries({queryKey: [{"agent": user?.id, "action": "find-assigned-tickets"}]})
            showSuccessToast("Ticket claimed");
        },
        onError: (error) => {
            showErrorToast(`Error, cannot claim the ticket because: ${error.message}`);
        },
    });

    /**
     * Get the confirmation dialog output and execute the call back
     * @param ticketId 
     */
    async function handleClose(ticketId: string) {
        const confirmed = await confirm({ content: `Close ticket ?` });
        if (confirmed) {
            closeTicketQuery.mutate({ticketId: ticketId})
        };
    }

    // mutation to claim (assign to himself) an unassigned ticket
    const closeTicketQuery = useMutation({
        mutationFn: ({ ticketId }: { ticketId: string }) => closeTicket(
            ticketId,
        ),
        onSuccess: (res, variables) => {
            if (res.status === "fail") {
                showErrorToast(`Error, cannot closed the ticket because: ${res.errorMsg}`);
                return;
            }
            queryClient.invalidateQueries({queryKey: conversationKey(user?.id ?? "anon")}) // force the update for the conversation page to show the status
            queryClient.invalidateQueries({queryKey: getFindTicketByIdKey(variables.ticketId)}) // force to reload the message status
            queryClient.invalidateQueries({queryKey: getFindAssignedTicketKey(user?.id ?? "anon")}) // force to reload ticket queue for status
            showSuccessToast("Ticket closed");
        },
        onError: (error) => {
            showErrorToast(`Error, cannot close the ticket because: ${error.message}`);
        },
    });



    /**
     * Get the confirmation dialog output and execute the call back
     * @param ticketId 
     */
    async function handleInProgress(ticketId: string) {
        const confirmed = await confirm({ content: `Reopen this ticket ?` });
        if (confirmed) {
            inProgressTicketQuery.mutate({ticketId: ticketId})
        };
    }
    
    // mutation to claim (assign to himself) an unassigned ticket
    const inProgressTicketQuery = useMutation({
        mutationFn: ({ ticketId }: { ticketId: string }) => inProgressTicket(
            ticketId,
        ),
        onSuccess: (res, variables) => {
            if (res.status === "fail") {
                showErrorToast(`Error, cannot update the ticket status because: ${res.errorMsg}`);
                return;
            }
            queryClient.invalidateQueries({queryKey: conversationKey(user?.id ?? "anon")}) // force the update for the conversation page to show the status
            queryClient.invalidateQueries({queryKey: getFindTicketByIdKey(variables.ticketId)})
            queryClient.invalidateQueries({queryKey: getFindAssignedTicketKey(user?.id ?? "anon")}) // force to reload ticket queue for status
            showSuccessToast("Ticket re-opened");
        },
        onError: (error) => {
            showErrorToast(`Error, cannot update the ticket status because: ${error.message}`);
        },
    });


    // find a ticket by its id
    const findTicketByIdQuery = (ticketId : string) => {
        return useQuery({
            queryKey: getFindTicketByIdKey(ticketId),
            staleTime: 60 * 5 * 1000, // 5 minutes
            queryFn: async (): Promise<TicketById | null> => {
                const res = await findTicketById(ticketId);

                if (res.status === "fail") {
                    console.error("[ERROR] Cannot find ticket for id: " + ticketId, res.errorMsg);
                    return null;
                }
    
                return res.data as TicketById;
            },
        })
    }

    // query to delete a ticket
    const deleteTicketQuery = useMutation({
        mutationFn: (ticketId : string) => deleteTicket(
            ticketId,
        ),
        onSuccess: (res) => {
            if (res.status === "fail") {
                showErrorToast(`Error, cannot delete the ticket because: ${res.errorMsg}`);
                return;
            }
            // invalidate cache query ticket to be able to reftech them after a deletion
            queryClient.invalidateQueries({queryKey: [{"client": user?.id, "action": "find-tickets"}]})
            showSuccessToast("Ticket deleted");
        },
        onError: (error) => {
            showErrorToast(`Error, cannot delete the ticket because: ${error.message}`);
        },
    });



    return {
        clientTickets: findClientTicketQuery.data ?? [],
        isClientTicketLoading: findClientTicketQuery.isPending,
        isClientTicketError: findClientTicketQuery.isError,
        clientTicketError: findClientTicketQuery.error,
        unassignedTickets: findUnassignedTicketQuery.data ?? [],
        isUnassignedTicketLoading: findUnassignedTicketQuery.isPending,
        isUnassignedTicketError: findUnassignedTicketQuery.isError,
        unassignedTicketError: findUnassignedTicketQuery.error,
        agentTickets: findAssignedTicketQuery.data ?? [],
        isAgentTicketLoading: findAssignedTicketQuery.isPending,
        isAgentTicketError: findAssignedTicketQuery.isError,
        agentTicketError: findAssignedTicketQuery.error,
        claimTicket: claimTicketQuery.mutate,
        isClaimTicketLoading: claimTicketQuery.isPending,
        claimingTicketId: claimTicketQuery.variables?.ticketId,
        isDeleteTicketLoading: deleteTicketQuery.isPending,
        deletingTicketId: deleteTicketQuery.variables,
        deleteTicketQuery: deleteTicketQuery.mutate,
        handleClose,
        isCloseTicketLoading: closeTicketQuery.isPending,
        findTicketById,
        findTicketByIdQuery,
        inProgressTicketMutate: inProgressTicketQuery.mutate ,
        handleInProgress
    };
}