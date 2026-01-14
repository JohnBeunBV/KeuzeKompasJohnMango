import React, {type PropsWithChildren, useEffect } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../../application/store/hooks";
import { fetchUser } from "../../application/Slices/authSlice";
import AccountErrorBoundary from "./AccountErrorBoundary.tsx";

export const AccountSection: React.FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { user, status, authError } = useAppSelector(s => s.auth);

    useEffect(() => {
        if (!user && status === "authenticated") {
            dispatch(fetchUser());
        }
    }, [dispatch, user, status]);

    if (status === "loading") {
        return <Spinner className="d-block mx-auto mt-4" />;
    }

    if (authError) {
        return (
            <Alert variant="danger">
                Accountgegevens konden niet geladen worden.
            </Alert>
        );
    }

    if (!user) {
        return <Spinner className="d-block mx-auto mt-4" />;
    }

    return (
        <AccountErrorBoundary>
            {children}
        </AccountErrorBoundary>
    );
};
