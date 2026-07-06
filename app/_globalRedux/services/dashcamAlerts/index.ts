import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export interface DashcamAlert {
  alarm_name: string;
  device_imei_no: string;
  time_begin: string;
  time_end: string;
  image_attachment: string;
  video_attachment: string;
}

export interface DashcamAlertsResponse {
  message: string;
  counts: number;
  data: DashcamAlert[];
}

export interface DashcamAlertsParams {
  imei: string;
  startTime: string;
  endTime: string;
}

export const dashcamAlertsApi = createApi({
  reducerPath: "dashcamAlertsApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:3636",
  }),

  endpoints: (builder) => ({
    getDashcamAlerts: builder.query<
      DashcamAlertsResponse,
      DashcamAlertsParams
    >({
      query: ({ imei, startTime, endTime }) => ({
        url: "/api/alerts",
        params: {
          imei,
          startTime,
          endTime,
        },
      }),
    }),
  }),
});

export const { useGetDashcamAlertsQuery, useLazyGetDashcamAlertsQuery } =
  dashcamAlertsApi;
