'use client';
import { createSlice } from '@reduxjs/toolkit';

const initialState: boolean = false;

export const collapseTripStatusToggleSlice = createSlice({
	name: 'collapse-trip-status-toggle',
	initialState,
	reducers: {
		setCollapseTripStatusToggle: (state, action: { payload: boolean; type: string }) => {
			return (state = action.payload);
		},
		resetCollapseTripStatusToggle: (state) => {
			return (state = initialState);
		},
	},
});
export const { setCollapseTripStatusToggle, resetCollapseTripStatusToggle } = collapseTripStatusToggleSlice.actions;
export default collapseTripStatusToggleSlice.reducer;
