interface UpdateDriverResponse {
	status: true;
	TripSaved: string;
	message: string;
	data: string;
}
interface UpdateDriverPayload {
	sysServiceId: string;
	groupId: number;
	driverName: string;
	driverNumber: string;
}
