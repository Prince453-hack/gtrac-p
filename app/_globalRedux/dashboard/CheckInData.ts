import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: GetRawDataWithApiResponse['rawdata'] | undefined = [];

const checkInDataSlice = createSlice({
	name: 'check-in-data-slice',
	initialState,
	reducers: {
		setCheckInData: (state, action: PayloadAction<GetRawDataWithApiResponse['rawdata']>) => {
			return (state = action.payload);
		},

		resetCheckInData: (state) => {
			state = initialState;
			return state;
		},
	},
});

export const { setCheckInData, resetCheckInData } = checkInDataSlice.actions;
export default checkInDataSlice.reducer;
