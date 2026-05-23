import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type StateType = { type: 'create-trip' | 'trip-planning' | ''; planId?: number | null };

const initialState: StateType = { type: '', planId: null };

const createTripOrTripPlanningActiveSlice = createSlice({
	name: 'create-trip-or-trip-status-active-slice',
	initialState,
	reducers: {
		setCreateTripOrTripPlanningActive: (state, action: PayloadAction<StateType>) => {
			state.type = action.payload.type;
			return state;
		},

		setPlanId: (state, action: PayloadAction<number | null>) => {
			state.planId = action.payload;
			return state;
		},
	},
});

export const { setCreateTripOrTripPlanningActive, setPlanId } = createTripOrTripPlanningActiveSlice.actions;
export default createTripOrTripPlanningActiveSlice.reducer;
