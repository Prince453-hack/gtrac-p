'use client';
import { createSlice } from '@reduxjs/toolkit';

const initialState: boolean = false;

export const collapseVehicleStatusToggleSlice = createSlice({
	name: 'collapse-vehicle-status-toggle',
	initialState,
	reducers: {
		setCollapseVehicleStatusToggle: (state, action: { payload: boolean; type: string }) => {
			return (state = action.payload);
		},
		resetCollapseVehicleStatusToggle: (state) => {
			return (state = initialState);
		},
	},
});
export const { setCollapseVehicleStatusToggle, resetCollapseVehicleStatusToggle } = collapseVehicleStatusToggleSlice.actions;
export default collapseVehicleStatusToggleSlice.reducer;
