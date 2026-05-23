import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ShareUrlFormData, ShareUrlResponse } from '../types/post/shareUrl';
import { getFormData } from '@/app/helpers/convertjsToFormData';

export const yatayaatNewTrackingApi = createApi({
	reducerPath: 'yatayaat-newtracking-api',
	refetchOnFocus: false,

	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_YATAYAAT_NEWTRACKING_API,
	}),
	endpoints: (builder) => ({
		shareUrl: builder.query<ShareUrlResponse, ShareUrlFormData>({
			query: (body) => {
				const formData = getFormData(body);
				return {
					url: `reports/Shareurldatasave.php`,
					method: 'POST',
					body: formData,
				};
			},
		}),

		getJourneyHours: builder.query<string, GetJourneyHoursParams>({
			query: ({
				userId,
				source,
				destination,
				via,
				viaOne,
				viaTwo,
				viaThree,
				viaFour,
				routeType,
				viaOneHaltHr,
				viaTwoHaltHr,
				viaThreeHaltHr,
				viaFourHaltHr,
				groupId,
				extra,
			}) => ({
				url: `reports/getjourney_hours_viareact.php?token=${groupId}&userid=${userId}&extra=${extra}&source=${encodeURIComponent(
					source
				)}&destination=${encodeURIComponent(destination)}&via=${encodeURIComponent(via)}&viaone=${encodeURIComponent(
					viaOne
				)}&viatwo=${encodeURIComponent(viaTwo)}&viathree=${encodeURIComponent(viaThree)}&viafour=${encodeURIComponent(
					viaFour
				)}&routetype=${encodeURIComponent(routeType)}&viaone_halthr_input=${encodeURIComponent(
					viaOneHaltHr
				)}&viatwo_halthr_input=${encodeURIComponent(viaTwoHaltHr)}&viathree_halthr_input=${encodeURIComponent(
					viaThreeHaltHr
				)}&viafour_tillkm=${encodeURIComponent(viaFourHaltHr)}`,
				method: 'GET',
				mode: 'no-cors',
				responseHandler: 'text',
			}),
		}),

		getLatLong: builder.query<string, GetJourneyHoursParams>({
			query: ({
				userId,
				source,
				destination,
				via,
				viaOne,
				viaTwo,
				viaThree,
				viaFour,
				routeType,
				viaOneHaltHr,
				viaTwoHaltHr,
				viaThreeHaltHr,
				viaFourHaltHr,
				groupId,
				extra,
			}) => ({
				url: `reports/gelatlong.php?token=${groupId}&userid=${userId}&extra=${extra}&source=${encodeURIComponent(
					source
				)}&destination=${encodeURIComponent(destination)}&via=${encodeURIComponent(via)}&viaone=${encodeURIComponent(
					viaOne
				)}&viatwo=${encodeURIComponent(viaTwo)}&viathree=${encodeURIComponent(viaThree)}&viafour=${encodeURIComponent(
					viaFour
				)}&routetype=${encodeURIComponent(routeType)}&viaone_halthr_input=${encodeURIComponent(
					viaOneHaltHr
				)}&viatwo_halthr_input=${encodeURIComponent(viaTwoHaltHr)}&viathree_halthr_input=${encodeURIComponent(
					viaThreeHaltHr
				)}&viafour_tillkm=${encodeURIComponent(viaFourHaltHr)}`,
				method: 'GET',
				mode: 'no-cors',
				responseHandler: 'text',
			}),
		}),

		getEtaHoursKm: builder.query<string, GetEtaHoursKmParams>({
			query: ({ userId, sourceLat, sourceLong, destinationLat, destinationlong, groupId, extra }) => ({
				url: `reports/eta_hours_km.php?ETA=true&sourceLat=${sourceLat}&sourceLong=${sourceLong}&destinationLat=${destinationLat}&destinationlong=${destinationlong}&token=${groupId}&userid=${userId}&extra=${extra}`,
				method: 'GET',
				mode: 'no-cors',
				responseHandler: 'text',
			}),
		}),
	}),
});

export const {
	useShareUrlQuery,
	useLazyGetJourneyHoursQuery,
	useGetJourneyHoursQuery,
	useLazyShareUrlQuery,
	useLazyGetLatLongQuery,
	useLazyGetEtaHoursKmQuery,
} = yatayaatNewTrackingApi;
