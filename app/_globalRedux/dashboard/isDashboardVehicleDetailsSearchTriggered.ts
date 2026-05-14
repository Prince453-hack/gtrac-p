import { createSlice } from '@reduxjs/toolkit';

const initialState: number = 0;

const isDashboardVehicleDetailsSearchTriggered = createSlice({
	name: 'is-dashboard-vehicle-details-select-search-triggered',
	initialState,
	reducers: {
		setIsDashboardVehicleDetailsSearchTriggeredActive: (state, action: { payload: void; type: string }) => {
			state = state + 1;
			return state;
		},

		setIsDashboardVehicleDetailsSearchTriggeredInActive: (state, action: { payload: void; type: string }) => {
			state = 0;
			return state;
		},
	},
});
export const { setIsDashboardVehicleDetailsSearchTriggeredActive, setIsDashboardVehicleDetailsSearchTriggeredInActive } =
	isDashboardVehicleDetailsSearchTriggered.actions;
export default isDashboardVehicleDetailsSearchTriggered.reducer;
