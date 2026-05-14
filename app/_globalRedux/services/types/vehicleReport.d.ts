export interface VehicleReportResponse {
  message: string;
  success: boolean;
  list: VehicleReportData[];
}

export interface VehicleReportData {
  vehicle_id: string;
  total_km: string;
  avg_mileage: string;
  total_fuel_consumed: string;
  total_stoppage_sec: string;
  total_running_sec: string;
  odometer: string | null;
  add_blue: string | null;
  idle_fuel_consumed: string | null;
  harshacceleration: number | null;
  harshbraking: number | null;
  overspeeding: number | null;
  freewheeling: number | null;
}

export interface VehicleReportParams {
  vId: number;
  startdate: string;
  enddate: string;
  requestfor: number;
  userid: number;
}
