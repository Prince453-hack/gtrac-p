"use client";
import { createSlice } from "@reduxjs/toolkit";
import { VehicleItnaryWithPath } from "../services/types/getItnaryWithMapResponse";

export const vehicleItnaryWithPathInitialState: VehicleItnaryWithPath = {
  message: "",
  success: false,
  data: [],
  diagnosticData: [],
  fromTime: "",
  toTime: "",
  totalDistance: "",
  calculatedTotalDistance: 0,
  stoppageTime: "",
  runningTime: "",
  totalRunningDistanceKM: "",
  totalNogps: 0,
  totalIdledistance: 0,
  avgSpeedKMH: 0,
  totalStoppage: 0,
  totalFuelConsumedT: 0,
  vehicleId: 0,
  patharry: [],
  fuelarray: [],
};

export const vehicleItnaryWithPathSlice = createSlice({
  name: "vehicle-itnary-with-path",
  initialState: vehicleItnaryWithPathInitialState,
  reducers: {
    setVehicleItnaryWithPath: (
      state,
      action: { payload: VehicleItnaryWithPath; type: string }
    ) => {
      return (state = action.payload);
    },
    resetVehicleItnaryWithPath: (state) => {
      state = vehicleItnaryWithPathInitialState;
      return state;
    },
  },
});

export const { setVehicleItnaryWithPath, resetVehicleItnaryWithPath } =
  vehicleItnaryWithPathSlice.actions;
export default vehicleItnaryWithPathSlice.reducer;
