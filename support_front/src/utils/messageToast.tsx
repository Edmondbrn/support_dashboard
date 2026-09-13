import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/shared/UserAvatar";
import { Btn } from "@/components/shared/button";
import { getUserInitials } from "@/utils/userUtils";
import type { MimeType, Profile } from "@/apis/types";
import { X } from "lucide-react";
import MessageAttachment from "@/pages/messages/MessageAttachment";

interface MessageToastContentProps {
    senderProfile: Profile | null;
    content?: string;
    attachmentMimeType?: string | null,
    attachmentPath?: string | null, // path to the bucket
    attachmentName?: string | null,
    onGo: () => void;
    toastId: string | number;
}

function MessageToastContent({ senderProfile, content, onGo, toastId, attachmentMimeType, attachmentPath, attachmentName }: MessageToastContentProps) {
    return (
        <Card className="w-[min(90vw,20rem)] bg-glass text-white">
            <CardHeader className="flex items-center gap-3">
                <UserAvatar initials={getUserInitials(senderProfile)} username={senderProfile?.username ?? "unknown"} />
                <CardTitle className="truncate">{senderProfile?.username ?? "User"}</CardTitle>
                <button className="ml-auto cursor-pointer" onClick={() => toast.dismiss(toastId)}>
                    <X/>
                </button>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-2 text-sm text-white">

                {/* File preview */}
                {
                    (attachmentMimeType && attachmentName && attachmentPath) && (
                        <MessageAttachment 
                            mimeType={attachmentMimeType}
                            name={attachmentName}
                            path={attachmentPath}
                            maxHeight="max-h-16"
                        />
                    )
                }
                {/* content preview */}
                {
                    content && <p className="line-clamp-2 wrap-break-words whitespace-normal">{content}</p>
                }
                
                <div className="ml-auto">
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
export function showMessageToast(
    senderProfile: Profile | null, 
    content: string,
    onGo: () => void,
    attachmentMimeType?: MimeType | null, 
    attachmentPath?: string | null, 
    attachmentName?: string | null
) {
    return toast.custom(
        (id) => (
            <MessageToastContent
                senderProfile={senderProfile}
                content={content}
                onGo={onGo}
                toastId={id}
                attachmentMimeType={attachmentMimeType}
                attachmentPath={attachmentPath} 
                attachmentName={attachmentName}
            />
        ),
        {
            position: "bottom-right",
            duration: 5000,
            style: {
                backgroundColor: "transparent",
                border: "none",
                padding: "0",
            },
        }
    );
}
