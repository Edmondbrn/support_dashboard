import { Ticket } from "lucide-react";

/**
 * Lists the tickets of the current user (client view).
 */
export default function Tickets() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Ticket className="size-10 text-white/40" />
            <p className="text-lg font-medium text-white">Your tickets</p>
            <p className="text-sm text-slate-400">This page is coming soon</p>
        </div>
    );
}