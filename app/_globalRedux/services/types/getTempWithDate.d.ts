type TelData = {
	type: string;
	data: number[];
};

interface TemperatureReportRawData {
	gps_latitude: number;
	gps_longitude: number;
	gps_time: string;
	gpstimeformatted: string;
	gps_speed: number;
	sys_service_id: number;
	gps_orientation: number;
	jny_distance: number;
	jny_status: string;
	des_movement_id: number;
	des_vehicle_id: number | null;
	location: string;
	tel_ignition: TelData | null;
	tel_alarm: TelData | null;
	tel_panic: TelData | null;
	tel_shield: TelData | null;
	tel_theft_attempt: TelData | null;
	tel_tamper: TelData | null;
	tel_ext_alarm: TelData | null;
	tel_journey: TelData | null;
	tel_journey_status: TelData | null;
	tel_idle: TelData | null;
	tel_ex_idle: TelData | null;
	tel_hours: TelData | null;
	tel_input_0: TelData | null;
	tel_input_1: TelData | null;
	tel_input_2: TelData | null;
	tel_input_3: TelData | null;
	tel_temperature: number;
	tel_voltage: number;
	main_powervoltage: number | null;
	tel_odometer: number;
	tel_poweralert: TelData | null;
	tel_speedalert: TelData | null;
	tel_boxalert: TelData | null;
	nearestPoi: string;
	tel_fuel: number;
	sys_proc_host: string;
	sys_msg_type: number;
	alcoholLbl: number;
}

interface GetTempWithDateResponse {
	message: string;
	success: boolean;
	fromTime: string;
	toTime: string;
	rawdata: TemperatureReportRawData[];
}
