import { Ticket } from "lucide-react";

import useTickets from "@/hooks/tickets/useTickets";
import { Spinner } from "@/components/ui/spinner";
import TicketCard from "@/components/tickets/TicketCard";
import { useNavigate } from "react-router";

/**
 * Lists the tickets of the current user (client view).
 */
export default function ClientTickets() {
    const navigate = useNavigate();
    const {
        clientTickets: tickets,
        isClientTicketLoading: isLoadingTickets,
        isClientTicketError: isErrorTickets,
        clientTicketError: errorTickets,
    } = useTickets();

    if (isLoadingTickets) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    if (isErrorTickets) {
        return (
            <div className="py-20 text-center">
                <span className="text-slate-400">
                    Error, cannot find your tickets {errorTickets?.message}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Ticket className="size-10 text-orange-300" />
            <h1 className="text-lg font-medium text-white">Your tickets</h1>
            <p className="text-sm text-slate-400">View the status of your requests</p>

            {
                tickets.length === 0 && <span className="text-slate-400 mt-5">You did not submit any ticket yet</span>
            }
            
            <ul className="grid w-2/3 list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
                {tickets.length > 0
                    && (
                        tickets.map((ticket) => (
                            <li key={ticket.id}>
                                <TicketCard
                                    ticket={ticket}
                                    showStatus
                                    showAgent
                                    showClaim={false}
                                    onOpenConversation={ 
                                        ticket.status === "open" 
                                            ? undefined // no message redirection button if ticket still unassigned
                                            : () => navigate(`/messages/${ticket.id}`)
                                    }
                                />
                            </li>
                        ))
                    )}
            </ul>
        </div>
    );
}