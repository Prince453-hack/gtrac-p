"use client";
import { createSlice } from "@reduxjs/toolkit";
import { VehicleData } from "../services/types/getListVehiclesmobTypes";

export interface SelectedVehicleState extends VehicleData {
  prevVehicleSelected: number;
  selectedVehicleHistoryTab:
    | "All"
    | "Running"
    | "Stoppages"
    | "Alerts"
    | "Diagnostic"
    | "Trip";
  searchType: "GLOBAL" | "";
  nearbyVehicles: NearbyVehiclesWithInfoWindow[] | undefined;
}

export const initialSelectedVehicleState: SelectedVehicleState = {
  vId: 0,
  prevVehicleSelected: 0,
  vehReg: "",
  vehicleFuelCapacity: 0,
  vehicleAdblueCapacity: 0,
  transporterVendor: "",
  veh_status: "",
  dateOfinstallation: "",
  controllermergeId: "",
  drivers: {
    driverName: "",
    phoneNumber: "",
  },
  disInKM: 0,
  gpsDtl: {
    latLngDtl: {
      lat: 0,
      lng: 0,
      latlong: "",
      addr: "",
      poi: "",
      gpstime: "",
      epochtime: 0,
    },
    lastfuelfilled: 0,
    lastfilledTime: "",
    speed: 0,
    ignState: "On",
    acState: "Off",
    Elock: "",
    ElockDataTime: "",
    volt: 0,
    fuel: 0,
    adblue: 0,
    temperature: 0,
    mode: "RUNNING",
    modeTime: "",
    modeTimeFormat: "",
    hatledSince: "",
    HaltingInHRS: "",
    angle: 0,
    cellId: 0,
    controllernum: "",
    gpsStatus: 0,
    model: null,
    tyres: null,
    isacconnected: false,
    Yesterday_KM: 0,
    ismainpoerconnected: "",
    alertCount: 0,
    main_powervoltage: 0,
    percentageBttry: 0,
    tel_rfid: "",
    tel_odometer: 0,
    jny_distance: "",
    veh_destinationShow: "",
    immoblizeStatus: null,
    notworkingHrs: 0,
    port: 0,
    alcoholLevel: 0,
    extraVhlparameter: "",
    ticket_status: null,
    panic: 0,
    inactiveReason: "",
    InactiveDatetime: "",
    inactiveStatus: 0,
  },
  vehicleState: "",
  vehicleTrip: {
    sys_service_id: 0,
    lorry_no: "",
    trip_id: 0,
    trip_status_update: "",
    party_name: "",
    challan_no: "",
    departure_date: "",
    station_from_location: "",
    station_to_location: "",
    arrival_date: "",
    totaltripkmbygoogle: "",
    delay: 0,
    driver_name: "",
    driver_number: null,
    trip_status: "",
    trip_status_batch: "",
    veh_remark: "",
    TripCreateddate: "",
    SourceIn: null,
    SourceOut: null,
    DestinationIN: null,
    DestinationOut: null,
    Actualtriphour: null,
    Hourstaken: null,
    KM: "",
    kmTravelled: 0,
    gps: {
      latLngDtl: {
        lat: 0,
        lng: 0,
        latlong: "",
        addr: "",
        poi: "",
        gpstime: "",
        epochtime: 0,
      },
      volt: null,
      fuel: 0,
      temperature: null,
    },
  },
  GPSInfo: {
    lat: 0,
    lng: 0,
    latlong: "",
    addr: "",
    poi: "",
    gpstime: "",
    gps_fix: 0,
    vId: 0,
  },
  ELOCKInfo: {
    lat: 0,
    lng: 0,
    latlong: "",
    addr: "",
    poi: "",
    gpstime: "",
    gps_fix: 0,
    vId: 0,
    Unhealthy: {
      type: "Buffer",
      data: [0],
    },
    UnhealthyDesc: null,
  },
  selectedVehicleHistoryTab: "All",
  searchType: "",
  nearbyVehicles: [],
  model: null,
  tyres: null,
  //
};

const selectedVehicleStatusSlice = createSlice({
  name: "selected-vehicle",
  initialState: initialSelectedVehicleState,
  reducers: {
    removeSelectedVehicle: (
      state,
      action: { payload?: SelectedVehicleState; type: string }
    ) => {
      return (state = initialSelectedVehicleState);
    },
    setSelectedVehicleStatus: (
      state,
      action: { payload: SelectedVehicleState; type: string }
    ) => {
      if (state.vId === action.payload.vId) {
        return (state = initialSelectedVehicleState);
      } else return (state = action.payload);
    },
    setSelectedVehicleBySelectElement: (
      state,
      action: { payload: SelectedVehicleState; type: string }
    ) => {
      return (state = action.payload);
    },
    setSelectedVehicleHistoryTab: (
      state,
      action: {
        payload: SelectedVehicleState["selectedVehicleHistoryTab"];
        type: string;
      }
    ) => {
      state.selectedVehicleHistoryTab = action.payload;
      return state;
    },
    setNearbyVehicles: (
      state,
      action: { payload: SelectedVehicleState["nearbyVehicles"]; type: string }
    ) => {
      state.nearbyVehicles = action.payload;
      return state;
    },
    setPrevVehicleSelected: (
      state,
      action: {
        payload: SelectedVehicleState["prevVehicleSelected"];
        type: string;
      }
    ) => {
      state.prevVehicleSelected = action.payload;
      return state;
    },
    resetSelectedVehicle: (state) => {
      state = initialSelectedVehicleState;
      return state;
    },
  },
});
export const {
  setSelectedVehicleStatus,
  setSelectedVehicleBySelectElement,
  removeSelectedVehicle,
  setSelectedVehicleHistoryTab,
  setNearbyVehicles,
  resetSelectedVehicle,
  setPrevVehicleSelected,
} = selectedVehicleStatusSlice.actions;
export default selectedVehicleStatusSlice.reducer;
