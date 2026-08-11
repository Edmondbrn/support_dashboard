import { Ticket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useTickets from "@/hooks/tickets/useTickets";
import { Spinner } from "@/components/ui/spinner";
import { timeStampToDate } from "@/utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import { twJoin } from "tailwind-merge";

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
        getCategoryBadgeVariant
    } = useTickets();

    if (isLoadingTickets) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Spinner className="size-8 text-white" />
            </div>
        )
    }

    if (isErrorTickets) {
        return (
            <div>
                <span>Error, cannot find your tickets {errorTickets?.message}</span>
            </div>
        )
    }

    

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Ticket className="size-10 text-white/40" />
            <p className="text-lg font-medium text-white">Your tickets</p>



            <div className="w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-3">
                {tickets.length === 0 
                    ? <span>No tickets found</span>
                    :  (
                    tickets.map((ticket) => (
                        <Card key={ticket.id} className="bg-glass text-white cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex flex-col gap-3 md:flex-row md:justify-between items-center ">
                                    <Badge className={twJoin(["text-xl font-semibold capitalize py-4", getCategoryBadgeVariant(ticket.category)])}>
                                        {ticket.category}
                                    </Badge>
                                    <Badge className={twJoin(["font-semibold capitalize", getPriorityBadgeVariant(ticket.priority)])}>
                                        {ticket.priority}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="flex flex-col justify-start items-start gap-5">

                                <div className="flex flex-col">
                                    <span className="underline font-semibold">Description:</span>
                                    <span className="pl-2">{ticket.description}</span>
                                </div>

                                <div className="flex flex-col">
                                    <span>Agent:</span>
                                    <span>{ ticket.agent_username ? ticket.agent_username : "Not assigned yet" }</span>
                                </div>

                                <div className="flex flex-col">
                                    <span>Status:</span>
                                    <span>{ ticket.status}</span>
                                </div>


                                <span className="w-full border-t border-t-gray-600 pt-3 text-start">{timeStampToDate(ticket.created_at)}</span>
                                
                            </CardContent>
                            
                        </Card>
                    ))

                )}
            </div>


        </div>




    );
}