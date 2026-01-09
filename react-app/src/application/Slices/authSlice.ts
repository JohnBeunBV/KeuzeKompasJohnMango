import { createSlice} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    roles: string[];
}

type AuthErrorReason = "missing_token" | "expired_token" | "corrupt_state" | null;

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    authError: AuthErrorReason;
}


const loadInitialAuthState = (): AuthState => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        return {
            token: null,
            user: null,
            isAuthenticated: false,
            authError: "missing_token",
        };
    }

    try {
        return {
            token,
            user: JSON.parse(user),
            isAuthenticated: true,
            authError: null,
        };
    } catch {
        return {
            token: null,
            user: null,
            isAuthenticated: false,
            authError: "corrupt_state",
        };
    }
};


const initialState: AuthState = loadInitialAuthState();

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (
            state,
            action: PayloadAction<{ token: string; user: AuthUser }>
        ) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.authError = null;

            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },

        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.authError = "missing_token";

            localStorage.removeItem("token");
            localStorage.removeItem("user");
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
