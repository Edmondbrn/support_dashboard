import { useEffect, useRef } from "react";
import { MessageSquareIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useConversations } from "@/hooks/messages/useConversations";
import { ConversationCard } from "@/components/messages/ConversationCard";
import { useRealtime } from "@/contexts/RealTimeContext";

export default function MessageList() {
    const { currentUserId, currentUsername, conversations, conversationQuery } = useConversations();
    const { unreadByTicket } = useRealtime();
    const sentinelRef = useRef<HTMLDivElement>(null);

    // fetch new results when the limit is reached
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;
        // check if the loading div exists, and if yes trigger the fetch (200PX of security)
        const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && conversationQuery.hasNextPage && !conversationQuery.isFetchingNextPage) {
            conversationQuery.fetchNextPage();
            }
        },
        { rootMargin: "200px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [conversationQuery.hasNextPage, conversationQuery.isFetchingNextPage, conversationQuery.fetchNextPage]);


    if (conversationQuery.isLoading) {
        return (
        <div className="flex flex-col items-center gap-3">
            <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
            <Spinner className="size-8 text-white" />
            <span>Loading your conversations...</span>
        </div>
        );
    }

    if (conversationQuery.isError) {
        return (
        <div className="flex h-full flex-col items-center gap-3 py-5">
            <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
            <span>Your conversations cannot be loaded</span>
        </div>
        );
    }

    if (conversations.length === 0) {
        return (
        <div className="flex h-full flex-col items-center gap-3 py-5">
            <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
            <span>No conversation yet</span>
        </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 px-20 py-5">
        {conversations.map((conv) => (
            <ConversationCard
                key={conv.id}
                conversation={conv}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                unreadCount={unreadByTicket[conv.id] ?? 0}
            />
        ))}

        {conversationQuery.hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-4">
            {conversationQuery.isFetchingNextPage && <Spinner className="size-5 text-orange-300" />}
            </div>
        )}
        </div>
    );
}