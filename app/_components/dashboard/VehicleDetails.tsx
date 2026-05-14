"use client";

import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import { setIsVehicleDetailsCollapsed } from "@/app/_globalRedux/dashboard/isVehicleDetailsCollapsedSlice";
import {
  liveVehicleInitialState,
  setLiveVehicleItnaryWithPath,
} from "@/app/_globalRedux/dashboard/liveVehicleSlice";
import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import { setIsGetNearbyVehiclesActive } from "@/app/_globalRedux/dashboard/nearbyVehicleSlice";
import {
  initialSelectedVehicleState,
  removeSelectedVehicle,
  setPrevVehicleSelected,
  setSelectedVehicleBySelectElement,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import {
  setVehicleItnaryWithPath,
  vehicleItnaryWithPathInitialState,
} from "@/app/_globalRedux/dashboard/vehicleItnaryWithPathSlice";
import { useAppDispatch } from "@/app/_globalRedux/provider";
import {
  trackingDashboard,
  useGetItineraryvehIdBDateNwStQuery,
  useGetpathwithDateDaignosticQuery,
  useLazyGetItineraryvehIdBDateNwStQuery,
  useLazyGetpathwithDateDaignosticQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { useLazyGetpathwithDateDaignosticOBDQuery } from "@/app/_globalRedux/services/trackingDashboardOBD";
import { GetItnaryWithMapResponse } from "@/app/_globalRedux/services/types";
import { VehicleItnaryWithPath } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { RootState } from "@/app/_globalRedux/store";
import { apmTotalKm } from "@/app/helpers/apmTotalKm";
import { isKmtAccount } from "@/app/helpers/isKmtAccount";
import * as live from "@/public/assets/gif/live.gif";
import expandReports from "@/public/assets/svgs/common/expand-reports.svg";
import { CloseOutlined } from "@ant-design/icons";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { Tooltip } from "antd";
import moment from "moment";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CustomRangePicker } from "./CustomRangePicker";
import { PlacesDropdown } from "./PlacesDropdown";
import { getLatestGPSTime } from "./utils/getLatestGPSTime";
import { getNormalOrControllerId } from "./utils/getNormalOrControllerId";
import { VehicleDateOverview } from "./VehicleDateOverview";
import VehicleDetailsDownloadButton from "./VehicleDetailsDownloadButton";
import { VehicleDetailsOverview } from "./VehicleDetailsOverview";
import { VehicleDetailsSelect } from "./VehicleDetailsSelect";
import { VehicleHistoryTabs } from "./VehicleHistoryTabs";
import { VehicleDetailsContext } from "./View";

const selectedStyles = {
  selectorBg: "transparent",
  colorBorder: "transparent",
  fontSize: 19,
  optionFontSize: 14,
  optionPadding: "5px",
  optionSelectedColor: "#000",
};

export const mergeData = (
  data: any[],
  userId: string,
  parentUser: string,
  extra: string
) => {
  let mergedData: any[] = [];
  let totalDistance = 0;
  data.forEach((value, index) => {
    if (
      (index > 0 &&
        value.mode === "Idle" &&
        data[index - 1]?.mode === "Idle") ||
      (index > 0 &&
        value.mode === "Idle" &&
        value.fromLat === data[index - 1].toLat &&
        value.fromLng === data[index - 1].toLong)
    ) {
      // merge the current value with the previous one
      mergedData[mergedData.length - 1] = {
        ...mergedData[mergedData.length - 1],
        fromLat: value.fromLat,
        fromLng: value.fromLng,
        fromTime: value.fromTime,
        startLocation: value.startLocation,
        totalDistance:
          isNaN(Number(extra)) || Number(extra) === 0
            ? mergedData[mergedData.length - 1].totalDistance
            : (
                (mergedData[mergedData.length - 1].totalDistance *
                  Number(extra)) /
                100
              ).toFixed(2),
        totalTimeInMIN:
          mergedData[mergedData.length - 1].totalTimeInMIN +
          value.totalTimeInMIN,
      };
    } else {
      mergedData.push({
        ...value,
        totalDistance: `${
          isNaN(Number(extra)) || Number(extra) === 0
            ? Number(value?.totalDistance.split(" ")[0])
            : Number(
                (
                  Number(value?.totalDistance.split(" ")[0]) +
                  (Number(value?.totalDistance.split(" ")[0]) * Number(extra)) /
                    100
                ).toFixed(2)
              )
        } KM`,
      });
    }
  });

  return isKmtAccount(Number(userId), Number(parentUser))
    ? { data, totalDistance: totalDistance.toFixed(2) }
    : { data: mergedData, totalDistance: totalDistance.toFixed(2) };
};

export const updateVehicleItnaryWithPath = ({
  vehicleListDataArgs,
  pathwithDateDataArgs,
  vehicleItnaryWithPath,
  dispatch,
  userId,
  parentUser,
  extra,
}: {
  vehicleListDataArgs: GetItnaryWithMapResponse | undefined;
  pathwithDateDataArgs: GetpathwithDateDaignosticReponse | undefined;
  vehicleItnaryWithPath: VehicleItnaryWithPath;
  dispatch: ThunkDispatch<RootState, unknown, any>;
  userId: string;
  parentUser: string;
  extra: string;
}) => {
  if (vehicleListDataArgs && pathwithDateDataArgs) {
    let adjustedVehicleListData = mergeData(
      vehicleListDataArgs.data,
      userId,
      parentUser,
      extra
    );
    let adjustpathwithDateData = mergeData(
      pathwithDateDataArgs.data,
      userId,
      parentUser,
      extra
    );

    dispatch(
      setVehicleItnaryWithPath({
        ...vehicleListDataArgs,
        data: adjustedVehicleListData.data,
        vehicleId: pathwithDateDataArgs.vehicleId,
        diagnosticData: adjustpathwithDateData.data,
        patharry: pathwithDateDataArgs.patharry,
        fuelarray: pathwithDateDataArgs.fuelarray,
        fromTime: pathwithDateDataArgs.fromTime,
        toTime: pathwithDateDataArgs.toTime,
        totalDistance: pathwithDateDataArgs.totalDistance,
        calculatedTotalDistance: Number(adjustpathwithDateData.totalDistance),
        runningTime: pathwithDateDataArgs.runningTime,
        stoppageTime: pathwithDateDataArgs.stoppageTime,
      })
    );
  } else if (vehicleListDataArgs && !pathwithDateDataArgs) {
    dispatch(setLiveVehicleItnaryWithPath(liveVehicleInitialState));
    dispatch(setVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));
    let adjustedVehicleListData = mergeData(
      vehicleListDataArgs.data,
      userId,
      parentUser,
      extra
    );
    dispatch(
      setVehicleItnaryWithPath({
        ...vehicleListDataArgs,
        data: adjustedVehicleListData.data,
        vehicleId: vehicleItnaryWithPath.vehicleId,
        diagnosticData: vehicleItnaryWithPath.diagnosticData,
        patharry: vehicleItnaryWithPath.patharry,
        fuelarray: vehicleItnaryWithPath.fuelarray,
        fromTime: vehicleItnaryWithPath.fromTime,
        toTime: vehicleItnaryWithPath.toTime,
        totalDistance: vehicleItnaryWithPath.totalDistance,
        calculatedTotalDistance: 0,
        runningTime: vehicleItnaryWithPath.runningTime,
        stoppageTime: vehicleItnaryWithPath.stoppageTime,
      })
    );
  }
  dispatch(setIsVehicleDetailsCollapsed(false));
};

