import { createSlice } from "@reduxjs/toolkit";

interface ElockFilterState {
  onlyControllerVehicles: boolean;
}

const initialState: ElockFilterState = {
  onlyControllerVehicles: false,
};

export const elockFilterSlice = createSlice({
  name: "elockFilter",
  initialState,
  reducers: {
    toggleElockFilter: (state) => {
      state.onlyControllerVehicles = !state.onlyControllerVehicles;
    },
  },
});

export const { toggleElockFilter } = elockFilterSlice.actions;
export default elockFilterSlice.reducer;
