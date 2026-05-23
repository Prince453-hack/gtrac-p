import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type IsApmTotalKmLoading = boolean;

const initialState: IsApmTotalKmLoading = false;

const isApmTotalKmLoading = createSlice({
	name: 'is-apm-total-km-loading-slice',
	initialState,
	reducers: {
		setIsApmTotalKmLoading: (state, action: PayloadAction<boolean>) => {
			return (state = action.payload);
		},
	},
});

export const { setIsApmTotalKmLoading } = isApmTotalKmLoading.actions;
export default isApmTotalKmLoading.reducer;
