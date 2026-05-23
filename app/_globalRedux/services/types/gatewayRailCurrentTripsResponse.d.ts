import { GatewayRailCurrentTrip } from "@/app/_globalRedux/services/types/gatewayRailCurrentTripsResponse";
export interface GatewayRailCurrentTripsResponse {
  message: string;
  success: boolean;
  list: GatewayRailCurrentTrip[];
}

export interface GatewayRailCurrentTrip {
  id: number;
  vehId: number;
  vehicle_no: string;
  TripStartDate: string;
  Driver_name: string;
  site_reporting_time: string;
  gr_no: string;
  billing_party_name: string;
  booking_type: string;
  document_no: string;
  container_no: string;
  "Container Combination": number;
  route: string;
  segment: number;
  header_tripstatus: number;
  timeupdate: string;
  TIMESTAMP: string;
  line2_id: number;
  "Tripsheet Doc No_": string;
  "Line No_": number;
  Route: string;
  "FROM Location": string;
  "TO Location": string;
  "Active Leg": number;
  size: number;
  "Leg STATUS": number;
  "Site RELEASE DATE": string;
  "Site RELEASE TIME": string;
  "Site Reporting DATE": string;
  "gps Site Reporting IN DATE TIME"?: string;
  "gps Site Reporting OUT DATE TIME"?: string;
  "gps Site parking IN DATE TIME"?: string;
  "gps Site parking OUT DATE TIME"?: string;
  sitereporting_gps_latitude: number;
  sitereporting_gps_longitude: number;
  "Site Reporting TIME": string;
  "Booking TYPE": number;
  "Transit TIME": number;
  "Actual Transit TIME": string;
  "Importer NAME": string;
  Remarks: string;
  gtrac_site_release: string;
  gtrac_site_reporting: string;
  update_time?: string;
  shipping_line_name: string;
  document_no: string;
  "gps Site RELEASE IN DATE TIME"?: string;
  "gps Site RELEASE OUT DATE TIME"?: string;
  site_relase_gps_latitude: number;
  "Active Leg": number;
  site_realse_gps_longitude: number;
  haltingAtsource?: string;
  haltingAtDestination?: string;
  transit?: string;
}

export interface GatewayRailCurrentTripsAndVehicleListMob
  extends GatewayRailCurrentTripsResponse {
  currentLocation: VehicleData;
}
