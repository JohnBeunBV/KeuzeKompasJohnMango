import { createSlice} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  roles: string[];
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null,
  roles: localStorage.getItem("roles")
      ? JSON.parse(localStorage.getItem("roles")!)
      : [],
  isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
        state,
        action: PayloadAction<{
          token: string;
          user: AuthUser;
        }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.roles = action.payload.user.roles;
      state.isAuthenticated = true;

      // persist
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem(
          "roles",
          JSON.stringify(action.payload.user.roles)
      );
    },

    logout: (state) => {
      state.token = null;
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("roles");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
