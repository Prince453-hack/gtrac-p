import { createSlice } from '@reduxjs/toolkit';

type TrafficState = {
	isTrafficLayerVisible: boolean;
};

const initialState: TrafficState = {
	isTrafficLayerVisible: false,
};

const trafficSlice = createSlice({
	name: 'traffic-slice',
	initialState,
	reducers: {
		setTrafficLayerVisible: (state, action: { payload: boolean; type: string }) => {
			state.isTrafficLayerVisible = action.payload;
			return state;
		},
		toggleTrafficLayer: (state) => {
			state.isTrafficLayerVisible = !state.isTrafficLayerVisible;
			return state;
		},
	},
});

export const {
	setTrafficLayerVisible,
	toggleTrafficLayer,
} = trafficSlice.actions;

export default trafficSlice.reducer;
