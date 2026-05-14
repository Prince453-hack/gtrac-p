import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  PassengerCountResponse,
  PassengerCountParams,
} from "../types/passengerCount";

export const passengerCountApi = createApi({
  reducerPath: "passengerCountApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: `https://7d90-49-205-176-68.ngrok-free.app`,
    timeout: 30000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["PassengerCount"],

  endpoints: (builder) => ({
    getAllPCSummary: builder.query<
      PassengerCountResponse,
      PassengerCountParams
    >({
      query: ({ vehId, startDate, endDate }) =>
        `getAllPCsummarydtWs?vehId=${vehId}&startdate=${startDate}&enddate=${endDate}`,
      providesTags: ["PassengerCount"],
    }),
  }),
});

export const { useGetAllPCSummaryQuery, useLazyGetAllPCSummaryQuery } =
  passengerCountApi;
