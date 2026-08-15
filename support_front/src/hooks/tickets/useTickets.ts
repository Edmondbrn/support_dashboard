import { claimTicket, deleteTicket, findAssignedTicketsByAgent, findTicketsByClient, findUnassignedTicket } from "@/apis/public";
import type { Ticket } from "@/apis/types";
import { useAuth } from "@/contexts/AuthContext";
import { showErrorToast, showSuccessToast } from "@/utils/showToast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



export default function useTickets() {

    const { user } = useAuth();
    const queryClient = useQueryClient();

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
        queryKey: [{"agent": user?.id, "action": "find-assigned-tickets"}],
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
        deleteTicketQuery: deleteTicketQuery.mutate
    };
}