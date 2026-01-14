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
            console.log("Reducer show for forceProfileModal", state.forceProfileModal);
            state.forceProfileModal = true;
        },
        hideForceProfileModal(state) {
            console.log("Reducer hide for forceProfileModal", state.forceProfileModal);
            state.forceProfileModal = false;
        },
    },
});

export const {
    showForceProfileModal,
    hideForceProfileModal,
} = uiSlice.actions;

export default uiSlice.reducer;
