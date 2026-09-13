import { memo } from "react";
import { useNavigate } from "react-router";
import { twJoin } from "tailwind-merge";
import { MessageSquareIcon } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { appRoutes } from "@/config";
import type { TicketPriority, UserConversation } from "@/apis/types";
import { timeStampToDate } from "@/utils/dateUtils";
import {
  getCategoryBadgeVariant,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from "@/utils/ticketBadges";
import { initialsFromUsername } from "@/utils/userUtils";

const PRIORITY_ACCENT: Record<TicketPriority, string> = {
  high: "border-l-orange-400",
  medium: "border-l-gray-400",
  low: "border-l-gray-600",
};

interface ConversationCardProps {
    conversation: UserConversation;
    currentUserId?: string;
    currentUsername?: string;
    unreadCount?: number;
}

function ConversationCardImpl({
    conversation,
    unreadCount = 0
}: ConversationCardProps) {
    const navigate = useNavigate();

    const accent =
        PRIORITY_ACCENT[conversation.priority] ?? "border-l-gray-500";
    return (
        <button
            type="button"
            onClick={() => navigate(appRoutes.MESSAGES_TICKET.replace(":ticketId", conversation.id))}
            className="w-full text-left cursor-pointer rounded-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
            <Card className={twJoin("bg-glass text-white border-l-4", accent)}>
                <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                            <UserAvatar initials={initialsFromUsername(conversation.username)} username={conversation.username}/>
                            {/* undread count badge */}
                            {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-semibold text-white ring-2 ring-black/40">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">{conversation.username}</span>
                            <time className="text-xs text-gray-400">
                            {timeStampToDate(conversation.created_at)}
                            </time>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-center gap-2">
                        <Badge className={twJoin("capitalize", getStatusBadgeVariant(conversation.status))}>
                            {conversation.status}
                        </Badge>
                        <Badge className={twJoin("capitalize", getCategoryBadgeVariant(conversation.category))}>
                            {conversation.category}
                        </Badge>
                    </div>
                    
                </div>

                {/* Description + priority */}
                <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-3">
                    <p className="line-clamp-2 text-sm text-gray-200">{conversation.description}</p>
                    <Badge
                        className={twJoin("capitalize", getPriorityBadgeVariant(conversation.priority))}
                    >
                        {conversation.priority}
                    </Badge>
                </div>

                {/* Last message preview */}
                {conversation.last_message_content && (
                    <div className="flex flex-col md:flex-row items-center gap-2 border-t border-white/10 pt-2 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <MessageSquareIcon className="size-4 text-orange-400" />
                            <span className="italic text-gray-400">{conversation.last_message_username}:</span>
                        </div>
                        <span className="truncate" title={conversation.last_message_content}>{conversation.last_message_content}</span>
                        <time className="ml-auto text-xs text-gray-500">
                            {timeStampToDate(conversation.last_message_at ?? "")}
                        </time>
                    </div>
                )}
                </CardContent>
            </Card>
        </button>
    );
}


export const ConversationCard = memo(ConversationCardImpl, (prev, next) => {
  return (
    prev.conversation === next.conversation
  );
});