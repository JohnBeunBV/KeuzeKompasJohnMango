import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../application/store/hooks";

interface AuthGuardProps {
    children: JSX.Element;
    requireLogin?: boolean;
    roles?: string[];
}

const AuthGuard = ({
                       children,
                       requireLogin = true,
                       roles = [],
                   }: AuthGuardProps) => {
    const location = useLocation();
    const { isAuthenticated, roles: userRoles } = useAppSelector(
        (state) => state.auth
    );

    if (requireLogin && !isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (roles.length > 0) {
        const hasRole = roles.some((r) => userRoles.includes(r));
        if (!hasRole) {
            return <Navigate to="/error" replace />;
        }
    }

    return children;
};

export default AuthGuard;
