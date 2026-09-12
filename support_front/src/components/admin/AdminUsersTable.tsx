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
import { ArrowUpDown, Save, Search, Trash2, Undo2 } from "lucide-react";
import { twJoin } from "tailwind-merge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Btn } from "@/components/shared/button";
import { getRoleBadgeVariant } from "@/utils/ticketBadges";
import { timeStampToDate } from "@/utils/dateUtils";
import type { AdminUser, UserRole } from "@/apis/types";

interface AdminUsersTableProps {
    users: AdminUser[];
    pendingRoles: Record<string, UserRole>;
    pendingDeletes: Record<string, true>;
    pendingCount: number;
    isSaving: boolean;
    onSelectRole: (userId: string, role: UserRole, currentRole: UserRole) => void;
    onToggleDelete: (userId: string, currentRole: UserRole) => void;
    isProtected: (userId: string, role: UserRole) => boolean;
    onSave: () => void;
}

const columnHelper = createColumnHelper<AdminUser>();

type RoleFilter = "all" | UserRole;

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "client", label: "Clients" },
    { value: "agent", label: "Agents" },
    { value: "admin", label: "Admins" },
];

const ROLE_OPTIONS: UserRole[] = ["client", "agent", "admin"];

function SortableHeader({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            {label}
            <ArrowUpDown className="size-3 opacity-60" />
        </span>
    );
}

function formatLastSeen(value: string | null) {
    if (!value) return "Never";
    return timeStampToDate(value);
}

/**
 * Glass dark-orange datatable for admins.
 * Sorting + global filtering + role filtering run through the TanStack table engine.
 * Role changes and deletions are staged per row, then persisted with Save.
 */
