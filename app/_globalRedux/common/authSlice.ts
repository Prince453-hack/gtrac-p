"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  isLoading: boolean;
  userId: string;
  mobileNumber: string;
  userName: string;
  groupId: string;
  accessLabel: number | null;
  parentUser: string;
  extra: string;

  password: string;
  company: string;
  address: string;
  billingAddress: string;
  mobileAppToken: string;
  payment: number;
  logo: string;
  isAc: number;
  isAlcohol: number;
  isOdometer: number;
  vehicleType: string;
  isVideoTelematics: number;
  isTemp: number;
  isPadlock: number;
  isMachine: number;
  isEveVehicle: number;
  isMarketVehicle: number;
  isGoogleMap: number;
  isCrackPadlock: number;
  isOdb: number;
};
export const initialAuthState: AuthState = {
  isLoading: false,
  userId: "",
  groupId: "",
  userName: "",
  mobileNumber: "",
  accessLabel: null,
  parentUser: "",
  extra: "",
  password: "",
  company: "",
  address: "",
  billingAddress: "",
  mobileAppToken: "",
  payment: 0,
  logo: "",
  isAc: 0,
  isAlcohol: 0,
  isOdometer: 0,
  vehicleType: "",
  isTemp: 0,
  isPadlock: 0,
  isVideoTelematics: 0,
  isMachine: 0,
  isEveVehicle: 0,
  isMarketVehicle: 0,
  isGoogleMap: 1,
  isCrackPadlock: 0,
  isOdb: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setAuth: (state, action: { payload: AuthState; type: string }) => {
      return (state = action.payload);
    },
    setAuthLoading: (
      state,
      action: { payload: AuthState["isLoading"]; type: string },
    ) => {
      return (state = { ...state, isLoading: action.payload });
    },
  },
});

export const { setAuth, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
