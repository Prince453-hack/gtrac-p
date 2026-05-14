import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import { getToken } from "@/lib/mettax";
import { GetVideoAlarmsResponse } from "../types/post/getVideoAlerts";
import { GetVideoAlarmsFileResponse } from "../types/post/getVideoAlertFile";
import {
  CreateTokenResponse,
  GetMettaxDeviceInfoResponse,
  GetMettaxDevicesResponse,
  GetMettaxDeviceShadowResponse,
  GetMettaxTalkChannelResponse,
} from "../types/post/mettax";

export const mettax = createApi({
  reducerPath: "india-mettax-api",
  refetchOnFocus: true,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_INDIA_METTAX_API,
  }),
  endpoints: (builder) => ({
    indiaCreateMettaxToken: builder.mutation<CreateTokenResponse, void>({
      query: () => ({
        url: "gps/v2/openapi/system/createToken",
        method: "POST",
        body: {
          apiKey: process.env.NEXT_PUBLIC_INDIA_METTAX_API_KEY,
          apiSecret: process.env.NEXT_PUBLIC_INDIA_METTAX_API_SECRET,
        },
      }),
    }),

    indiaGetMettaxDeviceInfo: builder.mutation<
      GetMettaxDeviceInfoResponse,
      { model: string }
    >({
      async queryFn({ model }, {}, _extraOptions, baseQuery) {
        const token = await getToken();

        const result = await baseQuery({
          url: "gps/v2/openapi/device/expand/info",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: { deviceId: model },
        });

        return result as QueryReturnValue<
          GetMettaxDeviceInfoResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
    }),

    indiaGetMettaxDevices: builder.mutation<
      GetMettaxDevicesResponse,
      { customerId: string }
    >({
      async queryFn({ customerId }, {}, _extraOptions, baseQuery) {
        const token = await getToken();

        const result = await baseQuery({
          url: "gps/v2/openapi/device/shadow/customer",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: { customerId },
        });

        return result as QueryReturnValue<
          GetMettaxDevicesResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
    }),
    indiaGetMettaxAlarms: builder.mutation<
      GetVideoAlarmsResponse,
      {
        startTime: string;
        endTime: string;
        deviceIds: string;
        alarmType: string | null;
        pageSize?: number;
        pageIndex: number;
      }
    >({
      async queryFn(
        {
          startTime,
          endTime,
          deviceIds,
          alarmType,
          pageSize = 1000,
          pageIndex,
        },
        {},
        _extraOptions,
        baseQuery
      ) {
        const token = await getToken();

        const result = await baseQuery({
          url: "gps/v2/openapi/alarm/alarmPage",
          method: "POST",
          headers: { Authorization: token || "" },
          body: {
            pageSize,
            pageIndex,
            deviceIds: deviceIds,
            alarmType: alarmType,
            startTime: startTime,
            endTime: endTime,
          },
        });

        return result as QueryReturnValue<
          GetVideoAlarmsResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
    }),

    indiaGetMettaxAlarmFile: builder.mutation<
      GetVideoAlarmsFileResponse,
      { alarmId: string }
    >({
      async queryFn({ alarmId }, {}, _extraOptions, baseQuery) {
        const token = await getToken();
        const result = await baseQuery({
          url: "gps/v2/openapi/alarm/file/id",
          method: "POST",
          headers: { Authorization: token || "" },
          body: { alarmId },
        });
        return result as QueryReturnValue<
          GetVideoAlarmsFileResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
    }),

    indiaGetMettaxDeviceShadow: builder.mutation<
      GetMettaxDeviceShadowResponse,
      { deviceIds: string }
    >({
      async queryFn({ deviceIds }, {}, _extraOptions, baseQuery) {
        const token = await getToken();
        const result = await baseQuery({
          url: "gps/v2/openapi/device/shadow/deviceIds",
          method: "POST",
          headers: { Authorization: token || "" },
          body: { deviceIds },
        });
        return result as QueryReturnValue<
          GetMettaxDeviceShadowResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
    }),

    indiaGetMettaxTalkChannel: builder.mutation<
      GetMettaxTalkChannelResponse,
      { deviceId: string; channelId?: number }
    >({
      async queryFn({ deviceId, channelId = 1 }, {}, _extraOptions, baseQuery) {
        const token = await getToken();
        const result = await baseQuery({
          url: "gps/v2/openapi/audio/talk/plus",
          method: "POST",
          headers: { Authorization: token || "" },
          body: { deviceId, channelId },
        });
        return result as QueryReturnValue<
          GetMettaxTalkChannelResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
    }),
  }),
});

export const {
  useIndiaCreateMettaxTokenMutation,
  useIndiaGetMettaxDevicesMutation,
  useIndiaGetMettaxDeviceInfoMutation,
  useIndiaGetMettaxAlarmsMutation,
  useIndiaGetMettaxAlarmFileMutation,
  useIndiaGetMettaxDeviceShadowMutation,
  useIndiaGetMettaxTalkChannelMutation,
} = mettax;
