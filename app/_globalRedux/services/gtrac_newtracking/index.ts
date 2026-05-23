import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const gtracNewtracking = createApi({
  reducerPath: "gtrac-newtracking",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_GTRAC_NEWTRACKING,
  }),
  tagTypes: [
    "Elock-Alert-Popups",
    "Temperature-Alert-Popups",
    "Fuel-Alert-Popups",
    "Panic-Alert-Popups",
    "Elock-Alert-By-Date",
  ],
  endpoints: (builder) => ({
    getDashboardAdvanceSearchData: builder.query<
      string,
      {
        running_hr_val: string;
        running_hr_val2: string;
        ideal_hr_val: string;
        ideal_hr_val2: string;
        km_val: string;
        km_val2: string;
        search_data: string;
        over_speed_val: string;
        token: string;
        userid: string;
        extra: string;
        puserid: string;
      }
    >({
      query: ({
        running_hr_val,
        running_hr_val2,
        ideal_hr_val,
        ideal_hr_val2,
        km_val,
        km_val2,
        search_data,
        over_speed_val,
        token,
        userid,
        extra,
        puserid,
      }) =>
        `load_search_data_next.php?running_hr_val=${running_hr_val}&running_hr_val2=${running_hr_val2}&ideal_hr_val=${ideal_hr_val}&ideal_hr_val2=${ideal_hr_val2}&km_val=${km_val}&km_val2=${km_val2}&search_data=${search_data}&over_speed_val=${over_speed_val}&token=${token}&userid=${userid}&extra=${extra}&puserid=${puserid}`,
    }),
    getElockAlerts: builder.query<
      ElockAlertsResponse[],
      {
        token: string;
        userId: string;
        puserId: string;
      }
    >({
      query: ({ token, userId, puserId }) => ({
        url: `ajax/elock_alerts_next.php?token=${token}&userid=${userId}&puserid=${puserId}&action=get_alerts&extra=0`,
      }),
      providesTags: ["Elock-Alert-Popups"],
    }),
    getElockAlertsByDate: builder.query<
      ElockAlertByDate[],
      ElockAlertByDateRequest
    >({
      query: ({ token, userId, puserId, startDate, endDate }) => ({
        url: `ajax/elock_alerts_next_report.php?token=${token}&userid=${userId}&puserid=${puserId}&action=get_alerts&dateStart=${startDate}&dateEnd=${endDate}`,
      }),
      providesTags: ["Elock-Alert-By-Date"],
    }),
    getFuelAlerts: builder.query<
      FuelAlertsResponse[],
      {
        token: string;
        userId: string;
        puserId: string;
      }
    >({
      query: ({ token, userId, puserId }) => ({
        url: `temperature_alert_next.php?action=getVehFuelPopUp&token=${token}&userid=${userId}&puserid=${puserId}`,
      }),
      providesTags: ["Fuel-Alert-Popups"],
    }),
    getTemperatureAlerts: builder.query<
      TemperatureAlertsResponse[],
      {
        token: string;
        userId: string;
        puserId: string;
      }
    >({
      query: ({ token, userId, puserId }) => ({
        url: `temperature_alert_next.php?action=getVehTempDataSnowman&token=${token}&userid=${userId}&puserid=${puserId}`,
      }),
      providesTags: ["Temperature-Alert-Popups"],
    }),
    getPanicAlerts: builder.query<
      PanicAlertResponse[],
      {
        token: string;
        userId: string;
        puserId: string;
      }
    >({
      query: ({ token, userId, puserId }) => ({
        url: `temperature_alert_next.php?action=panicalert&token=${token}&userid=${userId}&puserid=${puserId}`,
      }),
      providesTags: ["Panic-Alert-Popups"],
    }),

    addElockAlertComment: builder.mutation<
      ElockAlertsResponse,
      {
        token: string;
        userId: string;
        puserId: string;
        body: AddElockAlertCommentBody;
      }
    >({
      query: ({ token, userId, puserId, body }) => ({
        url: `ajax/elock_alerts_next.php?token=${token}&userid=${userId}&puserid=${puserId}&action=save_alerts_status&id=${body.id}&remarks=${body.remarks}&title=${body.title}&veh_id=${body.veh_id}`,
      }),
    }),

    addTemperatureAlertComment: builder.mutation<
      TemperatureAlertsResponse,
      {
        token: string;
        userId: string;
        puserId: string;
        body: AddTempAlertCommentBody;
      }
    >({
      query: ({ token, userId, puserId, body }) => ({
        url: `temperature_alert_next.php?token=${token}&userid=${userId}&puserid=${puserId}&action=updateTempSnowm&comment=${body.comment}&username=${body.username}&close_time_msg=${body.close_time_msg}&alert_id=${body.alert_id}&veh_no=${body.veh_no}`,
      }),
    }),

    addPanicAlertApprovalByControlRoom: builder.mutation<
      PanicAlertResponse,
      {
        token: string;
        userId: string;
        puserId: string;
        body: addPanicAlertApprovalByControlRoomBody;
      }
    >({
      query: ({ token, userId, puserId, body }) => ({
        url: `temperature_alert_next.php?token=${token}&userid=${userId}&puserid=${puserId}&action=updatepanicalert&comment=${body.comment}&UserName=${body.username}&veh_no=${body.veh_no}`,
      }),
    }),

    addFuelAlerts: builder.mutation<
      FuelAlertsResponse,
      {
        token: string;
        userId: string;
        puserId: string;
        body: addPanicAlertApprovalByControlRoomBody;
      }
    >({
      query: ({ token, userId, puserId, body }) => ({
        url: `temperature_alert_next.php?token=${token}&userid=${userId}&puserid=${puserId}&action=Save_fuel_alert&comment=${body.comment}&UserName=${body.username}&veh_no=${body.veh_no}`,
      }),
    }),

    addTripEnd: builder.query<
      any,
      {
        tripEndId: string;
        tripEndDate: string;
        tripEndGroupId: string;
        tripEndLorryNo: string;
        tripEndRemark: string;
        userId: string;
        puserId: string;
        token: string;
        extra: string;
        username: string;
      }
    >({
      query: ({
        tripEndId,
        tripEndDate,
        tripEndGroupId,
        tripEndLorryNo,
        tripEndRemark,
        userId,
        puserId,
        token,
        extra,
        username,
      }) => ({
        url: `${process.env.NEXT_PUBLIC_GTRAC_REPORTS}/reports/tripend_snowman.php?action=trip_End_menual_closed&Trip_end_id=${tripEndId}&Trip_end_date=${tripEndDate}&Trip_end_Group_id=${tripEndGroupId}&Trip_end_lorry_no=${tripEndLorryNo}&Trip_end_Remark=${tripEndRemark}&userid=${userId}&puserid=${puserId}&token=${token}&extra=${extra}&username=${username}`,
      }),
    }),
  }),
});

export const {
  useLazyGetDashboardAdvanceSearchDataQuery,
  useLazyGetElockAlertsQuery,
  useAddElockAlertCommentMutation,
  useGetElockAlertsQuery,
  useGetTemperatureAlertsQuery,
  useGetPanicAlertsQuery,
  useLazyGetPanicAlertsQuery,
  useLazyGetTemperatureAlertsQuery,
  useAddTemperatureAlertCommentMutation,
  useAddPanicAlertApprovalByControlRoomMutation,
  useGetFuelAlertsQuery,
  useLazyGetFuelAlertsQuery,
  useAddFuelAlertsMutation,
  useGetElockAlertsByDateQuery,
  useLazyGetElockAlertsByDateQuery,
  useLazyAddTripEndQuery,
} = gtracNewtracking;
