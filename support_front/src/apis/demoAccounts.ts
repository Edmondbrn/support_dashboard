import { supabase } from "@/lib/supabase";
import type { ApiCallResponse } from "./types";


/**
 * Fetch the demo login accounts (client1, agent1, admin).
 * Readable by anyone (anon) so the signin page can offer one-click login.
 * @returns
 */
export async function getDemoAccounts() : Promise<ApiCallResponse> {
    const {data, error} = await supabase
        .from("demo_accounts")
        .select("id, label, email, password_plain, role")
        .order("label");

    if (error) {
        console.error("[ERROR] Supabase error for fetching demo accounts", error.message);
        return {status: "fail", errorMsg: error.message, errorCode: error.code};
    }

    return {status: "success", data: data};
}
