import { twJoin } from "tailwind-merge";

import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@/apis/types";
import { timeStampToDate } from "@/utils/dateUtils";
import { getCategoryBadgeVariant, getPriorityBadgeVariant, getStatusBadgeVariant } from "@/utils/ticketBadges";

interface TicketCardProps {
    ticket: Ticket;
    showStatus?: boolean;
    showAgent?: boolean;
    actionLabel?: string;
    onAction?: (ticket: Ticket) => void;
    isActionLoading?: boolean;
    isActionDisabled?: boolean;
}

/**
 * Reusable card to display a ticket (client view, agent unassigned queue, agent assigned tickets).
 */
export default function TicketCard({
    ticket,
    showStatus = false,
    showAgent = false,
    actionLabel,
    onAction,
    isActionLoading = false,
    isActionDisabled = false,
}: TicketCardProps) {
    return (
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

            <CardContent>
                <dl className="flex flex-col gap-5 h-full">

                    <div className="flex flex-col items-start text-start gap-2 h-20">
                        <dt className="font-semibold underline">Description</dt>
                        <dd className="line-clamp-3">{ticket.description}</dd>
                    </div>

                    {/* show which agent has the charghe of this ticket (for client) */}
                    {
                        showAgent && (
                            <div className="flex flex-col items-start gap-2">
                                <dt className="font-semibold underline">Agent</dt>
                                <dd>{ticket.agent_profile?.username ?? "Not assigned yet"}</dd>
                            </div>
                        )
                    }

                    {/* show the current status of the ticket (for client) */}
                    {
                        showStatus && (
                            <div className="flex flex-col items-start gap-2">
                                <dt className="font-semibold underline">Status</dt>
                                <dd>
                                    <Badge className={twJoin(["font-semibold capitalize", getStatusBadgeVariant(ticket.status)])}>
                                        {ticket.status.replaceAll("_", " ")}
                                    </Badge>
                                </dd>
                            </div>
                        )
                    }

                    {/* Action button (delete ticket for open ticket for client and claim for agent)) */}
                    {
                        actionLabel && onAction && (
                            <Btn
                                isLoading={isActionLoading}
                                disabled={isActionDisabled}
                                version="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction(ticket);
                                }}
                            >
                                {actionLabel}
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
    );
}