import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ElockDirectCommandData {
  sys_service_id: number;
  device_number: string;
  location: string;
  accessed_by: string;
  send_datetime: string;
}

interface ElockDirectCommandResponse {
  success: boolean;
  data: ElockDirectCommandData[];
}

interface ElockDirectCommandParams {
  vId: number;
  gps_start_date: string;
  gps_end_date: string;
}

export const elockDirectApi = createApi({
  reducerPath: "elockDirectApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:8089",
  }),

  endpoints: (builder) => ({
    getElockDirectCommand: builder.query<ElockDirectCommandResponse, ElockDirectCommandParams>({
      query: ({ vId, gps_start_date, gps_end_date }) => ({
        url: "/elockdata/elcokDirectcommand",
        params: {
          vId,
          gps_start_date,
          gps_end_date,
        },
      }),
    }),
  }),
});

export const { useGetElockDirectCommandQuery } = elockDirectApi;
export type { ElockDirectCommandResponse, ElockDirectCommandData, ElockDirectCommandParams };
