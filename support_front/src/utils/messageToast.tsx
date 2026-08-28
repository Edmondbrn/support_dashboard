import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/shared/UserAvatar";
import { Btn } from "@/components/shared/button";
import { getUserInitials } from "@/utils/userUtils";
import type { Profile } from "@/apis/types";
import { X } from "lucide-react";

interface MessageToastContentProps {
    senderProfile: Profile | null;
    content: string;
    onGo: () => void;
    toastId: string | number;
}

function MessageToastContent({ senderProfile, content, onGo, toastId }: MessageToastContentProps) {
    return (
        <Card className="w-[min(90vw,20rem)] bg-glass text-white">
            <CardHeader className="flex items-center gap-3">
                <UserAvatar initials={getUserInitials(senderProfile)} />
                <CardTitle className="truncate">{senderProfile?.username ?? "User"}</CardTitle>
                <button className="ml-auto cursor-pointer" onClick={() => toast.dismiss(toastId)}>
                    <X/>
                </button>
            </CardHeader>
            <CardContent className="text-sm text-white">
                <p className="line-clamp-2 wrap-break-words whitespace-normal">{content}</p>
                <div className="flex justify-end">
                    <Btn
                        version="secondary"
                        onClick={() => {
                            toast.dismiss(toastId);
                            onGo();
                        }}
                    >
                        Go
                    </Btn>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Glass-dark message notification in the bottom-left corner.
 * Shows the sender avatar, a message content preview, and a "Go" button
 * that opens the message page.
 * @param senderName 
 * @param content 
 * @param onGo 
 * @returns the toast id
 */
export function showMessageToast(senderProfile: Profile | null, content: string, onGo: () => void) {
    return toast.custom(
        (id) => (
            <MessageToastContent
                senderProfile={senderProfile}
                content={content}
                onGo={onGo}
                toastId={id}
            />
        ),
        {
            position: "bottom-right",
            duration: 50000,
            style: {
                backgroundColor: "transparent",
                border: "none",
                padding: "0",
            },
        }
    );
}
