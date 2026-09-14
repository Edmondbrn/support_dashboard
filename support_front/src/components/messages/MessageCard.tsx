import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/context/useAuth";
import { twJoin } from "tailwind-merge";
import UserAvatar from "../shared/UserAvatar";
import { getUserInitials, initialsFromUsername } from "@/utils/userUtils";
import { memo } from "react";
import MessageAttachment from "@/pages/messages/MessageAttachment";
import type { UserRole } from "@/apis/types";



interface MessageCardProps {
    sentAt: string,
    senderName: string,
    senderRole?: UserRole
    content?: string | null,
    attachmentMimeType?: string | null,
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
    // current user's messages on the right, other ones on the left
    let msgPosition; let badgePosition; let initials;
    if (profile?.username === props.senderName) {
        msgPosition = "items-end pl-5 md:pl-20";
        badgePosition = "-top-3 -right-1";
        initials = getUserInitials(profile);
    } else {
        msgPosition = "items-start pr-5 md:pr-20";
        badgePosition = "-translate-x-5 -translate-y-4";
        initials = initialsFromUsername(props.senderName);
    }


    return (
        <div className={twJoin(["flex flex-col gap-1 text-justify", msgPosition])}>
            <Card 
                className="overflow-visible w-fit max-w-[50vw] md:max-w-xl p-2 bg-transparent" 
                style={{borderRadius: "1em"}}
            >
                <CardContent className="relative text-left">
                    <span className={twJoin(["absolute", badgePosition])}>
                        <UserAvatar initials={initials} username={props.senderName} role={props.senderRole} />
                    </span>
                    <div className={twJoin("flex flex-col gap-2", profile?.username === props.senderName ? "items-end" : "items-start")}>
                        {/* Attachment */}
                        {
                            (props.attachmentMimeType && props.attachmentName && props.attachmentPath) && (
                                <MessageAttachment 
                                    mimeType={props.attachmentMimeType}
                                    name={props.attachmentName}
                                    path={props.attachmentPath}
                                />
                            )
                        }
                        {/* Message content */}
                        {
                            props.content && <span className="text-gray-700 w-fit text-sm bg-white rounded-xl p-2 whitespace-normal wrap-break-word">{props.content}</span>
                        }
                    </div>
                </CardContent>
            </Card>
            <time className="text-xs text-gray-400">{props.sentAt}</time>
        </div>
    )
})

export default MessageCard;