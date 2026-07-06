import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface EcoTripItem {
    veh_no: string,
    Booking_no: string;
    sys_service_id: number;
    Pickup_loc: string;
    Pickup_lat: number;
    Pickup_lon: number;
    Pickup_time: string;
    trip_started: string;
    end_trip: string;
}

export interface EcoTripResponse {
    message: string;
    success: boolean;
    list: EcoTripItem[];
}

export interface EcoTripParams {
    startDate: string;
    endDate: string;
}

export const ecoTripDetailsApi = createApi({
    reducerPath: "ecoTripDetailsApi",
    refetchOnFocus: false,
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_TRACKING_DASHBOARD,
        prepareHeaders: (headers) => {
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["EcoTripDetails"],
    endpoints: (builder) => ({
        getEcoTripDetails: builder.query<EcoTripResponse, EcoTripParams>({
            query: ({ startDate, endDate }) => ({
                url: "/getalltripeco",
                params: {
                    startdate: startDate,
                    enddate: endDate,
                },
            }),
            providesTags: ["EcoTripDetails"],
        }),
    }),
});

export const {
    useGetEcoTripDetailsQuery,
    useLazyGetEcoTripDetailsQuery,
} = ecoTripDetailsApi;
