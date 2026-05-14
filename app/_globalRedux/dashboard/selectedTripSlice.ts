'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const initialSelectedTrip: SingleTripResponse['list'][0] = {
	sys_service_id: 0,
	lorry_no: '',
	lat: 0,
	lng: 0,
	addr: '',
	estimateHour: null,
	estimateTime: '',
	travelledHours: 0,
	party_name: '',
	challan_no: '',
	departure_date: '',
	source_reach_time: '',
	station_from_location: '',
	station_to_location: '',
	STA: '',
	ETA: '',
	totaltripkmbygoogle: 0,
	trip_complted_datebysystem: '',
	delay: null,
	driver_name: '',
	driver_number: '',
	trip_status: '',
	kmTravelled: 0,
	KMfromDestination: 0,
	RemainingKM: 0,
	SourceOut: '',
	vaiOne: '',
	vaiOneHalting: '',
	vaiOneInTime: '',
	vaiOneOutTime: '',
	vaiOneactHalting: null,
	vaiTwo: '',
	vaiTwoHalting: '',
	vaiTwoInTime: '',
	vaiTwoOutTime: '',
	vaiTwoactHalting: null,
	vaiThree: '',
	vaiThreeHalting: '',
	vaiThreeInTime: '',
	vaiThreeOutTime: '',
	vaiThreeactHalting: null,
	vaiFour: '',
	vaifourHalting: '',
	vaiFourInTime: '',
	vaiFourOutTime: '',
	vaifoureactHalting: null,
	destinationIn: '',
};

const selectedTripSlice = createSlice({
	name: 'selected-vehicle',
	initialState: initialSelectedTrip,
	reducers: {
		removeSelectedTrip: (state) => {
			return (state = initialSelectedTrip);
		},
		setSelectedTrip: (state, action: PayloadAction<SingleTripResponse['list'][0]>) => {
			return (state = action.payload);
		},
	},
});
export const { removeSelectedTrip, setSelectedTrip } = selectedTripSlice.actions;
export default selectedTripSlice.reducer;
