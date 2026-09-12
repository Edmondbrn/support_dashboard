import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAgentSearch, useAgentStats } from "@/hooks/admin/useAdminTickets";
import type { AdminTicket, AgentOption } from "@/apis/types";

interface AgentCellProps {
    ticket: AdminTicket;
    pending?: AgentOption;
    onSelect: (ticketId: string, option: AgentOption, currentAgentId: string | null) => void;
}

/**
 * Agent cell: tooltip with per-status workload on the username,
 * plus a searchable selector to stage a reassignment.
 */
export default function AgentCell({ ticket, pending, onSelect }: AgentCellProps) {
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [tooltipOpen, setTooltipOpen] = useState(false);

    const currentAgent = ticket.agent;
    const displayName = pending?.username ?? currentAgent?.username ?? "Unassigned";
    const isDirty = Boolean(pending);
    // stats refer to the currently assigned agent (not the staged one)
    const statsQuery = useAgentStats(currentAgent?.id ?? null, tooltipOpen && Boolean(currentAgent));
    const agentsQuery = useAgentSearch(search, selectorOpen);

    const options = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
    const stats = statsQuery.data;

    return (
        <div className="flex min-w-36 flex-col gap-1">
            {/* Username with workload tooltip */}
            {currentAgent ? (
                <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                    <TooltipTrigger
                        render={
                            <span
                                className={cn(
                                    "w-fit cursor-help underline decoration-dotted decoration-orange-300/60 underline-offset-4",
                                    isDirty ? "text-orange-300" : "text-slate-100",
                                )}
                            />
                        }
                    >
                        {displayName}
                        {isDirty && <span className="ml-1 text-[11px] text-orange-300">(new)</span>}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-56 border border-white/10 bg-slate-900 px-3 py-2 text-slate-100">
                        {statsQuery.isFetching ? (
                            <span className="flex items-center gap-2 text-xs">
                                <Spinner className="size-3" /> Loading workload…
                            </span>
                        ) : stats ? (
                            <span className="flex flex-col gap-1 text-xs">
                                <span className="font-semibold text-orange-300">{currentAgent.username}</span>
                                {stats.map((stat) => (
                                    <span 
                                        key={`${currentAgent.username}-${JSON.stringify(stat)}`} 
                                        className="capitalize"
                                    >
                                        {`${stat.status.replace("_", " ")}: ${stat.count}`}
                                    </span>
                                ))}
                                <span className="border-t border-white/10 pt-1 font-semibold">Total: {stats.reduce((a, b) => a += b.count, 0)}</span>
                            </span>
                        ) : (
                            <span className="text-xs">No workload data</span>
                        )}
                    </TooltipContent>
                </Tooltip>
            ) : (
                <span className={cn("text-sm", isDirty ? "text-orange-300" : "text-slate-400")}>
                    {isDirty ? `${displayName} (new)` : "Unassigned"}
                </span>
            )}

            {/* Searchable agent selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setSelectorOpen((v) => !v)}
                    className={cn(
                        "flex w-full items-center justify-between gap-1 rounded-lg border px-2 py-1 text-xs transition-colors",
                        isDirty
                            ? "border-orange-400/60 bg-orange-400/10 text-orange-200"
                            : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10",
                    )}
                >
                    <span className="truncate">{isDirty ? "Change…" : "Assign…"}</span>
                    <ChevronDown className="size-3 shrink-0" />
                </button>

                {selectorOpen && (
                    <>
                        <button
                            type="button"
                            aria-label="Close agent selector"
                            className="fixed inset-0 z-30 cursor-default bg-transparent"
                            onClick={() => setSelectorOpen(false)}
                        />
                        <div className="absolute z-40 mt-1 w-52 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl">
                            <div className="p-1.5">
                                <Input
                                    autoFocus
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search agent…"
                                    className="border-white/15 bg-white/5 text-xs text-white placeholder:text-slate-500"
                                />
                            </div>
                            <ul className="max-h-44 overflow-y-auto p-1">
                                {agentsQuery.isFetching && (
                                    <li className="flex items-center gap-2 px-2 py-2 text-xs text-slate-400">
                                        <Loader2 className="size-3 animate-spin" /> Searching…
                                    </li>
                                )}
                                {!agentsQuery.isFetching && options.length === 0 && (
                                    <li className="px-2 py-2 text-xs text-slate-400">No agent found</li>
                                )}
                                {options.map((option) => (
                                    <li key={option.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelect(ticket.id, option, ticket.agent_id);
                                                setSelectorOpen(false);
                                            }}
                                            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10"
                                        >
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <span className="truncate">{option.username}</span>
                                                {option.role === "admin" && (
                                                    <span className="shrink-0 rounded bg-orange-400/20 px-1 py-px text-[10px] font-medium text-orange-200">
                                                        admin
                                                    </span>
                                                )}
                                            </span>
                                            {(pending?.id === option.id || (!pending && currentAgent?.id === option.id)) && (
                                                <Check className="size-3 shrink-0 text-orange-300" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
