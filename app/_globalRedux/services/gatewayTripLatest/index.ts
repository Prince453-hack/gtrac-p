import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface GatewayTripLatestItem {
  id: number;
  vehicle_no: string;
  TripStartDate: string;
  Driver_name: string;
  site_reporting_time: string;
  gr_no: string;
  billing_party_name: string;
  booking_type: string;
  document_no: string;
  container_no: string;
  "Importer NAME": string | null;
  "Container Combination": number;
  route: string;
  header_tripstatus: number;
  timeupdate: string;
  size: string | null;
  segment: string | null;
  shipping_line_name: string | null;
}

export interface GatewayTripLatestResponse {
  message: string;
  success: boolean;
  list: GatewayTripLatestItem[];
}

export const gatewayTripLatestApi = createApi({
  reducerPath: "gatewayTripLatestApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 30000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["GatewayTripLatest"],
  endpoints: (builder) => ({
    getGatewayTripLatest: builder.query<
      GatewayTripLatestResponse,
      { token: string }
    >({
      query: ({ token }) => ({
        url: "/gatewayTripLatest",
        method: "GET",
        params: { token },
      }),
      providesTags: ["GatewayTripLatest"],
    }),
  }),
});

export const {
  useGetGatewayTripLatestQuery,
  useLazyGetGatewayTripLatestQuery,
} = gatewayTripLatestApi;
