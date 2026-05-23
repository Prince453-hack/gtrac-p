'use client';
import { createSlice } from '@reduxjs/toolkit';
import { VehicleData } from '../services/types/getListVehiclesmobTypes';

export interface SelectedDashboardVehicleState {
	vehicleData: VehicleData;
}

export const initialSelectedVehiclesState: SelectedDashboardVehicleState[] = [];

const selectedDashboardVehicleStatusSlice = createSlice({
	name: 'selected-dashboard-vehicle',
	initialState: initialSelectedVehiclesState,
	reducers: {
		removeDashboardSelectedVehicle: (state, action: { payload: SelectedDashboardVehicleState; type: string }) => {
			return state.filter((vehicle) => vehicle.vehicleData.vId !== action.payload.vehicleData.vId);
		},
		setDashboardSelectedVehicleStatus: (state, action: { payload: SelectedDashboardVehicleState[]; type: string }) => {
			return (state = action.payload);
		},
		resetDashboardSelectedVehicleState: (state) => {
			return (state = initialSelectedVehiclesState);
		},
	},
});
export const { setDashboardSelectedVehicleStatus, removeDashboardSelectedVehicle, resetDashboardSelectedVehicleState } =
	selectedDashboardVehicleStatusSlice.actions;
export default selectedDashboardVehicleStatusSlice.reducer;
