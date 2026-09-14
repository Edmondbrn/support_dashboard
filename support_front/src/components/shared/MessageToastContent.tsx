import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/shared/UserAvatar";
import { Btn } from "@/components/shared/button";
import { getUserInitials } from "@/utils/userUtils";
import type { Profile } from "@/apis/types";
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

export default function MessageToastContent({ senderProfile, content, onGo, toastId, attachmentMimeType, attachmentPath, attachmentName }: MessageToastContentProps) {
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
