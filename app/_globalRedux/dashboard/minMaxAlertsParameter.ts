"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Vehicle Parameters Data interface
export interface VehicleParametersData {
  AddBlueMin: string;
  AddBlueMax: string;
  EngineTotalFuelUsedMin: string;
  EngineTotalFuelUsedMax: string;
  EngineCoolantTempMin: string;
  EngineCoolantTempMax: string;
  EngineOilTempMin: string;
  EngineOilTempMax: string;
  EngineOilPressureMin: string;
  EngineOilPressureMax: string;
  AcceleratorPedalPosMin: string;
  AcceleratorPedalPosMax: string;
  EngineIntakeManifoldPressureMin: string;
  EngineIntakeManifoldPressureMax: string;
  EngineIntakeManifoldTempMin: string;
  EngineIntakeManifoldTempMax: string;
  EngineIdleHoursMin: string;
  EngineIdleHoursMax: string;
  EngineIdleFuelUsedMin: string;
  EngineIdleFuelUsedMax: string;
  FuelLevelMin: string;
  FuelLevelMax: string;
  TotalVehicleDistanceMin: string;
  TotalVehicleDistanceMax: string;
  EngineFuelRateMin: string;
  EngineFuelRateMax: string;
  EngineHoursOperationMin: string;
  EngineHoursOperationMax: string;
}

// State interface
export interface MinMaxAlertsParameterState {
  data: VehicleParametersData | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedVehicleId: string | number | null;
  lastFetchedDateRange: {
    startDate: string;
    endDate: string;
  } | null;
}

// Initial state
const initialState: MinMaxAlertsParameterState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetchedVehicleId: null,
  lastFetchedDateRange: null,
};

// Create slice
const minMaxAlertsParameterSlice = createSlice({
  name: "minMaxAlertsParameter",
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // Set vehicle parameters data
    setVehicleParametersData: (
      state,
      action: PayloadAction<VehicleParametersData>
    ) => {
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Set last fetched vehicle ID
    setLastFetchedVehicleId: (
      state,
      action: PayloadAction<string | number>
    ) => {
      state.lastFetchedVehicleId = action.payload;
    },

    // Set last fetched date range
    setLastFetchedDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.lastFetchedDateRange = action.payload;
    },

    // Clear all data
    clearVehicleParametersData: (state) => {
      state.data = null;
      state.error = null;
      state.isLoading = false;
      state.lastFetchedVehicleId = null;
      state.lastFetchedDateRange = null;
    },

    // Reset to initial state
    resetMinMaxAlertsParameter: (state) => {
      return initialState;
    },
  },
});

// Export actions
export const {
  setLoading,
  setVehicleParametersData,
  setError,
  setLastFetchedVehicleId,
  setLastFetchedDateRange,
  clearVehicleParametersData,
  resetMinMaxAlertsParameter,
} = minMaxAlertsParameterSlice.actions;

// Export reducer
export default minMaxAlertsParameterSlice.reducer;