export default function AdminUsersTable({
    users,
    pendingRoles,
    pendingDeletes,
    pendingCount,
    isSaving,
    onSelectRole,
    onToggleDelete,
    isProtected,
    onSave,
}: AdminUsersTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
    const [globalFilter, setGlobalFilter] = useState("");

    const columns = useMemo(
        () => [
            columnHelper.accessor("username", {
                header: () => <SortableHeader label="Username" />,
                cell: (info) => {
                    const stagedDelete = info.row.original.id in pendingDeletes;
                    return (
                        <span
                            className={twJoin([
                                "font-medium",
                                stagedDelete ? "text-red-300 line-through" : "text-slate-100",
                            ])}
                        >
                            {info.getValue()}
                        </span>
                    );
                },
            }),
            columnHelper.accessor("role", {
                header: () => <SortableHeader label="Role" />,
                filterFn: (row, columnId, filterValue) => {
                    if ((filterValue as RoleFilter) === "all") return true;
                    return row.getValue(columnId) === filterValue;
                },
                cell: (info) => {
                    const current = info.getValue();
                    const staged = pendingRoles[info.row.original.id];
                    const display = staged ?? current;
                    const protectedRow = isProtected(info.row.original.id, current);
                    const stagedDelete = info.row.original.id in pendingDeletes;
                    return (
                        <span className="flex items-center gap-2">
                            <Badge className={twJoin(["capitalize", getRoleBadgeVariant(display)])}>
                                {display}
                                {staged ? " (new)" : ""}
                            </Badge>
                            <select
                                aria-label={`Role for ${info.row.original.username}`}
                                value={display}
                                disabled={protectedRow || stagedDelete}
                                title={
                                    protectedRow
                                        ? "Own account and sole admin are protected"
                                        : stagedDelete
                                          ? "User staged for deletion"
                                          : "Stage a role change"
                                }
                                onChange={(e) =>
                                    onSelectRole(
                                        info.row.original.id,
                                        e.target.value as UserRole,
                                        current,
                                    )
                                }
                                className="rounded-lg border border-white/15 bg-white/5 px-1.5 py-1 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {ROLE_OPTIONS.map((role) => (
                                    <option key={role} value={role} className="bg-slate-900">
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </span>
                    );
                },
            }),
            columnHelper.accessor("created_at", {
                header: () => <SortableHeader label="Created" />,
                cell: (info) => (
                    <span className="whitespace-nowrap text-slate-300">
                        {timeStampToDate(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor("last_sign_in_at", {
                header: () => <SortableHeader label="Last online" />,
                sortingFn: (a, b, columnId) => {
                    const left = a.getValue(columnId) as string | null;
                    const right = b.getValue(columnId) as string | null;
                    if (left == null && right == null) return 0;
                    if (left == null) return 1;
                    if (right == null) return -1;
                    return left < right ? -1 : left > right ? 1 : 0;
                },
                cell: (info) => (
                    <span className="whitespace-nowrap text-slate-300">
                        {formatLastSeen(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.display({
                id: "delete",
                header: () => <span className="sr-only">Delete</span>,
                cell: ({ row }) => {
                    const stagedDelete = row.original.id in pendingDeletes;
                    const protectedRow = isProtected(row.original.id, row.original.role);
                    return (
                        <button
                            type="button"
                            aria-label={stagedDelete ? `Cancel deletion of ${row.original.username}` : `Delete ${row.original.username}`}
                            title={
                                protectedRow
                                    ? "Own account and sole admin are protected"
                                    : stagedDelete
                                      ? "Cancel deletion"
                                      : "Stage account deletion (removes tickets and messages)"
                            }
                            disabled={protectedRow}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleDelete(row.original.id, row.original.role);
                            }}
                            className={twJoin([
                                "rounded-lg border p-1.5 transition-colors",
                                stagedDelete
                                    ? "border-orange-400/60 bg-orange-400/10 text-orange-200 hover:bg-orange-400/20"
                                    : "border-white/10 bg-white/5 text-red-300 hover:bg-red-500/20",
                                protectedRow && "cursor-not-allowed opacity-40 hover:bg-white/5",
                            ])}
                        >
                            {stagedDelete ? <Undo2 className="size-4" /> : <Trash2 className="size-4" />}
                        </button>
                    );
                },
            }),
        ],
        [pendingRoles, pendingDeletes, onSelectRole, onToggleDelete, isProtected],
    );

    const roleCounts = useMemo(() => {
        const counts: Record<RoleFilter, number> = { all: users.length, client: 0, agent: 0, admin: 0 };
        for (const user of users) {
            counts[user.role] += 1;
        }
        return counts;
    }, [users]);

    const table = useReactTable({
        data: users,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const query = String(filterValue).toLowerCase();
            if (!query) return true;
            const u = row.original;
            return [u.username, u.role].join(" ").toLowerCase().includes(query);
        },
    });

    const roleFilter = (table.getColumn("role")?.getFilterValue() as RoleFilter | undefined) ?? "all";

    return (
        <div className="w-full overflow-hidden rounded-xl bg-glass shadow-2xl">
            {/* Toolbar: role filter + global filter (TanStack) + Save top-right */}
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center">
                    <div
                        role="group"
                        aria-label="Filter by role"
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
                    >
                        {ROLE_FILTERS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => table.getColumn("role")?.setFilterValue(option.value)}
                                aria-pressed={roleFilter === option.value}
                                className={twJoin([
                                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                                    roleFilter === option.value
                                        ? "bg-orange-400/20 text-orange-200"
                                        : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
                                ])}
                            >
                                {option.label}
                                <span className="ml-1 opacity-70">{roleCounts[option.value]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Filter users…"
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
                                No users match your filter
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => {
                            const staged = row.original.id in pendingRoles || row.original.id in pendingDeletes;
                            return (
                                <TableRow
                                    key={row.id}
                                    className={
                                        row.original.id in pendingDeletes
                                            ? "border-red-400/20 bg-red-400/5 hover:bg-red-400/10"
                                            : staged
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
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <div className="border-t border-white/10 px-4 py-2 text-xs text-slate-500">
                {table.getFilteredRowModel().rows.length} of {users.length} users
            </div>
        </div>
    );
}
