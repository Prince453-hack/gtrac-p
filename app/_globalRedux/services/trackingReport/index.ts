import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SaveAlcoholBody } from '../types/post/saveAlcoholResponse';

export const trackingReport = createApi({
	reducerPath: 'trackingReports',
	refetchOnFocus: false,

	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_TRACKING_REPORT,
		timeout: 50000,
	}),
	// tagTypes: [],

	endpoints: (builder) => ({
		getContinuousJourney: builder.query<
			ContinuousJourneyResponse,
			{ token: string; userId: string; startDate: string; endDate: string; vId: string }
		>({
			query: ({ token, userId, startDate, endDate, vId }) =>
				`ContinuousJny?token=${token}&userid=${userId}&startdate=${startDate}&enddate=${endDate}&vId=${vId}`,
		}),
		getPerformanceKm: builder.query<
			GetPerformanceReportResponse,
			{ token: string; userId: string; startDate: string; endDate: string; vId: string; kmType: string }
		>({
			query: ({ token, userId, startDate, endDate, vId, kmType }) =>
				`performanceKm?token=${token}&vId=${vId}&userid=${userId}&startdate=${startDate}&enddate=${endDate}&kmtype=${kmType}`,
		}),
		saveAlcoholReading: builder.mutation<any, SaveAlcoholBody>({
			query: (body) => ({
				url: 'savealcoholReading',
				method: 'POST',
				body,
			}),
		}),
	}),
});

export const {
	useGetContinuousJourneyQuery,
	useLazyGetContinuousJourneyQuery,
	useGetPerformanceKmQuery,
	useLazyGetPerformanceKmQuery,
	useSaveAlcoholReadingMutation,
} = trackingReport;
