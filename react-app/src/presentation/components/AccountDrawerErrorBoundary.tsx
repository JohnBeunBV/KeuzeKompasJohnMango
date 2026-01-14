import React from "react";
import { Alert } from "react-bootstrap";

export class AccountDrawerErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error("AccountDrawer crashed:", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Alert variant="danger">
                    Er ging iets mis bij het laden van je accountgegevens.
                </Alert>
            );
        }

        return this.props.children;
    }
}
