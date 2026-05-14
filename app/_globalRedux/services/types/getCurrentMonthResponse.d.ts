interface CurrentMonthVehicleDetails {
	vehicleNum: string;
	km: number;
	kmshow: number | string;
	dateof: string;
	NoGpsKM: number;
}
interface GetCurrentMonthResponse {
	message: string;
	success: boolean;
	list: CurrentMonthVehicleDetails[];
}
