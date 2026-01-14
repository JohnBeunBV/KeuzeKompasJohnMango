import { configureStore } from "@reduxjs/toolkit";
import vkmsReducer from "../Slices/vkmsSlice";
import uiReducer from "../Slices/uiSlice.ts";
import authReducer from "../Slices/authSlice";
import { setAuthToken } from "../../infrastructure/ApiClient";

export const store = configureStore({
  reducer: {
    vkms: vkmsReducer,
    auth: authReducer,
      ui: uiReducer,
  },
});

let currentToken: string | null = null;

store.subscribe(() => {
  const state = store.getState();
  const nextToken = state.auth.token;

  if (currentToken !== nextToken) {
    currentToken = nextToken;
    setAuthToken(nextToken);
  }
});

// initial bootstrapping
setAuthToken(store.getState().auth.token);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
