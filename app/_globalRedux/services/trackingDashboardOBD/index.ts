import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GetpathwithDateDaignosticOBDResponse } from "../types/getpathwithDateDaignosticOBD";

export const trackingReportOBD = createApi({
  reducerPath: "trackingReportOBD",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 120000,
  }),

  tagTypes: ["OBD-Path-With-Date-Diagnostic"],

  endpoints: (builder) => ({
    getpathwithDateDaignosticOBD: builder.query<
      GetpathwithDateDaignosticOBDResponse,
      {
        vId: number;
        startdate: string;
        enddate: string;
        requestfor: number;
        userid: number;
      }
    >({
      query: ({ vId, startdate, enddate, requestfor, userid }) =>
        `getpathwithDateDaignosticOBD?vId=${vId}&startdate=${encodeURIComponent(
          startdate
        )}&enddate=${encodeURIComponent(
          enddate
        )}&requestfor=${requestfor}&userid=${userid}`,
      keepUnusedDataFor: 0,
      providesTags: ["OBD-Path-With-Date-Diagnostic"],
    }),
  }),
});

export const {
  useGetpathwithDateDaignosticOBDQuery,
  useLazyGetpathwithDateDaignosticOBDQuery,
} = trackingReportOBD;
