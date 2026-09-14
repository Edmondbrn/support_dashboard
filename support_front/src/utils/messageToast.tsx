import { toast } from "sonner";
import type { MimeType, Profile } from "@/apis/types";
import MessageToastContent from "@/components/shared/MessageToastContent";


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
