import { useMemo, useState } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Save, Search } from "lucide-react";
import { twJoin } from "tailwind-merge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Btn } from "@/components/shared/button";
import { getCategoryBadgeVariant, getPriorityBadgeVariant, getStatusBadgeVariant } from "@/utils/ticketBadges";
import { timeStampToDate } from "@/utils/dateUtils";
import type { AdminTicket, AgentOption } from "@/apis/types";
import AgentCell from "./AgentCell";

interface AdminTicketsTableProps {
    tickets: AdminTicket[];
    pendingAssignments: Record<string, AgentOption>;
    pendingCount: number;
    isSaving: boolean;
    onSelectAgent: (ticketId: string, option: AgentOption, currentAgentId: string | null) => void;
    onSave: () => void;
    onOpenTicket: (ticketId: string) => void;
}

const columnHelper = createColumnHelper<AdminTicket>();

type AssignmentFilter = "all" | "assigned" | "unassigned";

const ASSIGNMENT_FILTERS: { value: AssignmentFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "assigned", label: "Assigned" },
    { value: "unassigned", label: "Unassigned" },
];

function SortableHeader({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            {label}
            <ArrowUpDown className="size-3 opacity-60" />
        </span>
    );
}

/**
 * Glass dark-orange datatable for admins.
 * Sorting + global filtering + assignment (assigned/unassigned) filtering
 * run through the TanStack table engine.
 */
export default function AdminTicketsTable({
    tickets,
    pendingAssignments,
    pendingCount,
    isSaving,
    onSelectAgent,
    onSave,
    onOpenTicket,
}: AdminTicketsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
    const [globalFilter, setGlobalFilter] = useState("");

    const columns = useMemo(
        () => [
            columnHelper.accessor((row) => row.client?.username ?? "—", {
                id: "creator",
                header: () => <SortableHeader label="Creator" />,
                cell: (info) => <span className="font-medium text-slate-100">{info.getValue()}</span>,
            }),
            columnHelper.accessor("description", {
                header: () => <SortableHeader label="Description" />,
                cell: (info) => (
                    <span title={info.getValue()} className="block max-w-60 truncate text-slate-300">
                        {info.getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor("created_at", {
                header: () => <SortableHeader label="Created" />,
                cell: (info) => <span className="whitespace-nowrap text-slate-300">{timeStampToDate(info.getValue())}</span>,
            }),
            columnHelper.accessor("status", {
                header: () => <SortableHeader label="Status" />,
                cell: (info) => (
                    <Badge className={twJoin(["capitalize", getStatusBadgeVariant(info.getValue())])}>
                        {info.getValue().replaceAll("_", " ")}
                    </Badge>
                ),
            }),
            columnHelper.accessor("priority", {
                header: () => <SortableHeader label="Priority" />,
                cell: (info) => (
                    <Badge className={twJoin(["capitalize", getPriorityBadgeVariant(info.getValue())])}>
                        {info.getValue()}
                    </Badge>
                ),
            }),
            columnHelper.accessor("category", {
                header: () => <SortableHeader label="Category" />,
                cell: (info) => (
                    <Badge className={twJoin(["capitalize", getCategoryBadgeVariant(info.getValue())])}>
                        {info.getValue()}
                    </Badge>
                ),
            }),
            // Hidden accessor backing the Assigned/Unassigned column filter.
            // Driven by the toolbar segmented control through the TanStack engine.
            columnHelper.accessor("agent_id", {
                id: "assignment",
                header: () => null,
                cell: () => null,
                enableSorting: false,
                filterFn: (row, columnId, filterValue) => {
                    if ((filterValue as AssignmentFilter) === "all") return true;
                    const isAssigned = row.getValue(columnId) != null;
                    return (filterValue as AssignmentFilter) === "assigned" ? isAssigned : !isAssigned;
                },
            }),
            columnHelper.display({
                id: "agent",
                header: () => <span className="text-orange-300">Agent</span>,
                cell: ({ row }) => (
                    <AgentCell
                        ticket={row.original}
                        pending={pendingAssignments[row.original.id]}
                        onSelect={onSelectAgent}
                    />
                ),
            }),
            columnHelper.display({
                id: "open",
                header: () => <span className="sr-only">Open</span>,
                cell: ({ row }) => (
                    <button
                        type="button"
                        aria-label={`Open ticket ${row.original.id}`}
                        title="Open conversation"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenTicket(row.original.id);
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-orange-300 transition-colors hover:bg-white/15 hover:text-orange-200"
                    >
                        <ExternalLink className="size-4" />
                    </button>
                ),
            }),
        ],
        [pendingAssignments, onSelectAgent, onOpenTicket],
    );

    const assignmentCounts = useMemo(() => {
        let assigned = 0;
        for (const ticket of tickets) {
            if (ticket.agent_id != null) assigned += 1;
        }
        return { all: tickets.length, assigned, unassigned: tickets.length - assigned };
    }, [tickets]);

    const table = useReactTable({
        data: tickets,
        columns,
        state: { sorting, globalFilter, columnVisibility: { assignment: false } },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const query = String(filterValue).toLowerCase();
            if (!query) return true;
            const t = row.original;
            return [t.client?.username, t.agent?.username, t.description, t.status, t.priority, t.category]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query);
        },
    });

    const assignmentFilter =
        (table.getColumn("assignment")?.getFilterValue() as AssignmentFilter | undefined) ?? "all";

    return (
        <div className="w-full overflow-hidden rounded-xl bg-glass shadow-2xl">
            {/* Toolbar: assignment filter + global filter (TanStack) + Save top-right */}
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center">
                    <div
                        role="group"
                        aria-label="Filter by assignment"
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
                    >
                        {ASSIGNMENT_FILTERS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => table.getColumn("assignment")?.setFilterValue(option.value)}
                                aria-pressed={assignmentFilter === option.value}
                                className={twJoin([
                                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                    assignmentFilter === option.value
                                        ? "bg-orange-400/20 text-orange-200"
                                        : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
                                ])}
                            >
                                {option.label}
                                <span className="ml-1 opacity-70">{assignmentCounts[option.value]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Filter tickets…"
                            className="border-white/15 bg-white/5 pl-8 text-sm text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                        <Badge className="bg-orange-400/20 text-orange-200">
                            {pendingCount} change{pendingCount > 1 ? "s" : ""}
                        </Badge>
                    )}
                    <Btn version="secondary" onClick={onSave} disabled={pendingCount === 0} isLoading={isSaving}>
                        <span className="inline-flex items-center gap-1.5">
                            <Save className="size-4" />
                            Save
                        </span>
                    </Btn>
                </div>
            </div>

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-white/10 bg-white/5 hover:bg-white/5">
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                    className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-orange-300"
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableCell colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                                No tickets match your filter
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className={
                                    row.original.id in pendingAssignments
                                        ? "border-orange-400/20 bg-orange-400/5 hover:bg-orange-400/10"
                                        : "border-white/10 hover:bg-white/5"
                                }
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="px-3 py-2.5 align-middle text-sm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <div className="border-t border-white/10 px-4 py-2 text-xs text-slate-500">
                {table.getFilteredRowModel().rows.length} of {tickets.length} tickets
            </div>
        </div>
    );
}
