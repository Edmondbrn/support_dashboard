import { findTicketsByClient } from "@/apis/public";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";



export default function useTickets() {

    const { user } = useAuth();

    // query to find all the tickets of the current client
    const query = useQuery({
        queryKey: [{"client": user?.id}],
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


    /**
     * Helper function to get priority badge color
     * @param priority 
     * @returns 
     */
    const getPriorityBadgeVariant = (priority : TicketPriority) => {

        switch (priority) {
            case "medium":
                return "bg-blue-600 text-white"
            case "high":
                return "bg-orange text-white"
            case "low":
            default:
                return "bg-white text-gray-800"
        }
    }


    /**
     * Helper function to get category badge color
     * @param category 
     * @returns 
     */
    const getCategoryBadgeVariant = (category: TicketCategory) => {

        switch (category) {
            case "software":
                return "bg-gray-300 text-gray-800"
            case "hardware":
                return "bg-slate-400 text-white"
            case "delivery":
                return "bg-indigo-500 text-white"
            case "payment":
                return "bg-emerald-500 text-white"
            default:
                return "bg-gray-300 text-gray-800"
        }
    }

    /**
     * Helper function to get status badge color
     * @param status 
     * @returns 
     */
    const getStatusBadgeVariant = (status: TicketStatus) => {

        switch (status) {
            case "open":
                return "bg-emerald-500 text-white"
            case "in_progress":
                return "bg-yellow-500 text-black"
            case "resolved":
                return "bg-blue-600 text-white"
            case "closed":
            default:
                return "bg-gray-400 text-gray-950"
        }
    }

    return {
        tickets: query.data ?? [],
        isLoadingTickets: query.isPending,
        isErrorTickets: query.isError,
        errorTickets: query.error,
        getPriorityBadgeVariant,
        getCategoryBadgeVariant,
        getStatusBadgeVariant
    };
}