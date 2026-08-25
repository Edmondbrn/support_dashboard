import { useParams } from "react-router";
import { useConversationRealtime } from "./useConversationRealtime";
import { useEffect, useRef, useState } from "react";
import { showErrorToast } from "@/utils/showToast";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealTimeContext";
import { sendMessage } from "@/apis/messages";
import { useMutation } from "@tanstack/react-query";




export default function useMessages() {

    const { user, profile } = useAuth();
    const { ticketId } = useParams();

    const [draft, setDraft] = useState("");

    const listRef = useRef<HTMLDivElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { messages, openTicket } = useRealtime();

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


    const handleSend = async () => {
        const content = draft.trim();
        if (!content || !ticketId || !user) return;

        sendTyping(false);
        setDraft("");
        return await sendMessage(ticketId, user.id, content);
    }

    const messageMutation = useMutation({
        mutationFn: () => handleSend(),
        onSuccess: (res) => {
            if (!res || res.status === "fail") {
                showErrorToast(`Error, failed to send message: ${res?.errorMsg}`);
                return;
            }
            // invalidate cache query ticket to be able to reftech them after a creation
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
        messageMutation,
        handleDraftChange,
        listRef,
        messages
    };
}