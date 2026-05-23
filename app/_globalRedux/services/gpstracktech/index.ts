import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface AlarmInfoRequest {
  ids: number[];
  pageNumber: number;
  pageSize: number;
  queryParams: string[];
  queryType: number;
  startTime: string;
  endTime: string;
}

interface AlarmInfoData {
  alarmId: string;
  vehicleId: number;
  deviceId: string;
  deviceName: string;
  group: string;
  alarmType: number;
  alarmName: string;
  alarmTime: string;
  mediaType: null;
  filePath: null;
  aviPath: string;
  imagePath: string;
  deviceType: string;
  duration: string;
  driverName: string;
  speed: string;
  lon: string;
  lat: string;
  detail: string;
  driverImg: string;
  maxSimilar: number;
}

interface AlarmInfoResponse {
  code: number;
  data: AlarmInfoData[];
  msg: string;
  total: number;
  extend: null;
}

export const gpstracktech = createApi({
  reducerPath: "gpstracktech",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://y.gpstracktech.com/api",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("key", "ba3c5a15-cd8a-4706-b9d7-b34a64244541");
      headers.set("Accept-Language", "en");
      headers.set("version", "1.0");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAlarmInfo: builder.mutation<AlarmInfoResponse, AlarmInfoRequest>({
      query: (data) => ({
        url: "/alarm/recentlyAdasList",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useGetAlarmInfoMutation } = gpstracktech;
