interface GetPoilistResponse {
	status: boolean;
	data: {
		id: number;
		name: string;
		gps_latitude: number;
		gps_longitude: number;
		gps_radius: number;
	}[];
}
