// src/features/vkms/vkmsSlice.ts
import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import type {Vkm} from "@domain/models/vkm.model";
import {getVkmById, getVkms} from "../../DomainServices/Vkms.service";
import type {VkmsResponse, VkmsQuery} from "../../DomainServices/Vkms.service";

interface VkmsState {
    data: Vkm[];
    selected: Vkm | null;
    total: number;
    totalPages: number;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const initialState: VkmsState = {
    data: [],
    selected: null,
    total: 0,
    totalPages: 1,
    status: "idle",
    error: null,
};

// thunk met default limit
export const fetchVkms = createAsyncThunk<
    VkmsResponse & { limit: number }, // return type
    VkmsQuery
>("vkms/fetchVkms", async (query: VkmsQuery) => {
    const result = await getVkms(query);

    // 🛡 Zorg dat limit altijd een number is
    const limit = query.limit ?? 12;

    return {...result, limit};
});
export const fetchVkmById = createAsyncThunk<Vkm, string>(
    "vkms/fetchVkmById",
    async (id) => {
        return await getVkmById(id);
    }
);


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
                state.data = Array.isArray(action.payload.vkms) ? action.payload.vkms : [];
                state.total = action.payload.meta.total;

                const limit = action.payload.limit > 0 ? action.payload.limit : 12;
                state.totalPages = limit > 0 ? Math.ceil(state.total / limit) : 1;

                state.status = "succeeded";

            })
            .addCase(fetchVkms.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message || "Kon data niet laden";
            })
            .addCase(fetchVkmById.pending, (state) => {
                state.status = "loading";
                state.error = null;
                state.selected = null;
            })
            .addCase(fetchVkmById.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.selected = action.payload;
            })
            .addCase(fetchVkmById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message || "Kon Vkm niet laden";
            });
    },
});


export default vkmsSlice.reducer;
