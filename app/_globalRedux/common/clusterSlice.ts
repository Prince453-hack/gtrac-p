'use client';
import { createSlice } from '@reduxjs/toolkit';

type isClusterActive = boolean;
const initialState: isClusterActive = true;

const clusterSlice = createSlice({
	name: 'cluster',
	initialState,
	reducers: {
		setClusterToggle: (state) => {
			return (state = !state);
		},
		setClusterActive: (state) => {
			return (state = true);
		},
		setClusterDiactive: (state) => {
			return (state = false);
		},
	},
});

export const { setClusterToggle, setClusterActive, setClusterDiactive } = clusterSlice.actions;
export default clusterSlice.reducer;
