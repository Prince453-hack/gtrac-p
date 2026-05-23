interface PathwithDateDaignosticOBDData {
  totalDistance: string;
  totalTime: number;
  totalTimeInMIN: number;
  fromLat: number;
  fromLng: number;
  startLocation: string;
  fromTime: string;
  fromTimetoMatch: string;
  endLocation: string;
  toLat: number;
  toLong: number;
  toTime: string;
  toTimetoMatch: string;
  mode: string;
  engineTotalFuelUsedstrt: string;
  engineTotalFuelUsedend: string;
  engineTotalIdleFuelUsedstrt: string;
  engineTotalIdleFuelUsedend: string;
}

interface PathOBDArrayItem {
  gpstime: string;
  lat: number;
  lng: number;
  bearing: number;
  distance: number;
  speed: number;
  location: string;
  nearestPoi: string;
  datetime: string;
}

export interface GetpathwithDateDaignosticOBDResponse {
  message: string;
  success: boolean;
  vehicleId: string;
  data: PathwithDateDaignosticOBDData[];
  fromTime: string;
  toTime: string;
  totalDistance: string;
  stoppageTime: number;
  runningTime: number;
  totalRunningDistanceKM: number;
  totalNogps: number;
  totalIdledistance: number;
  avgSpeedKMH: number;
  totalStoppage: number;
  patharry: PathOBDArrayItem[];
  totalFuelConsumedT: number;
  totalmileage: string;
}
