import { createSlice } from '@reduxjs/toolkit';
import { KmtAlerts } from '../services/types/alerts';

const initialState: KmtAlerts[] = [
	{
		sys_service_id: '',
		lorry_no: '',
		harshBreak: [],
		harshacc: [],
		mainpower: [],
		internalPower: [],
		overspeed: [],
		overspeedKMT: [],
		freewheeling: [],
		contineousDrive: [],
		nightdrive: [],
		highenginetemperature: [],
		idle: [],
		lowengineoilpressure: [],
		overSpeed: [],
		panic: [],
		services: [],
		document: [],
		transitdelay: [],
		unlockonmove: [],
	},
];

export const mapAlertIconsSlice = createSlice({
	name: 'map-alerts-icons',
	initialState,
	reducers: {
		setKmtAlerts: (state, action: { payload: KmtAlerts[]; type: string }) => {
			return (state = action.payload);
		},
		resetKmtAlerts: (state) => {
			state = initialState;
			return state;
		},
	},
});
export const { setKmtAlerts, resetKmtAlerts } = mapAlertIconsSlice.actions;
export default mapAlertIconsSlice.reducer;
