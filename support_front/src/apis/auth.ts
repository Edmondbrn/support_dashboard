import { supabase } from "@/lib/supabase";
import type { ApiCallResponse } from "./types";



/**
 * API call to create a new user from an email
 * @param email 
 * @param password 
 * @param username 
 * @returns 
 */
export async function signUp(email: string, password : string, username : string) : Promise<ApiCallResponse> {
    const {error} = await supabase.auth.signUp({
        email: email!,
        password: password!,
        options: { // give metadata for the trigger
            data: {
                username: username!
            }
        }
    })

    if (error) {
        console.error("[ERROR] Supabase error for signup", error.message);
        return {status: "fail", errorMsg: error.message};
    }
    // disconnect the user, // TODO remove it when email confirm is set to tru
    await supabase.auth.signOut();
    return {status: "success"};
}