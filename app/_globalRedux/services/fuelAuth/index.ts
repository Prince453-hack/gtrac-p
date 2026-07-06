import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface FuelLoginRequest {
  login: string;
  password: string;
}

export interface FuelLoginResponse {
  jwt: string;
  refresh: string;
}

export const fuelAuthApi = createApi({
  reducerPath: "fuelAuthApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: "/api/fuel",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  endpoints: (builder) => ({
    login: builder.mutation<FuelLoginResponse, FuelLoginRequest | void>({
      query: (credentials) => ({
        url: "/auth",
        method: "POST",
        body: {
          login: credentials?.login || process.env.NEXT_PUBLIC_FUEL_API_LOGIN,
          password:
            credentials?.password || process.env.NEXT_PUBLIC_FUEL_API_PASSWORD,
        },
      }),
    }),
  }),
});

export const { useLoginMutation } = fuelAuthApi;
