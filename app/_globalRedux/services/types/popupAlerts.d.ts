interface ElockAlertsResponse {
	id: string;
	sys_user_id: string;
	sys_group_id: string;
	sys_service_id: string;
	veh_id: string;
	vehicle_no: string;
	title: string;
	description: string;
	latitude: string;
	longitude: string;
	gps_mode: string;
	gps_time: string;
	elock_power_status: string | null;
	elock_lock_status: string | null;
	portal_popup: string | null;
	alert_via_api: string;
	remarks: string | null;
	log_time: string;
	updated_at: string;
	titledb: string;
	type?: string;
	status: string;
}

interface TemperatureAlertsResponse {
	id: string;
	idle_vehicle: string;
	is_active: string;
	msg: string;
	status: string;
}
interface FuelAlertsResponse {
	id: string;
	idle_vehicle: string;
	is_active: number;
	msg: string;
	status: string;
}

interface AddElockAlertCommentBody {
	id: number;
	remarks: string;
	title: string;
	veh_id: number;
}

interface PanicAlertResponse {
	id: string;
	idle_vehicle: string;
	is_active: string;
	msg: string;
	status: string;
}

interface IdleAlertResponse {
	id: string;
	idle_vehicle: string;
	is_active: string;
	msg: string;
	status: string;
}

interface AddTempAlertCommentBody {
	veh_no: string;
	comment: string;
	username: string;
	close_time_msg: string;
	alert_id: number;
}

interface addPanicAlertApprovalByControlRoomBody {
	veh_no: string;
	comment: string;
	username: string;
}
