import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const carvanMapTracking = createApi({
	reducerPath: 'carvanMapTracking',
	refetchOnFocus: false,
	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_CARVAN_MAP_TRACKING_API,
	}),
	endpoints: (builder) => ({
		initiateLocationRequest: builder.mutation<SuccessResponse, { phoneNumbers: string[] }>({
			query: ({ phoneNumbers }) => ({
				url: 'location-requests',
				method: 'POST',
				body: { phoneNumbers },
			}),
		}),
	}),
});

export const { useInitiateLocationRequestMutation } = carvanMapTracking;
