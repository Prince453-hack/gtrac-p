"use client";
import { createSlice } from "@reduxjs/toolkit";
import { CSSProperties } from "react";

export interface GoogleMapPropsState {
  containerStyle: CSSProperties;
  centerOfMap: { lat: number; lng: number };
  currentCenterOfMap: { lat: number; lng: number };
  zoomNo: number;
  isMapActive: boolean;
  isGoogleExistenceVerified: boolean;
  isMapNotLoading: boolean;
  openStoppageIndex: number;
  isLoadingScreenActive: boolean;
  customStyles: google.maps.MapOptions["styles"];
  selectedMapTypeId: string;
  isCarvanMapUpdateLocationPending: boolean;
  carvanMapUniqueId: string;
  refetchVehicleListMob: boolean;
  isLiveOn: boolean;
}

const initialState: GoogleMapPropsState = {
  containerStyle: {
    height: "92.2vh",
    width: "calc(100% - 450px)",
    position: "relative",
    float: "right",
  },
  centerOfMap: { lat: 20.61595, lng: 79.14421 },
  currentCenterOfMap: { lat: 20.61595, lng: 79.14421 },
  zoomNo: 5,
  isGoogleExistenceVerified: false,
  isMapActive: false,
  isMapNotLoading: true,
  isLoadingScreenActive: false,
  openStoppageIndex: 0,
  customStyles: [],
  selectedMapTypeId: "roadmap",
  isCarvanMapUpdateLocationPending: false,
  carvanMapUniqueId: "",
  refetchVehicleListMob: false,
  isLiveOn: true,
};

export const mapSlice = createSlice({
  name: "map",
  initialState,

  reducers: {
    setContainerStyle: (
      state,
      action: { payload: GoogleMapPropsState["containerStyle"]; type: string }
    ) => {
      state.containerStyle = action.payload;
    },
    setCenterOfMap: (
      state,
      action: { payload: GoogleMapPropsState["centerOfMap"]; type: string }
    ) => {
      state.centerOfMap = action.payload;
      state.currentCenterOfMap = action.payload;

      return state;
    },
    setSelectedMapTypeId: (
      state,
      action: {
        payload: GoogleMapPropsState["selectedMapTypeId"];
        type: string;
      }
    ) => {
      state.selectedMapTypeId = action.payload;
    },
    setCurrentCenterOfMap: (
      state,
      action: {
        payload: GoogleMapPropsState["currentCenterOfMap"];
        type: string;
      }
    ) => {
      state.currentCenterOfMap = action.payload;
    },
    setZoomNo: (
      state,
      action: { payload: GoogleMapPropsState["zoomNo"]; type: string }
    ) => {
      state.zoomNo = action.payload;
    },
    setIsMapActive: (
      state,
      action: { payload: GoogleMapPropsState["isMapActive"]; type: string }
    ) => {
      state.isMapActive = action.payload;
    },
    setIsGoogleExistenceVerified: (
      state,
      action: { payload: GoogleMapPropsState["isMapActive"]; type: string }
    ) => {
      state.isGoogleExistenceVerified = action.payload;
    },
    setIsMapNotLoading: (
      state,
      action: { payload: GoogleMapPropsState["isMapNotLoading"]; type: string }
    ) => {
      state.isMapNotLoading = action.payload;
    },
    setOpenStoppageIndex: (
      state,
      action: {
        payload: GoogleMapPropsState["openStoppageIndex"];
        type: string;
      }
    ) => {
      state.openStoppageIndex = action.payload;
      return state;
    },
    setIsLoadingScreenActive: (
      state,
      action: {
        payload: GoogleMapPropsState["isLoadingScreenActive"];
        type: string;
      }
    ) => {
      state.isLoadingScreenActive = action.payload;
      return state;
    },

    setCarvanMapUniqueId: (
      state,
      action: {
        payload: GoogleMapPropsState["carvanMapUniqueId"];
        type: string;
      }
    ) => {
      state.carvanMapUniqueId = action.payload;
      return state;
    },
    resetMapStylingAndOpenStoppageIndex: (state) => {
      const { isMapActive, isMapNotLoading } = state;
      state = {
        ...initialState,
        isMapActive,
        isMapNotLoading,
        isGoogleExistenceVerified: true,
      };
      return state;
    },
    toggleRefetchVehicleListMob: (
      state,
      action: {
        payload: GoogleMapPropsState["refetchVehicleListMob"];
        type: string;
      }
    ) => {
      state = { ...initialState, refetchVehicleListMob: action.payload };
    },
    setIsLiveOn: (
      state,
      action: { payload: GoogleMapPropsState["isLiveOn"]; type: string }
    ) => {
      state.isLiveOn = action.payload;
    },
  },
});
export const {
  setCenterOfMap,
  setContainerStyle,
  setZoomNo,
  setCurrentCenterOfMap,
  setIsMapActive,
  setIsMapNotLoading,
  setOpenStoppageIndex,
  setIsGoogleExistenceVerified,
  resetMapStylingAndOpenStoppageIndex,
  setIsLoadingScreenActive,
  setSelectedMapTypeId,
  setCarvanMapUniqueId,
  toggleRefetchVehicleListMob,
  setIsLiveOn,
} = mapSlice.actions;
export default mapSlice.reducer;
