import { getFormData } from "@/app/helpers/convertjsToFormData";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  GetAlertsPopupsResponse,
  EchoPuchAlertsResponse,
} from "../../services/types/alerts";

export const reactApi = createApi({
  reducerPath: "react-api",
  refetchOnFocus: true,
  tagTypes: ["Normal-Alert-Popups", "EchoPuch-Alerts"],

  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_REACT_API,
  }),
  endpoints: (builder) => ({
    getNormalAlerts: builder.query<
      GetAlertsPopupsResponse[],
      { token: number }
    >({
      query: ({ token }) => `alerts_popups.php?token=${token}`,
      providesTags: ["Normal-Alert-Popups"],
    }),

    getEchoPuchAlerts: builder.query<
      EchoPuchAlertsResponse[],
      { token: number }
    >({
      query: ({ token }) => ({
        url: `https://gtrac.in/newtracking/reports/echoPuchalerts.php?token=${token}`,
        method: "GET",
      }),
      providesTags: ["EchoPuch-Alerts"],
    }),

    getIsUserAuthenticated: builder.mutation<
      any,
      { username: string; ms_username: string }
    >({
      query: ({ username, ms_username }) => ({
        url: `auth_user.php`,
        body: getFormData({ username, email: ms_username }),
        method: "POST",
      }),
    }),

    addNormalAlertComment: builder.mutation<any, any>({
      query: (body: any) => ({
        url: "alerts_popups_update.php",
        method: "POST",
        body: new URLSearchParams({
          ...body,
        }),
      }),
    }),
  }),
});

export const {
  useGetNormalAlertsQuery,
  useLazyGetNormalAlertsQuery,
  useGetEchoPuchAlertsQuery,
  useLazyGetEchoPuchAlertsQuery,
  useAddNormalAlertCommentMutation,
  useGetIsUserAuthenticatedMutation,
} = reactApi;
