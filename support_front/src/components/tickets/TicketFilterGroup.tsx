import { twJoin } from "tailwind-merge";

import type { FilterOption } from "./ticketFilters";

interface TicketFilterGroupProps<T extends string> {
    label: string;
    ariaLabel: string;
    options: FilterOption<T>[];
    selected: T[];
    counts?: Partial<Record<T, number>>;
    onToggle: (value: T) => void;
}

/**
 * Multi-select pill group styled like the AdminUsersTable role filter.
 * `aria-pressed` reflects selection; empty `selected` means "All".
 */
export default function TicketFilterGroup<T extends string>({
    label,
    ariaLabel,
    options,
    selected,
    counts,
    onToggle,
}: TicketFilterGroupProps<T>) {
    return (
        <div className="flex flex-col items-start gap-1.5">
            <span className="text-xs font-medium text-slate-400">{label}</span>
            <div
                role="group"
                aria-label={ariaLabel}
                className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
            >
                {options.map((option) => {
                    const isActive = selected.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onToggle(option.value)}
                            aria-pressed={isActive}
                            className={twJoin([
                                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                                isActive
                                    ? "bg-orange-400/20 text-orange-200"
                                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
                            ])}
                        >
                            {option.label}
                            {counts?.[option.value] !== undefined && (
                                <span className="ml-1 opacity-70">{counts[option.value]}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
