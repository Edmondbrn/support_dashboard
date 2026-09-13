import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { findAllTicketsForAdmin, getAgentTicketStats, reassignTicket, searchAgents } from "@/apis/admin";
import type { AdminTicket, AgentOption, AgentStats } from "@/apis/types";
import { useConfirm } from "@/contexts/ConfirmationDialogContext";
import { showErrorToast, showSuccessToast } from "@/utils/showToast";
import { getFindAssignedTicketKey } from "../tickets/useTickets";
import { conversationKey } from "../messages/useConversations";
import { useAuth } from "@/contexts/AuthContext";

export const adminAllTicketsKey = ["admin", "all-tickets"];
export const agentSearchKey = (query: string) => ["admin", "agent-search", query];
export const agentStatsKey = (agentId: string) => ["admin", "agent-stats", agentId];

/**
 * Search agents by username for the reassignment selector.
 */
export function useAgentSearch(query: string, enabled: boolean) {
    return useQuery({
        queryKey: agentSearchKey(query),
        enabled,
        staleTime: 60 * 1000,
        queryFn: async (): Promise<AgentOption[]> => {
            const res = await searchAgents(query);
            if (res.status === "fail") {
                console.error("[ERROR] Cannot search agents", res.errorMsg);
                return [];
            }
            return res.data as AgentOption[];
        },
    });
}

/**
 * Per-agent workload (assigned tickets grouped by status) for the hover tooltip.
 */
export function useAgentStats(agentId: string | null, enabled: boolean) {
    return useQuery({
        queryKey: agentStatsKey(agentId ?? "none"),
        enabled: enabled && Boolean(agentId),
        staleTime: 60 * 5 * 1000,
        queryFn: async (): Promise<AgentStats[] | null> => {
            if (!agentId) return null;
            const res = await getAgentTicketStats(agentId);
            if (res.status === "fail") {
                console.error("[ERROR] Cannot load agent stats", res.errorMsg);
                return null;
            }

            return res.data as AgentStats[];
        },
    });
}

/**
 * Admin ticket management: full ticket list plus bulk reassignment
 * staged in `pendingAssignments` until Save (guarded by confirmation dialog).
 */
export default function useAdminTickets() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const { user } = useAuth();
    const [pendingAssignments, setPendingAssignments] = useState<Record<string, AgentOption>>({});

    const allTicketsQuery = useQuery({
        queryKey: adminAllTicketsKey,
        staleTime: 60 * 5 * 1000,
        queryFn: async (): Promise<AdminTicket[]> => {
            const res = await findAllTicketsForAdmin();
            if (res.status === "fail") {
                console.error("[ERROR] Cannot find all tickets", res.errorMsg);
                throw new Error(res.errorMsg ?? "Cannot load tickets");
            }
            return res.data as AdminTicket[];
        },
    });

    function setPendingAssignment(ticketId: string, option: AgentOption, currentAgentId: string | null) {
        // drop the entry if the admin re-selects the original agent or toggles the same staged agent for this ticket.
        const stagedForTicket = pendingAssignments[ticketId];
        const isToggleOff = stagedForTicket?.id === option.id;
        if (option.id === currentAgentId || isToggleOff) {
            setPendingAssignments((prev) => {
                if (!(ticketId in prev)) return prev;
                const next = { ...prev };
                delete next[ticketId];
                return next;
            });
            return;
        }
        setPendingAssignments((prev) => ({ ...prev, [ticketId]: option }));
    }

    function clearPendingAssignments() {
        setPendingAssignments({});
    }

    const reassignMutation = useMutation({
        mutationFn: async (entries: Record<string, AgentOption>) => {
            const results = await Promise.all(
                Object.entries(entries).map(async ([ticketId, option]) => ({
                    ticketId,
                    res: await reassignTicket(ticketId, option.id),
                })),
            );
            const failed = results.filter((r) => r.res.status === "fail");
            if (failed.length > 0) {
                throw new Error(
                    failed.map((f) => `${f.ticketId.slice(0, 8)}: ${f.res.errorMsg}`).join("; "),
                );
            }
            return results.length;
        },
        onSuccess: (count) => {
            queryClient.invalidateQueries({ queryKey: adminAllTicketsKey });
            // stats may have changed for reassigned agents
            queryClient.invalidateQueries({ queryKey: ["admin", "agent-stats"] });
            // reset conversation list and assigned tickets
            queryClient.invalidateQueries({ queryKey: getFindAssignedTicketKey(user?.id ?? "anon") });
            queryClient.invalidateQueries({ queryKey: conversationKey(user?.id ?? "anon") });

            clearPendingAssignments();
            showSuccessToast(`${count} ticket${count > 1 ? "s" : ""} reassigned`);
        },
        onError: (error) => {
            showErrorToast(`Error, cannot reassign tickets: ${error.message}`);
        },
    });

    async function handleSave() {
        const count = Object.keys(pendingAssignments).length;
        if (count === 0 || reassignMutation.isPending) return;
        const confirmed = await confirm({
            title: "Reassign tickets",
            content: `Reassign ${count} ticket${count > 1 ? "s" : ""} to the selected agent${count > 1 ? "s" : ""}?`,
        });
        if (confirmed) {
            reassignMutation.mutate(pendingAssignments);
        }
    }

    return {
        tickets: allTicketsQuery.data ?? [],
        isLoading: allTicketsQuery.isPending,
        isError: allTicketsQuery.isError,
        error: allTicketsQuery.error,
        refetch: allTicketsQuery.refetch,
        pendingAssignments,
        pendingCount: Object.keys(pendingAssignments).length,
        setPendingAssignment,
        clearPendingAssignments,
        handleSave,
        isSaving: reassignMutation.isPending,
    };
}
