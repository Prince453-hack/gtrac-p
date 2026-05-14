"use client";

import { configureStore } from "@reduxjs/toolkit";

import mapReducer from "./dashboard/mapSlice";
import olMapReducer from "./dashboard/olMapSlice";
import selectedVehicleReducer from "./dashboard/selectedVehicleSlice";
import selectedDashboardVehicleReducer from "./dashboard/dashboardVehicleDetailsSelect";
import collapseVehicleStatusToggleReducer from "./dashboard/collapseVehicleStatusToggleSlice";
import collapseTripStatusToggleReducer from "./dashboard/collapseTripStatusToggleSlice";
import markersReducer from "./dashboard/markersSlice";
import authReducer from "./common/authSlice";
import clusterReducer from "./common/clusterSlice";
import globalNewMapCluster from "./dashboard/globalNewMapCluster";
import vehicleItnaryWithPathReducer from "./dashboard/vehicleItnaryWithPathSlice";
import isVehicleDetailsCollapsedReducer from "./dashboard/isVehicleDetailsCollapsedSlice";
import historyReplayReducer from "./dashboard/historyReplaySlice";
import selectedVehicleCustomRangeReducer from "./dashboard/selectedVehicleCustomRangeSlice";
import selectedVehicleCustomRangeReuseWithoutDoubleDateSlice from "./dashboard/selectedVehicleCustomRangeReuseWithoutDoubleDateSlice";
import selectedVehicleListTabReducer from "./dashboard/selectedVehicleListTab";
import mapAlertIconsReducer from "./dashboard/mapAlertIcons";
import nearbyVehicleReducer from "./dashboard/nearbyVehicleSlice";
import poiDataReducer from "./dashboard/poiSlice";
import liveVehicleItnaryWithPathReducer from "./dashboard/liveVehicleSlice";
import isDashboardVehicleDetailsSearchTriggeredReducer from "./dashboard/isDashboardVehicleDetailsSearchTriggered";
import isVehicleStatusOrTripStatusActiveReducer from "./dashboard/isVehicleStatusOrTripStatusActive";
import createTripOrTripPlanningActiveReducer from "./dashboard/createTripOrTripPlanningActive";
import allVehiclesReducer from "./dashboard/allVehicles";
import selectedTripReducer from "./dashboard/selectedTripSlice";
import editTripOrTripPlanningActiveReducer from "./dashboard/editTripOrEditPlanningActive";
import markerInfoWindowReducer from "./dashboard/markerInfoWindow";
import CreatePOIReducer from "./dashboard/createPoi";
import CreateOlPOIReducer from "./dashboard/createOlPoi";
import CheckInDataReducer from "./dashboard/CheckInData";
import VideoTelematicsReducer from "./dashboard/videoTelematics";
import videoFilterReducer from "./dashboard/videoFilterSlice";
import elockFilterReducer from "./dashboard/elockFilterSlice";
import fuelFilterReducer from "./dashboard/fuelFilterSlice";
import ticketStatusReducer from "./dashboard/ticketStatusSlice";
import fuelVehicleDetailsReducer from "./dashboard/fuelVehicleDetails";
import IsApmTotalKmLoadingReducer from "./dashboard/isApmTotalKmLoading";
import ambulanceTrackingReducer from "./dashboard/ambulanceTracking";
import deletePOIReducer from "./dashboard/deletePOI";
import trafficReducer from "./dashboard/trafficSlice";
import minMaxAlertsParameterReducer from "./dashboard/minMaxAlertsParameter";
import trackingDashboardOBDReducer from "./dashboard/trackingDashboardODBSlice";
import recentlyClickedVehiclesReducer from "./dashboard/recentlyClickedVehiclesSlice";

