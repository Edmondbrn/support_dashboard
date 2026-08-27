import { useParams } from "react-router";
import { useConversationRealtime } from "./useConversationRealtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { showErrorToast } from "@/utils/showToast";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealTimeContext";
import { sendMessage } from "@/apis/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MessageRow } from "@/apis/types";
import { inProgressTicket } from "@/apis/public";
import { ticketMessagesKey, useTicketMessagesQuery, useTickeUsersQuery, type ChatMessage } from "./useTicketMessages";


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
        return () => closeTicket();
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
     * Reformat the message before sending it to the backend
     * @returns
     */
    const handleSend = async () => {
        const content = draft.trim();

        if (!content || !ticketId || !user) return;

        if (content.length > 500) {
            return { status: "fail" as const, errorMsg: `Message too long (${content.length} / 500)`, data: {} };
        }

        sendTyping(false);
        setDraft("");
        if (messages.length === 0) {
            await inProgressTicket(ticketId); // pass the ticket as "in_progress" when the first message is sent by the agent
        }
        return await sendMessage(ticketId, user.id, content);
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
        listRef,
        messages
    };
}