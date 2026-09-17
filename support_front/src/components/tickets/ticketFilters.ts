import type { TicketCategory, TicketPriority, TicketStatus } from "@/apis/types";

export interface FilterOption<T extends string> {
    value: T;
    label: string;
}

export const STATUS_OPTIONS: FilterOption<TicketStatus>[] = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS: FilterOption<TicketPriority>[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

export const CATEGORY_OPTIONS: FilterOption<TicketCategory>[] = [
    { value: "software", label: "Software" },
    { value: "hardware", label: "Hardware" },
    { value: "delivery", label: "Delivery" },
    { value: "payment", label: "Payment" },
];

export const SORT_OPTIONS = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/**
 * Toggle a value in a multi-select filter array.
 * Empty array means "no filtering" (All).
 */
export function toggleFilterValue<T>(prev: T[], value: T): T[] {
    return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
}

/**
 * Multi-select predicate: an empty selection matches everything.
 */
export function matchesMultiFilter<T>(selected: T[], value: T): boolean {
    return selected.length === 0 || selected.includes(value);
}
