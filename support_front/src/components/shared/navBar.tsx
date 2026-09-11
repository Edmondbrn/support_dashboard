import { signout } from "@/apis/auth";
import { appRoutes } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    LogOut,
    MessageSquare,
    ShieldCheck,
    Ticket,
    TicketPlus
} from "lucide-react";
import { NavLink } from "react-router";
import { getUserInitials } from "@/utils/userUtils";
import UserAvatar from "./UserAvatar";
import { useRealtime } from "@/contexts/RealTimeContext";

type UserRole = Database["public"]["Enums"]["roles"];

interface NavItem {
    label: string;
    to: string;
    icon: LucideIcon;
    end?: boolean;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
    client: [
        { label: "Dashboard", to: appRoutes.HOME, icon: LayoutDashboard },
        { label: "Tickets", to: appRoutes.TICKETS, icon: Ticket, end: true },
        { label: "Create ticket", to: appRoutes.TICKET_CREATE, icon: TicketPlus },
        { label: "Messages", to: appRoutes.MESSAGES, icon: MessageSquare }
    ],
    // Navigation for agents and admins will be added later
    agent: [
        { label: "Dashboard", to: appRoutes.HOME, icon: LayoutDashboard },
        { label: "Tickets", to: appRoutes.TICKETS, icon: Ticket },
        { label: "Messages", to: appRoutes.MESSAGES, icon: MessageSquare }
    ],
    admin: [
        { label: "Dashboard", to: appRoutes.HOME, icon: LayoutDashboard },
        { label: "Tickets", to: appRoutes.TICKETS, icon: Ticket },
        { label: "All tickets", to: appRoutes.ADMIN_TICKETS, icon: ShieldCheck },
        { label: "Messages", to: appRoutes.MESSAGES, icon: MessageSquare }
    ]
};

export default function NavBar() {
    const { user, profile, role } = useAuth();
    const { unreadCount } = useRealtime();

    // default to the client menu while loading or as fallback
    const menu = NAV_ITEMS[role ?? "client"];

    if (!user) {
        return null;
    }

    const initials = getUserInitials(profile);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                {/* Brand */}
                <NavLink to={appRoutes.HOME} className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-orange-300">
                        <Ticket className="size-4" />
                    </span>
                    <span className="hidden text-sm font-semibold tracking-wide text-white sm:inline">
                        Support Desk
                    </span>
                </NavLink>

                {/* Role-driven links */}
                <nav className="flex items-center gap-1">
                    {menu.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                )
                            }
                        >
                            <item.icon className="size-4" />
                            {
                                item.to === appRoutes.MESSAGES
                                    // add read count for message menu
                                    ? (
                                        <div className="relative shrink-0">
                                            <span className="hidden md:inline">{item.label}</span>
                                            {/* undread count badge */}
                                            {unreadCount > 0 && (
                                            <span className="absolute -right-4 -top-2 flex size-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-semibold text-white ring-2 ring-black/40">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                            )}
                                        </div>
                                    )
                                    : <span className="hidden md:inline">{item.label}</span>
                            }
                        </NavLink>
                    ))}
                </nav>

                {/* User area */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <UserAvatar initials={initials} />
                        <span className="hidden text-sm text-slate-200 md:block">
                            {profile?.username ?? "User"}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sign out"
                        className="text-slate-300 hover:bg-white/10 hover:text-white"
                        onClick={() => { signout(); }}
                    >
                        <LogOut className="size-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
}