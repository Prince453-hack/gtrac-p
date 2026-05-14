import { createSlice } from "@reduxjs/toolkit";

interface FuelFilterState {
  onlyFuelEnabled: boolean;
}

const initialState: FuelFilterState = {
  onlyFuelEnabled: false,
};

export const fuelFilterSlice = createSlice({
  name: "fuelFilter",
  initialState,
  reducers: {
    toggleFuelFilter: (state) => {
      state.onlyFuelEnabled = !state.onlyFuelEnabled;
    },
  },
});

export const { toggleFuelFilter } = fuelFilterSlice.actions;
export default fuelFilterSlice.reducer;
