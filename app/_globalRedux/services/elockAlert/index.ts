import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ElockAlertItem {
  vehicle_id: number;
  vehicle_no: string;
  title: string;
  latitude: number;
  longitude: number;
  description: string;
  log_time: string;
  notification_time: string;
  remark: string | null;
}

interface ElockAlertResponse {
  success: boolean;
  data: ElockAlertItem[];
}

interface ElockAlertParams {
  vId: number;
  gps_start_date: string;
  gps_end_date: string;
}

export const elockAlertApi = createApi({
  reducerPath: "elockAlertApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:8089",
  }),

  endpoints: (builder) => ({
    getElockAlertReport: builder.query<ElockAlertResponse, ElockAlertParams>({
      query: ({ vId, gps_start_date, gps_end_date }) => ({
        url: "/elockdata/elcokAlertReport",
        params: {
          vId,
          gps_start_date,
          gps_end_date,
        },
      }),
    }),
  }),
});

export const { useGetElockAlertReportQuery } = elockAlertApi;
export type { ElockAlertResponse, ElockAlertItem, ElockAlertParams };
