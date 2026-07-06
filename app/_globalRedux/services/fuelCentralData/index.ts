import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface FuelLevelParams {
  vehicleID: string | number;
  timeBegin: number; // Unix timestamp in seconds (UTC)
  timeEnd: number; // Unix timestamp in seconds (UTC)
  token: string; // JWT token from fuelAuth api
}

export interface FuelDataPoint {
  rV: number;
  aV: number;
  eD: number; // Unix timestamp
}

export interface TankData {
  data: FuelDataPoint[];
}

export interface FuelLevelResponse {
  status: {
    code: number;
    message: string;
  };
  tankData: TankData[];
}

export const fuelCentralDataApi = createApi({
  reducerPath: "fuelCentralDataApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "/api/fuel",
  }),

  endpoints: (builder) => ({
    getFuelLevel: builder.query<FuelLevelResponse, FuelLevelParams>({
      query: ({ vehicleID, timeBegin, timeEnd, token }) => ({
        url: "/level",
        method: "GET",
        params: {
          vehicleID,
          timeBegin,
          timeEnd,
        },
        headers: {
          Authorization: `JWT ${token}`,
        },
      }),
    }),
  }),
});

export const { useGetFuelLevelQuery, useLazyGetFuelLevelQuery } = fuelCentralDataApi;
