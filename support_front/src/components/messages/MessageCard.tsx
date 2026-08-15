import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { twJoin } from "tailwind-merge";
import UserAvatar from "../shared/UserAvatar";
import { getUserInitials } from "@/utils/userUtils";



interface MessageCardProps {
    children: string,
    sentAt: string,
    senderName: string
}

/**
 * Component to represent a message with its publication date and author data
 * @param props 
 * @returns 
 */
export default function MessageCard(props : MessageCardProps) {

    const { profile } = useAuth();

    const initials = getUserInitials(profile);
    // current user's messages on the right, other ones on the left
    const msgPosition = profile?.username === props.senderName ? "items-end pl-5 md:pl-20" : "items-start pr-5 md:pr-20";
    const badgePosition = profile?.username === props.senderName ? "-top-5 -right-6" : "-translate-x-10 -translate-y-5";

    return (
        <div className={twJoin(["flex flex-col gap-1 text-justify", msgPosition])}>
            <Card className="overflow-visible w-fit p-2 bg-white text-gray-700 text-sm" style={{borderRadius: "1em"}}>

                <CardContent className="relative text-left">
                    <span className={twJoin(["absolute", badgePosition])}>
                    <UserAvatar initials={initials} />
                    </span>
                    <span>{props.children}</span>
                </CardContent>

            </Card>
            <time className="text-xs text-gray-400">{props.sentAt}</time>
        </div>
    )


}