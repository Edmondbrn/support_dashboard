import { supabase } from "@/lib/supabase";
import type { ApiCallResponse } from "./types";


/**
 * Fetch the whole history of a ticket
 * Number of message per ticket should not be huge, so no limit si fine
 * @param ticketId 
 * @returns 
 */
export async function findMessagesGorTicket(
    ticketId : string
) : Promise<ApiCallResponse> {

    const {data, error} = await supabase
                                .from("messages")
                                .select(`
                                    id,
                                    content,
                                    created_at,
                                    sender_id,
                                    sender:profiles!sender_id (username)
                                `)
                                .eq("ticket_id", ticketId)
                                .order("created_at", {ascending: true});
    
    if (error) {
        console.error("[ERROR] Supabase error while fetching messages", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return { status: "success", data };
}


/**
 * Create a new message inside a ticket (RLS handles sender identity)
 * @param ticketId 
 * @param senderId 
 * @param content 
 * @returns 
 */
export async function sendMessage(
    ticketId : string, 
    senderId : string, 
    content : string
) : Promise<ApiCallResponse> {
    
    const { data, error } = await supabase
        .from("messages")
        .insert({ ticket_id: ticketId, sender_id: senderId, content })
        .select()
        .single();

    if (error) {
        console.error("[ERROR] Supabase error while sending message", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data };
}