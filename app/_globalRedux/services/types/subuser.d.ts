export interface SubUser {
	user_id: string;
	sys_username: string;
	fullname: string;
	sys_added_date: string;
	sys_group_id: string;
	email_address: string;
	mobile_number: string;
	status: number;
}

export interface SubuserAssignedVehiclesResponse {
	message: string;
	success: boolean;
	list: {
		id: number;
		veh_reg: string;
	}[];
}
