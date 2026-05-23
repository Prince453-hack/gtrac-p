import {
  deleteCirclePoi,
  deleteGeofencePoi,
  deleteGeofencePointsOnly,
} from "@/app/_globalRedux/services/deletePOI";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const deleteCirclePoiThunk = createAsyncThunk(
  "deleteCirclePoi",
  async ({ userid, poiid }: { userid: number; poiid: number }) => {
    const response = await deleteCirclePoi(userid, poiid);
    return response.data;
  }
);

export const deleteGeofencePoiThunk = createAsyncThunk(
  "deleteGeofencePoi",
  async ({ userid, poiid }: { userid: number; poiid: number }) => {
    const response = await deleteGeofencePoi(userid, poiid);
    return response.data;
  }
);

export const deleteGeofencePointsOnlyThunk = createAsyncThunk(
  "deleteGeofencePointsOnly",
  async ({ poiid }: { poiid: number }) => {
    const response = await deleteGeofencePointsOnly(poiid);
    return response.data;
  }
);

interface DeletePOIState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: DeletePOIState = {
  loading: false,
  error: null,
  success: false,
};

const deletePOISlice = createSlice({
  name: "deletePOI",
  initialState,
  reducers: {
    resetDeletePOIState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteCirclePoiThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteCirclePoiThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteCirclePoiThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete circle POI";
      })
      .addCase(deleteGeofencePoiThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteGeofencePoiThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteGeofencePoiThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete geofence POI";
      })
      .addCase(deleteGeofencePointsOnlyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteGeofencePointsOnlyThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteGeofencePointsOnlyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to delete geofence points";
      });
  },
});

export const { resetDeletePOIState } = deletePOISlice.actions;
export default deletePOISlice.reducer;
