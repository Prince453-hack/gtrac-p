import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the response type for gear data based on actual API format
interface GearDataItem {
  gps_latitude: number;
  gps_longitude: number;
  gps_time: string;
  gpstimeformatted: string;
  gps_speed: number;
  sys_service_id: number;
  gps_orientation: number;
  jny_distance: number;
  jny_status: number;
  location: string;
  nearestPoi: string;
  tel_odometer: number;
  tel_fuel: number;
  rpm: number;
  geostreet: string;
  adblue: number;
  gear: number;
  ratio: number;
}

interface GetRawGearDataResponse {
  success: boolean;
  message: string;
  fromTime: string;
  toTime: string;
  rawdata: GearDataItem[];
}

export const gearDetailsApi = createApi({
  reducerPath: "gearDetailsApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 120000,
  }),
  tagTypes: ["GearData"],
  endpoints: (builder) => ({
    getRawGearDataByVehicleAndDate: builder.query<
      GetRawGearDataResponse,
      { 
        vId: number; 
        startdate: string; 
        enddate: string; 
        requestfor: number;
        userid: string;
        interval: number;
      }
    >({
      query: ({ vId, startdate, enddate, requestfor, userid, interval }) =>
        `GetRawGearDatavehIdBydate?vId=${vId}&startdate=${startdate}&enddate=${enddate}&requestfor=${requestfor}&userid=${userid}&interval=${interval}`,
      providesTags: ["GearData"],
    }),
  }),
});

export const {
  useGetRawGearDataByVehicleAndDateQuery,
  useLazyGetRawGearDataByVehicleAndDateQuery,
} = gearDetailsApi;