'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Map } from 'leaflet';

import { CSSProperties } from 'react';

export interface OlMapState {
	isOlMapActive: boolean;
	containerStyle: CSSProperties;
	centerOfMap: { lat: number; lng: number };
	zoomNo: number;
	map: Map | null;
}

const initialState: OlMapState = {
	isOlMapActive: false,
	containerStyle: {
		height: '92.2vh',
		width: 'calc(100% - 450px)',
		position: 'relative',
		float: 'right',
	},
	centerOfMap: { lat: 20.61595, lng: 83.14421 },
	zoomNo: 5,
	map: null,
};

export const olMapSlice = createSlice({
	name: 'map',
	initialState,

	reducers: {
		setIsOlMapActive: (state, action: PayloadAction<OlMapState['isOlMapActive']>) => {
			state.isOlMapActive = action.payload;
		},

		setContainerStyle: (state, action: PayloadAction<OlMapState['containerStyle']>) => {
			state.containerStyle = action.payload;
		},

		setCenterOfMap: (state, action: PayloadAction<OlMapState['centerOfMap']>) => {
			state.centerOfMap = action.payload;
		},
		setOlMap: (state, action: PayloadAction<OlMapState['map']>) => {
			state.map = action.payload;
		},
		setZoomNo: (state, action: PayloadAction<OlMapState['zoomNo']>) => {
			state.zoomNo = action.payload;
		},
	},
});
export const { setIsOlMapActive, setContainerStyle, setCenterOfMap, setOlMap, setZoomNo } = olMapSlice.actions;
export default olMapSlice.reducer;
