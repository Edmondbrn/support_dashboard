import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { appRoutes } from "@/config";
import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";

/**
 * Guard which redirects unauthenticated users to the signin page.
 * Shows a loading spinner while the session is being fetched to avoid a flash.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <Spinner className="size-8 text-white" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to={appRoutes.AUTH_SIGNIN} replace state={{ from: location }} />;
    }

    return children;
}