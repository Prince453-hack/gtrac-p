"use client";
import { createSlice } from "@reduxjs/toolkit";
import { VehicleItnaryWithPath } from "../services/types/getItnaryWithMapResponse";

export const liveVehicleInitialState: VehicleItnaryWithPath = {
  message: "",
  success: false,
  data: [],
  diagnosticData: [],
  fromTime: "",
  toTime: "",
  totalDistance: "",
  stoppageTime: "",
  calculatedTotalDistance: 0,
  runningTime: "",
  totalFuelConsumedT: 0,
  totalRunningDistanceKM: "",
  totalNogps: 0,
  totalIdledistance: 0,
  avgSpeedKMH: 0,
  totalStoppage: 0,
  vehicleId: 0,
  patharry: [],
  fuelarray: [],
};

export const liveVehicleItnaryWithPathSlice = createSlice({
  name: "vehicle-itnary-with-path",
  initialState: liveVehicleInitialState,
  reducers: {
    setLiveVehicleItnaryWithPath: (
      state,
      action: { payload: VehicleItnaryWithPath; type: string }
    ) => {
      return (state = action.payload);
    },
    resetLiveVehicleItnaryWithPath: (state) => {
      state = liveVehicleInitialState;
      return state;
    },
  },
});

export const { setLiveVehicleItnaryWithPath, resetLiveVehicleItnaryWithPath } =
  liveVehicleItnaryWithPathSlice.actions;
export default liveVehicleItnaryWithPathSlice.reducer;
