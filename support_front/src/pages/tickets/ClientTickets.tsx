import { Ticket } from "lucide-react";

import useTickets from "@/hooks/tickets/useTickets";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";
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


/**
 * Lists the tickets of the current user (client view).
 */
export default function ClientTickets() {
    useDocumentTitle("My tickets");
    const navigate = useNavigate();
    const {
        clientTickets: tickets,
        isClientTicketLoading: isLoadingTickets,
        isClientTicketError: isErrorTickets,
        clientTicketError: errorTickets,
    } = useTickets();

    const [statusFilters, setStatusFilters] = useState<TicketStatus[]>([]);
    const [priorityFilters, setPriorityFilters] = useState<TicketPriority[]>([]);
    const [categoryFilters, setCategoryFilters] = useState<TicketCategory[]>([]);
    const [sortOption, setSortOption] = useState<SortOption>("newest");

    const hasActiveFilters =
        statusFilters.length > 0 || priorityFilters.length > 0 || categoryFilters.length > 0;

    function handleReset() {
        setStatusFilters([]);
        setPriorityFilters([]);
        setCategoryFilters([]);
    }

    const statusCounts = useMemo(() => {
        const counts: Record<TicketStatus, number> = { open: 0, in_progress: 0, closed: 0 };
        for (const ticket of tickets) {
            counts[ticket.status] += 1;
        }
        return counts;
    }, [tickets]);

    const priorityCounts = useMemo(() => {
        const counts: Record<TicketPriority, number> = { low: 0, medium: 0, high: 0 };
        for (const ticket of tickets) {
            counts[ticket.priority] += 1;
        }
        return counts;
    }, [tickets]);

    const categoryCounts = useMemo(() => {
        const counts: Record<TicketCategory, number> = {
            software: 0,
            hardware: 0,
            delivery: 0,
            payment: 0,
        };
        for (const ticket of tickets) {
            counts[ticket.category] += 1;
        }
        return counts;
    }, [tickets]);


    const filteredTickets = useMemo(() => {
        // multi-select: an empty selection matches everything
        const filtered = tickets.filter((ticket) =>
            matchesMultiFilter(statusFilters, ticket.status) &&
            matchesMultiFilter(categoryFilters, ticket.category) &&
            matchesMultiFilter(priorityFilters, ticket.priority)
        );
        // apply the creation date filter
        return filtered.sort((a, b) =>
            sortOption === "newest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [tickets, priorityFilters, categoryFilters, sortOption, statusFilters]);

    if (isLoadingTickets) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    if (isErrorTickets) {
        return (
            <div className="py-20 text-center">
                <span className="text-slate-400">
                    Error, cannot find your tickets {errorTickets?.message}
                </span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl flex flex-col items-center gap-5 px-4 py-20  mx-auto sm:px-6">
            <Ticket className="size-10 text-orange-300" />
            <h1 className="text-lg font-medium text-white">Your tickets</h1>
            <p className="text-sm text-slate-400">View the status of your requests</p>

            <div className="flex w-full flex-wrap items-end justify-center gap-3">
                <TicketFilterGroup
                    label="Status"
                    ariaLabel="Filter by status"
                    options={STATUS_OPTIONS}
                    selected={statusFilters}
                    counts={statusCounts}
                    onToggle={(value) => setStatusFilters((prev) => toggleFilterValue(prev, value))}
                />
                <TicketFilterGroup
                    label="Priority"
                    ariaLabel="Filter by priority"
                    options={PRIORITY_OPTIONS}
                    selected={priorityFilters}
                    counts={priorityCounts}
                    onToggle={(value) => setPriorityFilters((prev) => toggleFilterValue(prev, value))}
                />
                <TicketFilterGroup
                    label="Category"
                    ariaLabel="Filter by category"
                    options={CATEGORY_OPTIONS}
                    selected={categoryFilters}
                    counts={categoryCounts}
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
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-500">
                {filteredTickets.length} of {tickets.length} tickets
            </p>

            {
                filteredTickets.length === 0 && <span className="text-slate-400 mt-5">No ticket matchs your filter</span>
            }

            <ul className="grid w-2/3 list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
                {filteredTickets.length > 0
                    && (
                        filteredTickets.map((ticket) => (
                            <li key={ticket.id}>
                                <TicketCard
                                    ticket={ticket}
                                    showStatus
                                    showAgent
                                    showClaim={false}
                                    onOpenConversation={ 
                                        ticket.status === "open" 
                                            ? undefined // no message redirection button if ticket still unassigned
                                            : () => navigate(`/messages/${ticket.id}`)
                                    }
                                />
                            </li>
                        ))
                    )}
            </ul>
        </div>
    );
}
