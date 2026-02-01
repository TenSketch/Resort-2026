import { Navigate } from "react-router";
import { useAdmin } from "@/lib/AdminProvider";
import LoadingScreen from "../shared/LoadingScreen";

interface RoleGuardProps {
    children: React.ReactNode;
    pageId: string;
    fallbackPath?: string;
}

const RoleGuard = ({ children, pageId, fallbackPath = "/dashboard/report" }: RoleGuardProps) => {
    const { canAccessPage, loading } = useAdmin();

    // Show loading screen while checking permissions
    if (loading) {
        return <LoadingScreen />;
    }

    // Redirect if user doesn't have access to this page
    if (!canAccessPage(pageId)) {
        return <Navigate to={fallbackPath} replace />;
    }

    // User has access, render the protected content
    return <>{children}</>;
};

export default RoleGuard;
