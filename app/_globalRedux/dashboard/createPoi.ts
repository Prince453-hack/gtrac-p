import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreatePoi {
	isCreatePoi: boolean;
	isCreatePoiModalOpen: boolean;
	shape: google.maps.drawing.OverlayType | null;
	drawingManager: google.maps.drawing.DrawingManager | null;
	center: { lat: number; lng: number };
	radius: number;
	coordinates: { lat: number; lng: number }[];
	name: string;
	polygon: google.maps.Polygon | null;
	circle: google.maps.Circle | null;
}

const initialState: CreatePoi = {
	isCreatePoi: false,
	isCreatePoiModalOpen: false,
	shape: null,
	drawingManager: null,
	center: { lat: 0, lng: 0 },
	radius: 0,
	coordinates: [],
	name: '',
	polygon: null,
	circle: null,
};

export const createPoiSlice = createSlice({
	name: 'create-poi',
	initialState: initialState,
	reducers: {
		setCreatePoi: (state, action: PayloadAction<CreatePoi['isCreatePoi']>) => {
			state.isCreatePoi = action.payload;
			return state;
		},

		setIsCreatePoiModalOpen: (state, action: PayloadAction<CreatePoi['isCreatePoiModalOpen']>) => {
			state.isCreatePoiModalOpen = action.payload;
			return state;
		},
		setDrawingManager: (state, action: PayloadAction<CreatePoi['drawingManager'] | null>) => {
			state.drawingManager = action.payload;
			return state;
		},
		setPoiShape: (state, action: PayloadAction<CreatePoi['shape']>) => {
			state.shape = action.payload;
			return state;
		},

		setCenter: (state, action: PayloadAction<CreatePoi['center']>) => {
			state.center = action.payload;
			return state;
		},
		setRadius: (state, action: PayloadAction<CreatePoi['radius']>) => {
			state.radius = action.payload;
			return state;
		},
		setCoordinates: (state, action: PayloadAction<CreatePoi['coordinates']>) => {
			state.coordinates = action.payload;
			return state;
		},
		setName: (state, action: PayloadAction<CreatePoi['name']>) => {
			state.name = action.payload;
			return state;
		},

		setPolygon: (state, action: PayloadAction<CreatePoi['polygon']>) => {
			state.polygon = action.payload;
			return state;
		},
		setCircle: (state, action: PayloadAction<CreatePoi['circle']>) => {
			state.circle = action.payload;
			return state;
		},
	},
});
export const {
	setCreatePoi,
	setIsCreatePoiModalOpen,
	setDrawingManager,
	setPoiShape,
	setCenter,
	setRadius,
	setCoordinates,
	setName,
	setPolygon,
	setCircle,
} = createPoiSlice.actions;
export default createPoiSlice.reducer;
