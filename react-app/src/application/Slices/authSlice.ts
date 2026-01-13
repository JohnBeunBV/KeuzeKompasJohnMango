import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {Vkm} from "@domain/models/vkm.model.ts";

import apiClient, {setAuthToken} from "../../infrastructure/ApiClient";

export function normalizeAuthUser(raw: unknown): AuthUser {
    const u = raw as Partial<AuthUser> & { [key: string]: unknown };

    return {
        id: String((u as any).id ?? (u as any)._id ?? ""),
        username: typeof u.username === "string" ? u.username : "",
        email: typeof u.email === "string" ? u.email : "",
        roles: Array.isArray(u.roles) ? u.roles.filter(r => typeof r === "string") : [],
        profile: {
            interests: Array.isArray(u.profile?.interests) ? u.profile.interests : [],
            values: Array.isArray(u.profile?.values) ? u.profile.values : [],
            goals: Array.isArray(u.profile?.goals) ? u.profile.goals : [],
        },
        favorites: Array.isArray((u as any).favorites)
            ? (u as any).favorites.filter(Boolean)
            : [],
    };
}


export interface AuthUser {
    id: string;
    username: string;
    email: string;
    roles: string[];
    profile: {
        interests: string[];
        values: string[];
        goals: string[];
    };
    favorites: Vkm[]
}

type AuthErrorReason = "missing_token" | "expired_token" | "corrupt_state" | null;
type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    status: AuthStatus;
    authError: AuthErrorReason;
    isRefreshing: boolean;
}

export const fetchUser = createAsyncThunk<AuthUser>(
    "auth/fetchUser",
    async (_, {rejectWithValue}) => {
        try {
            const res = await apiClient.get("/auth/me");
            return normalizeAuthUser(res.data);
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.error ?? "expired_token"
            );
        }
    }
);


const loadInitialAuthState = (): AuthState => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) {
        return {
            token: null,
            user: null,
            status: "idle",
            authError: "missing_token",
            isRefreshing: false,
        };
    }

    try {
        const parsed = JSON.parse(userRaw);
        return {
            token,
            user: normalizeAuthUser(parsed),
            status: "authenticated",
            authError: null,
            isRefreshing: false,
        };
    } catch {
        return {
            token: null,
            user: null,
            status: "unauthenticated",
            authError: "corrupt_state",
            isRefreshing: false,
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
            state.status = "authenticated";
            state.authError = null;

            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));

            // Also update apiClient token
            setAuthToken(action.payload.token);
        },

        logout: (state) => {
            state.token = null;
            state.user = null;
            state.status = "idle";
            state.authError = "missing_token";

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setAuthToken(null);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                if (state.status !== "authenticated") {
                    state.status = "loading";
                }

                state.isRefreshing = true;
                state.authError = null;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.status = "authenticated";
                state.authError = null;
                state.isRefreshing = false;
                localStorage.setItem("user", JSON.stringify(action.payload));
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.user = null;
                state.status = "unauthenticated";
                state.isRefreshing = false;
                state.authError =
                    (action.payload as AuthErrorReason) ?? "corrupt_state";

                localStorage.removeItem("user");
            });

    },
});


export const {loginSuccess, logout} = authSlice.actions;
export default authSlice.reducer;
