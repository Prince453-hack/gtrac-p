import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const serverLiveApi = createApi({
	reducerPath: 'server-live-api',
	refetchOnFocus: false,

	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_SERVER_LIVE,
	}),
	endpoints: (builder) => ({
		// createAlertClient: builder.query<any, CreateAlertClientData>({
		// 	query: (body) => ({
		// 		url: `clientview/Alert_management.php`,
		// 		method: 'POST',
		// 		body: new URLSearchParams({
		// 			...body,
		// 		}),
		// 	}),
		// }),
	}),
});

export const {
	// useLazyCreateAlertClientQuery
} = serverLiveApi;
