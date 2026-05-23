import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
	ActiveDeactivateBody,
	CreateAlertClientData,
	CreateAlertData,
	CreateServiceOrDocumentAlert,
	GetServiceOrDocumentAlert,
	GetServiceOrDocumentAlertResponse,
} from '../types/post/alert';
import { AlertManagementResponse } from '../types/alerts';
import { SubUser } from '../types/subuser';
import { getFormData } from '@/app/helpers/convertjsToFormData';

export const yatyaat = createApi({
	reducerPath: 'yatayaat',
	refetchOnFocus: true,

	baseQuery: fetchBaseQuery({
		baseUrl: process.env.NEXT_PUBLIC_YATAYAAT,
	}),
	endpoints: (builder) => ({
		getServiceOrDocumentAlert: builder.query<GetServiceOrDocumentAlertResponse[], GetServiceOrDocumentAlert>({
			query: (body) => ({
				url: `reactapi/service_alerts.php`,
				method: 'POST',
				body: new URLSearchParams({ ...body }),
			}),
		}),

		createServiceOrDocumentAlert: builder.query<any, CreateServiceOrDocumentAlert>({
			query: (body) => ({
				url: `reactapi/setServiceOrDoc_alerts.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),
		editServiceOrDocumentAlert: builder.query<any, CreateServiceOrDocumentAlert>({
			query: (body) => ({
				url: `reactapi/updateServiceOrDoc_alerts.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),

		getAlertsManagement: builder.query<AlertManagementResponse, { token: string; userId: string }>({
			query: ({ token, userId }) => `reactapi/clientview/Get_Alert_management.php?token=${token}&userid=${userId}`,
		}),
		getSubUsers: builder.query<SubUser[], { userId: string }>({
			query: ({ userId }) => ({ url: `reactapi/getsubusers.php`, method: 'POST', body: new URLSearchParams({ user_id: `${userId}` }) }),
		}),

		createAlert: builder.query<any, CreateAlertData>({
			query: (body) => ({
				url: `reactapi/alertsgenerats.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),

		createAlertClient: builder.query<any, CreateAlertClientData>({
			query: (body) => ({
				url: `reactapi/clientview/Alert_management.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),

		editAlert: builder.query<any, CreateAlertData>({
			query: (body) => ({
				url: `reactapi/alertsgenerats_update.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),

		createSubuser: builder.query<any, CreateAndEditSubuserData>({
			query: (body) => ({
				url: `reactapi/add_subuser.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),
		deleteSubuser: builder.query<any, DeleteSubuserData>({
			query: (body) => ({
				url: `reactapi/delete_subuser.php`,
				method: 'POST',
				body: getFormData(body),
			}),
		}),
		editSubuser: builder.query<any, CreateAndEditSubuserData>({
			query: (body) => ({
				url: `reactapi/edit_subuser.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),
		addSubuserVehicles: builder.query<any, AddSubuserVehicles>({
			query: (body) => ({
				url: `reactapi/add_subuser_vehicles.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),
		activateDeactivateAlerts: builder.query<any, ActiveDeactivateBody>({
			query: (body) => ({
				url: `reactapi/active_deactive_alerts.php`,
				method: 'POST',
				body: new URLSearchParams({
					...body,
				}),
			}),
		}),
		getNearbyVehicles: builder.query<GetNearbyVehiclesResponse[], GetNearbyVehiclesBody>({
			query: (body) => ({
				url: `reactapi/nearbyvehilce.php`,
				method: 'POST',
				body: getFormData(body),
			}),
		}),
		getUserAlerts: builder.query<[], { token: string; userId: string }>({
			query: ({ token, userId }) => `reactapi/user_alert_types.php?token=${token}&userid=${userId}`,
		}),
		getEventsData: builder.mutation<EventsResponse, { userId: string; token: string }>({
			query: ({ userId, token }) => ({
				url: `reactapi/event.php`,
				method: 'POST',
				body: new URLSearchParams({
					userid: userId,
					token,
				}),
			}),
		}),
		deleteAllAlertNotifications: builder.mutation<any, { token: string }>({
			query: ({ token }) => ({
				url: `reactapi/dismiss_all_alerts.php`,
				method: 'POST',
				body: new URLSearchParams({
					token,
				}),
				invalidatesTags: [
					'Normal-Alert-Popups',
					'All-Alerts-By-Date',
					'KMT-Alerts-By-Date',
					'Elock-Alert-Popups',
					'Temperature-Alert-Popups',
					'Fuel-Alert-Popups',
					'Panic-Alert-Popups',
				],
			}),
		}),
	}),
});

export const {
	useGetServiceOrDocumentAlertQuery,
	useLazyGetServiceOrDocumentAlertQuery,
	useLazyCreateServiceOrDocumentAlertQuery,
	useLazyEditServiceOrDocumentAlertQuery,
	useGetAlertsManagementQuery,
	useLazyGetAlertsManagementQuery,
	useGetSubUsersQuery,
	useLazyGetSubUsersQuery,
	useLazyCreateAlertQuery,
	useLazyCreateAlertClientQuery,
	useLazyEditAlertQuery,
	useLazyCreateSubuserQuery,
	useLazyDeleteSubuserQuery,
	useLazyEditSubuserQuery,
	useLazyAddSubuserVehiclesQuery,
	useLazyActivateDeactivateAlertsQuery,
	useLazyGetNearbyVehiclesQuery,
	useGetUserAlertsQuery,
	useLazyGetUserAlertsQuery,
	useGetEventsDataMutation,
	useDeleteAllAlertNotificationsMutation,
} = yatyaat;