// services
import { trackingDashboard } from "./services/trackingDashboard";
import { tracking } from "./services/tracking";
import { setupListeners } from "@reduxjs/toolkit/query";
import { reactApi } from "./services/reactApi";
import { yatayaatNewTrackingApi } from "./services/yatayaatNewtracking";
import optionsSlice from "./dashboard/optionsSlice";
import { serverLiveApi } from "./services/serverLive";
import { masterData } from "./services/masterData";
import { gtracNewtracking } from "./services/gtrac_newtracking";
import { yatyaat } from "./services/yatayaat";
import { trackingReport } from "./services/trackingReport";
import { mettax } from "./services/mettax";
import { mettax as indiaMettax } from "./services/indiaMettax";
import { carvanMapTracking } from "./services/carvanmaptracking";
import { alertManagementApi } from "./services/alertManagement";
import { ambulanceTrackingApi } from "./services/ambulancetracking";
import { fuelTracking } from "./services/fuelData";
import { getMinMaxAlertValueApi } from "./services/getMinMaxAlertValue";
import { gearDetailsApi } from "./services/gearDetails";
import { trackingReportOBD } from "./services/trackingDashboardOBD";
import { saveInactiveVehicleApi } from "./services/saveInactiveVehicle";
import { makeActiveVehicleApi } from "./services/makeActiveVehicle";
import { fuelFilling } from "./services/fuelFilling";
import { commentAlertApi } from "./services/commentAlert";
import { haltingHoursApi } from "./services/haltingHours";
import { passengerCountApi } from "./services/passengerCount";
import { gpstracktech } from "./services/gpstracktech";
import { getSearchDataApi } from "./services/getSearchData/index";
import { geofenceVehiclesApi } from "./services/geofenceVehicles";
import { elockApi } from "./services/elock";
import { elockAlertApi } from "./services/elockAlert";
import { unlockLockReportApi } from "./services/unlockLockReport";
import { elockDirectApi } from "./services/elockDirect";
import { elockOtpApi } from "./services/elockOtp";
import { internalProcessApi } from "./services/internalProcess";
import { recordQueryApi } from "./services/recordQuery";

