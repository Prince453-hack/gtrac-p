import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreateOlPoi {
	isCreateOlPoi: boolean;
	isCreateOlPoiModalOpen: boolean;
	shape: 'polygon' | 'circle' | null;
	drawingManager: google.maps.drawing.DrawingManager | null;
	center: { lat: number; lng: number };
	radius: number;
	coordinates: { lat: number; lng: number }[];
	name: string;
}

const initialState: CreateOlPoi = {
	isCreateOlPoi: false,
	isCreateOlPoiModalOpen: false,
	shape: null,
	drawingManager: null,
	center: { lat: 0, lng: 0 },
	radius: 0,
	coordinates: [],
	name: '',
};

export const CreateOlPoiSlice = createSlice({
	name: 'create-poi',
	initialState: initialState,
	reducers: {
		setCreateOlPoi: (state, action: PayloadAction<CreateOlPoi['isCreateOlPoi']>) => {
			state.isCreateOlPoi = action.payload;
			return state;
		},

		setIsCreateOlPoiModalOpen: (state, action: PayloadAction<CreateOlPoi['isCreateOlPoiModalOpen']>) => {
			state.isCreateOlPoiModalOpen = action.payload;
			return state;
		},
		setOlDrawingManager: (state, action: PayloadAction<CreateOlPoi['drawingManager'] | null>) => {
			state.drawingManager = action.payload;
			return state;
		},
		setOlPoiShape: (state, action: PayloadAction<CreateOlPoi['shape']>) => {
			state.shape = action.payload;
			return state;
		},

		setOlCenter: (state, action: PayloadAction<CreateOlPoi['center']>) => {
			state.center = action.payload;
			return state;
		},
		setOlRadius: (state, action: PayloadAction<CreateOlPoi['radius']>) => {
			state.radius = action.payload;
			return state;
		},
		setOlCoordinates: (state, action: PayloadAction<CreateOlPoi['coordinates']>) => {
			state.coordinates = action.payload;
			return state;
		},
		setOlName: (state, action: PayloadAction<CreateOlPoi['name']>) => {
			state.name = action.payload;
			return state;
		},
	},
});
export const {
	setCreateOlPoi,
	setIsCreateOlPoiModalOpen,
	setOlDrawingManager,
	setOlPoiShape,
	setOlCenter,
	setOlRadius,
	setOlCoordinates,
	setOlName,
} = CreateOlPoiSlice.actions;
export default CreateOlPoiSlice.reducer;
