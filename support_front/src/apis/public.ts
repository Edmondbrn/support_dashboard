import { supabase } from "@/lib/supabase";
import type { ApiCallResponse, TicketCategory, TicketPriority } from "./types";




/**
 * @param userId 
 * @returns 
 */
export async function findProfile(userId : string) {
    return await supabase
            .from("profiles")
            .select("id, username, role")
            .eq("id", userId)
            .maybeSingle()
}


/**
 * Funtion to create a ticket
 * @param clientId 
 * @param category
 * @param priority 
 * @returns 
 */
export async function createTicket(
    clientId: string, 
    category : TicketCategory,
    priority: TicketPriority,
    description : string,
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .from("tickets")
                        .insert({
                            "client_id": clientId,
                            "category": category,
                            "description": description,
                            "priority": priority
                        }).select("id").single();

    if (error) {
        console.error("[ERROR] Supabase error for creating ticket", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};
    
}


/**
 * Funtion to create a ticket
 * @param clientId 
 * @param categoryId 
 * @param priority 
 * @returns 
 */
export async function findTicketsByClient(
    clientId: string, 
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .from("tickets")
                        .select(`
                            id, 
                            agent_profile:profiles!agent_id (
                                username
                            ),
                            description,
                            status, 
                            priority, 
                            created_at, 
                            closed_by,
                            category`
                        )
                        .eq("client_id", clientId);

    if (error) {
        console.error("[ERROR] Supabase error for collecting client tickets", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};
    
}


/**
 * API to find unassigned ticket to let agent choose one
 * @returns 
 */
export async function findUnassignedTicket(

) : Promise<ApiCallResponse> {
    const {data, error} = await supabase
                                .from("tickets")
                                .select(`
                                    id,
                                    description,
                                    priority,
                                    status, 
                                    created_at,
                                    category
                                `)
                                .is("agent_id", null);

    if (error) {
        console.error("[ERROR] Supabase error for collecting unassigned tickets", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data}

}

/**
 * API to find the tickets assigned to a given agent
 * @param agentId 
 * @returns 
 */
export async function findAssignedTicketsByAgent(
    agentId: string,
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .from("tickets")
                        .select(`
                            id, 
                            agent_profile:profiles!agent_id (
                                username
                            ),
                            description,
                            status, 
                            priority, 
                            created_at, 
                            closed_by,
                            category`
                        )
                        .eq("agent_id", agentId);

    if (error) {
        console.error("[ERROR] Supabase error for collecting agent's tickets", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};

}


/**
 * API for an agent to claim (assign to himself) an unassigned ticket
 * @param ticketId 
 * @param agentId 
 * @returns 
 */
export async function claimTicket(
    ticketId: string,
    agentId: string,
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .rpc("claim_ticket", {
                            "p_ticket_id": ticketId,
                            "p_agent_id": agentId,
                        });

    if (error) {
        console.error("[ERROR] Supabase error while claiming the ticket", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};

}


/**
 * API for an agent to claim (assign to himself) an unassigned ticket
 * @param ticketId 
 * @param agentId 
 * @returns 
 */
export async function inProgressTicket(
    ticketId: string
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .rpc("in_progress_ticket", {
                            "p_ticket_id": ticketId,
                        });

    if (error) {
        console.error("[ERROR] Supabase error while updating the ticket status", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};

}

/**
 * API to delete an open ticket
 * @param ticketId 
 * @returns 
 */
export async function deleteTicket(
    ticketId : string
) : Promise<ApiCallResponse> {


    const {data, error} = await supabase
                            .from("tickets")
                            .delete()
                            .eq("id", ticketId);

    if (error) {
        console.error("[ERROR] Supabase error while deleting the ticket", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data}

}