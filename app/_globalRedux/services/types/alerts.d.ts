import { continuousDrivingMap } from "@/app/_assets/mapsimg/alerts/continuousDrivingMap.png";
import { LargeNumberLike } from "node:crypto";
export interface GetAlertsPopupsResponse {
  alert_id: string;
  alert_type: string;
  alertcount: string;
  datetime: string;
  msg: string;
  sys_service_id: string;
  vehicleno: string;
  status: string;
}
[];

export interface AlertManagement {
  id: string;
  user_Id: string;
  Parent_user_Id: string;
  group_Id: string;
  sys_username: string;
  email_id: string;
  mobile_No: string;
  SetAlertType:
    | "OverSpeed"
    | "Main Power Disconnect"
    | "AC"
    | "GPS Disconnect"
    | "Temperature"
    | "Panic"
    | "Idling"
    | "Ignition"
    | "Ignition Night"
    | "Service"
    | "Document";
  SetGeoFanceValue: string;
  SetSpeedValue: string;
  SetTempFrom: string;
  SetTempTo: string;
  checkSms: string;
  IdlingHrs: string;
  sys_service_id: string;
  VehicleNo: string;
  status: string;
  sms: string;
  created_at: string;
  updated_at: string;
}

export interface AlertManagementResponse {
  status: boolean;
  message: string;
  data: AlertManagement[];
}

enum AlertType {
  AC = "AC",
  GeoFence = "GeoFence",
  GPS_Disconnect = "GPS Disconnect",
  Harsh_Acceleration = "Harsh Acceleration",
  Harsh_Braking = "Harsh Braking",
  High_Engine_Temperature = "High Engine Temperature",
  Idling = "Idling",
  Ignition = "Ignition",
  Ignition_Night = "Ignition Night",
  Low_Engine_Oil_Pressure = "Low Engine Oil Pressure",
  Main_Power_Disconnect = "Main Power Disconnect",
  Main_power_disconnected = "Main power disconnected",
  Main_Power_Disconnected = "Main Power Disconnected",
  OverSpeed = "OverSpeed",
  overspeedKMT = "overspeedKMT",
  Continuous_Driving = "Continuous Driving",
  Panic = "Panic",
  Services = "Services",
  Document = "Document",
  SetAlertType = "SetAlertType",
  Temperature = "Temperature",
  Unlock_on_move = "Unlock on move",
  idle = "idle",
  freewheeling = "freewheeling",
  Free_Wheeling = "Free Wheeling",
  Internal_battery_disconnected = "Internal battery disconnected",
  Transit_Delay = "Transit Delay",
  Document = "Document",
  NightDrive = "NightDrive",
}
interface AlertDetails {
  starttime: string;
  endtime: string;
  vehicle_no: number;
  exception_type: AlertType;
  KM: number;
  duration: number;
  startlocation: string;
  startlat: number;
  startLong: number;
  endlocation: string;
  endlat: number;
  endLong: number;
  speed: number;
  journey_statusfinal: string;
  msg?: string;
}

export interface KmtAlerts {
  sys_service_id: string;
  lorry_no: string;
  harshBreak: AlertDetails[];
  harshacc: AlertDetails[];
  mainpower: AlertDetails[];
  internalPower: AlertDetails[];
  overspeed: AlertDetails[];
  overspeedKMT: AlertDetails[];
  freewheeling: AlertDetails[];
  contineousDrive: AlertDetails[];
  nightdrive: AlertDetails[];
  highenginetemperature: AlertDetails[];
  idle: AlertDetails[];
  lowengineoilpressure: AlertDetails[];
  overSpeed: AlertDetails[];
  panic: AlertDetails[];
  services: AlertDetails[];
  document: AlertDetails[];
  transitdelay: AlertDetails[];
  unlockonmove: AlertDetails[];
}

export interface KMTAlertsResponse {
  message: string;
  success: boolean;
  list: KmtAlerts[];
}

export interface AlertByDayEvents {
  starttime: string;
  endtime: string;
  vehicle_no: number | string;
  exception_type: string;
  KM: string;
  duration: string;
  startlocation: string;
  startlat: number;
  startLong: number;
  endlocation: string;
  endlat: number;
  endLong: number;
  speed: number;
  journey_statusfinal: string | null;
  Halting?: string | null;
  hour?: string;
  InvoiceNo?: string;
  InvoiceDate?: string;
  remark?: string;
  id: number;
  service_id: string;
  route_name: string;
}

export interface AlertByDateLorryData {
  sys_service_id: number;
  lorry_no: number;
  harshBreak: AlertByDayEvents[];
  harshacc: AlertByDayEvents[];
  mainpower: AlertByDayEvents[];
  MainpowerConnected: AlertByDayEvents[];
  internalPower: AlertByDayEvents[];
  overspeedKMT: AlertByDayEvents[];
  freewheeling: AlertByDayEvents[];
  freewheelingWrong: AlertByDayEvents[];
  contineousDrive: AlertByDayEvents[];
  nightdrive: AlertByDayEvents[];
  padlock: AlertByDayEvents[];
  highenginetemperature: AlertByDayEvents[];
  idle: AlertByDayEvents[];
  lowengineoilpressure: AlertByDayEvents[];
  overspeed: AlertByDayEvents[];
  OverSpeed: AlertByDayEvents[];
  panic: AlertByDayEventst[];
  services: AlertByDayEvents[];
  document: AlertByDayEvents[];
  transitdelay: AlertByDayEvents[];
  unlockonmove: AlertByDayEvents[];
  PoscoOverspeed: AlertByDayEvents[];
  geofence: AlertByDayEvents[];
  alcohol: AlertByDayEvents[];
  finalgetEnrouteHalt: AlertByDayEvents[];
  finalgetGeofenceExitAlert: AlertByDayEvents[];
}

export interface AlertByDateResponse {
  message: string;
  success: boolean;
  list: AlertByDateLorryData[];
}

export interface NormalAlertUpdateBody {
  token: number;
  remark: string;
  issue: string;
  service_id: number;
  alert_type: AlertType;
}

export interface EchoPuchAlertsResponse {
  alert_id: string;
  vehicle_no: string;
  alert_type: string;
  datetime: string;
  message: string;
  status: string;
  remark?: string;
  location?: string;
}
[];
