import { Link } from "react-router";
import {
    ArrowRight,
    Inbox,
    LayoutDashboard,
    MessageSquare,
    ShieldCheck,
    Ticket,
    TicketPlus,
    Users,
    type LucideIcon,
} from "lucide-react";

import { appRoutes } from "@/config";
import { useAuth } from "@/hooks/context/useAuth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRoleBadgeVariant } from "@/utils/ticketBadges";
import { twJoin } from "tailwind-merge";

interface QuickAction {
    title: string;
    description: string;
    to: string;
    icon: LucideIcon;
}

interface HowItWorksStep {
    title: string;
    description: string;
}

interface RoleHomeContent {
    heading: string;
    subtitle: string;
    actions: QuickAction[];
    steps: HowItWorksStep[];
}

const ROLE_HOME_CONTENT: Record<string, RoleHomeContent> = {
    client: {
        heading: "How can we help you today?",
        subtitle:
            "Create a support ticket, chat with the agent assigned to you, and track the resolution all in one place.",
        actions: [
            {
                title: "New ticket",
                description: "Describe your issue and let an agent pick it up.",
                to: appRoutes.TICKET_CREATE,
                icon: TicketPlus,
            },
            {
                title: "My tickets",
                description: "Follow the status of your open and past requests.",
                to: appRoutes.TICKETS,
                icon: Ticket,
            },
            {
                title: "Messages",
                description: "Continue the conversation on your claimed tickets.",
                to: appRoutes.MESSAGES,
                icon: MessageSquare,
            },
        ],
        steps: [
            {
                title: "Describe your issue",
                description: "Open a ticket with a category, a priority and a clear description.",
            },
            {
                title: "An agent claims it",
                description: "Your ticket appears in the agent queue until someone picks it up.",
            },
            {
                title: "Chat and resolve",
                description: "Discuss directly with your agent until the ticket is closed.",
            },
        ],
    },
    agent: {
        heading: "Ready to help your clients?",
        subtitle: "Claim unassigned tickets, guide clients to a resolution, and keep your queue clean.",
        actions: [
            {
                title: "Ticket queue",
                description: "Claim unassigned tickets or manage your own.",
                to: appRoutes.TICKETS,
                icon: Inbox,
            },
            {
                title: "Messages",
                description: "Reply to clients and follow up on ongoing cases.",
                to: appRoutes.MESSAGES,
                icon: MessageSquare,
            },
        ],
        steps: [
            {
                title: "Claim a ticket",
                description: "Pick an unassigned ticket from the queue that matches your skills.",
            },
            {
                title: "Help the client",
                description: "Chat with them to understand and fix the issue.",
            },
            {
                title: "Close or reopen",
                description: "Close resolved tickets, reopen them if the problem comes back.",
            },
        ],
    },
    admin: {
        heading: "Keep the support desk running.",
        subtitle:
            "You have the same tools as agents, plus oversight of every ticket, discussion and user account.",
        actions: [
            {
                title: "Ticket queue",
                description: "Claim tickets and work cases like an agent.",
                to: appRoutes.TICKETS,
                icon: Inbox,
            },
            {
                title: "All tickets",
                description: "Review every ticket and reassign them when needed.",
                to: appRoutes.ADMIN_TICKETS,
                icon: ShieldCheck,
            },
            {
                title: "Users",
                description: "Update roles or remove accounts.",
                to: appRoutes.ADMIN_USERS,
                icon: Users,
            },
            {
                title: "Messages",
                description: "Access any discussion for supervision.",
                to: appRoutes.MESSAGES,
                icon: MessageSquare,
            },
        ],
        steps: [
            {
                title: "Handle tickets",
                description: "Claim, discuss, close or reopen tickets like an agent.",
            },
            {
                title: "Supervise everything",
                description: "Browse all tickets and every discussion across the platform.",
            },
            {
                title: "Reassign when needed",
                description: "Move a ticket to another agent to balance the load.",
            },
            {
                title: "Manage accounts",
                description: "Change user roles or delete accounts from the Users page.",
            },
        ],
    },
};

/**
 * Role-aware landing page: quick actions plus a short "how it works" guide.
 */
export default function Home() {
    const { profile } = useAuth();

    if (!profile) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                    <LayoutDashboard className="size-7 text-orange-300" />
                </span>
                <h1 className="text-lg font-medium text-white">Something went wrong</h1>
                <p className="max-w-md text-sm text-slate-400">
                    We could not load your profile. Please sign out and sign in again.
                </p>
            </div>
        );
    }

    const content = ROLE_HOME_CONTENT[profile.role] ?? ROLE_HOME_CONTENT.client;

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-4 py-20 sm:px-6">
            {/* Hero */}
            <section className="flex flex-col items-center gap-3 text-center">
                <LayoutDashboard className="size-10 text-orange-300" />
                <p className="text-sm text-slate-400">Welcome back, {profile.username}</p>
                <h1 className="max-w-xl text-lg font-semibold text-white sm:text-3xl">
                    {content.heading}
                </h1>
                <Badge className={twJoin(["capitalize", getRoleBadgeVariant(profile.role)])}>
                    {profile.role}
                </Badge>
                <p className="max-w-xl text-sm text-slate-400">{content.subtitle}</p>
            </section>

            {/* Quick actions */}
            <section className="flex w-full flex-col items-center gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-orange-300">
                    Quick actions
                </h2>
                <div
                    className={twJoin([
                        "grid w-full list-none grid-cols-1 gap-4 p-0",
                        content.actions.length > 3
                            ? "sm:grid-cols-2 xl:grid-cols-4"
                            : "sm:grid-cols-2 lg:grid-cols-3",
                    ])}
                >
                    {content.actions.map((action) => (
                        <Card key={action.to + action.title} className="bg-glass text-white">
                            <CardHeader>
                                <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                                    <action.icon className="size-5 text-orange-300" />
                                </span>
                                <CardTitle>{action.title}</CardTitle>
                                <CardDescription className="text-slate-400">
                                    {action.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link
                                    to={action.to}
                                    className={cn(
                                        buttonVariants({ variant: "outline", size: "sm" }),
                                        "border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white",
                                    )}
                                >
                                    Open
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="flex w-full flex-col items-center gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-orange-300">
                    How it works
                </h2>
                <ol
                    className={twJoin([
                        "grid w-full list-none grid-cols-1 gap-4 p-0",
                        content.steps.length > 3 ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3",
                    ])}
                >
                    {content.steps.map((step, index) => (
                        <li
                            key={step.title}
                            className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left"
                        >
                            <span
                                aria-hidden
                                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-400/20 text-sm font-semibold text-orange-200"
                            >
                                {index + 1}
                            </span>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium text-white">{step.title}</p>
                                <p className="text-sm text-slate-400">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}
