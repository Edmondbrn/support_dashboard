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


/**
 * API call to connect a user based on the password
 * @param email 
 * @param password 
 * @returns 
 */
export async function signin(email : string, password : string) : Promise<ApiCallResponse> {
    const {data, error} = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })

    if (error) {
        console.error("[ERROR] Supabase error for signin", error.message);
        return {status: "fail", errorMsg: error.message};
    }
    return {status: 'success', data: data.user}
}



/**
 * APi call to connect a user based on the password
 * @param email 
 * @param password 
 * @returns 
 */
export async function signout() : Promise<ApiCallResponse> {
    const {error} = await supabase.auth.signOut();

    if (error) {
        console.error("[ERROR] Supabase error whiel singing out", error.message);
        return {status: "fail", errorMsg: error.message};
    }
    return {status: 'success'};
}