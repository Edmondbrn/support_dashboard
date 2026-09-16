import { Inbox, Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import useAdminUsers from "@/hooks/admin/useAdminUsers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * Admin-only page: plain list of all users in a TanStack-powered datatable.
 * Role changes and deletions are staged per row, then persisted with the
 * table Save button (guarded by a confirmation dialog in the hook).
 */
export default function AdminUsers() {
    useDocumentTitle("Users");
    const {
        users,
        isLoading,
        isError,
        error,
        pendingRoles,
        pendingDeletes,
        pendingCount,
        setPendingRole,
        togglePendingDelete,
        isProtected,
        handleSave,
        isSaving,
    } = useAdminUsers();

    return (
        <div className="w-full max-w-7xl flex flex-col items-center gap-5 px-4 py-20  mx-auto sm:px-6">
            <Users className="size-10 text-orange-300" />
            <h1 className="text-lg font-medium text-white">All users</h1>
            <p className="text-sm text-slate-400">Review every account, update roles or delete accounts</p>

            {isLoading && <Spinner className="mt-10 size-8 text-white" />}

            {isError && (
                <span className="py-10 text-slate-400">
                    Error, cannot load users {error?.message}
                </span>
            )}

            {!isLoading && !isError && users.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                    <Inbox className="size-8" />
                    <span>No users yet</span>
                </div>
            )}

            {!isLoading && !isError && users.length > 0 && (
                <AdminUsersTable
                    users={users}
                    pendingRoles={pendingRoles}
                    pendingDeletes={pendingDeletes}
                    pendingCount={pendingCount}
                    isSaving={isSaving}
                    onSelectRole={setPendingRole}
                    onToggleDelete={togglePendingDelete}
                    isProtected={isProtected}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
