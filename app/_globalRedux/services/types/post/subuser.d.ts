interface CreateAndEditSubuserData {
	token: string;
	userId: string;
	username: string;
	password: string;
	conf_password: string;
	name: string;
	email: string;
	phone: string;
}

interface DeleteSubuserData {
	user_id: number;
}

interface AddSubuserVehicles {
	user_id: string;
	selected_val: string;
}
