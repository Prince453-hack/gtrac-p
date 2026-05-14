"use client";
import { createSlice } from "@reduxjs/toolkit";

const initialState: GetAllVehiclesListResponse["list"] = [
  { id: 0, veh_reg: "", veh_body: "", sys_proc_host: "" },
];

export const allVehicles = createSlice({
  name: "all-vehicles",
  initialState,
  reducers: {
    setAllVehicles: (state, action) => {
      return (state = action.payload);
    },
    resetAllVehicles: (state) => {
      return (state = initialState);
    },
  },
});
export const { setAllVehicles, resetAllVehicles } = allVehicles.actions;
export default allVehicles.reducer;
