import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface FuelFillingItem {
  sys_service_id: number;
  type: string;
  latitude: number;
  longitude: number;
  typeId: string;
  value: string;
  fillingTime: string;
  event_address: string;
}

interface FuelFillingResponse {
  message: string;
  success: boolean;
  list: FuelFillingItem[];
}

interface FuelFillingParams {
  sys_service_id: string | number;
  startdate: string;
  enddate: string;
  TypeFT?: number;
  userid: string | number;
}

export const fuelFilling = createApi({
  reducerPath: "fuelFilling",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
  }),

  endpoints: (builder) => ({
    getAllFillTheftLog: builder.query<FuelFillingResponse, FuelFillingParams>({
      query: ({ sys_service_id, startdate, enddate, TypeFT = 1, userid }) => ({
        url: "/AllFillTheftLog",
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

export const { useGetAllFillTheftLogQuery } = fuelFilling;
