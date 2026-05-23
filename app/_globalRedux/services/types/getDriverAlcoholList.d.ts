export interface GetDriverAlcoholListResponse {
	message: string;
	success: boolean;
	list: List[];
}

export interface List {
	id: number;
	sys_service_id: number;
	driver_name: string;
	driver_number: string;
	driver_alternative_number: any;
	dl_no: string;
	dl_expiry_date: any;
	Date_of_Joining: any;
	Date_of_Relieving: any;
	pan_no: string;
	sys_group_id: number;
	sys_driver_id: number;
	readingtime: string;
	readingvalue: string;
	readingtext: string;
	sift: string;
	readingtimeev: any;
	readingtextev: any;
	readingvalueev: any;
	siftev: any;
	dateofreading: string;
}
