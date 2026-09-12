import MessageCard from "@/components/messages/MessageCard";
import useMessages from "@/hooks/messages/useMessages";
import { ArrowLeft, InboxIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import MessageInput from "@/components/messages/MessageInput";
import MessageList from "./MessageList";
import { Btn } from "@/components/shared/button";
import useTickets from "@/hooks/tickets/useTickets";
import { Badge } from "@/components/ui/badge";
import { twJoin } from "tailwind-merge";
import { getCategoryBadgeVariant, getPriorityBadgeVariant, getStatusBadgeVariant } from "@/utils/ticketBadges";
import type { TicketById } from "@/apis/types";
import { useNavigate } from "react-router";
import { appRoutes } from "@/config";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}

export default function Messages() {

    const {
        ticketId,
        counterpartOnline,
        ticketUsers,
        isUnassigned,
        isTyping,
        isMessagesLoading,
        isTicketUserLoading,
        messages,
        listRef,
        profile
    } = useMessages();

    const {
        handleClose,
        isCloseTicketLoading,
        findTicketByIdQuery,
        handleInProgress,
        claimTicket,
        isClaimTicketLoading,
    } = useTickets();

    const navigate = useNavigate();

    const { data: ticket, isLoading: isTicketLoading } = findTicketByIdQuery(ticketId);

    function agentActionBtn(ticketId : string, ticket : TicketById) {
        if (!profile || profile.role === "client") {
            return null
        }

        if (ticket.status === "closed") {
            return <Btn
                version="secondary"
                onClick={() => handleInProgress(ticketId)}
                isLoading={isCloseTicketLoading}
            >
                Reopen ticket
            </Btn>
        } else {
           return  <Btn
                version="secondary"
                onClick={() => handleClose(ticketId)}
                isLoading={isCloseTicketLoading}
            >
                Close ticket
            </Btn>
        }
    }

    function closedTicketSection(ticket : TicketById) {
        return (
            <div className="flex flex-col items-center justify-center gap-2">
                <h2 className="text-lg font-medium text-white">Closed ticket</h2>
                <p className="text-sm text-slate-400">{`This ticket has been closed by ${ticket.close_agent?.username ?? "an agent"}. You cannot send new messages.`}</p>
            </div>
        )
    }

    function ticketMetadata(ticket: TicketById) {
        return (
            <div className="flex flex-col items-start">
                <span className="font-semibold">{`Description: `}</span>
                <span className="line-clamp-3 pl-3" title={ticket.description}>{ticket.description}</span>
                <div className="w-full flex justify-between py-2">
                    <div className="flex gap-2">
                        <Badge className={twJoin("capitalize", getStatusBadgeVariant(ticket.status))}>
                            {ticket.status}
                        </Badge>
                        <Badge className={twJoin("capitalize", getCategoryBadgeVariant(ticket.category))}>
                            {ticket.category}
                        </Badge>
                    </div>
                    <Badge className={twJoin("capitalize", getPriorityBadgeVariant(ticket.priority))}>
                        {ticket.priority}
                    </Badge>
                </div>
            </div>
        );
    }

    // Base page when a ticket exists but no agent is assigned yet.
    // Uses the existing empty-state layout. Sending is blocked for every role
    // until the ticket is claimed/assigned.
    function unassignedTicketSection(ticketId: string, ticket: TicketById) {
        const role = profile?.role;
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col gap-2 px-10 py-5">
                <button className="cursor-pointer self-start" onClick={() => navigate(appRoutes.MESSAGES)}>
                    <ArrowLeft className="rounded-2xl border-2 border-gray-400 p-1" size={32} />
                </button>
                {ticketMetadata(ticket)}
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                    <InboxIcon className="size-10 text-orange-300" />
                    <h2 className="text-lg font-medium text-white">No agent assigned yet</h2>
                    <p className="text-sm text-slate-400">
                        {role === "client"
                            ? "Your ticket is waiting. An agent will pick it up soon. You cannot send messages until then."
                            : "This ticket has no agent. Claim it to start the conversation. Messages are disabled until then."}
                    </p>
                    {role === "agent" || role === "admin" ? (
                        <div className="flex items-center gap-2 pt-2">
                            <Btn
                                version="secondary"
                                onClick={() => claimTicket({ ticketId })}
                                isLoading={isClaimTicketLoading}
                            >
                                Claim ticket
                            </Btn>
                            {role === "admin" && (
                                <Btn
                                    version="primary"
                                    onClick={() => navigate(appRoutes.ADMIN_TICKETS)}
                                >
                                    Manage in admin
                                </Btn>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    function backButton() {
        return (
            <button className="cursor-pointer" onClick={() => navigate(appRoutes.MESSAGES)}>
                <ArrowLeft className="rounded-2xl border-2 border-gray-400 p-1" size={32}/>
            </button>
        )
    }

    // State: No ticket selected (base /messages route)
    if (!ticketId) {
        return <MessageList />;
    }

    // State: Loading messages
    if (isMessagesLoading || isTicketLoading || isTicketUserLoading) {
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center bg-navy-gradient">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
                <InboxIcon className="size-10 text-orange-300" />
                <h2 className="text-lg font-medium text-white">Ticket not found</h2>
                <p className="text-sm text-slate-400">The given identifier does not correspond to any ticket</p>
                {backButton()}
            </div>
        )
    }

    const showUnassigned = isUnassigned || ticketUsers?.agentName == null;
    if (showUnassigned) {
        return unassignedTicketSection(ticketId, ticket);
    }

    // State: Error (no messages loaded)
    if (!messages || messages.length === 0) {
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col px-10 py-5">
                {/* Empty state header */}
                {backButton()}
                {ticketMetadata(ticket)}
                {
                    ticket.status === "closed"
                        ?
                            <div>
                                {closedTicketSection(ticket)}
                                {agentActionBtn(ticketId, ticket)}
                            </div>
                        : (
                            <>
                                <div className="flex flex-col items-center justify-center gap-2 py-20">
                                    <InboxIcon className="size-10 text-orange-300" />
                                    <h2 className="text-lg font-medium text-white">No messages yet</h2>
                                    <p className="text-sm text-slate-400">Send the first message to start the conversation</p>
                                    {agentActionBtn(ticketId, ticket)}
                                </div>
                                <MessageInput />
                            </>
                        )
                }

            </div>
        );
    }
    // State: Messages exist
    return (
        <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col gap-2 px-10 py-5">
            {/* header: conversation partner + online status */}
            {backButton()}
            {
                isTicketUserLoading
                 ? <Spinner className="size-8 text-white"/>
                 : Object.entries(counterpartOnline).map(([username, isOnline]) => {
                    return (
                        <div key={`${username}-${isOnline}`} className="border-b border-white/10 pb-3">
                            {/* client and agent action button */}
                            <div key={`onlineStatus-${username}`} className="flex justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`size-2.5 rounded-full ${
                                            isOnline ? "bg-emerald-400" : "bg-slate-500"
                                        }`}
                                    />
                                    <span className="text-sm text-white">
                                        {username}
                                    </span>
                                </div>


                                <div className="flex flex-col md:flex-row items-center gap-2">
                                    {agentActionBtn(ticketId, ticket)}
                                    {isTyping && (
                                        <span className="ml-auto text-sm italic text-orange-300">
                                            is typing…
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* ticket metadata */}
                            {ticketMetadata(ticket)}

                            { ticket.status === "closed" &&
                                closedTicketSection(ticket)
                            }
                        </div>
                    )
                })
            }

            {/* messages */}
            <div ref={listRef}
                className="flex flex-col px-10 py-10
                        overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300"
            >
                {messages.map((m) => (
                    <div key={m.id} className="pb-3">
                        <MessageCard
                            sentAt={formatDate(m.created_at)}
                            senderName={m.sender?.username ?? "unknown"}
                            senderRole={m.sender?.role}
                            content={m.content}
                            attachmentMimeType={m.attachment_mime_type}
                            attachmentPath={m.attachment_url}
                            attachmentName={m.attachment_name}
                        />
                    </div>
                ))}
                {isTyping && (
                    <span className="ml-auto text-sm italic text-orange-300">
                        is typing…
                    </span>
                )}
            </div>


            { ticket.status !== "closed" && <MessageInput />}
        </div>
    );
}
