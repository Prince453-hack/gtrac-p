interface PathPoint {
  lat: number;
  lng: number;
  bearing: number;
  distance: number;
  location: string;
  nearestPoi: string;
  datetime: string;
  speed: number;
  tel_fuel?: number;
  adblue?: number;
  tel_odometer?: number;
}

export interface VehicleItinaryData {
  totalDistance: string;
  totalTime: string;
  totalTimeInMIN: number;
  fromLat: number;
  fromLng: number;
  engineTotalFuelUsedstrt: number;
  engineTotalFuelUsedend: number;
  startLocation: string;
  endLocation: string;
  fromTime: string;
  toLat: number;
  toLong: number;
  toTime: string;
  mode: "Running" | "Idle";
}

interface PathArrayItem extends PathPoint {}

export interface GetItnaryWithMapResponse {
  message: string;
  success: boolean;
  data: VehicleItinaryData[];
  fromTime: string;
  toTime: string;
  totalDistance: string;
  calculatedTotalDistance: number;
  stoppageTime: string;
  runningTime: string;
  totalRunningDistanceKM: string;
  totalNogps: number;
  totalIdledistance: number;
  avgSpeedKMH: number;
  totalStoppage: number;
  totalFuelConsumedT: number;
  vehicleId: number;
  patharry: PathArrayItem[] | [];
  fuelarray: PathArrayItem[] | [];
}

export interface GetPathArrayResponse {
  message: string;
  success: true;
  fromTime: string;
  toTime: string;
  totalDistance: string;
  patharry: PathArrayItem[] | [];
}

export interface VehicleItinaryDiagnosticData extends VehicleItinaryData {
  fromTimetoMatch: string;
  toTimetoMatch: string;
}

export interface VehicleItnaryWithPath extends GetItnaryWithMapResponse {
  diagnosticData: VehicleItinaryDiagnosticData[];
}
