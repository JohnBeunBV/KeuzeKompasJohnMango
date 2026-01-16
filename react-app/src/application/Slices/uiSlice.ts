import { createSlice } from "@reduxjs/toolkit";

interface UiState {
    forceProfileModal: boolean;
}

const initialState: UiState = {
    forceProfileModal: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        showForceProfileModal(state) {
            state.forceProfileModal = true;
        },
        hideForceProfileModal(state) {
            state.forceProfileModal = false;
        },
    },
});

export const {
    showForceProfileModal,
    hideForceProfileModal,
} = uiSlice.actions;

export default uiSlice.reducer;
