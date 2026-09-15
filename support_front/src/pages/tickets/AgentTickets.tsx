import { useMemo, useState } from "react";
import { Inbox, ListTodo } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TicketCard from "@/components/tickets/TicketCard";
import useTickets from "@/hooks/tickets/useTickets";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";
import { useNavigate } from "react-router";

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
 * Agent view: unassigned ticket queue (claimable + filterable) and assigned tickets.
 */
export default function AgentTickets() {
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

    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
    const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
    const [sortOption, setSortOption] =         useState<SortOption>("newest");


    const [sortOptionAgent, setSortOptionAgent] =         useState<SortOption>("newest");
    const [priorityFilterAgent, setPriorityFilterAgent] = useState<TicketPriority | "all">("all");
    const [categoryFilterAgent, setCategoryFilterAgent] = useState<TicketCategory | "all">("all");
    const [statusFilterAgent, setStatusFilterAgent] =     useState<TicketStatus | "all">("all");

    const filteredUnassignedTickets = useMemo(() => {
        // filter by category and by priority
        const filtered = unassignedTickets.filter((ticket) =>
            (priorityFilter === "all" || ticket.priority === priorityFilter) &&
            (categoryFilter === "all" || ticket.category === categoryFilter)
        );
        // apply the creation date filter
        return filtered.sort((a, b) =>
            sortOption === "newest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [unassignedTickets, priorityFilter, categoryFilter, sortOption]);


    const filteredAssignedTickets = useMemo(() => {
        // filter by category and by priority
        const filtered = agentTickets.filter((ticket) =>
            (statusFilterAgent === "all" ||  ticket.status === statusFilterAgent) &&
            (categoryFilterAgent === "all" || ticket.category === categoryFilterAgent) &&
            (priorityFilterAgent === "all" || ticket.priority === priorityFilterAgent)
        );
        // apply the creation date filter
        return filtered.sort((a, b) =>
            sortOptionAgent === "newest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [agentTickets, categoryFilterAgent, sortOptionAgent, statusFilterAgent, priorityFilterAgent]);

    return (
        <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
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
                    <div className="flex w-full flex-wrap items-center justify-center gap-3">
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
                    <div className="flex w-full flex-wrap items-center justify-center gap-3">
                        <Select value={statusFilterAgent} onValueChange={(value) => { if (value) setStatusFilterAgent(value as TicketStatus); }}>
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
                        <Select value={priorityFilterAgent} onValueChange={(value) => { if (value) setPriorityFilterAgent(value as TicketPriority | "all"); }}>
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

                        <Select value={categoryFilterAgent} onValueChange={(value) => { if (value) setCategoryFilterAgent(value as TicketCategory | "all"); }}>
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
                    </div>
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