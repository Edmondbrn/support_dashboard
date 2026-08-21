import MessageCard from "@/components/messages/MessageCard";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealTimeContext";
import { useConversationRealtime } from "@/hooks/messages/useConversationRealtime";
import useMessages from "@/hooks/messages/useMessages";
import { MessageSquare, PaperclipIcon, SendHorizonalIcon } from "lucide-react";
import { useSearchParams } from "react-router";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}



export default function Messages() {

    const {
        ticketId
    } = useMessages();



    if (!ticketId) {
        return <p className="p-10 text-white">Select a ticket to open the conversation.</p>;
    }

    return (
        <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col px-10 py-5">
            {/* header: conversation partner + online status */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span
                    className={`size-2.5 rounded-full ${
                        counterpartOnline ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                />
                <span className="text-sm text-white">
                    {counterpartOnline ? "Online" : "Offline"}
                </span>
                {isTyping && (
                    <span className="ml-auto text-sm italic text-orange-300">
                        is typing…
                    </span>
                )}
            </div>

            {/* messages */}
            <div ref={listRef} className="flex flex-col overflow-y-auto px-10 py-10">
                {messages.map((m) => (
                    <MessageCard
                        key={m.id}
                        sentAt={formatDate(m.created_at)}
                        senderName={m.sender?.username ?? "unknown"}
                    >
                        {m.content ?? ""}
                    </MessageCard>
                ))}
            </div>

            {/* input */}
            <div className="flex shrink-0 items-center gap-3 px-5 py-3">
                <button className="cursor-pointer">
                    <PaperclipIcon />
                </button>
                <Input
                    className="border-white/30"
                    type="text"
                    placeholder="Type your message..."
                    value={draft}
                    maxLength={500}
                    minLength={1}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSend(); }}
                />
                <button className="cursor-pointer" onClick={() => void handleSend()}>
                    <SendHorizonalIcon />
                </button>
            </div>
        </div>
    );
}