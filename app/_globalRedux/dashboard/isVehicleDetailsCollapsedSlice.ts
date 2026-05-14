import { createSlice } from '@reduxjs/toolkit';

const initialState: boolean = false;

const isVehicleDetailsCollapsedSlice = createSlice({
	name: 'is-vehicles-details-collapsed-slice',
	initialState,
	reducers: {
		setIsVehicleDetailsCollapsed: (state, action: { payload: boolean; type: string }) => {
			state = action.payload;
			return state;
		},
		resetIsVehicleDetailsCollapsed: (state) => {
			state = initialState;
			return state;
		},
	},
});
export const { setIsVehicleDetailsCollapsed, resetIsVehicleDetailsCollapsed } = isVehicleDetailsCollapsedSlice.actions;
export default isVehicleDetailsCollapsedSlice.reducer;
