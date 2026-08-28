import MessageCard from "@/components/messages/MessageCard";
import useMessages from "@/hooks/messages/useMessages";
import { InboxIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import MessageInput from "@/components/messages/MessageInput";
import MessageList from "./MessageList";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}

export default function Messages() {

    const {
        ticketId,
        counterpartOnline,
        isTyping,
        isMessagesLoading,
        isTicketUserLoading,
        listRef,
        messages
    } = useMessages();


    // State: No ticket selected (base /messages route)
    if (!ticketId) {
        return <MessageList />;
    }

    // State: Loading messages
    if (isMessagesLoading) {
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center bg-navy-gradient">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    // State: Error (no messages loaded)
    if (!messages || messages.length === 0) {
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col px-10 py-5">
                {/* Empty state header */}
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                    <InboxIcon className="size-10 text-orange-300" />
                    <h2 className="text-lg font-medium text-white">No messages yet</h2>
                    <p className="text-sm text-slate-400">Send the first message to start the conversation</p>
                </div>

                <MessageInput />
            </div>
        );
    }

    // State: Messages exist
    return (
        <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col px-10 py-5">
            {/* header: conversation partner + online status */}
            {
                isTicketUserLoading
                 ? <Spinner className="size-8 text-white"/>
                 : Object.entries(counterpartOnline).map(([username, isOnline]) => {
                    return (
                        <div key={`onlineStatus-${username}`} className="flex items-center gap-2 border-b border-white/10 pb-3">
                            <span
                                className={`size-2.5 rounded-full ${
                                    isOnline ? "bg-emerald-400" : "bg-slate-500"
                                }`}
                            />
                            <span className="text-sm text-white">
                                {username}
                            </span>
                            {isTyping && (
                                <span className="ml-auto text-sm italic text-orange-300">
                                    is typing…
                                </span>
                            )}
                        </div>
                    )
                })
            }
            
            {/* messages */}
            <div ref={listRef} className="flex flex-col overflow-y-auto px-10 py-10">
                {messages.map((m) => (
                    <div className="pb-3">
                        <MessageCard
                            key={m.id}
                            sentAt={formatDate(m.created_at)}
                            senderName={m.sender?.username ?? "unknown"}
                        >
                            {m.content ?? ""}
                        </MessageCard>
                    </div>
                ))}
                {isTyping && (
                    <span className="ml-auto text-sm italic text-orange-300">
                        is typing…
                    </span>
                )}
            </div>

            <MessageInput />
        </div>
    );
}