import { GetServiceOrDocumentAlert } from './alert.d';
export interface CreateAlertData {
	id: string;
	user_Id: stirng;
	group_Id: stirng;
	sys_username: string;
	SetSpeedValue: stirng;
	SetGeoFanceValue: stirng;
	SetIdlingValue: stirng;
	setMultipleOption2: stirng;
	SetTempFromValue: stirng;
	SetTempToValue: stirng;
	SetAlertValue: string;
	SetDynamicValue: stirng;
	search_name_input: stirng;
	Email: string;
	MobileNo: stirng;
}

export interface CreateAlertClientData extends CreateAlertData {
	alert_user_id: string;
	alert_group_id: string;
	alert_sys_username: string;
}

interface ActiveDeactivateBody {
	token: string;
	user_id: string;
	alert_type: string;
	alert_status: string;
	alert_id: string;
}

export interface CreateServiceOrDocumentAlert {
	token: string;
	aid: string;
	alert_type: 'Service' | 'Document';
	vehicle: string;
	currentodometer: string;
	email: string;
	contact: string;
	type: string;
	service_date: string;
	gap_service_date: string;
	lastservice: string;
	nextservice: string;
	gapservice: string;
}

export interface GetServiceOrDocumentAlertResponse {
	id: string;
	sys_service_id: string;
	alert_type: string;
	service_document_date: string;
	gap_service_document_date: string;
	service_km: string | null;
	sys_group_id: string;
	alert_message: string;
	active: string;
	email: string;
	mobile: string;
	sms: string;
	next_service_km: string | null;
	service_gap_km: string | null;
	veh_reg: string;
	odometer: string;
	odometer_lastdate: string;
}

export interface GetServiceOrDocumentAlert {
	token: string;
	alert_type: 'Service' | 'Document';
}
