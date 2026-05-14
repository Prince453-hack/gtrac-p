interface TelemetryBuffer {
	type: string;
	data: number[];
}

interface RawData {
	gps_latitude: number;
	gps_longitude: number;
	gps_time: string;
	gpstimeformatted: string;
	gps_speed: number;
	gps_orientation: number;
	location: string;
	rpm: number;
	jny_distance: number | null;
	jny_status: string;
	sys_service_id: number;
	des_movement_id: number;
	des_vehicle_id: number | null;
	tel_state: number;
	tel_ignition: TelemetryBuffer;
	tel_alarm: 0 | 1 | null;
	tel_panic: TelemetryBuffer;
	tel_shield: 0 | 1 | null;
	tel_theft_attempt: 0 | 1 | null;
	tel_tamper: 0 | 1 | null;
	tel_ext_alarm: 0 | 1 | null;
	tel_journey: 0 | 1 | null;
	tel_journey_status: 0 | 1 | null;
	tel_fuel: number;
	tel_idle: 0 | 1 | null;
	tel_ex_idle: 0 | 1 | null;
	tel_hours: 0 | 1 | null;
	tel_input_0: TelemetryBuffer;
	tel_input_1: 0 | 1 | null;
	tel_input_2: 0 | 1 | null;
	tel_input_3: 0 | 1 | null;
	tel_temperature: 0 | 1 | null;
	tel_voltage: 0 | 1 | null;
	tel_odometer: 0 | 1 | null;
	tel_poweralert: TelemetryBuffer;
	tel_speedalert: 0 | 1 | null;
	tel_boxalert: 0 | 1 | null;

	extraVhlparameter: string;
	main_powervoltage: number;
	sys_proc_host: string;
	sys_msg_type: number;
	geostreet: string;
}

interface RawDataWithoutLocation {
	gps_latitude: number;
	gps_longitude: number;
	gps_time: string;
	gpstimeformatted: string;
	gps_speed: number;
	gps_orientation: number;
	rpm: number;
	jny_distance: number | null;
	jny_status: string;
	sys_service_id: number;
	des_movement_id: number;
	tel_fuel: number;
	adblue: number;
	extraVhlparameter: string;
	tel_odometer: number;
	des_vehicle_id: number | null;
	tel_state: number;
	tel_ignition: TelemetryBuffer;
	tel_alarm: 0 | 1 | null;
	tel_panic: TelemetryBuffer;
	tel_shield: 0 | 1 | null;
	tel_theft_attempt: 0 | 1 | null;
	tel_tamper: 0 | 1 | null;
	tel_ext_alarm: 0 | 1 | null;
	tel_journey: 0 | 1 | null;
	tel_journey_status: 0 | 1 | null;
	tel_idle: 0 | 1 | null;
	tel_ex_idle: 0 | 1 | null;
	tel_hours: 0 | 1 | null;
	tel_input_0: TelemetryBuffer;
	tel_input_1: 0 | 1 | null;
	tel_input_2: 0 | 1 | null;
	tel_input_3: 0 | 1 | null;
	tel_temperature: 0 | 1 | null;
	tel_voltage: 0 | 1 | null;
	tel_odometer: 0 | 1 | null;
	tel_poweralert: TelemetryBuffer;
	tel_speedalert: 0 | 1 | null;
	tel_boxalert: 0 | 1 | null;
	main_powervoltage: number;
	sys_proc_host: string;
	sys_msg_type: number;
	geostreet: string;
}

interface GetRawDataWithApiResponse {
	message: string;
	success: boolean;
	fromTime: string;
	toTime: string;
	rawdata: RawData[];
}

interface GetRawDataWithoutLocationApiResponse {
	message: string;
	success: boolean;
	fromTime: string;
	toTime: string;
	rawdata: RawDataWithoutLocation[];
}
