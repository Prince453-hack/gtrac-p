import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ElockOtpCommandData {
  user_id: number;
  sys_service_id: number;
  location: string;
  accessed_by: string;
  update_time: string;
}

interface ElockOtpCommandResponse {
  success: boolean;
  data: ElockOtpCommandData[];
}

interface ElockOtpCommandParams {
  vId: number;
  gps_start_date: string;
  gps_end_date: string;
}

export const elockOtpApi = createApi({
  reducerPath: "elockOtpApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "https://gtrac.in:8089",
  }),

  endpoints: (builder) => ({
    getElockOtpCommand: builder.query<
      ElockOtpCommandResponse,
      ElockOtpCommandParams
    >({
      query: ({ vId, gps_start_date, gps_end_date }) => ({
        url: "/elockdata/elcokOtpcommand",
        params: {
          vId,
          gps_start_date,
          gps_end_date,
        },
      }),
    }),
  }),
});

export const { useGetElockOtpCommandQuery } = elockOtpApi;
export type {
  ElockOtpCommandResponse,
  ElockOtpCommandData,
  ElockOtpCommandParams,
};
