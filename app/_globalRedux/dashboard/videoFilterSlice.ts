import { createSlice } from "@reduxjs/toolkit";

interface VideoFilterState {
  onlyVideoEnabled: boolean;
}

const initialState: VideoFilterState = {
  onlyVideoEnabled: false,
};

export const videoFilterSlice = createSlice({
  name: "videoFilter",
  initialState,
  reducers: {
    toggleVideoFilter: (state) => {
      state.onlyVideoEnabled = !state.onlyVideoEnabled;
    },
  },
});

export const { toggleVideoFilter } = videoFilterSlice.actions;
export default videoFilterSlice.reducer;
