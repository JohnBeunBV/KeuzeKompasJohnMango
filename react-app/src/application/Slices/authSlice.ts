import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {Vkm} from "@domain/models/vkm.model.ts";
import apiClient, {setAuthToken} from "../../infrastructure/ApiClient";

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

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    authError: AuthErrorReason;
}

export const fetchUser = createAsyncThunk<AuthUser>(
    "auth/fetchUser",
    async (_, {rejectWithValue}) => {
        try {
            const res = await apiClient.get("/auth/me");
            return res.data as AuthUser;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || err.message);
        }
    }
);

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

            setAuthToken(action.payload.token);
        },

        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.authError = "missing_token";

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setAuthToken(null);
        },

        // ✅ Nieuwe action om user/profiel direct bij te werken
        setUser: (state, action: PayloadAction<AuthUser>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.authError = null;

            localStorage.setItem("user", JSON.stringify(action.payload));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                state.authError = null;
            })
            .addCase(fetchUser.fulfilled, (state, action: PayloadAction<AuthUser>) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.authError = null;

                localStorage.setItem("user", JSON.stringify(action.payload));
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.user = null;
                state.isAuthenticated = false;
                state.authError = action.payload as AuthErrorReason || "corrupt_state";

                localStorage.removeItem("user");
            });
    },
});



export const {loginSuccess, logout, setUser} = authSlice.actions;
export default authSlice.reducer;
