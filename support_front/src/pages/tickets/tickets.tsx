import { Ticket } from "lucide-react";
import { twJoin } from "tailwind-merge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useTickets from "@/hooks/tickets/useTickets";
import { Spinner } from "@/components/ui/spinner";
import { timeStampToDate } from "@/utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/shared/button";

/**
 * Lists the tickets of the current user (client view).
 */
export default function Tickets() {
    const {
        tickets,
        isLoadingTickets,
        isErrorTickets,
        errorTickets,
        getPriorityBadgeVariant,
        getCategoryBadgeVariant,
        getStatusBadgeVariant,
        isDeleteTicketLoading,
        deletingTicketId,
        deleteTicketQuery,
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
            
            <ul className="grid w-2/3 list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 md:grid-cols-3">
                {tickets.length > 0
                    && (
                        tickets.map((ticket) => (
                            <li key={ticket.id}>
                                <Card 
                                    tabIndex={0}
                                    role="button" 
                                    className="h-full bg-glass text-white 
                                                cursor-pointer transition-all duration-500 ease-in-out hover:-translate-y-1 hover:scale-105 
                                                focus:outline-none focus:ring-2 focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            // onSelect()
                                        }
                                    }}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
                                            <Badge className={twJoin(["py-4 text-xl font-semibold capitalize", getCategoryBadgeVariant(ticket.category)])}>
                                                {ticket.category}
                                            </Badge>
                                            <Badge className={twJoin(["font-semibold capitalize", getPriorityBadgeVariant(ticket.priority)])}>
                                                {ticket.priority}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent >
                                        <dl className="flex flex-col gap-5">
                                            <div className="flex flex-col items-start gap-2">
                                                <dt className="font-semibold underline">Description</dt>
                                                <dd>{ticket.description}</dd>
                                            </div>

                                            <div className="flex flex-col items-start gap-2">
                                                <dt className="font-semibold underline">Agent</dt>
                                                <dd>{ticket.agent_profile?.username ?? "Not assigned yet"}</dd>
                                            </div>

                                            <div className="flex flex-col items-start gap-2">
                                                <dt className="font-semibold underline">Status</dt>
                                                <dd>
                                                    <Badge className={twJoin(["font-semibold capitalize", getStatusBadgeVariant(ticket.status)])}>
                                                        {ticket.status.replaceAll("_", " ")}
                                                    </Badge>
                                                </dd>
                                            </div>

                                            {/* Display delete button only if the ticket is still open */}
                                            {
                                                ticket.status === "open" && (
                                                    <Btn isLoading={isDeleteTicketLoading && deletingTicketId === ticket.id} version="danger" onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteTicketQuery(ticket.id)
                                                    }}>
                                                        Delete
                                                    </Btn>
                                                )
                                            }

                                            <time
                                                dateTime={ticket.created_at}
                                                className="w-full border-t border-white/10 pt-3 text-start text-xs text-slate-300"
                                            >
                                                {timeStampToDate(ticket.created_at)}
                                            </time>
                                        </dl>
                                    </CardContent>
                                </Card>
                            </li>
                        ))
                    )}
            </ul>
        </div>
    );
}