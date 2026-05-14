export interface GetDriverListResponse {
	message: string;
	success: boolean;
	list: GetDriverResponseList[];
}

export interface GetDriverResponseList {
	id: number;
	sys_group_id: number;
	sys_service_id: number;
	driver_name: string;
	driver_number: string;
	driver_alternative_number: any;
	dl_no: string;
	dl_expiry_date: any;
	Date_of_Joining: any;
	Date_of_Relieving: any;
	Guarantor: any;
	dob: any;
	age: any;
	dl_image: string;
	pan_no: string;
	pan_image: string;
	aadhar_card_no: string;
	aadhar_card_image: string;
	update_time: string;
	status: string;
}
