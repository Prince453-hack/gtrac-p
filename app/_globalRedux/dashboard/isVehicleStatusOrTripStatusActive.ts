import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type StateType = { type: 'trip' | 'vehicle' | 'video' | 'vehicle-allocation-trip' };

const initialState: StateType = { type: 'vehicle' };

const isVehicleDetailsStatus = createSlice({
	name: 'is-vehicles-or-trip-status-active-slice',
	initialState,
	reducers: {
		setVehicleDetailsStatus: (state, action: PayloadAction<StateType>) => {
			state.type = action.payload.type;
			return state;
		},
		resetIsVehicleDetailsCollapsed: () => {
			return initialState;
		},
	},
});

export const { setVehicleDetailsStatus, resetIsVehicleDetailsCollapsed } = isVehicleDetailsStatus.actions;
export default isVehicleDetailsStatus.reducer;
