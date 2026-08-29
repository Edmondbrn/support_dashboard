import { supabase } from "@/lib/supabase";
import type { ApiCallResponse } from "./types";


/**
 * API to fetch all the conversation between the current users and someone else for a ticket
 * @returns 
 */
export async function findUserConversations(
    last_loaded_ticket_id : string | undefined,
    last_message_at: string | undefined
) : Promise<ApiCallResponse> {
    const {data, error} = await supabase
                                .rpc("find_conversation_for_user", {
                                    "v_last_loaded_ticket_id": last_loaded_ticket_id,
                                    "v_last_message_at": last_message_at
                                })
    
    if (error) {
        console.error("[ERROR] Supabase error while fetching conversations", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }
    return { status: "success", data };
}

/**
 * Find conversation data to load the card in conversation list
 * @param ticketId 
 * @returns 
 */
export async function findConversationById(ticketId: string) {
  const { data, error } = await supabase
    .rpc("find_conversation_by_id", { v_ticket_id: ticketId })
    .maybeSingle();

  if (error) {
    console.error("[ERROR] Supabase error while fetching the conversation", error.message);
    return { status: "error", errorMsg: error.message };
  }
  return { status: "success", data };
}

/**
 * Fetch the whole history of a ticket
 * Number of message per ticket should not be huge, so no limit si fine
 * @param ticketId 
 * @returns 
 */
export async function findMessagesForTicket(
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
 * Fetch the usernames of users related to the ticket
 * @param ticketId 
 * @returns 
 */
export async function findTicketUsers(
    ticketId : string
) : Promise<ApiCallResponse> {

    const { data, error } = await supabase
            .from("tickets")
            .select(`
                client:profiles!tickets_client_id_fkey (username),
                agent:profiles!tickets_agent_id_fkey   (username)
            `)
            .eq("id", ticketId)
            .maybeSingle();
    
    if (error) {
        console.error("[ERROR] Supabase error while fetching messages", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return { status: "success", data: data };
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

    return { status: "success", data: data };
}


/**
 * Fetch unread data at app boots
 * @returns 
 */
export async function fetchUnreadCounts(
) : Promise<ApiCallResponse> {
    const { data, error } = await supabase.rpc("get_unread_counts");

    if (error) {
        console.error("[ERROR] Supabase error while fetching unread counts", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success", data: data };
}


/**
 * Fetch unread data at app boots
 * @returns 
 */
export async function markTicketRead(
    ticketId : string
) : Promise<ApiCallResponse> {
    const { error } = await supabase.rpc("update_ticket_last_read", {"v_ticket_id": ticketId});

    if (error) {
        console.error("[ERROR] Supabase error while marking ticket as read", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success" };
}