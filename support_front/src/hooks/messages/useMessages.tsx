import { useParams } from "react-router";
import { useConversationRealtime } from "./useConversationRealtime";
import { useEffect, useRef, useState } from "react";
import { showErrorToast } from "@/utils/showToast";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealTimeContext";
import { sendMessage } from "@/apis/messages";
import { useMutation } from "@tanstack/react-query";
import type { MessageRow } from "@/apis/types";




export default function useMessages() {

    const { user, profile } = useAuth();
    const { ticketId } = useParams();

    const [draft, setDraft] = useState("");

    const listRef = useRef<HTMLDivElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { messages, setMessages, openTicket, isMessagesLoading } = useRealtime();

    const { onlineUsers, isTyping, sendTyping } = useConversationRealtime(
        user?.id ?? null,
        ticketId,
        profile?.username,
    );

    const counterpartOnline = onlineUsers.length > 0;

    // load history + subscribe to live inserts when the ticket changes
    useEffect(() => {
        if (ticketId) void openTicket(ticketId);
    }, [ticketId, openTicket]);


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
            return {status: "fail", errorMsg: `Message too long (${content.length} / 500)`, data: {}}
        }

        sendTyping(false);
        setDraft("");
        return await sendMessage(ticketId, user.id, content);
    }

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
            const newMessage = res.data as MessageRow
            // add the message to the list at the end (avoid refetching all the content)
            setMessages((prevMessages) => [...prevMessages, {...newMessage, sender: {username: profile.username}}])
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
        isMessagesLoading,
        messageMutation,
        handleDraftChange,
        listRef,
        messages
    };
}