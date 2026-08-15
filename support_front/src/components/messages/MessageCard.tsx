import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { twJoin } from "tailwind-merge";



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

    // current user's messages on the right, other ones on the left
    const msgPosition = profile?.username === props.senderName ? "items-end pl-20" : "items-start pr-20";

    return (
        <div className={twJoin(["flex flex-col gap-1 text-justify", msgPosition])}>
            <span className="text-xs text-gray-400">{props.senderName}</span>
            <Card className="w-fit p-2 bg-white text-gray-700 text-sm" style={{borderRadius: "1em"}}>
                <CardContent className="text-left">
                    <span>{props.children}</span>
                </CardContent>
            </Card>
            <time className="text-xs text-gray-400">{props.sentAt}</time>
        </div>
    )


}