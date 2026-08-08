import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider which exposes the current authenticated user to the whole app.
 * It stays in sync with Supabase auth events (login, logout, token refresh...).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        // inital fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!isMounted) return;
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an <AuthProvider>");
    }
    return context;
}