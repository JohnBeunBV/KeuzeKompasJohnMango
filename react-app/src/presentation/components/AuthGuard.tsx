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

    // Not authenticated → 401
    if (requireLogin && !isAuthenticated) {
        return (
            <Navigate
                to="/error?status=401"
                replace
                state={{ from: location }}
            />
        );
    }

    // Authenticated but missing required role → 403
    if (roles.length > 0) {
        const hasRole = roles.some((r) => userRoles.includes(r));
        if (!hasRole) {
            return (
                <Navigate
                    to="/error?status=403"
                    replace
                />
            );
        }
    }

    return children;
};

export default AuthGuard;
