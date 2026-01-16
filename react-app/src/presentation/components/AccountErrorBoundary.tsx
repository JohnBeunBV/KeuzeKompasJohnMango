// AccountErrorBoundary.tsx
import React from "react";

export default class AccountErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error("Account UI crashed", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-danger mt-3">
                    Er ging iets mis bij het laden van je accountgegevens.
                </div>
            );
        }

        return this.props.children;
    }
}
