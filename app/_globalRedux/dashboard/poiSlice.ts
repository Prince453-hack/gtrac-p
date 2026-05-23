import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface POI {
  id: number;
  sys_user_id: number;
  name: string;
  gps_latitude: number;
  gps_longitude: number;
  gps_radius: number;
}

export interface Geofence {
  id: number;
  name: string;
  typeId: number;
  points: {
    gps_latitude: number;
    gps_longitude: number;
  }[];
}

export const initialPOIDropDownState: {
  poi: POI[];
  selectedPOI: POI | Geofence;
  geofenceList: Geofence[];
  isPOIZoomActive: boolean;
  selectedPOIList: number[]; // ✅ add this
  isManualEditMode: boolean;
  editingPOI: (POI | Geofence) | null;
} = {
  poi: [],
  geofenceList: [],
  selectedPOI: {
    id: -1,
    sys_user_id: 0,
    name: "",
    gps_latitude: 0,
    gps_longitude: 0,
    gps_radius: 0,
  },
  isPOIZoomActive: false,
  selectedPOIList: [],
  isManualEditMode: false,
  editingPOI: null,
};

export const poiSlice = createSlice({
  name: "poi-data",
  initialState: initialPOIDropDownState,
  reducers: {
    setPoiData: (state, action: PayloadAction<{ poi: POI[] }>) => {
      state.poi = action.payload.poi;
    },

    setGeoFence: (
      state,
      action: PayloadAction<{ geofenceList: Geofence[] }>
    ) => {
      state.geofenceList = action.payload.geofenceList;
    },

    setSelectedPOI: (state, action: PayloadAction<POI | Geofence>) => {
      state.selectedPOI = action.payload;
    },

    setSelectedPOIList: (state, action: PayloadAction<number[]>) => {
      state.selectedPOIList = action.payload;
    },

    setManualEditMode: (state, action: PayloadAction<boolean>) => {
      state.isManualEditMode = action.payload;
    },

    setEditingPOI: (state, action: PayloadAction<(POI | Geofence) | null>) => {
      state.editingPOI = action.payload;
    },
  },
});

export const { setPoiData, setGeoFence, setSelectedPOI, setSelectedPOIList, setManualEditMode, setEditingPOI } =
  poiSlice.actions;

export default poiSlice.reducer;
