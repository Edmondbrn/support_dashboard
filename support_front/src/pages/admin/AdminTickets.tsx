import { Inbox, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import AdminTicketsTable from "@/components/admin/AdminTicketsTable";
import useAdminTickets from "@/hooks/admin/useAdminTickets";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { appRoutes } from "@/config";

/**
 * Admin-only page: plain list of all tickets in a TanStack-powered datatable.
 * Reassignment is staged per row, then persisted with the table Save button
 * (guarded by a confirmation dialog in the hook).
 */
export default function AdminTickets() {
    useDocumentTitle("All tickets");
    const navigate = useNavigate();
    const {
        tickets,
        isLoading,
        isError,
        error,
        pendingAssignments,
        pendingCount,
        setPendingAssignment,
        handleSave,
        isSaving,
    } = useAdminTickets();

    return (

        <div className="w-full max-w-7xl flex flex-col items-center gap-5 px-4 py-20  mx-auto sm:px-6">
            <ShieldCheck className="size-10 text-orange-300" />
            <h1 className="text-lg font-medium text-white">All tickets</h1>
            <p className="text-sm text-slate-400">Review every ticket and reassign agents</p>

            {isLoading && <Spinner className="mt-10 size-8 text-white" />}

            {isError && (
                <span className="py-10 text-slate-400">
                    Error, cannot load tickets {error?.message}
                </span>
            )}

            {!isLoading && !isError && tickets.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                    <Inbox className="size-8" />
                    <span>No tickets yet</span>
                </div>
            )}

            {!isLoading && !isError && tickets.length > 0 && (
                <AdminTicketsTable
                    tickets={tickets}
                    pendingAssignments={pendingAssignments}
                    pendingCount={pendingCount}
                    isSaving={isSaving}
                    onSelectAgent={setPendingAssignment}
                    onSave={handleSave}
                    onOpenTicket={(ticketId) =>
                        navigate(appRoutes.MESSAGES_TICKET.replace(":ticketId", ticketId))
                    }
                />
            )}
        </div>
    );
}
