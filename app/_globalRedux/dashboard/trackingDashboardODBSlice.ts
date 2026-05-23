"use client";
import { createSlice } from "@reduxjs/toolkit";
import { GetpathwithDateDaignosticOBDResponse } from "../services/types/getpathwithDateDaignosticOBD";

export const trackingDashboardOBDInitialState: GetpathwithDateDaignosticOBDResponse =
  {
    message: "",
    success: false,
    vehicleId: "",
    data: [],
    fromTime: "",
    toTime: "",
    totalDistance: "",
    stoppageTime: 0,
    runningTime: 0,
    totalRunningDistanceKM: 0,
    totalNogps: 0,
    totalIdledistance: 0,
    avgSpeedKMH: 0,
    totalStoppage: 0,
    patharry: [],
    totalFuelConsumedT: 0,
    totalmileage: "",
  };

export const trackingDashboardOBDSlice = createSlice({
  name: "tracking-dashboard-obd",
  initialState: trackingDashboardOBDInitialState,
  reducers: {
    setTrackingDashboardOBDData: (
      state,
      action: { payload: GetpathwithDateDaignosticOBDResponse; type: string }
    ) => {
      return (state = action.payload);
    },
    resetTrackingDashboardOBDData: (state) => {
      state = trackingDashboardOBDInitialState;
      return state;
    },
    updateOBDPathArray: (
      state,
      action: { payload: typeof state.patharry; type: string }
    ) => {
      state.patharry = action.payload;
      return state;
    },
    clearOBDPathArray: (state) => {
      state.patharry = [];
      return state;
    },
  },
});

export const {
  setTrackingDashboardOBDData,
  resetTrackingDashboardOBDData,
  updateOBDPathArray,
  clearOBDPathArray,
} = trackingDashboardOBDSlice.actions;

export default trackingDashboardOBDSlice.reducer;
