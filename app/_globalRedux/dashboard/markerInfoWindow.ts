'use client';
import { createSlice } from '@reduxjs/toolkit';

const initialState: number = -1;

export const markerInfoWindow = createSlice({
	name: 'markers-info-window',
	initialState,
	reducers: {
		setIsMarkerInfoWindowOpen: (state, action: { payload: number; type: string }) => {
			return (state = action.payload);
		},
		resetIsMarkerInfoWindowOpen: (state) => {
			return (state = initialState);
		},
	},
});
export const { setIsMarkerInfoWindowOpen, resetIsMarkerInfoWindowOpen } = markerInfoWindow.actions;
export default markerInfoWindow.reducer;
