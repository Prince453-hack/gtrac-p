"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RecentlyClickedVehicle {
  vId: number;
  vehReg: string;
  clickedAt: number;
}

export interface RecentlyClickedVehiclesState {
  vehicles: RecentlyClickedVehicle[];
  maxVehicles: number;
}

const initialState: RecentlyClickedVehiclesState = {
  vehicles: [],
  maxVehicles: 6,
};

const loadFromLocalStorage = (): RecentlyClickedVehicle[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("recentlyClickedVehicles");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading recently clicked vehicles:", error);
      return [];
    }
  }
  return [];
};

const saveToLocalStorage = (vehicles: RecentlyClickedVehicle[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("recentlyClickedVehicles", JSON.stringify(vehicles));
    } catch (error) {
      console.error("Error saving recently clicked vehicles:", error);
    }
  }
};

const recentlyClickedVehiclesSlice = createSlice({
  name: "recentlyClickedVehicles",
  initialState: {
    ...initialState,
    vehicles: loadFromLocalStorage(),
  },
  reducers: {
    addRecentlyClickedVehicle: (
      state,
      action: PayloadAction<{ vId: number; vehReg: string }>
    ) => {
      const { vId, vehReg } = action.payload;
      const clickedAt = Date.now();

      // Remove vehicle if it already exists
      state.vehicles = state.vehicles.filter((vehicle) => vehicle.vId !== vId);

      state.vehicles.unshift({
        vId,
        vehReg,
        clickedAt,
      });

      if (state.vehicles.length > state.maxVehicles) {
        state.vehicles = state.vehicles.slice(0, state.maxVehicles);
      }

      // Save to localStorage
      saveToLocalStorage(state.vehicles);
    },
    removeRecentlyClickedVehicle: (state, action: PayloadAction<number>) => {
      state.vehicles = state.vehicles.filter(
        (vehicle) => vehicle.vId !== action.payload
      );
      saveToLocalStorage(state.vehicles);
    },
    clearRecentlyClickedVehicles: (state) => {
      state.vehicles = [];
      saveToLocalStorage(state.vehicles);
    },
    setMaxVehicles: (state, action: PayloadAction<number>) => {
      state.maxVehicles = Math.max(1, Math.min(10, action.payload));

      if (state.vehicles.length > state.maxVehicles) {
        state.vehicles = state.vehicles.slice(0, state.maxVehicles);
        saveToLocalStorage(state.vehicles);
      }
    },
    initializeFromLocalStorage: (state) => {
      state.vehicles = loadFromLocalStorage();
    },
  },
});

export const {
  addRecentlyClickedVehicle,
  removeRecentlyClickedVehicle,
  clearRecentlyClickedVehicles,
  setMaxVehicles,
  initializeFromLocalStorage,
} = recentlyClickedVehiclesSlice.actions;

export default recentlyClickedVehiclesSlice.reducer;
