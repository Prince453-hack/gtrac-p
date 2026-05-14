import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the response types based on the API response
export interface HaltingHoursRecord {
  vehicleNum: number;
  total_halting_time: string;
  total_halting_timeMin: string;
}

export interface HaltingHoursResponse {
  message: string;
  success: boolean;
  list: HaltingHoursRecord[];
}

export const haltingHoursApi = createApi({
  reducerPath: "haltingHoursApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 30000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["HaltingHours"],
  endpoints: (builder) => ({
    getHaltingHoursInPoi: builder.query<
      HaltingHoursResponse,
      { token: string }
    >({
      query: ({ token }) => `getHaltingHoursInPoi/?token=${token}`,
      providesTags: ["HaltingHours"],
    }),
  }),
});

export const {
  useGetHaltingHoursInPoiQuery,
  useLazyGetHaltingHoursInPoiQuery,
} = haltingHoursApi;
