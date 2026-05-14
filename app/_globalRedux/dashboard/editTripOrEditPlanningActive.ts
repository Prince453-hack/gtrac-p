import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type StateType = { type: 'edit-trip' | 'edit-plan' | ''; planId?: number | null };

const initialState: StateType = { type: '', planId: null };

const editTripOrTripPlanningActiveSlice = createSlice({
	name: 'edit-trip-or-trip-status-active-slice',
	initialState,
	reducers: {
		setEditTripOrEditPlanActive: (state, action: PayloadAction<StateType>) => {
			state.type = action.payload.type;
			return state;
		},
	},
});

export const { setEditTripOrEditPlanActive } = editTripOrTripPlanningActiveSlice.actions;
export default editTripOrTripPlanningActiveSlice.reducer;
