import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface FuelDataItem {
  id: number;
  sys_service_id: number;
  gps_time: string;
  rec_time: string;
  rv: number;
  av: number;
  timeinepoc: number;
  odometer: number;
  gps_latitude: string;
  gps_longitude: string;
  filling: number;
  fillingtheftaddress: string;
  fueltype: string;
}

interface FuelDataResponse {
  list: FuelDataItem[];
}

interface FuelDataParams {
  sys_service_id: string | number;
  startdate: string;
  enddate: string;
  userid: string | number;
  TypeFT?: number;
}

export const fuelTracking = createApi({
  reducerPath: "fuelTracking",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
  }),

  endpoints: (builder) => ({
    getAllFuelDataGraph: builder.query<FuelDataResponse, FuelDataParams>({
      query: ({ sys_service_id, startdate, enddate, userid, TypeFT = 1 }) => ({
        url: "/getAllfueldatagraph",
        params: {
          sys_service_id,
          startdate,
          enddate,
          TypeFT,
          userid,
        },
      }),
    }),
  }),
});

export const { useGetAllFuelDataGraphQuery } = fuelTracking;
