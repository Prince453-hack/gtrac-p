'use client';
import { createSlice } from '@reduxjs/toolkit';
import { Markers } from '../services/types/getListVehiclesmobTypes';

const initialState: Markers[] | [] = [];

export const selectedVehicleStatusSlice = createSlice({
	name: 'markers',
	initialState,
	reducers: {
		setAllMarkers: (state, action: { payload: Markers[]; type: string }) => {
			return (state = action.payload);
		},
		updateMarkersBasedOnStatus: (state, action: { payload: Markers[]; type: string }) => {
			return state.map((vehicle) => {
				const updatedVehicleData = action.payload.find((payloadVehicle) => payloadVehicle.vId === vehicle.vId);
				if (updatedVehicleData) {
					return { ...vehicle, visibility: true };
				} else {
					return { ...vehicle, visibility: false };
				}
			});
		},

		resetMarkers: (state) => {
			state = initialState;
			return state;
		},
		setAllMarkersInVisible: (state) => {
			state = state.map((vehicle) => ({ ...vehicle, visibility: false, isMarkerInfoWindowOpen: false }));
			return state;
		},
	},
});
export const { setAllMarkers, updateMarkersBasedOnStatus, resetMarkers, setAllMarkersInVisible } = selectedVehicleStatusSlice.actions;
export default selectedVehicleStatusSlice.reducer;
