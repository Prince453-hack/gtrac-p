interface GetTripDatesResponse {
	status: boolean;
	data: [
		{
			id: number;
			sys_service_id: number;
			date: string;
		}
	];
}
