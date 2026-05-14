import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VideoTelematicsType {
	selectedVehicleDeviceId: string;
	channels: number[];
	expiry_time: string;
}

export const initialVideoTelematics: VideoTelematicsType = {
	selectedVehicleDeviceId: '',
	channels: [],
	expiry_time: '',
};

export const videoTelematicsSlice = createSlice({
	name: 'video-telematics',
	initialState: initialVideoTelematics,
	reducers: {
		setSelectedVehicleDeviceId: (state, action: PayloadAction<string>) => {
			state.selectedVehicleDeviceId = action.payload;
			return state;
		},
		setChannels: (state, action: PayloadAction<number[]>) => {
			state.channels = action.payload;
			return state;
		},
	},
});
export const { setSelectedVehicleDeviceId, setChannels } = videoTelematicsSlice.actions;
export default videoTelematicsSlice.reducer;
