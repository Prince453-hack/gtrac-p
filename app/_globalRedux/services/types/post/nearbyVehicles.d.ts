interface GetNearbyVehiclesBody {
	token: number;
	latitude: number;
	longitude: number;
	km: number;
}

interface GetNearbyVehiclesResponse {
	Datetime: string;
	gps_latitude: string;
	gps_longitude: string;
	des_movement_id: string;
	sys_service_id: string;
	veh_reg: string;
	distance: string;
	gps_speed: string;
	drivercontact: string;
	drivername: string;
}
interface NearbyVehiclesWithInfoWindow extends GetNearbyVehiclesResponse {
	isInfoWindowOpen: boolean;
}
