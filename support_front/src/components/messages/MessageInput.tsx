import useMessages from "@/hooks/messages/useMessages";
import { Input } from "@base-ui/react";
import { InboxIcon, SendHorizontalIcon } from "lucide-react";


/**
 * Component with the message input section and the send button
 * @returns 
 */
export default function MessageInput() {

    const {
        draft,
        messageMutation,
        handleDraftChange,
    } = useMessages();

    return (
        <div className="flex shrink-0 items-center w-full gap-3 px-5 py-3 border border-gray-400 rounded-2xl">
            <button className="cursor-pointer">
                <InboxIcon size={32} className="text-slate-400" />
            </button>
            <Input
                className="border-white/30 grow text-md py-3"
                type="text"
                placeholder="Type your message..."
                value={draft}
                maxLength={500}
                minLength={1}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") messageMutation.mutate(); }}
            />
            <button className="cursor-pointer transition-colors ease-in-out transiton-1000 bg-orange-400 hover:bg-orange-500 rounded p-1" onClick={() => messageMutation.mutate()}>
                <SendHorizontalIcon size={32}/>
            </button>
        </div>
    )

}