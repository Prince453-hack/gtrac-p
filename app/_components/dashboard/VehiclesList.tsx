"use client";

export const revalidate = 0;

import {
  setIsLoadingScreenActive,
  toggleRefetchVehicleListMob,
} from "@/app/_globalRedux/dashboard/mapSlice";
import {
  setAllMarkers,
  updateMarkersBasedOnStatus,
} from "@/app/_globalRedux/dashboard/markersSlice";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetVehiclesByStatusQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import {
  GetListVehiclesMobResponse,
  VehicleData,
} from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { DownloadOutlined } from "@ant-design/icons";
import { Skeleton, Tooltip } from "antd";
import moment from "moment";
import {
  LegacyRef,
  MutableRefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { useDispatch, useSelector } from "react-redux";
import { DownloadReportsModal } from "../common";
import { DownloadReportTs } from "../common/CustomTableN";
import { getGPSOrElock } from "./utils/getNormalOrControllerId";
import { VehicleOverviewCard } from "./VehicleOverviewCard";
import { VehicleOverviewCardSkeleton } from "./VehicleOverviewCardSkeleton";
import { LiveOn, LiveOff } from "@/public/assets/svgs/nav";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ecolocation from "@/app/constant/ecolocation.json";

export const VehiclesList = ({
  selectedVehicleStatus,
}: {
  selectedVehicleStatus: string;
}) => {
  const {
    userId,
    groupId,
    parentUser: pUserId,
    accessLabel,
  } = useSelector((state: RootState) => state.auth);
  const markers = useSelector((state: RootState) => state.markers);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle,
  );
  const selectedVehicleListTab = useSelector(
    (state: RootState) => state.selectedVehicleListTab,
  );
  const { mapYourVehicleIndex, driverInfoIndex, createPOIIndex } = useSelector(
    (state: RootState) => state.vehicleOverviewOptions,
  );
  const { refetchVehicleListMob } = useSelector(
    (state: RootState) => state.map,
  );
  const onlyVideoEnabled = useSelector(
    (state: RootState) => state.videoFilter.onlyVideoEnabled,
  );
  const onlyFuelEnabled = useSelector(
    (state: RootState) => state.fuelFilter.onlyFuelEnabled,
  );
  const onlyControllerVehicles = useSelector(
    (state: RootState) => state.elockFilter.onlyControllerVehicles,
  );
  const onlyTicketEnabled = useSelector(
    (state: RootState) => state.ticketStatus.onlyTicketEnabled,
  );

  const [currentPage, setCurrentPage] = useState(10);
  const [isLiveOn, setIsLiveOn] = useState(true);
  const dispatch = useDispatch();

  // Simple approach: store Live state in window object for global access
  useEffect(() => {
    (window as any).isLiveOn = isLiveOn;
  }, [isLiveOn]);

  const [ref, inView] = useInView({
    threshold: 0,
  });

  const { isFetching: isFetchingVehicle, data: vehicleData } =
    useGetVehiclesByStatusQuery(
      {
        userId,
        token: groupId,
        pUserId,
        mode:
          selectedVehicleStatus === "all"
            ? ""
            : selectedVehicleStatus === "inpoi" ||
                selectedVehicleStatus === "Unhealthy" ||
                selectedVehicleStatus === "non active" ||
                selectedVehicleStatus === "not working"
              ? selectedVehicleStatus === "non active" ||
                selectedVehicleStatus === "not working"
                ? ""
                : selectedVehicleStatus
              : selectedVehicleStatus.toUpperCase(),
      },
      {
        skip:
          !groupId ||
          !userId ||
          selectedVehicle.vId !== 0 ||
          selectedDashboardVehicle.length > 0 ||
          mapYourVehicleIndex !== -1 ||
          driverInfoIndex !== -1 ||
          createPOIIndex !== -1,
        refetchOnMountOrArgChange: true,
        pollingInterval: 3000000,
      },
    );
  const [triggerRefetchOfVehicleListBasedOnTabSelected] =
    useLazyGetVehiclesByStatusQuery();

  let sortedData: MutableRefObject<GetListVehiclesMobResponse | undefined> =
    useRef();

  const getLastReceivedTime = (vehicle: VehicleData) => {
    // Use the gpstime from latLngDtl object as shown in the data structure
    const gpsTimeString = vehicle.gpsDtl?.latLngDtl?.gpstime;

    if (!gpsTimeString) {
      // Return a very old date for vehicles without GPS time
      return moment("1900-01-01");
    }

    let parsedTime = moment(gpsTimeString, "DD MMMM YYYY HH:mm");

    if (!parsedTime.isValid()) {
      parsedTime = moment(gpsTimeString, [
        "DD-MM-YYYY HH:mm",
        "YYYY-MM-DD HH:mm:ss",
        "DD/MM/YYYY HH:mm",
      ]);
    }

    if (!parsedTime.isValid()) {
      return moment("1900-01-01");
    }

    return parsedTime;
  };

  const isVehicleRunning = (vehicle: VehicleData) => {
    return vehicle.gpsDtl.mode?.toLowerCase() === "running";
  };

  const hasFuelData = (v: VehicleData) =>
    Boolean(v.gpsDtl.fuel && v.gpsDtl.fuel <= 100);

  const hasDashcamData = (v: VehicleData) =>
    Boolean(
      v.gpsDtl.model &&
      (!isNaN(Number(v.gpsDtl.model)) || v.gpsDtl.model.includes("##BSJ")),
    );

  const hasControllerData = (v: VehicleData) =>
    v.gpsDtl?.controllernum === "CONTROLLER";

  const hasTicketStatus = (v: VehicleData) =>
    v.gpsDtl.ticket_status !== null &&
    v.gpsDtl.ticket_status !== undefined &&
    v.gpsDtl.ticket_status !== "Service Completed";

  const sortByRunningStatusAndTime = (
    vehicle1: VehicleData,
    vehicle2: VehicleData,
  ) => {
    const runningDiff =
      Number(isVehicleRunning(vehicle2)) - Number(isVehicleRunning(vehicle1));
    if (runningDiff !== 0) return runningDiff;

    return (
      getLastReceivedTime(vehicle2).valueOf() -
      getLastReceivedTime(vehicle1).valueOf()
    );
  };

  const updateStatesOnData = (data: GetListVehiclesMobResponse) => {
    if (data && data.message !== "Something wrong happend") {
      let tempData;

      let filteredVehicles = data.list.filter(
        (vehicle) => vehicle.vId !== null,
      );

      if (selectedVehicleStatus === "non active") {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) =>
            vehicle.gpsDtl.inactiveStatus === 1 ||
            vehicle.gpsDtl.inactiveStatus === "1",
        );
      }

      if (selectedVehicleStatus === "not working") {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) => vehicle.gpsDtl.mode === "NOT WORKING",
        );
      }

      if (onlyFuelEnabled) {
        filteredVehicles = filteredVehicles.filter(hasFuelData);
      }
      if (onlyVideoEnabled) {
        filteredVehicles = filteredVehicles.filter(hasDashcamData);
      }
      if (onlyControllerVehicles) {
        filteredVehicles = filteredVehicles.filter(hasControllerData);
      }
      if (onlyTicketEnabled) {
        filteredVehicles = filteredVehicles.filter(hasTicketStatus);
      }

      const sortFunction =
        selectedVehicleListTab === "stopped"
          ? (vehicle1: VehicleData, vehicle2: VehicleData) => {
              const getHours = (v: VehicleData) => {
                const parts = v.gpsDtl.modeTimeFormat?.split(":") || ["0", "0"];
                return Number(parts[0]) + Number(parts[1]) / 60;
              };
              return getHours(vehicle2) - getHours(vehicle1);
            }
          : sortByRunningStatusAndTime;

      tempData = filteredVehicles.slice().sort(sortFunction);
      sortedData.current = { ...data, list: tempData };
    }

    if (
      data &&
      Array.isArray(data.list) &&
      markers.length === 0 &&
      sortedData.current
    ) {
      dispatch(
        setAllMarkers(
          sortedData.current.list.map((vehicle) => ({
            ...vehicle,
            visibility: true,
            isMarkerInfoWindowOpen: false,
          })),
        ),
      );
    } else if (
      data &&
      Array.isArray(data.list) &&
      markers.length &&
      sortedData.current
    ) {
      dispatch(
        updateMarkersBasedOnStatus(
          sortedData.current.list.map((vehicle) =>
            markers.find((marker) => marker.vId === vehicle.vId)
              ? { ...vehicle, visibility: true, isMarkerInfoWindowOpen: false }
              : {
                  ...vehicle,
                  visibility: false,
                  isMarkerInfoWindowOpen: false,
                },
          ),
        ),
      );
    } else {
      dispatch(
        setAllMarkers(
          markers.map((marker) => ({ ...marker, visibility: false })),
        ),
      );
    }
  };

  useEffect(() => {
    if (inView) {
      setTimeout(() => setCurrentPage((prev) => prev + 10), 2000);
    }
  }, [inView]);

  useEffect(() => {
    vehicleData && updateStatesOnData(vehicleData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleData]);

  // Re-sort data when fuel, video, or elock filters change
  useEffect(() => {
    if (vehicleData) {
      updateStatesOnData(vehicleData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onlyFuelEnabled,
    onlyVideoEnabled,
    onlyControllerVehicles,
    onlyTicketEnabled,
  ]);

  useEffect(() => {
    if (refetchVehicleListMob) {
      triggerRefetchOfVehicleListBasedOnTabSelected({
        userId,
        token: groupId,
        pUserId: pUserId,
        mode:
          selectedVehicleListTab.toUpperCase() === "ALL" ||
          selectedVehicleListTab.toUpperCase() === "NON ACTIVE" ||
          selectedVehicleListTab.toUpperCase() === "NOT WORKING"
            ? ""
            : selectedVehicleListTab.toUpperCase(),
      }).then(({ data }) => {
        if (data) updateStatesOnData(data);
        dispatch(toggleRefetchVehicleListMob(false));
      });
    }
  }, [refetchVehicleListMob]);

  const [updatedVehicleIndex, setUpdatedVehicleIndex] = useState(0);

  useEffect(() => {
    if (markers.length && selectedVehicle.vId !== 0 && sortedData.current) {
      const updatedVehicle = markers.find(
        (marker) => marker.vId === selectedVehicle.vId,
      );

      if (!updatedVehicle) return;

      sortedData.current = {
        ...vehicleData,
        list: [
          ...sortedData.current.list.map((sortedVehicle) =>
            sortedVehicle.vId === updatedVehicle.vId
              ? { ...updatedVehicle }
              : { ...sortedVehicle },
          ),
        ],
        message: "",
        success: true,
      };
    } else if (
      markers.length &&
      selectedVehicle.vId === 0 &&
      sortedData.current &&
      selectedDashboardVehicle.length &&
      updatedVehicleIndex < selectedDashboardVehicle.length
    ) {
      const updatedVehicle = markers.find(
        (marker) =>
          marker.vId ===
          selectedDashboardVehicle[updatedVehicleIndex].vehicleData.vId,
      );

      if (!updatedVehicle) return;

      sortedData.current = {
        ...vehicleData,
        list: [
          ...sortedData.current.list.map((sortedVehicle) =>
            sortedVehicle.vId === updatedVehicle.vId
              ? { ...updatedVehicle }
              : { ...sortedVehicle },
          ),
        ],
        message: "",
        success: true,
      };
    }

    if (updatedVehicleIndex < selectedDashboardVehicle.length - 1) {
      setUpdatedVehicleIndex((prev) => prev + 1);
    } else {
      setUpdatedVehicleIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, selectedDashboardVehicle]);

  const isFetching = isFetchingVehicle;

  if (isFetching) {
    return (
      <WrapperComponent
        refs={ref}
        isFetching={isFetching}
        isLiveOn={isLiveOn}
        setIsLiveOn={setIsLiveOn}
      >
        <VehicleOverviewCardSkeleton />
      </WrapperComponent>
    );
  }

  return (
    <WrapperComponent
      refs={ref}
      currentPage={currentPage}
      list={sortedData.current?.list || []}
      isFetching={isFetching}
      isLiveOn={isLiveOn}
      setIsLiveOn={setIsLiveOn}
    >
      {sortedData.current && selectedDashboardVehicle.length
        ? sortedData.current.list
            .filter((vehicle) =>
              selectedDashboardVehicle.find(
                (v) => v.vehicleData.vId === vehicle.vId,
              ),
            )
            .slice(0, currentPage)
            .map((vehicle) => (
              <span key={vehicle.vId}>
                <VehicleOverviewCard vehicleData={vehicle} />
              </span>
            ))
        : sortedData.current
          ? sortedData.current.list.slice(0, currentPage).map((vehicle) => (
              <span key={vehicle.vId}>
                <VehicleOverviewCard vehicleData={vehicle} />
              </span>
            ))
          : "No Vehicle Found"}
    </WrapperComponent>
  );
};

const WrapperComponent = ({
  children,
  refs,
  currentPage,
  list,
  isFetching,
  isLiveOn,
  setIsLiveOn,
}: {
  children: ReactNode;
  refs: LegacyRef<HTMLDivElement>;
  currentPage?: number;
  list?: VehicleData[] | [];
  isFetching: boolean;
  isLiveOn?: boolean;
  setIsLiveOn?: (value: boolean) => void;
}) => {
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseVehicleStatusToggle,
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle,
  );
  const markers = useSelector((state: RootState) => state.markers);
  const selectedVehicleListTab = useSelector(
    (state: RootState) => state.selectedVehicleListTab,
  );
  const { accessLabel, userId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  );
  const [vehicleCountPercentage, setVehicleCountPercentage] = useState({
    all: 0,
    inGeofence: 0,
    outsideGeofence: 0,
  });

  useEffect(() => {
    if (markers) {
      const allVehicles = markers.length;
      const inPoiVehicles = markers.filter((marker) =>
        marker.gpsDtl.latLngDtl.poi
          ? marker.gpsDtl.latLngDtl.poi?.replaceAll("_", " ") === "Inside POI"
          : false,
      ).length;
      const outsideGeofenceVehicles = allVehicles - inPoiVehicles;

      const inGeofencePercentage = Math.round(
        (inPoiVehicles / allVehicles) * 100,
      );
      const outsideGeofencePercentage = Math.round(
        (outsideGeofenceVehicles / allVehicles) * 100,
      );
      const allVehiclesPercentage = Math.round(
        (allVehicles / allVehicles) * 100,
      );

      setVehicleCountPercentage({
        all: allVehiclesPercentage,
        inGeofence: inGeofencePercentage,
        outsideGeofence: outsideGeofencePercentage,
      });
    }
  }, [markers]);
  const [updateDate, setUpdateDate] = useState("0");

  const dispatch = useDispatch();

  useEffect(() => {
    if (isFetching) {
      dispatch(setIsLoadingScreenActive(true));
      setUpdateDate(moment().format("HH:mm:ss"));
    } else {
      dispatch(setIsLoadingScreenActive(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching]);

  const [downloadReport, setDownloadReport] = useState<
    DownloadReportTs | undefined
  >();
  const { type: VehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive,
  );

  return (
    <div className="bg-white relative">
      <div className={`flex items-center justify-between px-5`}>
        <p className="text-gray-600 font-semibold pl-2 text-[13px]">
          {isCheckInAccount(Number(userId))
            ? "Check-In"
            : VehicleListType === "trip" ||
                VehicleListType === "vehicle-allocation-trip"
              ? "Trips"
              : "Vehicles"}{" "}
          Count:{" "}
          {selectedDashboardVehicle.length
            ? selectedDashboardVehicle.length
            : list && list.length}
        </p>

        <div className="flex items-center pr-2">
          {selectedDashboardVehicle.length !== 0 && accessLabel !== 6 ? (
            <div
              className="cursor-pointer mr-[10px] flex items-center"
              onClick={() => setIsLiveOn && setIsLiveOn(!isLiveOn)}
            >
              <Image
                src={isLiveOn ? LiveOn : LiveOff}
                alt={isLiveOn ? "Live On" : "Live Off"}
                className={cn("w-[60px] h-[28px]", isLiveOn && "animate-pulse")}
                width={60}
                height={28}
                draggable={false}
              />
            </div>
          ) : (
            <div className="text-[13px] text-gray-600 font-semibold flex">
              <div>Updated At: </div>
              {isFetching || updateDate === "0" ? (
                <div className="w-[65px] pl-[5px]">
                  <div className="lds-ring ml-[2.5px]">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              ) : (
                <div className="w-[65px] text-nowrap ml-[3px]">
                  {" "}
                  {updateDate}
                </div>
              )}
            </div>
          )}
          {isCheckInAccount(Number(userId)) ? null : (
            <div
              className={`bg-gray-600 h-[22px] w-[22px] flex justify-center items-center rounded-full  ${
                isFetching || updateDate === "0"
                  ? "cursor-progress"
                  : "cursor-pointer"
              }`}
            >
              <Tooltip
                title={`Download Selected Vehicle Report`}
                mouseEnterDelay={1}
              >
                <DownloadOutlined
                  style={{ color: "#F2F5F3" }}
                  disabled={isFetching || updateDate === "0"}
                  onClick={() => {
                    try {
                      if (list && list.length > 0) {
                        const isUser6258 = Number(userId) === 6258;

                        const locationMap: Record<string, string> = {};

                        if (isUser6258) {
                          (ecolocation as any[]).forEach((entry) => {
                            const reg = entry["VehicleNo."]
                              ?.toString()
                              .trim()
                              .toUpperCase();
                            if (reg) {
                              locationMap[reg] =
                                (entry as any).LOCATION?.toString().trim() ||
                                "";
                            }
                          });
                        }

                        const getBatteryStatusForUser833188 = (item: any) => {
                          if (Number(userId) !== 833188) {
                            return null;
                          }
                          const alcoholLevel = item.gpsDtl.alcoholLevel;
                          if (!alcoholLevel && alcoholLevel !== 0) {
                            return "NA";
                          }
                          const numericValue = Math.floor(Number(alcoholLevel));
                          if (isNaN(numericValue)) {
                            return "NA";
                          }

                          if (numericValue === 0) {
                            return "0%";
                          }

                          // Apply the mapping logic
                          if (numericValue > 65) {
                            return "100%";
                          } else if (numericValue < 55) {
                            return "0%";
                          } else {
                            const batteryPercentage = Math.round(
                              ((numericValue - 55) / (65 - 55)) * 100,
                            );
                            return `${batteryPercentage}%`;
                          }
                        };

                        let rows: any[] = list.map((item, index) => {
                          const deviceStatus =
                            item?.ELOCKInfo?.Unhealthy?.data?.[0] === 1
                              ? "Unhealthy"
                              : "Healthy";
                          const deviceStatusDescrription =
                            item?.ELOCKInfo?.UnhealthyDesc ?? "";

                          const ltcObj = {
                            "Device Status": deviceStatus,
                            "Device Status Description":
                              deviceStatusDescrription,
                          };

                          // Add battery status for user 833188
                          const batteryStatusObj =
                            Number(userId) === 833188
                              ? {
                                  "Battery Status":
                                    getBatteryStatusForUser833188(item),
                                }
                              : {};

                          // Add Locked/Unlocked column for elock vehicles
                          const isElockVehicle =
                            item.gpsDtl.controllernum === "CONTROLLER";
                          const elockStatusObj =
                            accessLabel === 6 && isElockVehicle
                              ? {
                                  "Locked/Unlocked":
                                    item.gpsDtl.acState === "Off"
                                      ? "Locked"
                                      : item.gpsDtl.acState === "On"
                                        ? "Unlocked"
                                        : "",
                                }
                              : {
                                  "Locked/Unlocked": "",
                                };

                          const nonActiveObj =
                            selectedVehicleListTab.toLowerCase() === "all" ||
                            selectedVehicleListTab.toLowerCase() ===
                              "non active"
                              ? {
                                  "Non Active":
                                    item.gpsDtl.inactiveStatus === 1 ||
                                    item.gpsDtl.inactiveStatus === "1"
                                      ? item.gpsDtl.inactiveReason ||
                                        "Non Active"
                                      : "",
                                }
                              : {};

                          const vehicleRegKey =
                            item.vehReg?.toString().trim().toUpperCase() || "";

                          const locationObj =
                            isUser6258 && vehicleRegKey
                              ? {
                                  Location:
                                    locationMap[vehicleRegKey] !== undefined
                                      ? locationMap[vehicleRegKey]
                                      : "",
                                }
                              : {};

                          return {
                            "S. No.": index + 1,
                            "Vehicle No.": item.vehReg,
                            "Location Name":
                              item.gpsDtl.latLngDtl.addr?.replaceAll("_", " "),
                            "Last Update":
                              accessLabel === 6
                                ? getGPSOrElock(item) === "GPS"
                                  ? item?.gpsDtl?.latLngDtl.gpstime
                                    ? moment(
                                        item.gpsDtl.latLngDtl.gpstime,
                                        "DD MMMM YYYY HH:mm",
                                      ).format("DD-MM-YYYY HH:mm")
                                    : ""
                                  : item?.ELOCKInfo?.gpstime
                                    ? moment(
                                        item.ELOCKInfo.gpstime,
                                        "DD MMMM YYYY HH:mm",
                                      ).format("DD-MM-YYYY HH:mm")
                                    : ""
                                : item.gpsDtl.latLngDtl.gpstime
                                  ? moment(
                                      item.gpsDtl.latLngDtl.gpstime,
                                      "DD MMMM YYYY HH:mm",
                                    ).format("DD-MM-YYYY HH:mm")
                                  : "",
                            "Halting Time": item.gpsDtl.HaltingInHRS,
                            Speed: item.gpsDtl.speed,
                            Status: item.gpsDtl.mode,
                            Destination: item.vehicleTrip.sys_service_id
                              ? item.vehicleTrip.station_to_location
                              : "",
                            [Number(userId) === 87364 ||
                            Number(parentUser) === 87364
                              ? "Nearest Geofence"
                              : "Nearest POI"]: item.gpsDtl.latLngDtl.poi
                              ? item.gpsDtl.latLngDtl.poi
                              : "",

                            ...ltcObj,
                            ...batteryStatusObj,
                            ...elockStatusObj,
                            ...nonActiveObj,
                            ...locationObj,
                          };
                        });

                        if (
                          selectedVehicleListTab.toLowerCase() === "running"
                        ) {
                          rows = list.map((item, index) => {
                            const deviceStatus =
                              item?.ELOCKInfo?.Unhealthy?.data?.[0] === 1
                                ? "Unhealthy"
                                : "Healthy";
                            const deviceStatusDescrription =
                              item?.ELOCKInfo?.UnhealthyDesc ?? "";

                            const ltcObj = {
                              "Device Status": deviceStatus,
                              "Device Status Description":
                                deviceStatusDescrription,
                            };

                            // Add battery status for user 833188
                            const batteryStatusObj =
                              Number(userId) === 833188
                                ? {
                                    "Battery Status":
                                      getBatteryStatusForUser833188(item),
                                  }
                                : {};

                            // Add Locked/Unlocked column for elock vehicles
                            const isElockVehicle =
                              item.gpsDtl.controllernum === "CONTROLLER";
                            const elockStatusObj =
                              accessLabel === 6 && isElockVehicle
                                ? {
                                    "Locked/Unlocked":
                                      item.gpsDtl.acState === "Off"
                                        ? "Locked"
                                        : item.gpsDtl.acState === "On"
                                          ? "Unlocked"
                                          : "",
                                  }
                                : {
                                    "Locked/Unlocked": "",
                                  };

                            const vehicleRegKey =
                              item.vehReg?.toString().trim().toUpperCase() ||
                              "";

                            const locationObj =
                              isUser6258 && vehicleRegKey
                                ? {
                                    Location:
                                      locationMap[vehicleRegKey] !== undefined
                                        ? locationMap[vehicleRegKey]
                                        : "",
                                  }
                                : {};

                            return {
                              "S. No.": index + 1,
                              "Vehicle No.": item.vehReg,
                              "Location Name":
                                item.gpsDtl.latLngDtl.addr?.replaceAll(
                                  "_",
                                  " ",
                                ),
                              "Last Running Time":
                                accessLabel === 6
                                  ? getGPSOrElock(item) === "GPS"
                                    ? item?.gpsDtl?.latLngDtl.gpstime
                                      ? moment(
                                          item.gpsDtl.latLngDtl.gpstime,
                                          "DD MMMM YYYY HH:mm",
                                        ).format("DD-MM-YYYY HH:mm")
                                      : ""
                                    : item?.ELOCKInfo?.gpstime
                                      ? moment(
                                          item.ELOCKInfo.gpstime,
                                          "DD MMMM YYYY HH:mm",
                                        ).format("DD-MM-YYYY HH:mm")
                                      : ""
                                  : item.gpsDtl.latLngDtl.gpstime
                                    ? moment(
                                        item.gpsDtl.latLngDtl.gpstime,
                                        "DD MMMM YYYY HH:mm",
                                      ).format("DD-MM-YYYY HH:mm")
                                    : "",
                              "Halting Time": item.gpsDtl.HaltingInHRS,
                              Speed: item.gpsDtl.speed,
                              [Number(userId) === 87364 ||
                              Number(parentUser) === 87364
                                ? "Nearest Geofence"
                                : "Nearest POI"]: item.gpsDtl.latLngDtl.poi
                                ? item.gpsDtl.latLngDtl.poi
                                : "",

                              ...ltcObj,
                              ...batteryStatusObj,
                              ...elockStatusObj,
                              ...locationObj,
                            };
                          });
                        } else if (
                          selectedVehicleListTab.toLowerCase() === "inpoi"
                        ) {
                          rows = list.map((item, index) => {
                            const deviceStatus =
                              item?.ELOCKInfo?.Unhealthy?.data?.[0] === 1
                                ? "Unhealthy"
                                : "Healthy";
                            const deviceStatusDescrription =
                              item?.ELOCKInfo?.UnhealthyDesc ?? "";

                            const ltcObj = {
                              "Device Status": deviceStatus,
                              "Device Status Description":
                                deviceStatusDescrription,
                            };

                            // Add battery status for user 833188
                            const batteryStatusObj =
                              Number(userId) === 833188
                                ? {
                                    "Battery Status":
                                      getBatteryStatusForUser833188(item),
                                  }
                                : {};

                            // Add Locked/Unlocked column for elock vehicles
                            const isElockVehicle =
                              item.gpsDtl.controllernum === "CONTROLLER";
                            const elockStatusObj =
                              accessLabel === 6 && isElockVehicle
                                ? {
                                    "Locked/Unlocked":
                                      item.gpsDtl.acState === "Off"
                                        ? "Locked"
                                        : item.gpsDtl.acState === "On"
                                          ? "Unlocked"
                                          : "",
                                  }
                                : {
                                    "Locked/Unlocked": "",
                                  };

                            const vehicleRegKey =
                              item.vehReg?.toString().trim().toUpperCase() ||
                              "";

                            const locationObj =
                              isUser6258 && vehicleRegKey
                                ? {
                                    Location:
                                      locationMap[vehicleRegKey] !== undefined
                                        ? locationMap[vehicleRegKey]
                                        : "",
                                  }
                                : {};

                            return {
                              "S. No.": index + 1,
                              "Vehicle No.": item.vehReg,
                              [Number(userId) === 87364 ||
                              Number(parentUser) === 87364
                                ? "Geofence Name"
                                : "POI Name"]: item.gpsDtl.latLngDtl.addr
                                ? item.gpsDtl.latLngDtl.addr
                                : "",
                              "Last Update":
                                accessLabel === 6
                                  ? getGPSOrElock(item) === "GPS"
                                    ? item?.gpsDtl?.latLngDtl.gpstime
                                      ? moment(
                                          item.gpsDtl.latLngDtl.gpstime,
                                          "DD MMMM YYYY HH:mm",
                                        ).format("DD-MM-YYYY HH:mm")
                                      : ""
                                    : item?.ELOCKInfo?.gpstime
                                      ? moment(
                                          item.ELOCKInfo.gpstime,
                                          "DD MMMM YYYY HH:mm",
                                        ).format("DD-MM-YYYY HH:mm")
                                      : ""
                                  : item.gpsDtl.latLngDtl.gpstime
                                    ? moment(
                                        item.gpsDtl.latLngDtl.gpstime,
                                        "DD MMMM YYYY HH:mm",
                                      ).format("DD-MM-YYYY HH:mm")
                                    : "",
                              "Halted Since": item.gpsDtl.hatledSince,

                              ...ltcObj,
                              ...batteryStatusObj,
                              ...elockStatusObj,
                              ...locationObj,
                            };
                          });
                        } else if (
                          selectedVehicleListTab.toLowerCase() === "idle"
                        ) {
                          rows = list.map((item, index) => {
                            const deviceStatus =
                              item?.ELOCKInfo?.Unhealthy?.data?.[0] === 1
                                ? "Unhealthy"
                                : "Healthy";
                            const deviceStatusDescrription =
                              item?.ELOCKInfo?.UnhealthyDesc ?? "";

                            const ltcObj = {
                              "Device Status": deviceStatus,
                              "Device Status Description":
                                deviceStatusDescrription,
                            };

                            const batteryStatusObj =
                              Number(userId) === 833188
                                ? {
                                    "Battery Status":
                                      getBatteryStatusForUser833188(item),
                                  }
                                : {};

                            const isElockVehicle =
                              item.gpsDtl.controllernum === "CONTROLLER";
                            const elockStatusObj =
                              accessLabel === 6 && isElockVehicle
                                ? {
                                    "Locked/Unlocked":
                                      item.gpsDtl.acState === "Off"
                                        ? "Locked"
                                        : item.gpsDtl.acState === "On"
                                          ? "Unlocked"
                                          : "",
                                  }
                                : {
                                    "Locked/Unlocked": "",
                                  };

                            const vehicleRegKey =
                              item.vehReg?.toString().trim().toUpperCase() ||
                              "";

                            const locationObj =
                              isUser6258 && vehicleRegKey
                                ? {
                                    Location:
                                      locationMap[vehicleRegKey] !== undefined
                                        ? locationMap[vehicleRegKey]
                                        : "",
                                  }
                                : {};

                            return {
                              "S. No.": index + 1,
                              "Vehicle No.": item.vehReg,
                              "Location Name":
                                item.gpsDtl.latLngDtl.addr?.replaceAll(
                                  "_",
                                  " ",
                                ),
                              "Last Running Time":
                                accessLabel === 6
                                  ? getGPSOrElock(item) === "GPS"
                                    ? item?.gpsDtl?.latLngDtl.gpstime
                                      ? moment(
                                          item.gpsDtl.latLngDtl.gpstime,
                                          "DD MMMM YYYY HH:mm",
                                        ).format("DD-MM-YYYY HH:mm")
                                      : ""
                                    : item?.ELOCKInfo?.gpstime
                                      ? moment(
                                          item.ELOCKInfo.gpstime,
                                          "DD MMMM YYYY HH:mm",
                                        ).format("DD-MM-YYYY HH:mm")
                                      : ""
                                  : item.gpsDtl.latLngDtl.gpstime
                                    ? moment(
                                        item.gpsDtl.latLngDtl.gpstime,
                                        "DD MMMM YYYY HH:mm",
                                      ).format("DD-MM-YYYY HH:mm")
                                    : "",
                              "Halting Time": item.gpsDtl.HaltingInHRS,
                              "Halted Since": item.gpsDtl.hatledSince,
                              [Number(userId) === 87364 ||
                              Number(parentUser) === 87364
                                ? "Nearest Geofence"
                                : "Nearest POI"]: item.gpsDtl.latLngDtl.poi
                                ? item.gpsDtl.latLngDtl.poi
                                : "",
                              ...ltcObj,
                              ...batteryStatusObj,
                              ...elockStatusObj,
                              ...locationObj,
                            };
                          });
                        }
                        const head = Object.keys(rows[0]);

                        const body = rows.map((row) => Object.values(row));

                        let columnsStyles: any = {};

                        body[0].map((value: any, index) => {
                          columnsStyles[index] = {
                            cellWidth: value.toString().length > 10 ? 50 : 20,
                          };
                        });

                        setDownloadReport({
                          title: "Vehicle Report",
                          excel: { title: "Vehicle Report", rows, footer: [] },
                          pdf: {
                            head: [head],
                            body: body,
                            title: "Vehicle Report",
                            pageSize: "a3",
                            userOptions: {
                              columnStyles: columnsStyles,
                            },
                          },
                        });
                      }
                    } catch (error) {
                      console.error("Error downloading vehicle report:", error);
                      alert("Error generating report. Please try again.");
                    }
                  }}
                />
              </Tooltip>
              <DownloadReportsModal
                downloadReport={downloadReport}
                setDownloadReport={setDownloadReport}
              />
            </div>
          )}
        </div>
      </div>
      {Number(userId) == 87364 || Number(parentUser) == 87364 ? (
        <div className=" text-gray-600 text-[13px] ml-[18px] mr-[26px]  rounded-md bg-white  py-2 mt-2 mb-1">
          <p className="mx-5">
            <span className="font-semibold">Inside Geofence: </span>
            {vehicleCountPercentage.inGeofence}% |{" "}
            <span className="font-semibold">Outside Geofence: </span>
            {vehicleCountPercentage.outsideGeofence}%
          </p>
        </div>
      ) : null}
      <div
        className={`${
          Number(userId) == 87364 || Number(parentUser) == 87364
            ? "h-[calc(100vh-230px)]"
            : "h-[calc(100vh-185px)]"
        } bg-white top-0 p-4 pt-0 scrollbar-thumb-thumb-green scrollbar-w-2  scrollbar-thumb-rounded-md scrollbar overflow-visible ${
          collapseVehicleStatusToggle ? "opacity-0" : "overflow-y-scroll"
        }`}
      >
        {children}
        {currentPage && list && selectedVehicle.searchType !== "GLOBAL" ? (
          <div className=" w-full px-4 my-4" ref={refs}>
            {selectedDashboardVehicle.length ? (
              currentPage < selectedDashboardVehicle.length
            ) : currentPage < list.length ? (
              <Skeleton className="pt-5" active />
            ) : (
              ""
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
