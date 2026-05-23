'use client';
import { createSlice } from '@reduxjs/toolkit';
import { MarkerClusterer as GoogleMarkerClusterer } from '@googlemaps/markerclusterer';

type GoogleMarkerClustererObj = GoogleMarkerClusterer | null;
const initialState: GoogleMarkerClustererObj = null;

const clusterSlice = createSlice({
	name: 'GoogleMarkerClusterer',
	initialState,
	reducers: {
		setCluster(state, action) {
			state = action.payload;
			return state;
		},
	},
});

export const { setCluster } = clusterSlice.actions;
export default clusterSlice.reducer;
