import MessageCard from "@/components/messages/MessageCard";
import { Input } from "@/components/ui/input";
import { MessageSquare, PaperclipIcon, SendHorizonalIcon } from "lucide-react";

/**
 * Messages between the client and the support agents (coming soon).
 */
export default function Messages() {
    return (
        // Tchat container 
        <div className="w-full h-full px-10 py-5">
            {/* <MessageSquare className="size-10 text-orange-300" />
            <p className="text-lg font-medium text-white">Messages</p> */}

            {/* space for messages */}
            <div className="flex flex-col gap-3">
                <MessageCard sentAt="20026-06-15" senderName="agent1">Test message Test messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest message</MessageCard>
                <MessageCard sentAt="20026-06-15" senderName="agent1">Test message Test messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest message</MessageCard>
                <MessageCard sentAt="20026-06-15" senderName="client1">Test message Test messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest message</MessageCard>
                <MessageCard sentAt="20026-06-15" senderName="client1">Test message Test messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest messageTest message</MessageCard>
            </div>

            {/* input text for message */}
            <div className="fixed bottom-0 left-0 w-full flex items-center gap-3 px-5 py-3">
                <button className="cursor-pointer">
                    <PaperclipIcon />
                </button>
                <Input className="border-white/30"
                    id="fieldgroup-email"
                    type="text"
                    placeholder="Type your message..."
                    onChange={(e) => console.log(e.target.value)}
                    maxLength={500}
                    minLength={1}
                />
                <button className="cursor-pointer">
                    <SendHorizonalIcon /> 
                </button>
            </div>


                
        </div>
    );
}