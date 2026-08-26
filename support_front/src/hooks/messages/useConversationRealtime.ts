import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";



interface PresenceState {
    userId: string,
    username: string,
}

interface TypingPayload {
    typing: boolean,
    username: string,
}


export function useConversationRealtime(
    currentUserId: string | null,
    ticketId: string | undefined,
    currentUsername?: string,
) {

    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (!ticketId || !currentUserId) return;

        let cancelled = false;
        const topic = `ticket:${ticketId}`;
        // manual cleanup if strict mode goes faster than effect cleanup
        const existing = supabase.getChannels().find((c) => c.topic.replace("realtime:", "") === topic)
        if (existing) {
            supabase.removeChannel(existing);
        }
        
        const channel = supabase.channel(topic);
        channelRef.current = channel;

        channel
            .on("presence", {"event": "sync"}, () => {
                // get connected users data
                const state = channel.presenceState<PresenceState>();
                const users = Object.values(state).map((p) => p[0]).filter(Boolean);
                // check if other users are online
                setOnlineUsers(users.filter((u) => u.userId !== currentUserId));
            })
            .on("broadcast", {"event": "typing"}, ({payload}: {payload : TypingPayload}) => {
                // do not process current user typing
                if (payload.username === currentUsername) return;

                setIsTyping(payload.typing);
                if (payload.typing) {
                    // safety net if "typing:false" never arrives
                    window.clearTimeout(typingTimer.current);
                    typingTimer.current = window.setTimeout(() => setIsTyping(false), 3000)
                }
            })
            .subscribe((status) => {
                if (cancelled) return; // do not track if the component is unmounted
                // send connected status to other connected users
                if (status === "SUBSCRIBED") {
                    channel.track({ user_id: currentUserId, username: currentUsername ?? "" });
                }
            });

        return () => {
            cancelled = true
            window.clearTimeout(typingTimer.current);
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [ticketId, currentUserId, currentUsername]);


    // send to other users the fact that someone is typing
    const sendTyping = useCallback((typing: boolean) => {
        channelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { typing, username: currentUsername ?? "" },
        });
    }, [currentUsername]);


    return { onlineUsers, isTyping, sendTyping };

}