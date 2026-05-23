import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GetListVehiclesMobResponse, GetItnaryWithMapResponse } from "../types";
import { AlertByDateResponse, KMTAlertsResponse } from "../types/alerts";
import {
  MapYourVehicleData,
  MapYOurVehicleResponse,
} from "../types/post/mapYourVehicle";
import { SubuserAssignedVehiclesResponse } from "../types/subuser";
import { setSelectedTrip } from "../../dashboard/selectedTripSlice";
import { GetVehiclesCountsResponse } from "../types/getVehiclesCounts";
import { LatLngToAddressResponse } from "../types/latLngToAddress";
import { GatewayRailCurrentTripsResponse } from "../types/gatewayRailCurrentTripsResponse";
import {
  VehicleReportResponse,
  VehicleReportParams,
} from "../types/vehicleReport";

interface CreateTripFormWithExtraInfo {
  body: CreateTripFormPayload["body"] & { extraInfo: any };
  token: string;
}

export const trackingDashboard = createApi({
  reducerPath: "allTripApi",
  refetchOnFocus: false,

  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_TRACKING_DASHBOARD ||
      "https://gtrac.in:8080/dashboard",
    timeout: 180000, // Increased timeout for live environment
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "Vehicles-List-By-Status",
    "On-Trip-Vehicles",
    "On-Planned-Vehicles",
    "All-Alerts-By-Date",
    "KMT-Alerts-By-Date",
    "Selected-Vehicle-Itinerary",
    "Selected-Vehicle-Diagnostic",
    "Completed-Trip-Vehicles",
    "Vehicle-Report",
  ],

  endpoints: (builder) => ({
    getVehiclesByStatus: builder.query<
      GetListVehiclesMobResponse,
      {
        token: string;
        userId: string;
        pUserId: string;
        mode?: string;
        status?: string;
        tripStatusBatch?: string;
      }
    >({
      query: ({ token, userId, pUserId, mode, status, tripStatusBatch }) => {
        if (status) {
          if (
            status === "On Trip" &&
            (tripStatusBatch === "On Trip" || tripStatusBatch === "Off Trip")
          ) {
            return `getListVehiclesmob?token=${token}&userid=${userId}&puserid=${pUserId}&status=${status}&trip_status_batch=`;
          } else {
            return `getListVehiclesmob?token=${token}&userid=${userId}&puserid=${pUserId}&status=${status}&trip_status_batch=${tripStatusBatch}`;
          }
        } else {
          return `getListVehiclesmob?token=${token}&userid=${userId}&puserid=${pUserId}&mode=${mode}`;
        }
      },
      keepUnusedDataFor: 0,
      providesTags: ["Vehicles-List-By-Status"],
    }),
    getAllVehicles: builder.query<
      GetAllVehiclesListResponse,
      { token: string }
    >({
      query: ({ token }) => `getAllvehiclelist?token=${token}`,
    }),

    getItnaryWithMap: builder.query<
      GetItnaryWithMapResponse,
      { vId: string; userId: string }
    >({
      query: ({ vId, userId }) =>
        `getitnarywithmap?vId=${vId}&userid=${userId}`,
    }),
    getItineraryvehIdBDateNwSt: builder.query<
      GetItnaryWithMapResponse,
      {
        vId: number;
        startDate: string;
        endDate: string;
        requestFor: number;
        userId: string;
      }
    >({
      query: ({ vId, startDate, endDate, requestFor, userId }) =>
        `GetItineraryvehIdBDateNwStmeh?vId=${vId}&startdate=${startDate}&enddate=${endDate}&requestfor=${requestFor}&userid=${userId}`,
      transformResponse: (response: GetpathwithDateDaignosticReponse) => {
        let sortedData = response.data.sort((a, b) => {
          return new Date(b.toTime).getTime() - new Date(a.toTime).getTime();
        });

        // Map PathwithDateDaignosticData[] to VehicleItinaryData[]
        let mappedData = sortedData.map((item) => ({
          ...item,
          engineTotalFuelUsedstrt: item.engineTotalFuelUsedstrt ?? "",
          engineTotalFuelUsedend: item.engineTotalFuelUsedend ?? "",
        }));

        return {
          ...response,
          data: mappedData,
        };
      },
      providesTags: ["Selected-Vehicle-Itinerary"],
    }),
    getKmtAlertVehicleWise: builder.query<
      KMTAlertsResponse,
      {
        userId: string;
        vehReg: string;
        vehId: number;
        startDateTime: string;
        endDateTime: string;
      }
    >({
      query: ({ userId, vehReg, vehId, startDateTime, endDateTime }) =>
        `kmtAlertVehicleWise?userid=${userId}&vehreg=${vehReg}&vehid=${vehId}&startdatetime=${startDateTime}&enddatetime=${endDateTime}`,
      providesTags: ["KMT-Alerts-By-Date"],
    }),

    mapYourVehicle: builder.query<MapYOurVehicleResponse, MapYourVehicleData>({
      query: (body) => ({
        url: `savemappedvehicle`,
        method: "POST",
        body: body,
      }),
    }),

    mapYourVehicleM: builder.mutation<
      MapYOurVehicleResponse,
      MapYourVehicleData
    >({
      query: (body) => ({
        url: `savemappedvehicle`,
        method: "POST",
        body: body,
      }),
    }),

    subuserAssignedVehicles: builder.query<
      SubuserAssignedVehiclesResponse,
      { token: string }
    >({
      query: ({ token }) => `getallvehiclelist?token=${token}`,
    }),

    getVehicleCurrentLocation: builder.query<
      GetCurrentLocationResponse,
      { userId: number; vehId: number }
    >({
      query: ({ userId, vehId }) =>
        `getcurrentlocation/?vehid=${vehId}&userid=${userId}`,
    }),

    getRawWithDateToday: builder.query<
      GetRawDataWithApiResponse,
      {
        userId: number;
        vehId: number;
        startDate: string;
        endDate: string;
        interval: string;
      }
    >({
      query: ({ userId, vehId, startDate, endDate, interval }) =>
        `getRawhwithDatetoday?vId=${vehId}&startdate=${startDate}&enddate=${endDate}&requestfor=0&userid=${userId}&interval=${interval}`,
    }),
    getRawWithDate: builder.query<
      GetRawDataWithApiResponse,
      {
        userId: number;
        vehId: number;
        startDate: string;
        endDate: string;
        interval: string;
      }
    >({
      query: ({ userId, vehId, startDate, endDate, interval }) =>
        `getRawhwithDateLoc?vId=${vehId}&startdate=${startDate}&enddate=${endDate}&requestfor=0&userid=${userId}&interval=${interval}`,
    }),
    getRawWithDateWithoutLocation: builder.query<
      GetRawDataWithoutLocationApiResponse,
      {
        userId: number;
        vehId: number;
        startDate: string;
        endDate: string;
        interval: string;
      }
    >({
      query: ({ userId, vehId, startDate, endDate, interval }) =>
        `getRawhwithDate?vId=${vehId}&startdate=${startDate}&enddate=${endDate}&requestfor=0&userid=${userId}&interval=${interval}`,
    }),

    getRawFuelWithDate: builder.query<
      GetRawDataWithoutLocationApiResponse,
      {
        userId: number;
        vehId: number;
        startDate: string;
        endDate: string;
        interval: string;
      }
    >({
      query: ({ userId, vehId, startDate, endDate, interval }) =>
        `getRawhFuelwithDate?vId=${vehId}&startdate=${startDate}&enddate=${endDate}&requestfor=0&userid=${userId}&interval=${interval}`,
    }),

    getKuberFuelFillingAndTheft: builder.query<
      GetKuberFuelFillingAndTheftResponse,
      {
        userId: number;
        vehId: number;
        startDate: string;
        endDate: string;
        type: number;
      }
    >({
      query: ({ userId, vehId, startDate, endDate, type }) =>
        `AllFillTheftLog?sys_service_id=${vehId}&startdate=${startDate}&enddate=${endDate}&TypeFT=${type}&userid=${userId}`,
    }),
    convertLatLngToAddress: builder.query<
      LatLngToAddressResponse,
      { userId: number; latitude: number; longitude: number }
    >({
      query: ({ userId, latitude, longitude }) =>
        `getLocationByLatlong?userid=${userId}&latitude=${latitude}&longitude=${longitude}`,
    }),
    getAlertsByDate: builder.query<
      AlertByDateResponse,
      {
        userId: string;
        token: string;
        alertType: string;
        startDateTime: string;
        endDateTime: string;
        vehReg: number | string;
        vehId: number | string;
      }
    >({
      query: ({
        userId,
        alertType,
        startDateTime,
        endDateTime,
        token,
        vehReg,
        vehId,
      }) =>
        `ALLAlertcategoryWise?veh_id=${vehId}&veh_reg=${vehReg}&alertype=${alertType}&userid=${userId}&startdatetime=${startDateTime}&enddatetime=${endDateTime}&token=${token}`,
      providesTags: ["All-Alerts-By-Date"],
    }),

    getCurrentMonthReport: builder.query<
      GetCurrentMonthResponse,
      { startDateTime: string; endDateTime: string; groupId: string }
    >({
      query: ({ groupId, startDateTime, endDateTime }) =>
        `consolidateKM/?token=${groupId}&startdate=${startDateTime}&enddate=${endDateTime}`,
    }),
    getpathwithDateDaignostic: builder.query<
      GetpathwithDateDaignosticReponse,
      { vId: number; startDate: string; endDate: string; userId: string }
    >({
      query: ({ vId, startDate, endDate, userId }) =>
        `getpathwithDateDaignostic?vId=${vId}&startdate=${startDate}&enddate=${endDate}&requestfor=0&userid=${userId}`,
      transformResponse: (response: GetpathwithDateDaignosticReponse) => {
        let data = {
          ...response,
          data: response.data.sort((a, b) => {
            return new Date(b.toTime).getTime() - new Date(a.toTime).getTime();
          }),
        };
        return data;
      },
      providesTags: ["Selected-Vehicle-Diagnostic"],
    }),
    getTempWithDate: builder.query<
      GetTempWithDateResponse,
      {
        startDateTime: string;
        endDateTime: string;
        userId: number;
        vId: number;
        interval: number;
      }
    >({
      query: ({ startDateTime, endDateTime, userId, vId, interval }) =>
        `getTempwithDate?vId=${vId}&startdate=${startDateTime}&enddate=${endDateTime}&userid=${userId}&interval=${interval}`,
    }),
    saveMapChoice: builder.mutation<SaveMapChoiceResponse, SaveMapBody>({
      query: (body) => ({
        url: `/saveMapchoice`,
        body,
        method: "POST",
      }),
    }),
    getKMAnkurCarrier: builder.query<AnukurCarrierResponse, { token: number }>({
      query: ({ token }) => `getKMAnkurcarrier?token=${token}`,
    }),
    updateDriverData: builder.mutation<
      UpdateDriverResponse,
      UpdateDriverPayload
    >({
      query: ({ sysServiceId, groupId, driverName, driverNumber }) => ({
        method: "POST",
        url: `saveDriverData`,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sys_service_id: sysServiceId,
          group_id: groupId,
          drivername: driverName,
          drivernumber: driverNumber,
        }),
      }),
      invalidatesTags: ["Vehicles-List-By-Status"],
    }),
    createPOI: builder.query<
      any,
      {
        userId: string;
        poiName: string;
        radius: number;
        lat: number;
        long: number;
        isGeofence: 0 | 24;
      }
    >({
      query: ({ poiName, radius, lat, long, userId, isGeofence }) => ({
        method: "POST",
        url: `savePoi`,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poi: poiName,
          radius: radius, // 1000
          lat: lat, //first lat
          lng: long, // first lng
          userid: userId,
          isGeofence,
        }),
      }),
    }),
    editPOI: builder.query<
      any,
      {
        userId: string;
        poiName: string;
        radius: number;
        lat: number;
        lng: number;
        poiId: number;
      }
    >({
      query: ({ poiName, radius, lat, lng, userId, poiId }) => ({
        method: "POST",
        url: `EditPoi`,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poi: `${poiName}`,
          userid: `${userId}`,
          poiid: `${poiId}`,
          radius: `${radius}`,
          lat: `${lat}`,
          lng: `${lng}`,
        }),
      }),
    }),
    createGeofence: builder.mutation<
      any,
      {
        poi: string;
        radius: number;
        lat: number;
        lng: number;
        userid: number;
        points: { lat: number; lng: number }[];
      }
    >({
      query: ({ poi, radius, lat, lng, userid, points }) => ({
        method: "POST",
        url: `savePoiWithGeofence`,
        body: {
          poi,
          radius,
          lat,
          lng,
          userid,
          isGeofence: true,
          points,
        },
      }),
    }),
    updateGeofence: builder.mutation<
      any,
      {
        name: string;
        radius: number;
        userId: string;
        token: string;
        points: { lat: number; lng: number }[];
        poiid: number;
      }
    >({
      query: ({ name, radius, userId, token, points, poiid }) => ({
        method: "POST",
        url: `saveGeofence`,
        body: {
          name,
          radius,
          userId,
          token,
          points,
          poiid,
        },
      }),
    }),
    createTripForm: builder.mutation<any, CreateTripFormWithExtraInfo>({
      query: ({ body }) => ({
        method: "POST",
        url: "savetripbyvehicle",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["On-Trip-Vehicles"],
    }),
    planTripForm: builder.mutation<any, CreateTripFormPayload>({
      query: ({ body }) => ({
        method: "POST",
        url: "savePlanByVhl",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["On-Planned-Vehicles"],
    }),
    planDelete: builder.query<
      any,
      {
        tripId: number;
        userId: string;
        token: string;
        startDate: string;
        endDate: string;
        tripStatus: string;
        tripStatusBatch: string;
      }
    >({
      query: ({ tripId }: { tripId: number }) => ({
        method: "GET",
        url: `plandelete?tripid=${tripId}`,
      }),
      async onQueryStarted(
        {
          tripId,
          userId,
          token,
          startDate,
          endDate,
          tripStatus,
          tripStatusBatch,
          ...patch
        },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          trackingDashboard.util.updateQueryData(
            "getPlannedVehicles",
            { token, userId, startDate, endDate, tripStatus, tripStatusBatch },
            (draft) => {
              draft.list = draft.list.filter((item) => item.trip_id !== tripId);

              Object.assign(draft, patch);
            }
          )
        );

        try {
          await queryFulfilled;
        } catch (err) {
          patchResult.undo();
        }
      },
    }),

    editPlannedVehicles: builder.mutation<
      any,
      CreateTripFormPayload & {
        body: CreateTripFormPayload["body"] & { tripid: string };
      }
    >({
      query: ({ body }) => ({
        method: "POST",
        url: "editPlanByVhl",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["On-Planned-Vehicles"],
    }),
    editTripVehicles: builder.mutation<
      any,
      CreateTripFormPayload & {
        body: CreateTripFormPayload["body"] & { tripid: string };
      }
    >({
      query: ({ body }) => ({
        method: "POST",
        url: "editTripByVhl",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["On-Trip-Vehicles"],
    }),
    getTripVehicles: builder.query<
      getTripVehiclesResponse,
      {
        token: string;
        userId: string;
        startDate: string;
        endDate: string;
        tripStatus: string;
        tripStatusBatch: string;
      }
    >({
      query: ({
        token,
        userId,
        startDate,
        endDate,
        tripStatus,
        tripStatusBatch,
      }) =>
        `getTripvehiclelist?tripstatus=${tripStatus}&tripstatusbatch=${tripStatusBatch}&token=${token}&userid=${userId}&startdate=${startDate}&enddate=${endDate}`,
      transformResponse: (response: getTripVehiclesResponse) => {
        response.list.sort((a, b) => {
          return (
            new Date(b.departure_date).getTime() -
            new Date(a.departure_date).getTime()
          );
        });
        return response;
      },
      keepUnusedDataFor: 0,
      providesTags: ["On-Trip-Vehicles"],
    }),

    getTripCompletedVehicles: builder.query<
      getTripVehiclesResponse,
      {
        token: string;
        userId: string;
        startDate: string;
        endDate: string;
        tripStatus: string;
        tripStatusBatch: string;
      }
    >({
      query: ({
        token,
        userId,
        startDate,
        endDate,
        tripStatus,
        tripStatusBatch,
      }) =>
        `getTripComplList?tripstatus=${tripStatus}&tripstatusbatch=${tripStatusBatch}&token=${token}&userid=${userId}&startdate=${startDate}&enddate=${endDate}`,
      transformResponse: (response: getTripVehiclesResponse) => {
        response.list.sort((a, b) => {
          return (
            new Date(b.departure_date).getTime() -
            new Date(a.departure_date).getTime()
          );
        });
        return response;
      },
      keepUnusedDataFor: 0,
      providesTags: ["Completed-Trip-Vehicles"],
    }),
    getPlannedVehicles: builder.query<
      getTripVehiclesResponse,
      {
        token: string;
        userId: string;
        startDate: string;
        endDate: string;
        tripStatus: string;
        tripStatusBatch: string;
      }
    >({
      query: ({
        token,
        userId,
        startDate,
        endDate,
        tripStatus,
        tripStatusBatch,
      }) =>
        `getplanAlllist?tripstatus=${tripStatus}&tripstatusbatch=${tripStatusBatch}&token=${token}&userid=${userId}&startdate=${startDate}&enddate=${endDate}`,
      keepUnusedDataFor: 0,
      providesTags: ["On-Planned-Vehicles"],
    }),
    getTripSingle: builder.query<
      SingleTripResponse,
      { trip_id: string; vehicle_id: string; token: string }
    >({
      query: ({ trip_id, vehicle_id, token }) =>
        `getTripSingle?tripid=${trip_id}&vehid=${vehicle_id}&token=${token}`,
      keepUnusedDataFor: 0,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setSelectedTrip(data.list[0]));
        } catch (err) {
          // `onError` side-effect
        }
      },
    }),
    getAllMrkMapping: builder.query<
      getAllMrkMappingResponse,
      { token: string }
    >({
      query: ({ token }) => `getAllMrkMapping?token=${token}`,
    }),
    getConsolidateDetail: builder.query<
      ConsolidatedReportResponse,
      { token: string; userId: string; startDate: string }
    >({
      query: ({ token, userId, startDate }) =>
        `consolidateDetail?token=${token}&userid=${userId}&startdate=${startDate}`,
    }),

    getConsolidateDateByRange: builder.query<
      ConsolidatedReportResponse,
      {
        token: string;
        userId: string;
        startDate: string;
        endDate: string;
      }
    >({
      query: ({ token, userId, startDate, endDate }) =>
        `consolidateDetailtime?token=${token}&userid=${userId}&startdatetime=${startDate}&enddatetime=${endDate}`,
    }),

    getConslidateByDateRangeDataAndVehicleNumber: builder.query<
      ConsolidatedReportResponse,
      {
        token: string;
        userId: string;
        startDate: string;
        endDate: string;
        vehId: number;
      }
    >({
      query: ({ token, startDate, endDate, vehId, userId }) =>
        `getdetailConsolidatetimeVehicle/?token=${token}&userId=${userId}&startdate=${startDate}&enddate=${endDate}&vehId=${vehId}`,
    }),
    getCountDetails: builder.query<
      GetVehiclesCountsResponse,
      { groupid: string; userid: string; puserid: string }
    >({
      query: ({ groupid, userid, puserid }) =>
        `getlistvehiclecounttravel?token=${groupid}&userId=${userid}&puserid=${puserid}`,
    }),
    getDTCResult: builder.query<
      GetDTCResponse,
      { vehicleId: number; token: string }
    >({
      query: ({ vehicleId, token }) =>
        `getDTCResult?vehicleId=${vehicleId}&token=${token}`,
    }),
    getGatwayTrip: builder.query<GatewayRailCurrentTripsResponse, any>({
      query: () => `getGatwayTrip?`,
    }),
    getGatewayTripHistory: builder.query<
      GatewayRailCurrentTripsResponse,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) =>
        `getGatwayTripbytrip?startdate=${startDate}&enddate=${endDate}`,
    }),

    getVehicleReport: builder.query<VehicleReportResponse, VehicleReportParams>(
      {
        query: ({ vId, startdate, enddate, requestfor, userid }) =>
          `getvehiclereport?vId=${vId}&startdate=${startdate}&enddate=${enddate}&requestfor=${requestfor}&userid=${userid}`,
        providesTags: ["Vehicle-Report"],
      }
    ),

    getConsolidateKM: builder.query<
      any,
      {
        token: string;
        startdate: string;
        enddate: string;
      }
    >({
      query: ({ token, startdate, enddate }) =>
        `consolidateKM/?token=${token}&startdate=${startdate}&enddate=${enddate}`,
    }),
  }),
});

