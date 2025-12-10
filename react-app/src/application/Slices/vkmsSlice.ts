// src/features/vkms/vkmsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Vkm } from "@domain/models/vkm.model";
import { getVkms } from "../../DomainServices/Vkms.service";
import type { VkmsResponse, VkmsQuery } from "../../DomainServices/Vkms.service";

interface VkmsState {
  data: Vkm[];
  total: number;
  page: number;
  totalPages: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: VkmsState = {
  data: [],
  total: 0,
  page: 1,
  totalPages: 1,
  status: "idle",
  error: null,
};

// ✅ thunk met default limit
export const fetchVkms = createAsyncThunk<
  VkmsResponse & { limit: number }, // return type
  VkmsQuery
>("vkms/fetchVkms", async (query: VkmsQuery) => {
  const result = await getVkms(query);

  // 🛡 Zorg dat limit altijd een number is
  const limit = query.limit ?? 12;

  return { ...result, limit };
});

const vkmsSlice = createSlice({
  name: "vkms",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVkms.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchVkms.fulfilled, (state, action) => {
        state.status = "succeeded";

        state.data = Array.isArray(action.payload.vkms) ? action.payload.vkms : [];
        state.total = typeof action.payload.total === "number" ? action.payload.total : 0;
        state.page = typeof action.payload.page === "number" ? action.payload.page : 1;

        const limit = action.payload.limit > 0 ? action.payload.limit : 12;
        state.totalPages = limit > 0 ? Math.ceil(state.total / limit) : 1;
      })
      .addCase(fetchVkms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Kon data niet laden";
      });
  },
});


export default vkmsSlice.reducer;
