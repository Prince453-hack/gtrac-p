export type ShareUrlFormData = {
	vehicle_popup_id: number;
	veh_no_id_popup_name: string;
	Txtdate: string;
	UserName: string;
	UserId: number;
	groupid: number;
	client_name: string;
	action: string;
	email: string;
	phone_no: number;
};

export type ShareUrlResponse = {
	status: boolean;
	vehicle_no: string;
	massage: string;
	url: string;
};
