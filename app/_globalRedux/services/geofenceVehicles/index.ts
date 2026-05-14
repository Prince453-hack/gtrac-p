import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GetInGeofenceVehiclesResponse } from "../types/geofenceVehicles";

export const geofenceVehiclesApi = createApi({
  reducerPath: "geofenceVehiclesApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 30000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["GeofenceVehicles"],
  endpoints: (builder) => ({
    getInGeofenceVehicles: builder.query<
      GetInGeofenceVehiclesResponse,
      { token: string }
    >({
      query: ({ token }) => ({
        url: `/getIngeofencevehDtl`,
        method: "GET",
        params: { token },
      }),
      providesTags: ["GeofenceVehicles"],
    }),
  }),
});

export const {
  useGetInGeofenceVehiclesQuery,
  useLazyGetInGeofenceVehiclesQuery,
} = geofenceVehiclesApi;
