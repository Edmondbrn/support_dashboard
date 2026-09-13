import { supabase } from "@/lib/supabase";
import type { ApiCallResponse, UserRole } from "./types";

/**
 * Admin: fetch every ticket with creator + assigned agent.
 * RLS "Admin sees all tickets" handles authorization.
 */
export async function findAllTicketsForAdmin(): Promise<ApiCallResponse> {
    const { data, error } = await supabase
        .from("tickets")
        .select(`
            id,
            description,
            created_at,
            status,
            priority,
            category,
            agent_id,
            client:profiles!tickets_client_id_fkey (username),
            agent:profiles!tickets_agent_id_fkey (id, username)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[ERROR] Supabase error while fetching all tickets for admin", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}

/**
 * Admin: search agents by username for the reassignment selector.
 * RLS "Agent and admin can see profiles" (is_agent() covers admin) handles authorization.
 */
export async function searchAgents(query: string, limit = 20): Promise<ApiCallResponse> {
    const trimmed = query.trim();
    let builder = supabase
        .from("profiles")
        .select("id, username, role")
        .in("role", ["agent", "admin"])
        .order("username", { ascending: true })
        .limit(limit);

    if (trimmed.length > 0) {
        builder = builder.ilike("username", `%${trimmed}%`);
    }

    const { data, error } = await builder;

    if (error) {
        console.error("[ERROR] Supabase error while searching agents", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}

/**
 * Admin: count tickets assigned to an agent, grouped by status.
 * Used for the hover tooltip on the agent username.
 */
export async function getAgentTicketStats(agentId: string): Promise<ApiCallResponse> {
    const { data, error } = await supabase
        .rpc(
            "get_agent_ticket_stat",
            { v_agent_id: agentId }
        );

    if (error) {
        console.error("[ERROR] Supabase error while fetching agent ticket stats", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }
    
    return { status: "success", data: data };
}

/**
 * Admin: reassign a ticket via RPC (sensitive write, no direct UPDATE).
 * Backend validates caller is admin + target is an agent.
 */
export async function reassignTicket(
    ticketId: string,
    newAgentId: string,
): Promise<ApiCallResponse> {
    const { data, error } = await supabase.rpc("reassign_ticket", {
        p_ticket_id: ticketId,
        p_new_agent_id: newAgentId,
    });

    if (error) {
        console.error("[ERROR] Supabase error while reassigning ticket", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}

/**
 * Admin: fetch every user with role, creation date and last sign-in.
 * Backed by the admin_list_users RPC (admin-only, joins auth.users).
 */
export async function findAllUsersForAdmin(): Promise<ApiCallResponse> {
    // ordering (newest first) is done inside the RPC
    const { data, error } = await supabase.rpc("admin_list_users");

    if (error) {
        console.error("[ERROR] Supabase error while fetching all users for admin", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}

/**
 * Admin: update a user's role via RPC (sensitive write, no direct UPDATE).
 * Backend refuses self role changes and demoting the last admin.
 */
export async function updateUserRole(
    userId: string,
    newRole: UserRole,
): Promise<ApiCallResponse> {
    const { data, error } = await supabase.rpc("update_role", {
        p_profile_id: userId,
        p_new_role: newRole,
    });

    if (error) {
        console.error("[ERROR] Supabase error while updating user role", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}

/**
 * Admin: delete an account completely (auth user + cascaded profile/tickets).
 * Backend refuses self deletion and deleting the last admin.
 */
export async function deleteUserAccount(
    userId: string,
): Promise<ApiCallResponse> {
    const { data, error } = await supabase.rpc("admin_delete_user", {
        p_user_id: userId,
    });

    if (error) {
        console.error("[ERROR] Supabase error while deleting user", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}
