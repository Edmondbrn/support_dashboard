import { MessageSquare } from "lucide-react";

/**
 * Messages between the client and the support agents (coming soon).
 */
export default function Messages() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <MessageSquare className="size-10 text-orange-300" />
            <p className="text-lg font-medium text-white">Messages</p>
            <p className="text-sm text-slate-400">This page is coming soon</p>
        </div>
    );
}