import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUserAccount, findAllUsersForAdmin, updateUserRole } from "@/apis/admin";
import type { AdminUser, UserRole } from "@/apis/types";
import { useConfirm } from "@/contexts/ConfirmationDialogContext";
import { showErrorToast, showSuccessToast } from "@/utils/showToast";
import { useAuth } from "@/contexts/AuthContext";

export const adminAllUsersKey = ["admin", "all-users"];

/**
 * Admin user management: full user list plus role changes and deletions
 * staged in `pendingRoles` / `pendingDeletes` until Save
 * (guarded by a confirmation dialog). Mirrors useAdminTickets.
 */
export default function useAdminUsers() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const { user } = useAuth();
    const [pendingRoles, setPendingRolesState] = useState<Record<string, UserRole>>({});
    const [pendingDeletes, setPendingDeletesState] = useState<Record<string, true>>({});

    const allUsersQuery = useQuery({
        queryKey: adminAllUsersKey,
        staleTime: 60 * 5 * 1000,
        queryFn: async (): Promise<AdminUser[]> => {
            const res = await findAllUsersForAdmin();
            if (res.status === "fail") {
                console.error("[ERROR] Cannot find all users", res.errorMsg);
                throw new Error(res.errorMsg ?? "Cannot load users");
            }
            return res.data as AdminUser[];
        },
    });

    const users = useMemo(() => allUsersQuery.data ?? [], [allUsersQuery.data]);

    const adminCount = useMemo(
        () => users.filter((u) => u.role === "admin").length,
        [users],
    );

    function isSelf(userId: string): boolean {
        return user?.id === userId;
    }

    /** True when the row must not be editable (own account or sole admin). */
    function isProtected(userId: string, role: UserRole): boolean {
        if (isSelf(userId)) return true;
        return role === "admin" && adminCount <= 1;
    }

    function setPendingRole(userId: string, role: UserRole, currentRole: UserRole) {
        if (isProtected(userId, currentRole)) return;
        if (userId in pendingDeletes) return;
        // drop the entry when re-selecting the current role or toggling the staged one
        if (role === currentRole || pendingRoles[userId] === role) {
            setPendingRolesState((prev) => {
                if (!(userId in prev)) return prev;
                const next = { ...prev };
                delete next[userId];
                return next;
            });
            return;
        }
        setPendingRolesState((prev) => ({ ...prev, [userId]: role }));
    }

    function togglePendingDelete(userId: string, currentRole: UserRole) {
        if (isProtected(userId, currentRole)) return;
        setPendingDeletesState((prev) => {
            const next = { ...prev };
            // remove from list if selected twice
            if (userId in next) {
                delete next[userId];
            } else {
                next[userId] = true;
            }
            return next;
        });
        // a deleted user needs no role change
        setPendingRolesState((prev) => {
            if (!(userId in prev)) return prev;
            const next = { ...prev };
            delete next[userId];
            return next;
        });
    }

    function clearPending() {
        setPendingRolesState({});
        setPendingDeletesState({});
    }

    /** Save pending deletes and role updates */
    const saveMutation = useMutation({
        mutationFn: async (entries: { roles: Record<string, UserRole>; deletes: string[] }) => {
            const roleResults = await Promise.all(
                Object.entries(entries.roles).map(async ([userId, role]) => ({
                    userId,
                    res: await updateUserRole(userId, role),
                })),
            );
            const deleteResults = await Promise.all(
                entries.deletes.map(async (userId) => ({
                    userId,
                    res: await deleteUserAccount(userId),
                })),
            );
            const failed = [...roleResults, ...deleteResults].filter((r) => r.res.status === "fail");
            if (failed.length > 0) {
                throw new Error(
                    failed.map((f) => `${f.userId.slice(0, 8)}: ${f.res.errorMsg}`).join("; "),
                );
            }
            return { roles: roleResults.length, deletes: deleteResults.length };
        },
        onSuccess: ({ roles, deletes }) => {
            queryClient.invalidateQueries({ queryKey: adminAllUsersKey });
            clearPending();
            const parts: string[] = [];
            if (roles > 0) parts.push(`${roles} role${roles > 1 ? "s" : ""} updated`);
            if (deletes > 0) parts.push(`${deletes} account${deletes > 1 ? "s" : ""} deleted`);
            showSuccessToast(parts.join(", "));
        },
        onError: (error) => {
            showErrorToast(`Error, cannot save user changes: ${error.message}`);
        },
    });

    async function handleSave() {
        // role changes for users that are also staged for deletion are dropped at save time
        const roles = Object.fromEntries(
            Object.entries(pendingRoles).filter(([userId]) => !(userId in pendingDeletes)),
        ) as Record<string, UserRole>;
        const deletes = Object.keys(pendingDeletes);
        const count = Object.keys(roles).length + deletes.length;
        if (count === 0 || saveMutation.isPending) return;

        const confirmed = await confirm({
            title: "Save user changes",
            content:
                `Apply ${Object.keys(roles).length} role change${Object.keys(roles).length > 1 ? "s" : ""}` +
                (deletes.length > 0
                    ? ` and delete ${deletes.length} account${deletes.length > 1 ? "s" : ""}? Deleting an account permanently removes its tickets and messages.`
                    : "?"),
        });
        if (confirmed) {
            saveMutation.mutate({ roles, deletes });
        }
    }

    return {
        users,
        adminCount,
        isLoading: allUsersQuery.isPending,
        isError: allUsersQuery.isError,
        error: allUsersQuery.error,
        refetch: allUsersQuery.refetch,
        pendingRoles,
        pendingDeletes,
        pendingCount: Object.keys(pendingRoles).length + Object.keys(pendingDeletes).length,
        setPendingRole,
        togglePendingDelete,
        clearPending,
        isSelf,
        isProtected,
        handleSave,
        isSaving: saveMutation.isPending,
    };
}
