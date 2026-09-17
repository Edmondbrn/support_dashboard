import type { Database } from "@/lib/database.types";


type ApiCallStatus = "success" | "fail";

export interface ApiCallResponse {
    status : ApiCallStatus,
    errorMsg? : string,
    errorCode?: string,
    data?: unknown,
}

export type UserRole = Database["public"]["Enums"]["roles"];
export type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];
export type TicketCategory = Database["public"]["Enums"]["ticket_category"];
export type MimeType = Database["public"]["Enums"]["mime_type"];

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface AttachmentMeta {
    attachment_path: string,
    attachment_mime_type: string,
    attachment_name: string,
    attachment_size: number,
}

export interface SignedUrl {
    error: string | null;
    path: string | null;
    signedURL: string | null;
    signedUrl: string | null;
}

export interface Profile {
    id: string;
    username: string;
    role: UserRole;
}

export interface Category {
    id: string;
    label: string;
}


export interface Ticket {
    id: string,
    description: string,
    agent_profile: { username: string } | null;
    category: TicketCategory;
    status: TicketStatus;
    priority: TicketPriority;
    created_at: string;
    closed_by: string | null;
}

export interface TicketById {
    description: string,
    category: TicketCategory;
    status: TicketStatus;
    priority: TicketPriority;
    created_at: string;
    close_agent: {"username": string | null};
}

/**
 * Single row returned by the `find_user_ticket` RPC: participant ids used
 * for membership checks, plus usernames used for display.
 */
export interface UserTicket {
    ticket_id: string,
    client_id: string,
    agent_id: string | null,
    client_username: string,
    agent_username: string | null,
}

export interface UserConversation {
    id: string,
    category: TicketCategory,
    status: TicketStatus,
    priority: TicketPriority,
    description: string,
    created_at: string,
    other_user_id: string,
    username: string, // name of the other user
    last_message_content: string | null,
    last_message_at: string | null,
    last_message_username: string | null,
    sender_id: string | null
}

export interface TicketUnreadData {
    ticket_id: string,
    unread_count: number
}

export interface AdminTicket {
    id: string;
    description: string;
    created_at: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: TicketCategory;
    agent_id: string | null;
    client: { username: string } | null;
    agent: { id: string; username: string } | null;
}

export interface AgentOption {
    id: string;
    username: string;
    role?: UserRole;
}

/**
 * Demo login account read from the `demo_accounts` table.
 * password_plain is clear text on purpose (throwaway demo accounts only).
 */
export interface DemoAccount {
    id: string;
    label: string;
    email: string;
    password_plain: string;
    role: UserRole;
}

export interface AgentStats {
    count: number,
    status: TicketStatus
}

export interface AdminUser {
    id: string;
    username: string;
    role: UserRole;
    created_at: string;
    last_sign_in_at: string | null;
}