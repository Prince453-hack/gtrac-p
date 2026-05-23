export interface MapYourVehicleData {
	group_id: number;
	lorry_no: string;
	oldlorry_no: string;
	sys_service_id: string;
	username: string;
}

export interface MapYOurVehicleResponse {
	status: boolean;
	TripSaved: 'Yes' | 'No';
	message: string;
	data: string;
}
