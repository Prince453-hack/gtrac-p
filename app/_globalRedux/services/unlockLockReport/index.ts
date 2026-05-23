import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface UnlockLockReportItem {
  sys_service_id: number;
  veh_reg: string;
  event: string;
  start_time: string;
  end_time: string;
  duration: string;
  start_location: string;
  end_location: string;
  start_lat: number;
  start_long: number;
  end_lat: number;
  end_long: number;
}

interface UnlockLockReportResponse {
  success: boolean;
  message: string;
  data: UnlockLockReportItem[];
}

interface UnlockLockReportParams {
  vId: number;
  gps_start_date: string;
  gps_end_date: string;
}

export const unlockLockReportApi = createApi({
  reducerPath: "unlockLockReportApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:8089",
  }),

  endpoints: (builder) => ({
    getUnlockLockReport: builder.query<
      UnlockLockReportResponse,
      UnlockLockReportParams
    >({
      query: ({ vId, gps_start_date, gps_end_date }) => ({
        url: "/elockdata/elcokLockUnlockReport",
        params: {
          vId,
          gps_start_date,
          gps_end_date,
        },
      }),
    }),
  }),
});

export const { useGetUnlockLockReportQuery } = unlockLockReportApi;
export type {
  UnlockLockReportResponse,
  UnlockLockReportItem,
  UnlockLockReportParams,
};
