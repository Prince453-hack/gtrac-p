import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface BreathAnalyzerTrackingItem {
	id: number;
	uuid: string;
	vehicle_number: string;
	employee_id: string;
	employee_name: string;
	latitude: string;
	longitude: string;
	location_address: string;
	status: string;
	timestamp: string | null;
	created_at: string;
	updated_at: string;
}

export interface BreathAnalyzerTrackingResponse {
	success: boolean;
	data: BreathAnalyzerTrackingItem[];
	total: number;
}

export interface BreathAnalyzerTrackingParams {
	startDate: string;
	endDate: string;
}

const defaultExternalBase = process.env.NEXT_PUBLIC_BREATH_ANALYZER_API || "http://103.91.90.235:3002/api";

const forceProxy = (process.env.NEXT_PUBLIC_FORCE_PROXY || "").toLowerCase() === "true";
const externalIsInsecure = defaultExternalBase.startsWith("http:");

const baseUrlForClient = forceProxy || externalIsInsecure ? "/api/breath-analyzer" : defaultExternalBase;

export const breathAnalyzerApi = createApi({
	reducerPath: "breathAnalyzerApi",
	refetchOnFocus: false,
	baseQuery: fetchBaseQuery({
		baseUrl: baseUrlForClient,
		timeout: 30000,
		prepareHeaders: (headers) => {
			headers.set("Content-Type", "application/json");
			return headers;
		},
	}),
	tagTypes: ["BreathAnalyzerTrackingData"],
	endpoints: (builder) => ({
		getTrackingData: builder.query<
			BreathAnalyzerTrackingResponse,
			BreathAnalyzerTrackingParams
		>({
			query: ({ startDate, endDate }) =>
				`tracking-data?startDate=${startDate}&endDate=${endDate}`,
			providesTags: ["BreathAnalyzerTrackingData"],
		}),
		getAllTrackingData: builder.query<
			BreathAnalyzerTrackingResponse,
			void
		>({
			query: () => `tracking-data`,
			providesTags: ["BreathAnalyzerTrackingData"],
		}),
	}),
});

export const { useGetTrackingDataQuery, useLazyGetTrackingDataQuery, useGetAllTrackingDataQuery, useLazyGetAllTrackingDataQuery } =
	breathAnalyzerApi;
