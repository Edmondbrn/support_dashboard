import type { Profile, UserRole } from "@/apis/types";
import type { User } from "@supabase/supabase-js";
import { createContext } from "react";

export interface AuthContextValue {
    user: User | null;
    profile: Profile | null;
    role: UserRole | null;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
