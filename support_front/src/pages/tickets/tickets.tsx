import { useAuth } from "@/hooks/context/useAuth";
import ClientTickets from "@/pages/tickets/ClientTickets";
import AgentTickets from "@/pages/tickets/AgentTickets";
import { Spinner } from "@/components/ui/spinner";

/**
 * Ticket page adapted to the role of the current user:
 * - client: lists the tickets submitted by the client
 * - agent/admin: unassigned ticket queue (with claim + filters) and assigned tickets
 */
export default function Tickets() {
    const { role, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    if (role === "agent" || role === "admin") {
        return <AgentTickets />;
    }

    return <ClientTickets />;
}