import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// TypeScript interfaces for the API
export interface SaveInactiveVehicleRequest {
  sys_service_id: string | number;
  reason: string;
  Other: number;
  inputDatetime: string;
  otherReason: string;
}

export interface SaveInactiveVehicleResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const saveInactiveVehicleApi = createApi({
  reducerPath: "saveInactiveVehicleApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 120000,
  }),
  tagTypes: ["InactiveVehicle"],
  endpoints: (builder) => ({
    saveInactiveVehicle: builder.mutation<
      SaveInactiveVehicleResponse,
      SaveInactiveVehicleRequest
    >({
      query: (body) => ({
        url: "/saveInactiveVehicle",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["InactiveVehicle"],
    }),
  }),
});

export const { useSaveInactiveVehicleMutation } = saveInactiveVehicleApi;
