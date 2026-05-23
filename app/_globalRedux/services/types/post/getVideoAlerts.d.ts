export interface GetVideoAlarmsResponse {
  code: number;
  data: VideoAlarmsData;
  msg: string;
}

export interface VideoAlarmsData {
  records: VideoAlarmsRecord[];
  total: number;
  size: number;
  current: number;
}

export interface VideoAlarmsRecord {
  id: string;
  deviceName: string;
  deviceId: string;
  alarmTs: string;
  alarmTsEnd: string;
  alarmType: string;
  lat: number;
  lon: number;
  alarmText: number;
  serialNo: string;
  fenceId: any;
  // Additional fields for BSJ API
  videoUrl?: string;
  imageUrls?: string[];
  alarmName?: string;
  speed?: string;
  duration?: string;
  driverName?: string;
}
