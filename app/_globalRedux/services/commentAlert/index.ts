import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface InsertAlertPopupPayload {
  token: string; // groupid
  service_id: string;
  alert_type: string;
  user_id?: number;
  username?: string;
  vehicleno?: string;
  speed?: number;
  gps_latitude?: number;
  gps_longitude?: number;
  aws_msg_id?: string;
  number?: string;
  email?: string;
  msg?: string;
  created_at?: string;
  remark?: string;
  issue?: string;
}

export interface InsertAlertPopupResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const commentAlertApi = createApi({
  reducerPath: "comment-alert-api",
  refetchOnFocus: true,
  tagTypes: ["Alert-Popup-Insert"],

  baseQuery: fetchBaseQuery({
    baseUrl: "https://yatayaat.in/reactapi/",
  }),
  endpoints: (builder) => ({
    insertAlertPopup: builder.mutation<
      InsertAlertPopupResponse,
      InsertAlertPopupPayload
    >({
      query: (payload) => ({
        url: "alerts_popups_insert.php",
        method: "POST",
        body: new URLSearchParams({
          token: payload.token,
          service_id: payload.service_id,
          alert_type: payload.alert_type,
          user_id: String(payload.user_id || 0),
          username: payload.username || "",
          vehicleno: payload.vehicleno || "",
          speed: String(payload.speed || 0),
          gps_latitude: String(payload.gps_latitude || 0),
          gps_longitude: String(payload.gps_longitude || 0),
          aws_msg_id: payload.aws_msg_id || "",
          number: payload.number || "",
          email: payload.email || "",
          msg: payload.msg || "",
          created_at: payload.created_at || "",
          remark: payload.remark || "",
          issue: payload.issue || "",
        }),
      }),
      invalidatesTags: ["Alert-Popup-Insert"],
    }),
  }),
});

export const { useInsertAlertPopupMutation } = commentAlertApi;
