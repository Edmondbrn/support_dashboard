import UserAvatar from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { appRoutes } from "@/config";
import { useConversations } from "@/hooks/messages/useConversations";
import { timeStampToDate } from "@/utils/dateUtils";
import { getCategoryBadgeVariant, getPriorityBadgeVariant, getStatusBadgeVariant } from "@/utils/ticketBadges";
import { initialsFromUsername } from "@/utils/userUtils";
import { MessageSquareIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { twJoin } from "tailwind-merge";


/**
 * Expose all the ticket messages where the agent / client is implied
 * @returns 
 */
export default function MessageList() {

    const {
        currentUserId,
        currentUsername,
        conversationQuery
    } = useConversations()

    const navigate = useNavigate()


    if (conversationQuery.isLoading) {
        return (
            <div className="flex flex-col gap-3 items-center">
                <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
                <Spinner className="size-8 text-white" />
                <span>Loading you conversations...</span>
            </div>
        )
    }

    if (conversationQuery.isError) {
        return (
            <div className="h-full flex flex-col gap-3 items-center py-5">
                <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
                <span>Your conversations cannot be loaded</span>
            </div>
        )
    }

    return (

        <div className=" flex flex-col gap-5 py-5 px-20">
            {conversationQuery.data?.map((conv) => (
                <button 
                    key={`ticket-conversation-${conv.id}`}
                    className="cursor-pointer transition-all duration-500 ease-in-out hover:-translate-y-1 hover:scale-105"
                    onClick={() => navigate(appRoutes.MESSAGES_TICKET.replace(":ticketId", conv.id))}
                >
                    <Card className="bg-glass text-white">

                        <CardContent className="flex flex-col gap-3">

                            <div className="flex flex-col md:flex-row gap-3">
                                {/* First column, user avatar and username */}
                                <div className="flex flex-col items-start gap-3 p-2 border">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar initials={initialsFromUsername(conv.username)}/>
                                        <span>{conv.username}</span>
                                    </div>
                                    <time>{timeStampToDate(conv.created_at)}</time>
                                </div>

                                {/* main content descr + last message if any */}
                                <div className="flex flex-col grow items-start gap-2 p-2 border">
                                    <div className="flex gap-3">
                                        <span>{conv.description}</span>
                                        <Badge className={twJoin(["capitalize", getPriorityBadgeVariant(conv.priority)])}>
                                            <span>{conv.priority}</span>                                            
                                        </Badge>
                                    </div>
                                    {/* can be null if no message yet */}
                                    <div className="flex gap-3 items-center">
                                        <span className="italic">{`${conv?.sender_id !== currentUserId ? conv.username : currentUsername}:`}</span>
                                        <span>{conv?.last_message_content}</span>
                                    </div>
                                    <time>{timeStampToDate(conv?.last_message_at ?? "")}</time>
                                </div>

                                <div className="flex flex-col gap-3  p-2">
                                    <Badge className={twJoin(["capitalize", getStatusBadgeVariant(conv.status)])}>
                                        <span>{conv.status}</span>
                                    </Badge>
                                    
                                    <Badge className={twJoin(["capitalize", getCategoryBadgeVariant(conv.category)])}>
                                        <span>{conv.category}</span>
                                    </Badge>
                                </div>

                            </div>
                        </CardContent>

                    </Card>
                </button    >
            ))}

        </div>

    );



}