import { useParams } from "react-router";
import { useConversationRealtime } from "./useConversationRealtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast, showWarningToast } from "@/utils/showToast";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealTimeContext";
import { sendMessage, uploadAttachment } from "@/apis/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AttachmentMeta, MessageRow } from "@/apis/types";
import { inProgressTicket } from "@/apis/public";
import { ticketMessagesKey, useTicketMessagesQuery, useTickeUsersQuery, type ChatMessage } from "./useTicketMessages";
import { getFilePath } from "@/utils/utils";

const AUTHORIZED_MIME_TYPES : Set<string> = new Set([
    "application/pdf", "image/jpeg", "image/png", "image/jpg"
]);

const FILE_MAX_SIZE = 5_242_880 // 5 MB

/**
 * Custom hook to handle message
 * - Notification
 * - Online status
 * - API calls
 * @returns
 */
export default function useMessages() {

    const { user, profile } = useAuth();
    const { ticketId } = useParams();
    const queryClient = useQueryClient();

    const [draft, setDraft] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const listRef = useRef<HTMLDivElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const { openTicket, closeTicket } = useRealtime();
    const { data: messages = [], isLoading: isMessagesLoading } = useTicketMessagesQuery(ticketId);
    const { data: ticketUsers, isLoading: isTicketUserLoading } = useTickeUsersQuery(ticketId);


    const { onlineUsernames, isTyping, sendTyping } = useConversationRealtime(
        user?.id ?? null,
        ticketId,
        profile?.username,
    );

    // compute user online status for the current conversation
    const counterpartOnline = useMemo(() => {
        if (!ticketUsers) {
            return {}
        }

        const counterPartName = ticketUsers.agentName !== profile?.username 
            ? ticketUsers.agentName 
            : ticketUsers.clientName;

        return {
            [counterPartName]: onlineUsernames.has(counterPartName)
        }
    }, [ticketUsers, onlineUsernames, profile]);


    // tell the realtime layer which ticket is open, so live inserts for THIS
    // ticket get appended silently instead of bumping the unread badge
    useEffect(() => {
        if (ticketId) openTicket(ticketId);
        return () => closeTicket(ticketId);
    }, [ticketId, openTicket, closeTicket]);


    // auto-scroll to the newest message
    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages.length]);


    // stop the "typing" safety timer on unmount
    useEffect(() => () => window.clearTimeout(typingTimer.current), []);


    const handleDraftChange = (value: string) => {
        setDraft(value);
        window.clearTimeout(typingTimer.current);
        sendTyping(true);
        // stop broadcasting "typing" after 1.5s of inactivity
        typingTimer.current = window.setTimeout(() => sendTyping(false), 1500);
    };


    /**
     * Check file MIME type before setting the state
     * @param file 
     * @returns 
     */
    const handleFileSelection = (file : File | null) => {
        if (!file) {
            setSelectedFile(null);
        } else if (!AUTHORIZED_MIME_TYPES.has(file.type)) {
            showWarningToast("Unauthorized file type.");
            return;
        } else if (file.size > FILE_MAX_SIZE) {
            showWarningToast("File too large.")
        }
        setSelectedFile(file);
    }

    // enable preview for image, just icon for other types
    const previewUrl = useMemo(() => {
        if (!selectedFile || !selectedFile.type.startsWith("image/")) {
            return null;
        }
        return URL.createObjectURL(selectedFile);
    }, [selectedFile])

    // clear memory when file is cleared
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl]);

    /**
     * Reformat the message before sending it to the backend
     * TODO betetr handle transition rollback if upload and message sending failed
     * @returns
     */
    const handleSend = async () => {
        if (!user) {return;}
        const content = draft.trim();
        const file = selectedFile;

        if (!content || !ticketId || !user) return;
        if (content.length > 500) {
            return { status: "fail" as const, errorMsg: `Message too long (${content.length} / 500)`, data: {} };
        }

        sendTyping(false);
        setDraft("");
        setSelectedFile(null); // optimisitic reset

        if (messages.length === 0) await inProgressTicket(ticketId);

        let attachment: AttachmentMeta | undefined;
        if (file) {
            const filePath = getFilePath(ticketId, file.name);
            const uploadRes = await uploadAttachment(filePath, file); // upload attchment to the bucket
            if (uploadRes.status === "success") {
                attachment = {
                    attachment_path: filePath,
                    attachment_mime_type: file.type,
                    attachment_name: file.name,
                    attachment_size: file.size,
                };
                //send message
                return await sendMessage(ticketId, user.id, content, attachment);
            } else {
                showErrorToast(`Could not send the message : ${uploadRes.errorMsg}`);
                return;
            }
        }

        // send message
        if (content) {
            return await sendMessage(ticketId, user.id, content);
        }
    };

    const messageMutation = useMutation({
        mutationFn: () => handleSend(),
        onSuccess: (res) => {
            // terminate early if no content
            if (!res) {
                return;
            } else if (res.status === "fail") {
                showErrorToast(`Error, failed to send message: ${res?.errorMsg}`);
                return;
            }

            const newMessage = res.data as MessageRow;
            const chatMessage: ChatMessage = {
                ...newMessage,
                sender: profile ? { username: profile.username } : null,
            };

            // patch the cache directly (no refetch of the whole thread).
            // the realtime INSERT echo for this same row will be deduped by id
            // when it comes back through the subscription in RealTimeContext.
            queryClient.setQueryData<ChatMessage[]>(ticketMessagesKey(ticketId), (old) => {
                if (!old) return [chatMessage];
                if (old.some((m) => m.id === chatMessage.id)) return old;
                return [...old, chatMessage];
            });
        },
        onError: (error) => {
            showErrorToast(`Error, failed to send message: ${error.message}`);
        },
    });


    return {
        ticketId,
        draft,
        counterpartOnline,
        isTyping,
        isTicketUserLoading,
        isMessagesLoading,
        messageMutation,
        handleDraftChange,
        handleFileSelection,
        selectedFile,
        previewUrl,
        listRef,
        messages
    };
}