import { twJoin } from "tailwind-merge";

import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@/apis/types";
import { getCategoryBadgeVariant, getPriorityBadgeVariant, getStatusBadgeVariant } from "@/utils/ticketBadges";
import { MessageSquareIcon } from "lucide-react";

interface TicketCardProps {
    ticket: Ticket;
    showStatus?: boolean;
    showAgent?: boolean;
    showClaim: boolean;
    onOpenConversation?: () => void;
    onClaimTicket? : () => void;
    isClaimTicketLoading? : boolean;
    claimingTicketId? : string;
}

/**
 * Reusable card to display a ticket (client view, agent unassigned queue, agent assigned tickets).
 */
export default function TicketCard({
    ticket,
    showStatus = false,
    showAgent = false,
    showClaim = true,
    onOpenConversation,
    onClaimTicket,
    isClaimTicketLoading,
    claimingTicketId
}: TicketCardProps) {


    return (
        <Card
            tabIndex={0}
            role="button"
            className="h-full w-full bg-glass text-white
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

            <CardContent>
                <dl className="flex flex-col gap-5 h-full w-full">

                    <div className="text-start h-20">
                        <dt className="font-semibold underline mb-2">Description</dt>
                        <dd className="line-clamp-3 wrap-break-word" title={ticket.description}>{ticket.description}</dd>
                    </div>

                    {/* show which agent has the charge of this ticket (for client) */}
                    {
                        showAgent && (
                            <div className="text-start">
                                <dt className="font-semibold underline mb-2">Agent</dt>
                                <dd>{ticket.agent_profile?.username ?? "Not assigned yet"}</dd>
                            </div>
                        )
                    }

                    {/* show the current status of the ticket (for client) */}
                    {
                        showStatus && (
                            <div className="text-start">
                                <dt className="font-semibold underline mb-2">Status</dt>
                                <dd>
                                    <Badge className={twJoin(["font-semibold capitalize", getStatusBadgeVariant(ticket.status)])}>
                                        {ticket.status.replaceAll("_", " ")}
                                    </Badge>
                                </dd>
                            </div>
                        )
                    }

                    {/* Open conversation button or add claime button (cannot be both) */}
                    {onOpenConversation 
                        ? (
                            <div className="flex justify-end">
                                <Btn
                                    version="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenConversation();
                                    }}
                                >
                                    <MessageSquareIcon className="mr-1 size-3" />
                                    Open conversation
                                </Btn>
                            </div>
                        )
                        : showClaim && (
                            <div className="grid grid-cols-1 mt-2">
                                <Btn
                                    version="primary"
                                    onClick={() => onClaimTicket!()}
                                    isLoading={Boolean(isClaimTicketLoading) && claimingTicketId === ticket.id}
                                >
                                    Claim
                                </Btn>
                            </div>
                        )
                    }
                </dl>
            </CardContent>
        </Card>
    );
}