export const getStartEndDate = (
  date: string,
  type: "start" | "end",
  format: string,
  returnType: "not touched" | "date",
  vehicleListType: "trip" | "vehicle" | "video" | "vehicle-allocation-trip"
) => {
  if (type === "start") {
    if (
      vehicleListType === "trip" ||
      vehicleListType === "vehicle-allocation-trip"
    ) {
      const startDate = moment(new Date(date));

      if (!startDate.isValid() || startDate.isBefore([2020, 10, 21], "year")) {
        if (returnType === "not touched") {
          return "Not Touched";
        } else {
          return moment(new Date()).startOf("day").format(format);
        }
      } else {
        return startDate.format(format);
      }
    } else {
      return moment(new Date()).startOf("day").format(format);
    }
  } else {
    if (
      vehicleListType === "trip" ||
      vehicleListType === "vehicle-allocation-trip"
    ) {
      const completedDate = moment(new Date(date));

      if (
        !completedDate.isValid() ||
        completedDate.isBefore([2020, 10, 21], "year")
      ) {
        return moment(new Date()).format(format);
      } else {
        return completedDate.format(format);
      }
    } else {
      return moment(new Date()).format(format);
    }
  }
};

const isOBDVehicle = (selectedVehicle: any) => {
  return (
    selectedVehicle.gpsDtl?.fuel &&
    selectedVehicle.gpsDtl.fuel <= 100 &&
    selectedVehicle.gpsDtl.port !== 31500
  );
};

