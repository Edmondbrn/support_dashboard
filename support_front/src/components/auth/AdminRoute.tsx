import { useAuth } from "@/hooks/context/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { appRoutes } from "@/config";
import { Navigate } from "react-router";
import type { ReactNode } from "react";

/**
 * Guard which only allows admins.
 * Redirects unauthenticated users to signin and non-admins to home.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
    const { user, role, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to={appRoutes.AUTH_SIGNIN} replace />;
    }

    if (role !== "admin") {
        return <Navigate to={appRoutes.HOME} replace />;
    }

    return children;
}
