import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Response types based on the provided API response
interface SearchVehicleResponse {
  message: string;
  success: boolean;
  list: SearchVehicleData[];
}

interface SearchVehicleData {
  vId: number;
  vehReg: string;
  imei: string;
  simnumber: string;
  commandtype: string;
  transporterVendor: string;
  controllermergeId: number;
  drivers: {
    driverName: string;
    phoneNumber: string;
  };
  disInKM: number;
  gpsDtl: {
    latLngDtl: {
      lat: number;
      lng: number;
      latlong: string;
      addr: string;
      poi: string;
      gpstime: string;
      epochtime: number;
    };
    speed: number;
    ignState: string;
    acState: string;
    Elock: string;
    ElockDataTime: string;
    volt: null | number;
    fuel: number;
    temperature: null | number;
    mode: string;
    modeTime: string;
    angle: number;
    cellId: number;
    gpsStatus: number;
    model: null | string;
    isacconnected: null | boolean;
    Yesterday_KM: number;
    ismainpoerconnected: {
      type: string;
      data: number[];
    };
    alertCount: number;
    main_powervoltage: number;
    tel_rfid: string;
    jny_distance: null | string;
    tel_odometer: number;
    gateDoor: number;
    immoblizeStatus: string;
    controllernum: string;
  };
  vehicleState: string;
  vehicleTrip: any[];
  GPSInfo: {
    lat: string;
    lng: string;
    latlong: string;
    addr: string;
    poi: string;
    gpstime: string;
    gps_fix: number;
  };
  ELOCKInfo: {
    lat: number;
    lng: number;
    latlong: string;
    addr: string;
    poi: string;
    gpstime: string;
    gps_fix: number;
    Unhealthy: null | any;
    UnhealthyDesc: null | string;
  };
}

// Request parameters interface
interface SearchVehicleParams {
  token: string;
  vehreg: string;
  userid: string;
}

export const getSearchDataApi = createApi({
  reducerPath: "getSearchDataApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 30000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["SearchVehicleData"],
  endpoints: (builder) => ({
    getSearchVhlData: builder.query<SearchVehicleResponse, SearchVehicleParams>(
      {
        query: ({ token, vehreg, userid }) =>
          `getSearchVhlData?token=${token}&vehreg=${vehreg}&userid=${userid}`,
        providesTags: ["SearchVehicleData"],
      },
    ),
  }),
});

export const { useGetSearchVhlDataQuery, useLazyGetSearchVhlDataQuery } =
  getSearchDataApi;
