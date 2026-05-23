import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { GetDriverListResponse } from '../types/getDriverListResponse';
import { GetDriverAlcoholListResponse } from '../types/getDriverAlcoholList';
import { GetPartyListResponse } from '../types/getPartyListResponse';

export const masterData = createApi({
	reducerPath: 'master-data',
	refetchOnFocus: false,

	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_MASTER_DATA,
	}),
	endpoints: (builder) => ({
		getPoiList: builder.query<GetPoilistResponse, { groupId: string; userId: string }>({
			query: ({ groupId, userId }) => `poilist?groupid=${groupId}&userid=${userId}`,
		}),
		getTripDates: builder.query<GetTripDatesResponse, { groupId: string; userId: string }>({
			query: ({ groupId, userId }) => `tripdate?groupid=${groupId}&userid=${userId}`,
		}),
		getDriverList: builder.query<GetDriverListResponse, { token: string }>({
			query: ({ token }) => `driverList?token=${token}`,
		}),
		getPartyList: builder.query<GetPartyListResponse, { token: string }>({
			query: ({ token }) => `partyList?token=${token}`,
		}),
		getDriverListAlcohol: builder.query<GetDriverAlcoholListResponse, { token: string; date: string }>({
			query: ({ token, date }) => `driverListalcohol?token=${token}&date=${date}`,
		}),
	}),
});

export const {
	useGetPoiListQuery,
	useGetTripDatesQuery,
	useGetPartyListQuery,
	useGetDriverListQuery,
	useGetDriverListAlcoholQuery,
	useLazyGetDriverListAlcoholQuery,
} = masterData;
