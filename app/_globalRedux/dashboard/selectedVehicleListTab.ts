'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: string = 'ALL';

export const selectedVehicleListTabSlice = createSlice({
	name: 'selected-vehicle-list-tab',
	initialState,
	reducers: {
		setSelectedVehicleListTab: (state, action: PayloadAction<string>) => {
			state = action.payload;
			return state;
		},
		resetSelectedVehicleListTab: (state) => {
			state = initialState;
			return state;
		},
	},
});

export const { setSelectedVehicleListTab, resetSelectedVehicleListTab } = selectedVehicleListTabSlice.actions;
export default selectedVehicleListTabSlice.reducer;
