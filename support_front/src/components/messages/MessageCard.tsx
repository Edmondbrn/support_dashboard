import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { twJoin } from "tailwind-merge";
import UserAvatar from "../shared/UserAvatar";
import { getUserInitials } from "@/utils/userUtils";
import { memo } from "react";
import MessageAttachment from "@/pages/messages/MessageAttachment";



interface MessageCardProps {
    sentAt: string,
    senderName: string,
    content?: string | null,
    attachmentMimeType?: string | null,
    attachmentSize?: number | null,
    attachmentPath?: string | null, // path to the bucket
    attachmentName?: string | null,
}

/**
 * Component to represent a message with its publication date and author data
 * @param props 
 * @returns 
 */
const MessageCard = memo((props : MessageCardProps) => {
    const { profile } = useAuth();
    const initials = getUserInitials(profile);
    // current user's messages on the right, other ones on the left
    const msgPosition = profile?.username === props.senderName ? "items-end pl-5 md:pl-20" : "items-start pr-5 md:pr-20";
    const badgePosition = profile?.username === props.senderName ? "-top-3 -right-1" : "-translate-x-10 -translate-y-5";

    return (
        <div className={twJoin(["flex flex-col gap-1 text-justify", msgPosition])}>
            <Card 
                className="overflow-visible w-fit max-w-[50vw] md:max-w-xl p-2 bg-transparent" 
                style={{borderRadius: "1em"}}
            >
                <CardContent className="relative text-left">
                    <span className={twJoin(["absolute", badgePosition])}>
                        <UserAvatar initials={initials} />
                    </span>
                    <div className="flex flex-col items-end gap-2">
                        {/* Attachment */}
                        {
                            (props.attachmentMimeType && props.attachmentName && props.attachmentSize && props.attachmentPath) && (
                                <MessageAttachment 
                                    mimeType={props.attachmentMimeType}
                                    name={props.attachmentName}
                                    path={props.attachmentPath}
                                />
                            )
                        }
                        {/* Message content */}
                        {
                            props.content && <span className="text-gray-700 text-sm bg-white rounded-xl p-2 whitespace-normal wrap-break-word">{props.content}</span>
                        }
                    </div>
                </CardContent>
            </Card>
            <time className="text-xs text-gray-400">{props.sentAt}</time>
        </div>
    )
})

export default MessageCard;