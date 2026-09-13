import { supabase } from "@/lib/supabase";
import type { ApiCallResponse, AttachmentMeta } from "./types";


/**
 * API to fetch all the conversation between the current users and someone else for a ticket
 * @returns 
 */
export async function findUserConversations(
    last_loaded_ticket_id : string | undefined,
    last_message_at: string | undefined
) : Promise<ApiCallResponse> {
    let args = {}
    if (last_loaded_ticket_id && last_message_at) {
        args = {
            "v_last_loaded_ticket_id": last_loaded_ticket_id,
            "v_last_message_at": last_message_at
        }
    }

    const {data, error} = await supabase
                                .rpc("find_conversation_for_user", args)
    
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
                                    sender:profiles!sender_id (username, role),
                                    attachment_url,
                                    attachment_mime_type,
                                    attachment_name,
                                    attachment_size
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
 * Fetch the participant ids (+ usernames) of a ticket, scoped to the caller
 * @param ticketId
 * @returns
 */
export async function findUserTicket(
    ticketId : string
) : Promise<ApiCallResponse> {

    const { data, error } = await supabase
            .rpc("find_user_ticket", { v_ticket_id: ticketId })
            .maybeSingle();

    if (error) {
        console.error("[ERROR] Supabase error while fetching ticket users", error.message);
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
    content? : string,
    attachment? : AttachmentMeta
) : Promise<ApiCallResponse> {

    let values = {
        ticket_id: ticketId, 
        sender_id: senderId, 
    }
    if (content) {
        values = {
            ...values,
            ...{content: content}
        }
    }
    // add attachment metadat if any
    if (attachment) {
        values = {
            ...values,
            ...{
                attachment_name: attachment.attachment_name,
                attachment_size: attachment.attachment_size,
                attachment_url: attachment.attachment_path,
                attachment_mime_type: attachment.attachment_mime_type
        }}
    }

    const { data, error } = await supabase
        .from("messages")
        .insert(values)
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
    const { error } = await supabase.rpc(
        "update_ticket_last_read", 
        {"v_ticket_id": ticketId}
    );

    if (error) {
        console.error("[ERROR] Supabase error while marking ticket as read", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.code };
    }

    return { status: "success" };
}


/**
 * Upload a file for the given conversation in the file path 
 * @param filePath 
 * @param file 
 * @returns 
 */
export async function uploadAttachment(
    filePath: string,
    file : File
) : Promise<ApiCallResponse> {

    const { error } = await supabase.storage
                                    .from("message-attachments")
                                    .upload(filePath, file);

    if (error) {
        console.error("[ERROR] Supabase error while uploading file to ticket bucket", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.statusCode };
    }

    return { status: "success" };
}


/**
 * Remove an uploaded file from the storage bucket if message insertion fails
 * @param filePath 
 */
export async function deleteAttachment(filePath: string): Promise<void> {
    const { error } = await supabase.storage
        .from("message-attachments")
        .remove([filePath]);

    if (error) {
        console.error("[ERROR] Failed to clean up orphaned attachment:", error.message);
    }
}

/**
 * Get downaload signed URLs to display attachment
 * @param filePath 
 * @param file 
 * @returns 
 */
export async function getAttachmentSignedUrls(
    filePaths: string[],
) : Promise<ApiCallResponse> {

    const { data, error } = await supabase.storage
                                    .from("message-attachments")
                                    .createSignedUrls(filePaths, 300); // expires after 5 minutes

    if (error) {
        console.error("[ERROR] Supabase error while downloading files from ticket bucket", error.message);
        return { status: "fail", errorMsg: error.message, errorCode: error.statusCode };
    }

    return { status: "success", data: data };
}