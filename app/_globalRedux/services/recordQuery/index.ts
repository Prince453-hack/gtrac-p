import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface DevRecordQueryRequest {
  startTime: string;
  endTime: string;
  queryType: number;
  queryParam: string;
  channelNo: number;
}

export interface DevRecordQueryFileItem {
  deviceId: string;
  channel: number;
  begintime: string;
  endtime: string;
  datatype: number;
  codetype: number;
  storgetype: number;
  fireSize: number;
}

export interface DevRecordQueryResponse {
  code: number;
  data: {
    listFile: DevRecordQueryFileItem[];
  };
  msg?: string;
}

export const recordQueryApi = createApi({
  reducerPath: "recordQueryApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: "https://y.gpstracktech.com/api",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("key", process.env.NEXT_PUBLIC_BSJ_VIDEO_API_TOKEN!);
      headers.set("Accept-Language", "en");
      headers.set("version", "1.0");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    devRecordQuery: builder.mutation<
      DevRecordQueryResponse,
      DevRecordQueryRequest
    >({
      query: (body) => ({
        url: "/video/devRecordQuery",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useDevRecordQueryMutation } = recordQueryApi;
