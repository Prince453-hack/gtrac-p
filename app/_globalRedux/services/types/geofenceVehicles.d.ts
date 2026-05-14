export interface GeofenceVehicleItem {
  veh_reg: string;
  tel_rawlog: string | null;
  sys_service_id: number;
  lat: number;
  lng: number;
  currenttime: string;
  geo_country: string;
  geo_street: string;
  diff_hr: number;
  date_plus_24h: string;
  date_plus_48h: string;
  date_plus_72h: string;
}

export interface GetInGeofenceVehiclesResponse {
  success: boolean;
  message: string;
  list: GeofenceVehicleItem[];
}
