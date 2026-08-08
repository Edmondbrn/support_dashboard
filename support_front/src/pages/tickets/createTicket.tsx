import { TicketPlus } from "lucide-react";

/**
 * Form to create a new ticket (coming soon).
 */
export default function CreateTicket() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <TicketPlus className="size-10 text-orange-300" />
            <p className="text-lg font-medium text-white">Create a ticket</p>
            <p className="text-sm text-slate-400">This page is coming soon</p>
        </div>
    );
}