export const store = configureStore({
  reducer: {
    map: mapReducer,
    olMap: olMapReducer,
    cluster: clusterReducer,
    globalNewMapCluster: globalNewMapCluster,
    selectedVehicle: selectedVehicleReducer,
    selectedDashboardVehicle: selectedDashboardVehicleReducer,
    collapseVehicleStatusToggle: collapseVehicleStatusToggleReducer,
    markers: markersReducer,
    auth: authReducer,
    vehicleItnaryWithPath: vehicleItnaryWithPathReducer,
    isVehicleDetailsCollapsedSlice: isVehicleDetailsCollapsedReducer,
    historyReplay: historyReplayReducer,
    customRange: selectedVehicleCustomRangeReducer,
    selectedVehicleCustomRangeReuseWithoutDoubleDateSlice:
      selectedVehicleCustomRangeReuseWithoutDoubleDateSlice,
    mapAlertsIcons: mapAlertIconsReducer,
    vehicleOverviewOptions: optionsSlice,
    selectedVehicleListTab: selectedVehicleListTabReducer,
    nearbyVehicles: nearbyVehicleReducer,
    poiData: poiDataReducer,
    liveVehicleData: liveVehicleItnaryWithPathReducer,
    isDashboardVehicleDetailsSearchTriggered:
      isDashboardVehicleDetailsSearchTriggeredReducer,
    selectedTrip: selectedTripReducer,
    collapseTripStatusToggle: collapseTripStatusToggleReducer,
    isVehicleStatusOrTripStatusActive: isVehicleStatusOrTripStatusActiveReducer,
    createTripOrPlanningTripActive: createTripOrTripPlanningActiveReducer,
    allVehicles: allVehiclesReducer,
    editTripOrPlanningTripActive: editTripOrTripPlanningActiveReducer,
    isMarkerInfoWindowOpen: markerInfoWindowReducer,
    createPoi: CreatePOIReducer,
    createOlPoi: CreateOlPOIReducer,
    checkIndData: CheckInDataReducer,
    videoFilter: videoFilterReducer,
    elockFilter: elockFilterReducer,
    fuelFilter: fuelFilterReducer,
    ticketStatus: ticketStatusReducer,
    fuelVehicleDetails: fuelVehicleDetailsReducer,
    videoTelematics: VideoTelematicsReducer,
    isApmTotalKmmLoading: IsApmTotalKmLoadingReducer,
    ambulanceTracking: ambulanceTrackingReducer,
    deletePOI: deletePOIReducer,
    traffic: trafficReducer,
    minMaxAlertsParameter: minMaxAlertsParameterReducer,
    trackingDashboardOBD: trackingDashboardOBDReducer,
    recentlyClickedVehicles: recentlyClickedVehiclesReducer,

    [trackingDashboard.reducerPath]: trackingDashboard.reducer,
    [tracking.reducerPath]: tracking.reducer,
    [masterData.reducerPath]: masterData.reducer,
    [reactApi.reducerPath]: reactApi.reducer,
    [yatayaatNewTrackingApi.reducerPath]: yatayaatNewTrackingApi.reducer,
    [serverLiveApi.reducerPath]: serverLiveApi.reducer,
    [gtracNewtracking.reducerPath]: gtracNewtracking.reducer,
    [yatyaat.reducerPath]: yatyaat.reducer,
    [trackingReport.reducerPath]: trackingReport.reducer,
    [mettax.reducerPath]: mettax.reducer,
    [indiaMettax.reducerPath]: indiaMettax.reducer,
    [carvanMapTracking.reducerPath]: carvanMapTracking.reducer,
    [alertManagementApi.reducerPath]: alertManagementApi.reducer,
    [ambulanceTrackingApi.reducerPath]: ambulanceTrackingApi.reducer,
    [fuelTracking.reducerPath]: fuelTracking.reducer,
    [getMinMaxAlertValueApi.reducerPath]: getMinMaxAlertValueApi.reducer,
    [gearDetailsApi.reducerPath]: gearDetailsApi.reducer,
    [trackingReportOBD.reducerPath]: trackingReportOBD.reducer,
    [saveInactiveVehicleApi.reducerPath]: saveInactiveVehicleApi.reducer,
    [makeActiveVehicleApi.reducerPath]: makeActiveVehicleApi.reducer,
    [fuelFilling.reducerPath]: fuelFilling.reducer,
    [commentAlertApi.reducerPath]: commentAlertApi.reducer,
    [haltingHoursApi.reducerPath]: haltingHoursApi.reducer,
    [passengerCountApi.reducerPath]: passengerCountApi.reducer,
    [gpstracktech.reducerPath]: gpstracktech.reducer,
    [getSearchDataApi.reducerPath]: getSearchDataApi.reducer,
    [geofenceVehiclesApi.reducerPath]: geofenceVehiclesApi.reducer,
    [elockApi.reducerPath]: elockApi.reducer,
    [elockAlertApi.reducerPath]: elockAlertApi.reducer,
    [unlockLockReportApi.reducerPath]: unlockLockReportApi.reducer,
    [elockDirectApi.reducerPath]: elockDirectApi.reducer,
    [elockOtpApi.reducerPath]: elockOtpApi.reducer,
    [internalProcessApi.reducerPath]: internalProcessApi.reducer,
    [recordQueryApi.reducerPath]: recordQueryApi.reducer,
  },
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({}).concat([
      trackingDashboard.middleware,
      tracking.middleware,
      reactApi.middleware,
      yatayaatNewTrackingApi.middleware,
      serverLiveApi.middleware,
      masterData.middleware,
      gtracNewtracking.middleware,
      yatyaat.middleware,
      trackingReport.middleware,
      mettax.middleware,
      indiaMettax.middleware,
      carvanMapTracking.middleware,
      alertManagementApi.middleware,
      ambulanceTrackingApi.middleware,
      fuelTracking.middleware,
      getMinMaxAlertValueApi.middleware,
      gearDetailsApi.middleware,
      trackingReportOBD.middleware,
      saveInactiveVehicleApi.middleware,
      makeActiveVehicleApi.middleware,
      fuelFilling.middleware,
      commentAlertApi.middleware,
      haltingHoursApi.middleware,
      passengerCountApi.middleware,
      gpstracktech.middleware,
      getSearchDataApi.middleware,
      geofenceVehiclesApi.middleware,
      elockApi.middleware,
      elockAlertApi.middleware,
      unlockLockReportApi.middleware,
      elockDirectApi.middleware,
      elockOtpApi.middleware,
      internalProcessApi.middleware,
      recordQueryApi.middleware,
    ]),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