export const {
  useSaveMapChoiceMutation,
  useGetVehiclesByStatusQuery,
  useGetAllVehiclesQuery,
  useLazyGetAllVehiclesQuery,
  useLazyGetVehiclesByStatusQuery,
  useGetItnaryWithMapQuery,
  useLazyGetItnaryWithMapQuery,
  useGetItineraryvehIdBDateNwStQuery,
  useLazyGetItineraryvehIdBDateNwStQuery,
  useGetKmtAlertVehicleWiseQuery,
  useLazyGetKmtAlertVehicleWiseQuery,
  useMapYourVehicleQuery,
  useMapYourVehicleMMutation,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useGetCurrentMonthReportQuery,
  useLazyGetCurrentMonthReportQuery,
  useLazyGetTempWithDateQuery,
  useGetTempWithDateQuery,
  useLazySubuserAssignedVehiclesQuery,
  useGetVehicleCurrentLocationQuery,
  useLazyGetVehicleCurrentLocationQuery,
  useUpdateDriverDataMutation,
  useGetRawWithDateQuery,
  useLazyGetRawWithDateQuery,
  useLazyGetRawWithDateWithoutLocationQuery,
  useLazyGetRawFuelWithDateQuery,
  useGetKuberFuelFillingAndTheftQuery,
  useLazyGetKuberFuelFillingAndTheftQuery,
  useLazyConvertLatLngToAddressQuery,
  useGetRawWithDateTodayQuery,
  useLazyGetRawWithDateTodayQuery,
  useGetAlertsByDateQuery,
  useGetTripCompletedVehiclesQuery,
  useLazyGetAlertsByDateQuery,
  useLazyCreatePOIQuery,
  useLazyEditPOIQuery,
  useGetKMAnkurCarrierQuery,
  useGetpathwithDateDaignosticQuery,
  useLazyGetpathwithDateDaignosticQuery,
  useGetTripVehiclesQuery,
  useLazyGetTripVehiclesQuery,
  useGetPlannedVehiclesQuery,
  useLazyGetPlannedVehiclesQuery,
  useGetTripSingleQuery,
  useLazyGetTripSingleQuery,
  usePlanTripFormMutation,
  useCreateTripFormMutation,
  useLazyPlanDeleteQuery,
  useEditPlannedVehiclesMutation,
  useEditTripVehiclesMutation,
  useGetAllMrkMappingQuery,
  useGetConsolidateDetailQuery,
  useLazyGetConsolidateDetailQuery,
  useGetConsolidateDateByRangeQuery,
  useLazyGetConsolidateDateByRangeQuery,
  useGetConslidateByDateRangeDataAndVehicleNumberQuery,
  useLazyGetConslidateByDateRangeDataAndVehicleNumberQuery,
  useGetCountDetailsQuery,
  useGetDTCResultQuery,
  useLazyGetDTCResultQuery,
  useGetGatwayTripQuery,
  useGetGatewayTripHistoryQuery,
  useGetVehicleReportQuery,
  useLazyGetVehicleReportQuery,
  useGetConsolidateKMQuery,
  useLazyGetConsolidateKMQuery,
} = trackingDashboard;
