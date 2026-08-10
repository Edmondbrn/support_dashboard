import { supabase } from "@/lib/supabase";
import type { ApiCallResponse, Category, TicketPriority } from "./types";




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
 * Fetch all available ticket categories.
 * @returns 
 */
export async function findCategories() : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .from("categories")
                        .select("id, label");

    if (error) {
        console.error("[ERROR] Supabase error for collecting categories", error.message);
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
export async function createTicket(
    clientId: string, 
    categoryId : string,
    priority: TicketPriority,
    description : string,
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                        .from("tickets")
                        .insert({
                            "client_id": clientId,
                            "category_id": categoryId,
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
                        .select("client_id, agent_id, category_id, status, priority, created_at, closed_by")
                        .eq("client_id", clientId);

    if (error) {
        console.error("[ERROR] Supabase error for collecting client tickets", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};
    
}