export const VehicleDetails = () => {
  const dispatch = useAppDispatch();
  const { reportsModalState } = useContext(VehicleDetailsContext);

  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive
  );
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseVehicleStatusToggle
  );
  const collapseTripStatusToggle = useSelector(
    (state: RootState) => state.collapseTripStatusToggle
  );
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const { groupId, userId, accessLabel, parentUser, extra } = useSelector(
    (state: RootState) => state.auth
  );
  const hideVehicleHeaderTools = Number(userId) === 833815;
  const { dateRangeForDataFetching } = useSelector(
    (state: RootState) => state.customRange
  );
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle
  );
  const markers = useSelector((state: RootState) => state.markers);
  const { type: vehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive
  );
  const [visibleDetailsStyling, setVisibleDetailsStyling] = useState("");
  const [vehicleDetailsUpdateTime, setVehicleDetailsUpdateTime] =
    useState("pending");
  const [obdData, setObdData] = useState<any>(null);
  const [isObdLoading, setIsObdLoading] = useState(false);
  const selectedTrip = useSelector((state: RootState) => state.selectedTrip);

  // Calculate effective vId for trip vehicles in RTK queries
  const effectiveVIdForQueries =
    (vehicleListType === "trip" ||
      vehicleListType === "vehicle-allocation-trip") &&
    selectedTrip.sys_service_id
      ? selectedTrip.sys_service_id
      : selectedVehicle.vId;

  useEffect(() => {
    if (selectedVehicle.vId === 0) {
      if (
        (vehicleListType === "video" && collapseVehicleStatusToggle) ||
        (vehicleListType === "vehicle" && collapseVehicleStatusToggle) ||
        (vehicleListType === "trip" && collapseTripStatusToggle) ||
        (vehicleListType === "vehicle-allocation-trip" &&
          collapseTripStatusToggle)
      ) {
        setVisibleDetailsStyling("-translate-x-[442px]");
      } else {
        setVisibleDetailsStyling("-translate-x-[20px]");
      }
      9;
    } else if (selectedVehicle.vId !== 0) {
      if (
        (vehicleListType === "video" && collapseVehicleStatusToggle) ||
        (vehicleListType === "vehicle" && collapseVehicleStatusToggle) ||
        (vehicleListType === "trip" && collapseTripStatusToggle) ||
        (vehicleListType === "vehicle-allocation-trip" &&
          collapseTripStatusToggle)
      ) {
        setVisibleDetailsStyling("translate-x-[20px]");
      } else {
        setVisibleDetailsStyling("translate-x-[442px]");
      }
    }
  }, [
    selectedVehicle,
    collapseVehicleStatusToggle,
    collapseTripStatusToggle,
    vehicleListType,
  ]);

  const { isFetching: vehicleListIsFetching, currentData: vehicleListData } =
    useGetItineraryvehIdBDateNwStQuery(
      {
        userId: userId,
        vId:
          vehicleListType === "trip" ||
          vehicleListType === "vehicle-allocation-trip"
            ? effectiveVIdForQueries
            : accessLabel === 6
            ? getNormalOrControllerId(selectedVehicle, userId)
            : selectedVehicle.gpsDtl?.controllernum === "CONTROLLER"
            ? Number(selectedVehicle.controllermergeId)
            : effectiveVIdForQueries,
        startDate: getStartEndDate(
          selectedTrip.departure_date,
          "start",
          "YYYY-MM-DD HH:mm",
          "date",
          vehicleListType
        ),
        endDate: getStartEndDate(
          selectedTrip.trip_complted_datebysystem,
          "end",
          "YYYY-MM-DD HH:mm",
          "date",
          vehicleListType
        ),
        requestFor: 0,
      },
      {
        skip:
          vehicleItnaryWithPath.patharry.length > 0 ||
          !groupId ||
          !userId ||
          !effectiveVIdForQueries ||
          !!dateRangeForDataFetching.startDate ||
          historyReplay.isHistoryReplayMode ||
          (vehicleListType === "trip" && selectedTrip.sys_service_id === 0) ||
          (vehicleListType === "vehicle-allocation-trip" &&
            selectedTrip.sys_service_id === 0) ||
          (vehicleListType === "trip" &&
            moment(new Date(selectedTrip.departure_date)).isValid() &&
            moment(new Date(selectedTrip.departure_date)).isBefore(
              [2024, 10, 21],
              "year"
            )) ||
          (vehicleListType === "vehicle-allocation-trip" &&
            moment(new Date(selectedTrip.departure_date)).isValid() &&
            moment(new Date(selectedTrip.departure_date)).isBefore(
              [2024, 10, 21],
              "year"
            )),
        pollingInterval: 0,
        refetchOnFocus: false,
        refetchOnMountOrArgChange: false,
        refetchOnReconnect: false,
      }
    );

  const vId =
    vehicleListType === "trip" || vehicleListType === "vehicle-allocation-trip"
      ? effectiveVIdForQueries
      : accessLabel === 6
      ? getNormalOrControllerId(selectedVehicle, userId)
      : selectedVehicle.gpsDtl?.controllernum === "CONTROLLER"
      ? Number(selectedVehicle.controllermergeId)
      : effectiveVIdForQueries;

  const { currentData: pathwithDateData, isFetching: pathwithDateIsFetching } =
    useGetpathwithDateDaignosticQuery(
      {
        vId: vId,
        startDate: getStartEndDate(
          selectedTrip.departure_date,
          "start",
          "YYYY-MM-DD HH:mm",
          "date",
          vehicleListType
        ),
        endDate: getStartEndDate(
          selectedTrip.trip_complted_datebysystem,
          "end",
          "YYYY-MM-DD HH:mm",
          "date",
          vehicleListType
        ),
        userId: userId,
      },
      {
        skip:
          true ||
          !historyReplay.isHistoryReplayMode ||
          vehicleItnaryWithPath.patharry.length > 0 ||
          !groupId ||
          !userId ||
          !effectiveVIdForQueries ||
          !!dateRangeForDataFetching.startDate ||
          historyReplay.isHistoryReplayMode ||
          (vehicleListType === "trip" && selectedTrip.sys_service_id === 0) ||
          (vehicleListType === "vehicle-allocation-trip" &&
            selectedTrip.sys_service_id === 0) ||
          (vehicleListType === "trip" &&
            moment(new Date(selectedTrip.departure_date)).isValid() &&
            moment(new Date(selectedTrip.departure_date)).isBefore(
              [2024, 10, 21],
              "year"
            )) ||
          (vehicleListType === "vehicle-allocation-trip" &&
            moment(new Date(selectedTrip.departure_date)).isValid() &&
            moment(new Date(selectedTrip.departure_date)).isBefore(
              [2024, 10, 21],
              "year"
            )),
        pollingInterval: 0,
        refetchOnFocus: false,
        refetchOnMountOrArgChange: false,
        refetchOnReconnect: false,
      }
    );

  const [getPathWithDateDaignostic] = useLazyGetpathwithDateDaignosticQuery();
  const [getVehicleListItinerary] = useLazyGetItineraryvehIdBDateNwStQuery();
  const [getPathWithDateDaignosticOBD] =
    useLazyGetpathwithDateDaignosticOBDQuery();

  const getPathWithDateDaignosticAndGetVehicleListItinerary = async () => {
    if (createTripOrPlanningTripActive === "") {
      const effectiveVId =
        (vehicleListType === "trip" ||
          vehicleListType === "vehicle-allocation-trip") &&
        selectedTrip.sys_service_id
          ? selectedTrip.sys_service_id
          : selectedVehicle.vId;

      const apmkm = await apmTotalKm({
        startDate: getStartEndDate(
          selectedTrip.departure_date,
          "start",
          "YYYY-MM-DD HH:mm",
          "date",
          vehicleListType
        ),
        endDate: getStartEndDate(
          selectedTrip.trip_complted_datebysystem,
          "end",
          "YYYY-MM-DD HH:mm",
          "date",
          vehicleListType
        ),
        userId: Number(userId),
        vehicleId: Number(effectiveVId),
        parentUser: Number(parentUser),
        dispatch,
      });

      if (
        (vehicleListType === "trip" && selectedTrip.sys_service_id !== 0) ||
        (vehicleListType === "vehicle-allocation-trip" &&
          selectedTrip.sys_service_id !== 0) ||
        (selectedVehicle.vId !== 0 &&
          selectedVehicle.prevVehicleSelected !== selectedVehicle.vId) ||
        (vehicleListType === "trip" &&
          moment(new Date(selectedTrip.departure_date)).isValid() &&
          moment(new Date(selectedTrip.departure_date)).isBefore(
            [2024, 10, 21],
            "year"
          )) ||
        (vehicleListType === "vehicle-allocation-trip" &&
          moment(new Date(selectedTrip.departure_date)).isValid() &&
          moment(new Date(selectedTrip.departure_date)).isBefore(
            [2024, 10, 21],
            "year"
          ))
      ) {
        dispatch(setPrevVehicleSelected(effectiveVId));

        getVehicleListItinerary({
          userId: userId,
          vId:
            vehicleListType === "trip" ||
            vehicleListType === "vehicle-allocation-trip"
              ? effectiveVId
              : accessLabel === 6
              ? getNormalOrControllerId(selectedVehicle, userId)
              : selectedVehicle.gpsDtl?.controllernum === "CONTROLLER"
              ? Number(selectedVehicle.controllermergeId)
              : effectiveVId,
          startDate: getStartEndDate(
            selectedTrip.departure_date,
            "start",
            "YYYY-MM-DD HH:mm",
            "date",
            vehicleListType
          ),
          endDate: getStartEndDate(
            selectedTrip.trip_complted_datebysystem,
            "end",
            "YYYY-MM-DD HH:mm",
            "date",
            vehicleListType
          ),
          requestFor: 0,
        }).then(({ data: vehicleListDataArgs }) => {
          updateVehicleItnaryWithPath({
            vehicleListDataArgs: vehicleListDataArgs,
            pathwithDateDataArgs: undefined,
            vehicleItnaryWithPath: {
              ...vehicleItnaryWithPath,
              totalDistance:
                Number(userId) === 4607 || Number(parentUser) === 4607
                  ? apmkm
                  : vehicleItnaryWithPath.totalDistance,
            },
            dispatch,
            userId,
            parentUser,
            extra,
          });

          // Check if this is an OBD vehicle and call the appropriate API
          if (isOBDVehicle(selectedVehicle)) {
            setIsObdLoading(true);
            getPathWithDateDaignosticOBD({
              vId:
                vehicleListType === "trip" ||
                vehicleListType === "vehicle-allocation-trip"
                  ? effectiveVId
                  : accessLabel === 6
                  ? getNormalOrControllerId(selectedVehicle, userId)
                  : selectedVehicle.gpsDtl?.controllernum === "CONTROLLER"
                  ? Number(selectedVehicle.controllermergeId)
                  : effectiveVId,
              startdate: getStartEndDate(
                selectedTrip.departure_date,
                "start",
                "YYYY-MM-DD HH:mm",
                "date",
                vehicleListType
              ),
              enddate: getStartEndDate(
                selectedTrip.trip_complted_datebysystem,
                "end",
                "YYYY-MM-DD HH:mm",
                "date",
                vehicleListType
              ),
              requestfor: 0,
              userid: Number(userId),
            }).then(({ data: pathwithDateDataArgs }) => {
              // Store OBD data for VehicleDateOverview
              setObdData(pathwithDateDataArgs);
              setIsObdLoading(false);
              updateVehicleItnaryWithPath({
                vehicleListDataArgs: vehicleListDataArgs,
                pathwithDateDataArgs: {
                  ...pathwithDateDataArgs,
                  totalDistance:
                    Number(userId) === 4607 || Number(parentUser) === 4607
                      ? apmkm
                      : pathwithDateDataArgs
                      ? pathwithDateDataArgs.totalDistance
                      : "",
                  message: pathwithDateDataArgs
                    ? pathwithDateDataArgs.message
                    : "",
                  success: pathwithDateDataArgs
                    ? pathwithDateDataArgs.success
                    : false,
                  data: pathwithDateDataArgs
                    ? pathwithDateDataArgs.data.map((item: any) => ({
                        ...item,
                        totalTime: String(item.totalTime), // Convert number to string
                      }))
                    : [],
                  fromTime: pathwithDateDataArgs
                    ? pathwithDateDataArgs.fromTime
                    : "",
                  toTime: pathwithDateDataArgs
                    ? pathwithDateDataArgs.toTime
                    : "",
                  stoppageTime: pathwithDateDataArgs
                    ? String(pathwithDateDataArgs.stoppageTime)
                    : "",
                  runningTime: pathwithDateDataArgs
                    ? String(pathwithDateDataArgs.runningTime)
                    : "",
                  calculatedTotalDistance: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalRunningDistanceKM || 0
                    : 0,
                  totalRunningDistanceKM: pathwithDateDataArgs
                    ? String(pathwithDateDataArgs.totalRunningDistanceKM)
                    : "",
                  totalNogps: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalNogps
                    : 0,
                  totalIdledistance: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalIdledistance
                    : 0,
                  avgSpeedKMH: pathwithDateDataArgs
                    ? pathwithDateDataArgs.avgSpeedKMH
                    : 0,
                  totalStoppage: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalStoppage
                    : 0,
                  patharry: pathwithDateDataArgs
                    ? pathwithDateDataArgs.patharry
                    : [],
                  vehicleId: pathwithDateDataArgs
                    ? Number(pathwithDateDataArgs.vehicleId)
                    : 0,
                  fuelarray: [],
                  totalFuelConsumedT:
                    pathwithDateDataArgs &&
                    typeof pathwithDateDataArgs.totalFuelConsumedT === "number"
                      ? pathwithDateDataArgs.totalFuelConsumedT
                      : 0,
                  totalmileage:
                    pathwithDateDataArgs &&
                    typeof pathwithDateDataArgs.totalmileage === "string"
                      ? Number(pathwithDateDataArgs.totalmileage)
                      : 0,
                },
                vehicleItnaryWithPath: {
                  ...vehicleItnaryWithPath,
                  totalDistance:
                    Number(userId) === 4607 || Number(parentUser) === 4607
                      ? apmkm
                      : vehicleItnaryWithPath.totalDistance,
                },
                dispatch,
                userId,
                parentUser,
                extra,
              });
            });
          } else {
            getPathWithDateDaignostic({
              vId:
                vehicleListType === "trip" ||
                vehicleListType === "vehicle-allocation-trip"
                  ? effectiveVId
                  : accessLabel === 6
                  ? getNormalOrControllerId(selectedVehicle, userId)
                  : selectedVehicle.gpsDtl?.controllernum === "CONTROLLER"
                  ? Number(selectedVehicle.controllermergeId)
                  : effectiveVId,
              startDate: getStartEndDate(
                selectedTrip.departure_date,
                "start",
                "YYYY-MM-DD HH:mm",
                "date",
                vehicleListType
              ),
              endDate: getStartEndDate(
                selectedTrip.trip_complted_datebysystem,
                "end",
                "YYYY-MM-DD HH:mm",
                "date",
                vehicleListType
              ),
              userId: userId,
            }).then(({ data: pathwithDateDataArgs }) => {
              updateVehicleItnaryWithPath({
                vehicleListDataArgs: vehicleListDataArgs,
                pathwithDateDataArgs: {
                  ...pathwithDateDataArgs,
                  totalDistance:
                    Number(userId) === 4607 || Number(parentUser) === 4607
                      ? apmkm
                      : pathwithDateDataArgs
                      ? pathwithDateDataArgs.totalDistance
                      : "",
                  message: pathwithDateDataArgs
                    ? pathwithDateDataArgs.message
                    : "",
                  success: pathwithDateDataArgs
                    ? pathwithDateDataArgs.success
                    : false,
                  data: pathwithDateDataArgs ? pathwithDateDataArgs.data : [],
                  fromTime: pathwithDateDataArgs
                    ? pathwithDateDataArgs.fromTime
                    : "",
                  toTime: pathwithDateDataArgs
                    ? pathwithDateDataArgs.toTime
                    : "",
                  stoppageTime: pathwithDateDataArgs
                    ? pathwithDateDataArgs.stoppageTime
                    : "",
                  runningTime: pathwithDateDataArgs
                    ? pathwithDateDataArgs.runningTime
                    : "",
                  calculatedTotalDistance: pathwithDateDataArgs
                    ? pathwithDateDataArgs.calculatedTotalDistance
                    : 0,
                  totalRunningDistanceKM: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalRunningDistanceKM
                    : "",
                  totalNogps: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalNogps
                    : 0,
                  totalIdledistance: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalIdledistance
                    : 0,
                  avgSpeedKMH: pathwithDateDataArgs
                    ? pathwithDateDataArgs.avgSpeedKMH
                    : 0,
                  totalStoppage: pathwithDateDataArgs
                    ? pathwithDateDataArgs.totalStoppage
                    : 0,
                  patharry: pathwithDateDataArgs
                    ? pathwithDateDataArgs.patharry
                    : [],
                  vehicleId: pathwithDateDataArgs
                    ? pathwithDateDataArgs.vehicleId
                    : 0,
                  fuelarray: pathwithDateDataArgs
                    ? pathwithDateDataArgs.fuelarray
                    : [],
                  totalFuelConsumedT:
                    pathwithDateDataArgs &&
                    typeof pathwithDateDataArgs.totalFuelConsumedT === "number"
                      ? pathwithDateDataArgs.totalFuelConsumedT
                      : 0,

                  totalmileage:
                    pathwithDateDataArgs &&
                    typeof pathwithDateDataArgs.totalmileage === "number"
                      ? pathwithDateDataArgs.totalmileage
                      : 0,
                },
                vehicleItnaryWithPath: {
                  ...vehicleItnaryWithPath,
                  totalDistance:
                    Number(userId) === 4607 || Number(parentUser) === 4607
                      ? apmkm
                      : vehicleItnaryWithPath.totalDistance,
                },
                dispatch,
                userId,
                parentUser,
                extra,
              });
            });
          }
        });
      }
    }
  };

  useEffect(() => {
    if (
      !dateRangeForDataFetching.startDate &&
      effectiveVIdForQueries !== 0 &&
      (vehicleListType === "vehicle" || vehicleListType === "video")
    ) {
      getPathWithDateDaignosticAndGetVehicleListItinerary();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, historyReplay.isHistoryReplayMode]);

  useEffect(() => {
    if (
      (vehicleListType === "trip" &&
        moment(new Date(selectedTrip.departure_date)).isBefore(
          [2024, 10, 21],
          "year"
        ) === false) ||
      (vehicleListType === "vehicle-allocation-trip" &&
        moment(new Date(selectedTrip.departure_date)).isBefore(
          [2024, 10, 21],
          "year"
        ) === false)
    ) {
      getPathWithDateDaignosticAndGetVehicleListItinerary();
    } else if (
      vehicleListType === "trip" ||
      vehicleListType === "vehicle-allocation-trip"
    ) {
      dispatch(setLiveVehicleItnaryWithPath(liveVehicleInitialState));
      dispatch(setVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrip]);

  useEffect(() => {
    // Calculate effective vId for trip vehicles
    const effectiveVId =
      (vehicleListType === "trip" ||
        vehicleListType === "vehicle-allocation-trip") &&
      selectedTrip.sys_service_id
        ? selectedTrip.sys_service_id
        : selectedVehicle.vId;

    apmTotalKm({
      startDate: getStartEndDate(
        selectedTrip.departure_date,
        "start",
        "YYYY-MM-DD HH:mm",
        "date",
        vehicleListType
      ),
      endDate: getStartEndDate(
        selectedTrip.trip_complted_datebysystem,
        "end",
        "YYYY-MM-DD HH:mm",
        "date",
        vehicleListType
      ),
      userId: Number(userId),
      vehicleId: Number(effectiveVId),
      parentUser: Number(parentUser),
      dispatch,
    }).then((apmkm) => {
      updateVehicleItnaryWithPath({
        vehicleListDataArgs: vehicleListData,
        pathwithDateDataArgs: {
          ...pathwithDateData,
          totalDistance:
            Number(userId) === 4607 || Number(parentUser) === 4607
              ? apmkm
              : pathwithDateData
              ? pathwithDateData.totalDistance
              : "",
          message: pathwithDateData ? pathwithDateData.message : "",
          success: pathwithDateData ? pathwithDateData.success : false,
          data: pathwithDateData ? pathwithDateData.data : [],
          fromTime: pathwithDateData ? pathwithDateData.fromTime : "",
          toTime: pathwithDateData ? pathwithDateData.toTime : "",
          stoppageTime: pathwithDateData ? pathwithDateData.stoppageTime : "",
          runningTime: pathwithDateData ? pathwithDateData.runningTime : "",
          calculatedTotalDistance: pathwithDateData
            ? pathwithDateData.calculatedTotalDistance
            : 0,
          totalRunningDistanceKM: pathwithDateData
            ? pathwithDateData.totalRunningDistanceKM
            : "",
          totalNogps: pathwithDateData ? pathwithDateData.totalNogps : 0,
          totalIdledistance: pathwithDateData
            ? pathwithDateData.totalIdledistance
            : 0,
          avgSpeedKMH: pathwithDateData ? pathwithDateData.avgSpeedKMH : 0,
          totalStoppage: pathwithDateData ? pathwithDateData.totalStoppage : 0,
          patharry: pathwithDateData ? pathwithDateData.patharry : [],
          vehicleId: pathwithDateData ? pathwithDateData.vehicleId : 0,
          fuelarray: pathwithDateData ? pathwithDateData.fuelarray : [],
          totalFuelConsumedT:
            pathwithDateData &&
            typeof pathwithDateData.totalFuelConsumedT === "number"
              ? pathwithDateData.totalFuelConsumedT
              : 0,
          totalmileage:
            typeof pathwithDateData?.totalmileage === "number"
              ? pathwithDateData.totalmileage
              : 0,
        },
        vehicleItnaryWithPath: {
          ...vehicleItnaryWithPath,
          totalDistance:
            Number(userId) === 4607 || Number(parentUser) === 4607
              ? apmkm
              : vehicleItnaryWithPath.totalDistance,
        },
        dispatch,
        userId,
        parentUser,
        extra,
      });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleListIsFetching, pathwithDateIsFetching]);

  const isGetVehicleCurrentLocationLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getVehicleCurrentLocation" &&
        query.status === "pending"
    )
  );

  useEffect(() => {
    if (!isGetVehicleCurrentLocationLoading) {
      dispatch(setIsVehicleDetailsCollapsed(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGetVehicleCurrentLocationLoading]);

  const isDiagnosticDataPending = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getpathwithDateDaignostic" &&
        query.status === "pending"
    )
  );

  useEffect(() => {
    setVehicleDetailsUpdateTime(
      moment(new Date()).format("Do MMM, YYYY HH:mm:ss")
    );
  }, [isDiagnosticDataPending]);

  return (
    <div
      className={`ml-2 absolute py-[22px] z-20 ${visibleDetailsStyling} min-w-[450px] w-[450px] bg-white h-[calc(100vh-60px)] transition-transform duration-300`}
    >
      <div className="flex items-start justify-between px-5">
        <div className="mb-4 flex items-start justify-between gap-2 text-sm">
          <VehicleDetailsSelect selectedStyles={selectedStyles} type="" />
          {!hideVehicleHeaderTools ? (
            <div className="flex items-start justify-between gap-2.5 text-sm mt-2">
              <Tooltip title={"Expand Reports"} mouseEnterDelay={1}>
                <Image
                  src={expandReports}
                  alt="expand report icon"
                  width="20"
                  height="20"
                  className="mb-1 cursor-pointer hover:opacity-80 transition-opacity duration-300"
                  onClick={() => {
                    reportsModalState.setIsReportsExpanded(true);
                    reportsModalState.setSelectedView("Table");
                  }}
                />
              </Tooltip>

              <Tooltip title={"Proximity Locations"} mouseEnterDelay={1}>
                <PlacesDropdown />
              </Tooltip>
              <VehicleDetailsDownloadButton />
            </div>
          ) : null}
        </div>
        <Tooltip title="Close" placement="right" mouseEnterDelay={1}>
          <div
            className="mt-1 pr-1"
            onClick={() => {
              dispatch(setIsVehicleDetailsCollapsed(true));
              dispatch(
                trackingDashboard.util.invalidateTags([
                  "Vehicles-List-By-Status",
                ])
              );
              setTimeout(
                () => dispatch(setIsVehicleDetailsCollapsed(false)),
                1
              );
              dispatch(removeSelectedVehicle());
              dispatch(setIsGetNearbyVehiclesActive(false));
              if (selectedDashboardVehicle.length > 0) {
                dispatch(
                  setAllMarkers(
                    markers.map((marker) =>
                      selectedDashboardVehicle.find(
                        (selectedDashboardVehicle) =>
                          selectedDashboardVehicle.vehicleData.vId ===
                          marker.vId
                      )
                        ? { ...marker, visibility: true }
                        : { ...marker, visibility: false }
                    )
                  )
                );
              } else {
                dispatch(
                  setAllMarkers(
                    markers.map((marker) => ({ ...marker, visibility: true }))
                  )
                );
              }
              // trip system state update
              dispatch(
                setSelectedVehicleBySelectElement(initialSelectedVehicleState)
              );
              dispatch(setCreateTripOrTripPlanningActive({ type: "" }));
            }}
          >
            <CloseOutlined className="cursor-pointer" />
          </div>
        </Tooltip>
      </div>

      <div className="px-5">
        {vehicleListType === "trip" ||
        vehicleListType === "vehicle-allocation-trip" ? (
          <div className="w-[calc(100%-4px)] ml-0.5 mt-2 mb-[18px] rounded-md p-2 h-[38px] text-base bg-white">
            {selectedTrip.sys_service_id ? (
              <div className="flex justify-between px-2">
                <p>
                  {getStartEndDate(
                    selectedTrip.departure_date,
                    "start",
                    "Do MMM, YYYY HH:mm",
                    "date",
                    vehicleListType
                  )}
                </p>{" "}
                -{" "}
                <p>
                  {getStartEndDate(
                    selectedTrip.trip_complted_datebysystem,
                    "end",
                    " Do MMM, YYYY HH:mm",
                    "not touched",
                    vehicleListType
                  )}
                </p>
              </div>
            ) : (
              <div className="flex justify-between px-2 animate-pulse h-[38px] w-full bg-neutral-200"></div>
            )}
          </div>
        ) : (
          <CustomRangePicker />
        )}
      </div>
      <VehicleDateOverview
        travelTime={vehicleItnaryWithPath.runningTime || "0"}
        stoppedTime={vehicleItnaryWithPath.stoppageTime || "0"}
        distance={vehicleItnaryWithPath.totalDistance || "0"}
      />
      {selectedVehicle.gpsDtl.fuel &&
      selectedVehicle.gpsDtl.fuel <= 100 &&
      selectedVehicle.gpsDtl.port !== 31500 ? null : (
        <>
          <div className="px-6 pb-4 pt-1">
            <div className="flex items-center">
              <Image src={live} width={40} height={40} alt="Live gif" />
              <Tooltip
                title={
                  accessLabel === 6 &&
                  getLatestGPSTime(selectedVehicle) === "GPS" &&
                  selectedVehicle.GPSInfo.gps_fix === 1
                    ? selectedVehicle.GPSInfo.addr?.replaceAll("_", " ")
                    : accessLabel === 6 &&
                      getLatestGPSTime(selectedVehicle) === "GPS" &&
                      selectedVehicle.GPSInfo.gps_fix !== 1
                    ? selectedVehicle.GPSInfo.addr?.replaceAll("_", " ") ||
                      selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                        "_",
                        " "
                      ) ||
                      "No GPS Fix"
                    : accessLabel === 6 &&
                      selectedVehicle.ELOCKInfo &&
                      getLatestGPSTime(selectedVehicle) === "ELOCK" &&
                      selectedVehicle.ELOCKInfo.gps_fix === 1
                    ? selectedVehicle.ELOCKInfo.addr?.replaceAll("_", " ") ||
                      selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                        "_",
                        " "
                      )
                    : accessLabel === 6 &&
                      selectedVehicle.ELOCKInfo &&
                      getLatestGPSTime(selectedVehicle) === "ELOCK" &&
                      selectedVehicle.ELOCKInfo.gps_fix !== 1
                    ? selectedVehicle.ELOCKInfo.addr?.replaceAll("_", " ") ||
                      selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                        "_",
                        " "
                      ) ||
                      "No GPS Fix"
                    : accessLabel === 6
                    ? selectedVehicle.GPSInfo.addr?.replaceAll("_", " ") ||
                      selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                        "_",
                        " "
                      )
                    : selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                        "_",
                        " "
                      )
                }
                mouseEnterDelay={1}
              >
                <div className=" cursor-pointer font-semibold text-base">
                  {accessLabel === 6 &&
                  getLatestGPSTime(selectedVehicle) === "GPS" &&
                  selectedVehicle.GPSInfo.gps_fix === 1
                    ? (
                        selectedVehicle.GPSInfo.addr?.replaceAll("_", " ") ||
                        selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                          "_",
                          " "
                        )
                      )?.slice(0, 40)
                    : accessLabel === 6 &&
                      getLatestGPSTime(selectedVehicle) === "GPS" &&
                      selectedVehicle.GPSInfo.gps_fix !== 1
                    ? (
                        selectedVehicle.GPSInfo.addr?.replaceAll("_", " ") ||
                        selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                          "_",
                          " "
                        ) ||
                        "No GPS Fix"
                      )?.slice(0, 40)
                    : accessLabel === 6 &&
                      selectedVehicle.ELOCKInfo &&
                      getLatestGPSTime(selectedVehicle) === "ELOCK" &&
                      selectedVehicle.ELOCKInfo.gps_fix === 1
                    ? (
                        selectedVehicle.ELOCKInfo.addr?.replaceAll("_", " ") ||
                        selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                          "_",
                          " "
                        )
                      )?.slice(0, 40)
                    : accessLabel === 6 &&
                      selectedVehicle.ELOCKInfo &&
                      getLatestGPSTime(selectedVehicle) === "ELOCK" &&
                      selectedVehicle.ELOCKInfo.gps_fix !== 1
                    ? (
                        selectedVehicle.ELOCKInfo.addr?.replaceAll("_", " ") ||
                        selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                          "_",
                          " "
                        ) ||
                        "No GPS Fix"
                      )?.slice(0, 40)
                    : accessLabel === 6
                    ? (
                        selectedVehicle.GPSInfo.addr?.replaceAll("_", " ") ||
                        selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
                          "_",
                          " "
                        )
                      )?.slice(0, 40)
                    : selectedVehicle.gpsDtl.latLngDtl.addr
                        ?.replaceAll("_", " ")
                        .slice(0, 40)}
                  {selectedVehicle.gpsDtl.latLngDtl.addr?.length > 40
                    ? "..."
                    : ""}
                </div>
              </Tooltip>
            </div>
            <div className="ml-10 -mt-2 text-sm  text-neutral-500">
              Updated At:{" "}
              {accessLabel === 6 &&
              selectedVehicle.ELOCKInfo &&
              selectedVehicle.ELOCKInfo.gpstime
                ? getLatestGPSTime(selectedVehicle) === "GPS"
                  ? selectedVehicle.GPSInfo?.gpstime
                  : selectedVehicle.ELOCKInfo?.gpstime
                : selectedVehicle.gpsDtl?.latLngDtl?.gpstime ||
                  moment(new Date()).format("Do MMM, YYYY HH:mm")}
            </div>
          </div>

          <hr />
        </>
      )}

      {selectedVehicle.gpsDtl.fuel &&
      selectedVehicle.gpsDtl.fuel <= 100 &&
      Number(userId) !== 833193 &&
      selectedVehicle.gpsDtl.port !== 31500 ? (
        <div className="mt-2">
          <VehicleDetailsOverview
            data={vehicleItnaryWithPath}
            view="VehicleDetails"
          />
        </div>
      ) : (
        <div className="px-5 mt-2">
          <VehicleHistoryTabs
            data={vehicleItnaryWithPath}
            view="VehicleDetails"
          />
        </div>
      )}
    </div>
  );
};
