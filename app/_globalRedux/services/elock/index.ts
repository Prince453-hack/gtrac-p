import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface BufferData {
  type: "Buffer";
  data: number[];
}

interface VehicleData {
  mobile_no: string;
  imei: string;
  Vid: number;
  lat: number;
  lng: number;
  reg_no: string;
  veh_reg: string;
  vr_id: string;
  speed: number;
  idle_since: string;
  gps_fix: number;
  tel_voltage: number;
  mode: string;
  gpstime: string;
  gmt: string;
  epochtime: number;
  vendor_name: string;
  driver_contact_no: string | null;
  driver_code: string;
  driver_name: string;
  route_no: string;
  source: string;
  destination: string;
  cpt: string;
  supervisor_no: string;
  Connected: BufferData;
  locknput: BufferData;
  door: string;
}

interface ElockResponse {
  message: string;
  success: boolean;
  dashboard: VehicleData;
  elock: VehicleData;
}

interface ElockParams {
  vId: number;
  cId: number;
}

export const elockApi = createApi({
  reducerPath: "elockApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:8089",
  }),

  endpoints: (builder) => ({
    getElockData: builder.query<ElockResponse, ElockParams>({
      query: ({ vId, cId }) => ({
        url: "/elockdata/elcokSearchpage",
        params: {
          vId,
          cId,
        },
      }),
    }),
  }),
});

export const { useGetElockDataQuery } = elockApi;
export type { ElockResponse, VehicleData, BufferData, ElockParams };
