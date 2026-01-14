import {Navigate, useLocation} from "react-router-dom";
import {useAppSelector} from "../../application/store/hooks";
import type {JSX} from "react";

const isProfileComplete = (user: any): boolean => {
    if (!user?.profile) return false;

    const {interests = [], values = [], goals = []} = user.profile;

    return (
        interests.length > 0 &&
        values.length > 0 &&
        goals.length > 0
    );
};

interface AuthGuardProps {
    children: JSX.Element;
    requireLogin?: boolean;
    requireProfile?: boolean;
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
                       requireProfile = false,
                   }: AuthGuardProps) => {
    const location = useLocation();

    const {token, isAuthenticated, user} = useAppSelector((state) => state.auth);

    const userRoles = user?.roles ?? [];
    // Token expired → 401 but with reason
    if (token && isTokenExpired(token)) {
        return (
            <Navigate
                to="/error?status=401&reason=expired"
                replace
                state={{from: location}}
            />
        );
    }
    // Not logged in / missing token
    if (requireLogin && !isAuthenticated) {
        return (
            <Navigate
                to="/error?status=401&reason=missing_token"
                replace
                state={{from: location}}
            />
        );
    }

    // Profile incomplete → force studentenprofiel
    if (
        requireLogin &&
        isAuthenticated &&
        user &&
        !isTokenExpired(token ?? "") &&
        !(isProfileComplete(user) && requireProfile) &&
        location.pathname !== "/studentenprofiel" &&
        !location.pathname.startsWith("/error")
    ) {
        return (
            <Navigate
                to="/studentenprofiel"
                replace
                state={{from: location}}
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
