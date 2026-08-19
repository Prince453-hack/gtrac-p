import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface DtcLookupRequest {
  spn: number;
  fmi: number;
  make: string;
}

export interface DtcLookupResponse {
  spn: number;
  fmi: number;
  make: string;
  fault_description: string;
  category: string;
  possible_causes: string[];
  symptoms: string[];
}

export const dtcCodeApi = createApi({
  reducerPath: "dtcCodeApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_GTRAC_URL_NEW,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["DtcCode"],
  endpoints: (builder) => ({
    lookupDtc: builder.mutation<DtcLookupResponse, DtcLookupRequest>({
      query: (body) => ({
        url: "/api/v1/dtc/lookup",
        method: "POST",
        body,
      }),
    }),
    getDtcLookup: builder.query<DtcLookupResponse, DtcLookupRequest>({
      query: (body) => ({
        url: "/api/v1/dtc/lookup",
        method: "POST",
        body,
      }),
      providesTags: ["DtcCode"],
    }),
  }),
});

export const {
  useLookupDtcMutation,
  useGetDtcLookupQuery,
  useLazyGetDtcLookupQuery,
} = dtcCodeApi;
