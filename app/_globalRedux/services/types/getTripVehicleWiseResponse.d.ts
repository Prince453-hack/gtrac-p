interface GpsData {
	latLngDtl: {
		lat: number;
		lng: number;
		latlong: string;
		addr: string;
		poi: string;
		gpstime: string;
		epochtime: number;
	};
	volt: number;
	fuel: number;
	temperature: number;
}

interface Trip {
	sys_service_id: number;
	lorry_no: string;
	trip_id: number;
	trip_status_update: string;
	party_name: string;
	challan_no: string;
	departure_date: string;
	station_from_location: string;
	station_to_location: string;
	arrival_date: string;
	totaltripkmbygoogle: string;
	delay: number;
	driver_name: string;
	driver_number: string | null;
	trip_status: string;
	trip_status_batch: string;
	veh_remark: string;
	TripCreateddate: string;
	SourceIn: string | null;
	SourceOut: string;
	DestinationIN: string | null;
	DestinationOut: string | null;
	Actualtriphour: number;
	Hourstaken: number | null;
	KM: string;
	gps: GpsData;
}

interface GetTripVehicleWiseResponse {
	message: string;
	success: boolean;
	list: Trip[];
}
