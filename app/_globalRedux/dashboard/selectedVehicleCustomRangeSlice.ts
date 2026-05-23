import { createSlice } from '@reduxjs/toolkit';

interface CustomRange {
	dateRangeToDisplay: { startDate: string; endDate: string };
	dateRangeForDataFetching: { startDate: string; endDate: string };
	previousDateRange: { startDate: string; endDate: string };
	customRangeSelected: 'Today' | 'Yesterday' | 'Last 3 Days' | 'Last 7 Days' | 'This Month' | 'Last Month' | 'Custom Date Range';
}

interface DateRange {
	dateRangeToDisplay: { startDate: string; endDate: string };
	dateRangeForDataFetching: { startDate: string; endDate: string };
}

const initialState: CustomRange = {
	dateRangeToDisplay: { startDate: '', endDate: '' },
	dateRangeForDataFetching: { startDate: '', endDate: '' },
	previousDateRange: { startDate: '', endDate: '' },
	customRangeSelected: 'Today',
};

const selectedVehicleCustomRangeSlice = createSlice({
	name: 'custom-range',
	initialState,
	reducers: {
		setSelectedVehicleCustomRange: (state, action: { payload: CustomRange; type: string }) => {
			state = action.payload;
			return state;
		},
		setSelectedVehicleCustomDateRange: (state, action: { payload: DateRange; type: string }) => {
			state.previousDateRange = state.dateRangeToDisplay;
			state.dateRangeToDisplay = action.payload.dateRangeToDisplay;
			state.dateRangeForDataFetching = action.payload.dateRangeForDataFetching;
			return state;
		},
		setPreviousDateRangeAsSelectedDateRange: (state) => {
			state.previousDateRange = state.dateRangeToDisplay;
			return state;
		},
		setSelectedVehicleCustomRangeSelected: (state, action: { payload: CustomRange['customRangeSelected']; type: string }) => {
			state.customRangeSelected = action.payload;
			return state;
		},
		resetSelectedVehicleCustomRange: (state) => {
			state = initialState;
			return state;
		},
	},
});

export const {
	setSelectedVehicleCustomRange,
	setSelectedVehicleCustomDateRange,
	setSelectedVehicleCustomRangeSelected,
	resetSelectedVehicleCustomRange,
	setPreviousDateRangeAsSelectedDateRange,
} = selectedVehicleCustomRangeSlice.actions;
export default selectedVehicleCustomRangeSlice.reducer;
