"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AmbulanceEmployee,
  AmbulanceEmployeeResponse,
} from "../services/ambulancetracking";

export interface AmbulanceTrackingState {
  ambulanceData: AmbulanceEmployeeResponse | null;
  selectedAmbulance: AmbulanceEmployee | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export const initialAmbulanceTrackingState: AmbulanceTrackingState = {
  ambulanceData: null,
  selectedAmbulance: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const ambulanceTrackingSlice = createSlice({
  name: "ambulanceTracking",
  initialState: initialAmbulanceTrackingState,
  reducers: {
    setAmbulanceData: (
      state,
      action: PayloadAction<AmbulanceEmployeeResponse>
    ) => {
      state.ambulanceData = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },
    setSelectedAmbulance: (
      state,
      action: PayloadAction<AmbulanceEmployee | null>
    ) => {
      state.selectedAmbulance = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateAmbulanceEmployee: (
      state,
      action: PayloadAction<{
        ambulanceNumber: string;
        employeeType: "driver" | "emt";
        employeeData: any;
      }>
    ) => {
      const { ambulanceNumber, employeeType, employeeData } = action.payload;

      if (state.ambulanceData) {
        const ambulanceIndex = state.ambulanceData.ambulances.findIndex(
          (amb) => amb.ambulanceNumber === ambulanceNumber
        );

        if (ambulanceIndex !== -1) {
          state.ambulanceData.ambulances[ambulanceIndex][employeeType] =
            employeeData;
        }
      }

      // Update selected ambulance if it matches
      if (state.selectedAmbulance?.ambulanceNumber === ambulanceNumber) {
        state.selectedAmbulance[employeeType] = employeeData;
      }
    },
    clearAmbulanceData: (state) => {
      state.ambulanceData = null;
      state.selectedAmbulance = null;
      state.error = null;
      state.lastUpdated = null;
    },
    resetAmbulanceTracking: () => {
      return initialAmbulanceTrackingState;
    },
  },
});

export const {
  setAmbulanceData,
  setSelectedAmbulance,
  setLoading,
  setError,
  updateAmbulanceEmployee,
  clearAmbulanceData,
  resetAmbulanceTracking,
} = ambulanceTrackingSlice.actions;

export default ambulanceTrackingSlice.reducer;
