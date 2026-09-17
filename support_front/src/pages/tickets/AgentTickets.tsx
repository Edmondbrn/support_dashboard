import { useMemo, useState } from "react";
import { Inbox, ListTodo } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TicketCard from "@/components/tickets/TicketCard";
import TicketFilterGroup from "@/components/tickets/TicketFilterGroup";
import {
    CATEGORY_OPTIONS,
    PRIORITY_OPTIONS,
    SORT_OPTIONS,
    STATUS_OPTIONS,
    matchesMultiFilter,
    toggleFilterValue,
    type SortOption,
} from "@/components/tickets/ticketFilters";
import useTickets from "@/hooks/tickets/useTickets";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";
import { useNavigate } from "react-router";

/**
 * Agent view: unassigned ticket queue (claimable + filterable) and assigned tickets.
 */
export default function AgentTickets() {
    useDocumentTitle("Ticket queue");
    const navigate = useNavigate();
    const {
        unassignedTickets,
        isUnassignedTicketLoading,
        isUnassignedTicketError,
        unassignedTicketError,
        agentTickets,
        isAgentTicketLoading,
        isAgentTicketError,
        agentTicketError,
        claimTicket,
        isClaimTicketLoading,
        claimingTicketId,
    } = useTickets();

    const [priorityFilters, setPriorityFilters] = useState<TicketPriority[]>([]);
    const [categoryFilters, setCategoryFilters] = useState<TicketCategory[]>([]);
    const [sortOption, setSortOption] =         useState<SortOption>("newest");


    const [sortOptionAgent, setSortOptionAgent] =         useState<SortOption>("newest");
    const [priorityFiltersAgent, setPriorityFiltersAgent] = useState<TicketPriority[]>([]);
    const [categoryFiltersAgent, setCategoryFiltersAgent] = useState<TicketCategory[]>([]);
    const [statusFiltersAgent, setStatusFiltersAgent] =     useState<TicketStatus[]>([]);

    const hasActiveUnassignedFilters = priorityFilters.length > 0 || categoryFilters.length > 0;
    const hasActiveAssignedFilters =
        statusFiltersAgent.length > 0 ||
        priorityFiltersAgent.length > 0 ||
        categoryFiltersAgent.length > 0;

    function handleResetUnassigned() {
        setPriorityFilters([]);
        setCategoryFilters([]);
    }

    function handleResetAssigned() {
        setStatusFiltersAgent([]);
        setPriorityFiltersAgent([]);
        setCategoryFiltersAgent([]);
    }

    const unassignedPriorityCounts = useMemo(() => {
        const counts: Record<TicketPriority, number> = { low: 0, medium: 0, high: 0 };
        for (const ticket of unassignedTickets) {
            counts[ticket.priority] += 1;
        }
        return counts;
    }, [unassignedTickets]);

    const unassignedCategoryCounts = useMemo(() => {
        const counts: Record<TicketCategory, number> = {
            software: 0,
            hardware: 0,
            delivery: 0,
            payment: 0,
        };
        for (const ticket of unassignedTickets) {
            counts[ticket.category] += 1;
        }
        return counts;
    }, [unassignedTickets]);

    const assignedStatusCounts = useMemo(() => {
        const counts: Record<TicketStatus, number> = { open: 0, in_progress: 0, closed: 0 };
        for (const ticket of agentTickets) {
            counts[ticket.status] += 1;
        }
        return counts;
    }, [agentTickets]);

    const assignedPriorityCounts = useMemo(() => {
        const counts: Record<TicketPriority, number> = { low: 0, medium: 0, high: 0 };
        for (const ticket of agentTickets) {
            counts[ticket.priority] += 1;
        }
        return counts;
    }, [agentTickets]);

    const assignedCategoryCounts = useMemo(() => {
        const counts: Record<TicketCategory, number> = {
            software: 0,
            hardware: 0,
            delivery: 0,
            payment: 0,
        };
        for (const ticket of agentTickets) {
            counts[ticket.category] += 1;
        }
        return counts;
    }, [agentTickets]);

    const filteredUnassignedTickets = useMemo(() => {
        // multi-select: an empty selection matches everything
        const filtered = unassignedTickets.filter((ticket) =>
            matchesMultiFilter(priorityFilters, ticket.priority) &&
            matchesMultiFilter(categoryFilters, ticket.category)
        );
        // apply the creation date filter
        return filtered.sort((a, b) =>
            sortOption === "newest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [unassignedTickets, priorityFilters, categoryFilters, sortOption]);


    const filteredAssignedTickets = useMemo(() => {
        // multi-select: an empty selection matches everything
        const filtered = agentTickets.filter((ticket) =>
            matchesMultiFilter(statusFiltersAgent, ticket.status) &&
            matchesMultiFilter(categoryFiltersAgent, ticket.category) &&
            matchesMultiFilter(priorityFiltersAgent, ticket.priority)
        );
        // apply the creation date filter
        return filtered.sort((a, b) =>
            sortOptionAgent === "newest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [agentTickets, categoryFiltersAgent, sortOptionAgent, statusFiltersAgent, priorityFiltersAgent]);

    return (
        <div className="w-full max-w-7xl flex flex-col items-center gap-5 px-4 py-20  mx-auto sm:px-6">
            <ListTodo className="size-10 text-orange-300" />
            <h1 className="text-lg font-medium text-white">Ticket queue</h1>
            <p className="text-sm text-slate-400">Claim unassigned tickets or manage your own</p>

            <Tabs className="flex w-2/3 flex-col items-center gap-5" defaultValue="unassigned">
                <TabsList>
                    <TabsTrigger value="unassigned">
                        Unassigned queue
                        <Badge className="rounded-full bg-gray-200 text-gray-800 px-2 text-xs font-semibold">
                            {unassignedTickets.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="assigned">
                        My tickets
                        <Badge className="rounded-full bg-gray-200 text-gray-800  px-2 text-xs font-semibold">
                            {agentTickets.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="unassigned" className="flex w-full flex-col items-center gap-5">

                    {/* Filter section */}
                    <div className="flex w-full flex-wrap items-end justify-center gap-3">
                        <TicketFilterGroup
                            label="Priority"
                            ariaLabel="Filter unassigned tickets by priority"
                            options={PRIORITY_OPTIONS}
                            selected={priorityFilters}
                            counts={unassignedPriorityCounts}
                            onToggle={(value) => setPriorityFilters((prev) => toggleFilterValue(prev, value))}
                        />
                        <TicketFilterGroup
                            label="Category"
                            ariaLabel="Filter unassigned tickets by category"
                            options={CATEGORY_OPTIONS}
                            selected={categoryFilters}
                            counts={unassignedCategoryCounts}
                            onToggle={(value) => setCategoryFilters((prev) => toggleFilterValue(prev, value))}
                        />

                        <div className="flex flex-col items-start gap-1.5">
                            <span className="text-xs font-medium text-slate-400">Sort</span>
                            <div className="flex items-center gap-2">
                                <Select value={sortOption} onValueChange={(value) => { if (value) setSortOption(value as SortOption); }}>
                                    <SelectTrigger className="border-white/30 cursor-pointer">
                                        <SelectValue placeholder="Newest first" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveUnassignedFilters && (
                                    <button
                                        type="button"
                                        onClick={handleResetUnassigned}
                                        className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        {filteredUnassignedTickets.length} of {unassignedTickets.length} tickets
                    </p>
                    
                    {/* result section */}
                    {
                        isUnassignedTicketLoading && <Spinner className="mt-10 size-8 text-white" />
                    }

                    {
                        isUnassignedTicketError && (
                            <span className="py-10 text-slate-400">
                                Error, cannot find unassigned tickets {unassignedTicketError?.message}
                            </span>
                        )
                    }

                    {
                        !isUnassignedTicketLoading && !isUnassignedTicketError && filteredUnassignedTickets.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                                <Inbox className="size-8" />
                                <span>No unassigned tickets match your filters</span>
                            </div>
                        )
                    }

                    {/* Unassigned ticket, no message */}
                    {
                        !isUnassignedTicketLoading && !isUnassignedTicketError && filteredUnassignedTickets.length > 0 && (
                            <ul className="grid w-full list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 md:grid-cols-3">
                                {filteredUnassignedTickets.map((ticket: Ticket) => (
                                    <li key={ticket.id}>
                                        <TicketCard
                                            showClaim={true}
                                            ticket={ticket}
                                            onClaimTicket={() => claimTicket({ticketId: ticket.id})}
                                            isClaimTicketLoading={isClaimTicketLoading}
                                            claimingTicketId={claimingTicketId}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )
                    }
                </TabsContent>

                {/* Assigned tickets to the current agent */}
                <TabsContent value="assigned" className="flex w-full flex-col items-center gap-5">
                    {/* Filter section */}
                    <div className="flex w-full flex-wrap items-end justify-center gap-3">
                        <TicketFilterGroup
                            label="Status"
                            ariaLabel="Filter assigned tickets by status"
                            options={STATUS_OPTIONS}
                            selected={statusFiltersAgent}
                            counts={assignedStatusCounts}
                            onToggle={(value) => setStatusFiltersAgent((prev) => toggleFilterValue(prev, value))}
                        />
                        <TicketFilterGroup
                            label="Priority"
                            ariaLabel="Filter assigned tickets by priority"
                            options={PRIORITY_OPTIONS}
                            selected={priorityFiltersAgent}
                            counts={assignedPriorityCounts}
                            onToggle={(value) => setPriorityFiltersAgent((prev) => toggleFilterValue(prev, value))}
                        />
                        <TicketFilterGroup
                            label="Category"
                            ariaLabel="Filter assigned tickets by category"
                            options={CATEGORY_OPTIONS}
                            selected={categoryFiltersAgent}
                            counts={assignedCategoryCounts}
                            onToggle={(value) => setCategoryFiltersAgent((prev) => toggleFilterValue(prev, value))}
                        />

                        <div className="flex flex-col items-start gap-1.5">
                            <span className="text-xs font-medium text-slate-400">Sort</span>
                            <div className="flex items-center gap-2">
                                <Select value={sortOptionAgent} onValueChange={(value) => { if (value) setSortOptionAgent(value as SortOption); }}>
                                    <SelectTrigger className="border-white/30 cursor-pointer">
                                        <SelectValue placeholder="Newest first" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveAssignedFilters && (
                                    <button
                                        type="button"
                                        onClick={handleResetAssigned}
                                        className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        {filteredAssignedTickets.length} of {agentTickets.length} tickets
                    </p>
                    {
                        isAgentTicketLoading && <Spinner className="mt-10 size-8 text-white" />
                    }

                    {
                        isAgentTicketError && (
                            <span className="py-10 text-slate-400">
                                Error, cannot find your assigned tickets {agentTicketError?.message}
                            </span>
                        )
                    }

                    {
                        !isAgentTicketLoading && !isAgentTicketError && filteredAssignedTickets.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                                <Inbox className="size-8" />
                                <span>No ticket matchs your filters</span>
                            </div>
                        )
                    }

                    {
                        !isAgentTicketLoading && !isAgentTicketError && filteredAssignedTickets.length > 0 && (
                            <ul className="grid w-full list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 md:grid-cols-3">
                                {filteredAssignedTickets.map((ticket: Ticket) => (
                                    <li key={ticket.id}>
                                        <TicketCard
                                            showClaim={false}
                                            ticket={ticket}
                                            showStatus
                                            showAgent
                                            onOpenConversation={() => navigate(`/messages/${ticket.id}`)}
                                        
                                        />
                                    </li>
                                ))}
                            </ul>
                        )
                    }
                </TabsContent>
            </Tabs>
        </div>
    );
}
