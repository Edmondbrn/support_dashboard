import { supabase } from "@/lib/supabase";




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