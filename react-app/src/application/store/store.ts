// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import vkmsReducer from "../Slices/vkmsSlice";
import authReducer from "../Slices/authSlice";

export const store = configureStore({
  reducer: {
    vkms: vkmsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
