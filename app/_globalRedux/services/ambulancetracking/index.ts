import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define the response type for ambulance employee
export interface AmbulanceEmployeeResponse {
  totalAmbulances: number;
  totalActiveAmbulances: number;
  totalInActiveAmbulances: number;
  driversOnly: number;
  emtsOnly: number;
  totalDrivers: number;
  totalEmts: number;
  ambulances: AmbulanceEmployee[];
}

export interface AmbulanceEmployee {
  ambulanceNumber: string;
  callSign: string;
  zone: string;
  driver: EmployeeDetail;
  emt: EmployeeDetail;
}

export interface EmployeeDetail {
  name: string;
  employeeSystemId: string;
  phoneNumber: string;
  latestPunchTime: string;
  punchOutType: string;
}

export const ambulanceTrackingApi = createApi({
  reducerPath: "ambulanceTrackingApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "/api/ambulance",
    timeout: 120000,
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ["Ambulance-Employees"],

  endpoints: (builder) => ({
    getAmbulanceEmployees: builder.query<AmbulanceEmployeeResponse, void>({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["Ambulance-Employees"],
      transformErrorResponse: (response: any) => {
        console.error("Ambulance API Error:", response);
        return {
          status: response.status,
          data: response.data || "Unknown error occurred",
        };
      },
    }),
  }),
});

export const {
  useGetAmbulanceEmployeesQuery,
  useLazyGetAmbulanceEmployeesQuery,
} = ambulanceTrackingApi;
