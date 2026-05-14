interface ElockAlertByDateRequest {
	token: string;
	userId: string;
	puserId: string;
	startDate: string;
	endDate: string;
}

interface ElockAlertByDate {
	row_id: string;
	vehicle_id: string;
	vehicle_no: string;
	title: string;
	FMCDate: string;
	latlong: string;
	description: string;
	log_time: string;
	notification_time: string;
	username: string;
	remark: any;
	amazon_vrid: string;
	notification_time: string;
	remarkby: string;
}
