import { Ticket } from "lucide-react";

import useTickets from "@/hooks/tickets/useTickets";
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";
import TicketCard from "@/components/tickets/TicketCard";


const PRIORITY_FILTERS: { value: TicketPriority | "all"; label: string }[] = [
    { value: "all", label: "All priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

const CATEGORY_FILTERS: { value: TicketCategory | "all"; label: string }[] = [
    { value: "all", label: "All categories" },
    { value: "software", label: "Software" },
    { value: "hardware", label: "Hardware" },
    { value: "delivery", label: "Delivery" },
    { value: "payment", label: "Payment" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
] as const;


const STATUS_FILTERS: { value: TicketStatus | "all"; label: string }[] = [
    { value: "all", label: "All categories" },
    { value: "in_progress", label: "In progress" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
]

type SortOption = (typeof SORT_OPTIONS)[number]["value"];


/**
 * Lists the tickets of the current user (client view).
 */
export default function ClientTickets() {
    const navigate = useNavigate();
    const {
        clientTickets: tickets,
        isClientTicketLoading: isLoadingTickets,
        isClientTicketError: isErrorTickets,
        clientTicketError: errorTickets,
    } = useTickets();

    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
    const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
    const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
    const [sortOption, setSortOption] = useState<SortOption>("newest");


    const filteredTickets = useMemo(() => {
        // filter by category and by priority and by status
        const filtered = tickets.filter((ticket) =>
            (statusFilter === "all" ||  ticket.status === statusFilter) &&
            (categoryFilter === "all" || ticket.category === categoryFilter) &&
            (priorityFilter === "all" || ticket.priority === priorityFilter)
        );
        // apply the creation date filter
        return filtered.sort((a, b) =>
            sortOption === "newest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [tickets, priorityFilter, categoryFilter, sortOption, statusFilter]);

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
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Ticket className="size-10 text-orange-300" />
            <h1 className="text-lg font-medium text-white">Your tickets</h1>
            <p className="text-sm text-slate-400">View the status of your requests</p>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
                <Select value={statusFilter} onValueChange={(value) => { if (value) setStatusFilter(value as TicketStatus); }}>
                    <SelectTrigger className="border-white/30 cursor-pointer">
                        <SelectValue placeholder="Newest first" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_FILTERS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(value) => { if (value) setPriorityFilter(value as TicketPriority | "all"); }}>
                    <SelectTrigger className="border-white/30 cursor-pointer">
                        <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        {PRIORITY_FILTERS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={(value) => { if (value) setCategoryFilter(value as TicketCategory | "all"); }}>
                    <SelectTrigger className="border-white/30 cursor-pointer">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORY_FILTERS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

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
            </div>

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