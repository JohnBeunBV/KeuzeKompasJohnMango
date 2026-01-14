import {Navigate, useLocation} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks";
import { tokenExpired } from "../../application/Slices/authSlice";
import type {JSX} from "react";

interface AuthGuardProps {
    children: JSX.Element;
    requireLogin?: boolean;
    roles?: string[];
}

const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

const AuthGuard = ({
                       children,
                       requireLogin = true,
                       roles = [],
                   }: AuthGuardProps) => {
    const location = useLocation();
    const dispatch = useAppDispatch();

    const {token, status, user} = useAppSelector((state) => state.auth);

    const userRoles = user?.roles ?? ["student"];
    // Token expired → 401 but with reason
    if (token && isTokenExpired(token)) {
        dispatch(tokenExpired());
        return (
            <Navigate
                to="/error?status=401&reason=expired_token"
                replace
                state={{from: location}}
            />
        );
    }
    // Not logged in / missing token
    if (requireLogin && status === "idle") {
        return (
            <Navigate
                to="/error?status=401&reason=missing_token"
                replace
                state={{ from: location }}
            />
        );
    }

    // Corruption check
    if (roles.length > 0 && !user) {
        return (
            <Navigate
                to="/error?status=401&reason=missing_token"
                replace
            />
        );
    }


    // Authenticated but missing required role → 403
    if (roles.length > 0) {
        const hasRole = roles.some((role) => userRoles.includes(role));
        if (!hasRole) {
            return <Navigate to="/error?status=403" replace/>;
        }
    }

    return children;
};

export default AuthGuard;
