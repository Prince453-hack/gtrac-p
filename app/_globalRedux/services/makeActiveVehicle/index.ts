import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// TypeScript interfaces for the API
export interface MakeActiveVehicleRequest {
  sys_service_id: string | number;
  reason: string;
  Other: number;
  inputDatetime: string;
  otherReason: string;
}

export interface MakeActiveVehicleResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const makeActiveVehicleApi = createApi({
  reducerPath: "makeActiveVehicleApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 120000,
  }),
  tagTypes: ["ActiveVehicle"],
  endpoints: (builder) => ({
    makeActiveVehicle: builder.mutation<
      MakeActiveVehicleResponse,
      MakeActiveVehicleRequest
    >({
      query: (body) => ({
        url: "/makeItactiveVehicle",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["ActiveVehicle"],
    }),
  }),
});

export const { useMakeActiveVehicleMutation } = makeActiveVehicleApi;
