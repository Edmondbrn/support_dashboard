import { Spinner } from "@/components/ui/spinner";
import { useConversations } from "@/hooks/messages/useConversations";
import { MessageSquareIcon } from "lucide-react";


/**
 * Expose all the ticket messages where the agent / client is implied
 * @returns 
 */
export default function MessageList() {

    const {
        conversationQuery
    } = useConversations()


    if (conversationQuery.isLoading) {
        return (
            <div className="flex flex-col gap-3 items-center">
                <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
                <Spinner className="size-8 text-white" />
                <span>Loading you conversations...</span>
            </div>
        )
    }

    if (conversationQuery.isError) {
        return (
            <div className="h-full flex flex-col gap-3 items-cente">
                <MessageSquareIcon className="mb-4 size-10 text-orange-300" />
                <span>Your conversations cannot be loaded</span>
            </div>
        )
    }

    return (

        <div className="">
            {conversationQuery.data?.map((conv) => (
                <div key={`ticket-conversation-${conv.id}`}>
                    <span>{conv.id}</span>
                </div>
            ))}

        </div>

    );



}