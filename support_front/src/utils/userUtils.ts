import type { Profile } from "@/apis/types";


/**
 * Function to get user's initials
 * @param profile 
 * @returns 
 */
export function getUserInitials(profile : Profile | null) {
    const displayName = profile?.username ??  "User";
    return  initialsFromUsername(displayName);
}

/**
 * Derive the avatar initials from a plain username string (no profile object).
 * @param username 
 * @returns 
 */
export function initialsFromUsername(username : string) {
    return  username
        .split(/\s+/) // split by space
        .map((part) => part.charAt(0)) // get first letter of each block
        .slice(0, 2) // keep only the two first letters
        .join("")
        .toUpperCase();
}