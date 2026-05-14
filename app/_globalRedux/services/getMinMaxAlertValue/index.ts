import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types for the response
interface VehicleParametersData {
  AddBlueMin: string;
  AddBlueMax: string;
  EngineTotalFuelUsedMin: string;
  EngineTotalFuelUsedMax: string;
  EngineCoolantTempMin: string;
  EngineCoolantTempMax: string;
  EngineOilTempMin: string;
  EngineOilTempMax: string;
  EngineOilPressureMin: string;
  EngineOilPressureMax: string;
  AcceleratorPedalPosMin: string;
  AcceleratorPedalPosMax: string;
  EngineIntakeManifoldPressureMin: string;
  EngineIntakeManifoldPressureMax: string;
  EngineIntakeManifoldTempMin: string;
  EngineIntakeManifoldTempMax: string;
  EngineIdleHoursMin: string;
  EngineIdleHoursMax: string;
  EngineIdleFuelUsedMin: string;
  EngineIdleFuelUsedMax: string;
  FuelLevelMin: string;
  FuelLevelMax: string;
  TotalVehicleDistanceMin: string;
  TotalVehicleDistanceMax: string;
  EngineFuelRateMin: string;
  EngineFuelRateMax: string;
  EngineHoursOperationMin: string;
  EngineHoursOperationMax: string;
}

interface GetVehicleParametersResponse {
  message: string;
  success: boolean;
  list: VehicleParametersData[];
}

interface GetVehicleParametersRequest {
  vehid: string | number;
  userid: string | number;
  startdate: string;
  enddate: string;
}

export const getMinMaxAlertValueApi = createApi({
  reducerPath: "getMinMaxAlertValueApi",
  refetchOnFocus: false,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
    timeout: 120000,
  }),
  tagTypes: ["Vehicle-Parameters"],
  endpoints: (builder) => ({
    getVehicleParameters: builder.query<
      GetVehicleParametersResponse,
      GetVehicleParametersRequest
    >({
      query: ({ vehid, userid, startdate, enddate }) =>
        `getVhlParameters/?vehid=${vehid}&userid=${userid}&startdate=${encodeURIComponent(
          startdate
        )}&enddate=${encodeURIComponent(enddate)}`,
      providesTags: ["Vehicle-Parameters"],
    }),
  }),
});

export const {
  useGetVehicleParametersQuery,
  useLazyGetVehicleParametersQuery,
} = getMinMaxAlertValueApi;
