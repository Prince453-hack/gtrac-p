export interface GetVideoAlarmsFileResponse {
	code: number;
	data: GetVideoAlarmsResponseData[];
	msg: string;
}

export interface GetVideoAlarmsFileResponseData {
	alarmId: string;
	alarmType: string;
	deviceName: string;
	deviceId: string;
	alarmTime: string;
	fileUrl: string;
	fileType: string;
	fileSize: number;
}
