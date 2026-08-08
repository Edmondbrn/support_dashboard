import type { Database } from "@/lib/database.types";


type ApiCallStatus = "success" | "fail";

export interface ApiCallResponse {
    status : ApiCallStatus,
    errorMsg? : string,
    errorCode?: string,
    data?: unknown,
}

export type UserRole = Database["public"]["Enums"]["roles"];

export interface Profile {
    id: string;
    username: string;
    role: UserRole;
}