'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GoogleMapPropsState {
	isGetNearbyVehiclesActive: boolean;
	selectedVehicleOption: { label: string; value: number } | undefined;
	radiusInKilometers: number;
}

const initialState: GoogleMapPropsState = {
	isGetNearbyVehiclesActive: false,
	selectedVehicleOption: undefined,
	radiusInKilometers: 0,
};

export const nearbyVehicleSlice = createSlice({
	name: 'nearby_vehicles',
	initialState,

	reducers: {
		setIsGetNearbyVehiclesActive: (state, action: PayloadAction<GoogleMapPropsState['isGetNearbyVehiclesActive']>) => {
			state.isGetNearbyVehiclesActive = action.payload;
			return state;
		},
		setSelectedVehicleOption: (state, action: PayloadAction<GoogleMapPropsState['selectedVehicleOption']>) => {
			state.selectedVehicleOption = action.payload;
			return state;
		},
		setRadiusInKilometers: (state, action: PayloadAction<GoogleMapPropsState['radiusInKilometers']>) => {
			state.radiusInKilometers = action.payload;
			return state;
		},
		resetNearbyVehicles: (state) => {
			state = initialState;
			return state;
		},
	},
});
export const { setIsGetNearbyVehiclesActive, setSelectedVehicleOption, setRadiusInKilometers, resetNearbyVehicles } = nearbyVehicleSlice.actions;
export default nearbyVehicleSlice.reducer;
