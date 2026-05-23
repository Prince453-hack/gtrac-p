export interface PassengerCountData {
  id: number;
  report_date: string;
  sys_service_id: number;
  shift: string;
  total_pc: number;
  men_count: number;
  women_count: number;
  children_count: number;
  created_at: string;
}

export interface PassengerCountResponse {
  message: string;
  success: boolean;
  list: PassengerCountData[];
}

export interface PassengerCountParams {
  vehId: number;
  startDate: string;
  endDate: string;
}
