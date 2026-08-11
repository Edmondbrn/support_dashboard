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
                        });

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
                            agent_username:profiles!agent_id (
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