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
