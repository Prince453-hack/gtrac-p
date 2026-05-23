type getAllMrkMappingResponse_List_Object = {
	id: number;
	service_id: number;
	group_id: number;
	old_veh_number: string;
	new_veh_number: string;
	reason: string;
	date: string;
	ismapped: number;
	imei: string;
	updated_by: string;
	dateFormatted: string;
};

interface getAllMrkMappingResponse {
	message: string;
	success: boolean;
	list: getAllMrkMappingResponse_List_Object[];
}
