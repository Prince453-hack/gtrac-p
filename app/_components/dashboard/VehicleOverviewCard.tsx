"use client";

import { setVehicleDetailsStatus } from "@/app/_globalRedux/dashboard/isVehicleStatusOrTripStatusActive";
import { setLiveVehicleItnaryWithPath } from "@/app/_globalRedux/dashboard/liveVehicleSlice";
import { setOpenStoppageIndex } from "@/app/_globalRedux/dashboard/mapSlice";
import { setRadiusInKilometers } from "@/app/_globalRedux/dashboard/nearbyVehicleSlice";
import {
  setDriverInfoIndex,
  setOptionsIndex,
} from "@/app/_globalRedux/dashboard/optionsSlice";
import { addRecentlyClickedVehicle } from "@/app/_globalRedux/dashboard/recentlyClickedVehiclesSlice";
import { setSelectedVehicleCustomRange } from "@/app/_globalRedux/dashboard/selectedVehicleCustomRangeSlice";
import {
  setNearbyVehicles,
  setSelectedVehicleStatus,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import {
  setVehicleItnaryWithPath,
  vehicleItnaryWithPathInitialState,
} from "@/app/_globalRedux/dashboard/vehicleItnaryWithPathSlice";
import { setSelectedVehicleDeviceId } from "@/app/_globalRedux/dashboard/videoTelematics";
import { useGetAmbulanceEmployeesQuery } from "@/app/_globalRedux/services/ambulancetracking";
import { useIndiaGetMettaxDeviceShadowMutation } from "@/app/_globalRedux/services/indiaMettax";
import { useGetMettaxDeviceShadowMutation } from "@/app/_globalRedux/services/mettax";
import { trackingDashboard } from "@/app/_globalRedux/services/trackingDashboard";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { getSingleVehicleStatus } from "@/app/helpers/api/showVehicleStatus";
import checkIfIgnitionOnOrOff from "@/app/helpers/checkIfIgnitionOnOrOff";
import { getAlcoholStatus } from "@/app/helpers/getAlcholStatus";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { isKmtAccount } from "@/app/helpers/isKmtAccount";
import driverIcon from "@/public/assets/svgs/common/driver.svg";
import drunkDriverIcon from "@/public/assets/svgs/common/drunk_driver.svg";
import emtIcon from "@/public/assets/svgs/common/emt.svg";
import cancelMarkerIcon from "@/public/assets/svgs/common/marker-icon-cancel.svg";
import markerIcon from "@/public/assets/svgs/common/marker-icon.svg";
import moreIcon from "@/public/assets/svgs/common/more-icon.svg";
import poiIcon from "@/public/assets/svgs/common/poi-icon.svg";
import {
  FormOutlined,
  LeftCircleOutlined,
  LockOutlined,
  RightCircleOutlined,
  VideoCameraTwoTone,
  WarningOutlined,
} from "@ant-design/icons";
import { Badge, Card, Tooltip } from "antd";
import moment from "moment";
import Image from "next/image";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DTC } from "./DTC";
import { Elock } from "./Elock";
import { Fuel } from "./Fuel";
import { NoGpsKm } from "./noGpsKm";
import { Padlock } from "./Padlock";
import Passenger from "./Passenger";
import { PowerDisconnected } from "./powerDisconnected";
import { getLatestGPSTime } from "./utils/getLatestGPSTime";
import { isHourAgo } from "./utils/isHourAgo";
import { CreatePOI } from "./vehicleOverviewCard/CreatePOI";
import { DriversInfo } from "./vehicleOverviewCard/DriverInfo";
import { MapYourVehicle } from "./vehicleOverviewCard/MapYourVehicle";
import { Options } from "./vehicleOverviewCard/Options";
import { ShareUrl } from "./vehicleOverviewCard/ShareUrl";

export const VehicleOverviewCard = ({
  vehicleData,
}: {
  vehicleData: VehicleData;
}) => {
  const currentModeArr = vehicleData.gpsDtl.mode.split("");
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const auth = useSelector((state: RootState) => state.auth);
  const selectedVehicleListTab = useSelector(
    (state: RootState) => state.selectedVehicleListTab,
  );
  const [overviewSliderStyle, setOverviewSliderStyle] = useState(0);
  const [isDeviceOnline, setIsDeviceOnline] = useState<boolean | null>(null);
  const [isBSJVehicleOnline, setIsBSJVehicleOnline] = useState<boolean | null>(
    null,
  );
  const [lastValidPOI, setLastValidPOI] = useState<string>("");

  // Fetch ambulance data for user 833193
  const {
    data: ambulanceData,
    error,
    isLoading,
  } = useGetAmbulanceEmployeesQuery(undefined, {
    skip: Number(auth.userId) !== 833193,
  });

  const [getMettaxDeviceShadow] = useGetMettaxDeviceShadowMutation();
  const [getIndiaDeviceShadow] = useIndiaGetMettaxDeviceShadowMutation();

  const dispatch = useDispatch();

  // Helper function to get the correct address based on GPS fix status
  const getPrimaryAddress = () => {
    const gpsHasFix = vehicleData.GPSInfo?.gps_fix === 1;
    const elockHasFix = vehicleData.ELOCKInfo?.gps_fix === 1;

    if (gpsHasFix && !elockHasFix) {
      return vehicleData.GPSInfo?.addr?.replaceAll("_", " ") || "";
    } else if (elockHasFix && !gpsHasFix) {
      // ELOCK has fix, GPS doesn't
      return vehicleData.ELOCKInfo?.addr?.replaceAll("_", " ") || "";
    } else if (gpsHasFix && elockHasFix) {
      // Both have fix, prefer GPS
      return vehicleData.GPSInfo?.addr?.replaceAll("_", " ") || "";
    } else {
      // Neither has proper fix, fallback to latLngDtl
      return vehicleData.gpsDtl.latLngDtl.addr?.replaceAll("_", " ") || "";
    }
  };

  // Helper function to get coordinates for maps based on GPS fix status
  const getPrimaryCoordinates = () => {
    const gpsHasFix = vehicleData.GPSInfo?.gps_fix === 1;
    const elockHasFix = vehicleData.ELOCKInfo?.gps_fix === 1;

    if (gpsHasFix && !elockHasFix) {
      return {
        lat: vehicleData.GPSInfo?.lat,
        lng: vehicleData.GPSInfo?.lng,
      };
    } else if (elockHasFix && !gpsHasFix) {
      return {
        lat: vehicleData.ELOCKInfo?.lat,
        lng: vehicleData.ELOCKInfo?.lng,
      };
    } else if (gpsHasFix && elockHasFix) {
      return {
        lat: vehicleData.GPSInfo?.lat,
        lng: vehicleData.GPSInfo?.lng,
      };
    } else {
      return {
        lat: vehicleData.gpsDtl.latLngDtl.lat,
        lng: vehicleData.gpsDtl.latLngDtl.lng,
      };
    }
  };

  const stablePOI = useMemo(() => {
    const hasValidElockPOI =
      vehicleData.gpsDtl.controllernum === "CONTROLLER" &&
      vehicleData.ELOCKInfo?.poi &&
      vehicleData.ELOCKInfo.poi.trim() !== "" &&
      vehicleData.ELOCKInfo.poi.toLowerCase() !== "na";

    let currentPOI = "";

    if (hasValidElockPOI) {
      currentPOI = vehicleData.ELOCKInfo.poi?.replaceAll("_", " ") || "";
    } else {
      const gpsPOI = vehicleData.gpsDtl.latLngDtl.poi?.replaceAll("_", " ");

      // Apply user-specific transformations for GPS POI
      if (
        (Number(auth.userId) === 87364 || Number(auth.parentUser) === 87364) &&
        gpsPOI
      ) {
        if (gpsPOI === "Inside POI") {
          currentPOI = "Inside Geofence";
        } else if (gpsPOI === "No Nearest POI") {
          currentPOI = "No Nearest Geofence";
        } else {
          currentPOI = gpsPOI;
        }
      } else {
        currentPOI = gpsPOI || "";
      }
    }

    if (currentPOI === "Inside Geofence") {
      const primaryAddress = getPrimaryAddress();
      if (primaryAddress && primaryAddress.includes(" - ")) {
        const prefixPart = primaryAddress.split(" - ")[0].trim();
        if (prefixPart) {
          currentPOI = `Inside Geofence - ${prefixPart}`;
        }
      }
    }

    if (!currentPOI || currentPOI.trim() === "") {
      return lastValidPOI;
    }

    if (currentPOI !== lastValidPOI) {
      setLastValidPOI(currentPOI);
    }

    return currentPOI;
  }, [
    vehicleData.gpsDtl.controllernum,
    vehicleData.ELOCKInfo?.poi,
    vehicleData.gpsDtl.latLngDtl.poi,
    auth.userId,
    auth.parentUser,
    lastValidPOI,
  ]);

  // Check BSJ vehicle online/offline status
  const checkBSJVehicleStatus = async () => {
    if (
      vehicleData.gpsDtl.model &&
      vehicleData.gpsDtl.model.includes("##BSJ")
    ) {
      try {
        const imeiNumber = vehicleData.gpsDtl.model.replace("##BSJ", "");
        const status = await getSingleVehicleStatus(imeiNumber);
        setIsBSJVehicleOnline(status ? status.isOnline : false);
      } catch (error) {
        console.error("Error checking BSJ vehicle status:", error);
        setIsBSJVehicleOnline(null);
      }
    }
  };

  // Check device online/offline status for video telematics
  const checkDeviceStatus = async () => {
    if (
      auth.isVideoTelematics &&
      vehicleData.gpsDtl.model &&
      !isNaN(Number(vehicleData.gpsDtl.model))
    ) {
      try {
        if (Number(auth.userId) === 5360) {
          // User 5360 uses India API only
          const response = await getIndiaDeviceShadow({
            deviceIds: vehicleData.gpsDtl.model,
          }).unwrap();

          if (response.code === 0 && response.data.length > 0) {
            setIsDeviceOnline(response.data[0].expand.status);
          }
        } else if (Number(auth.userId) === 4343) {
          // User 4343 tries Singapore first, then India as fallback
          try {
            const response = await getMettaxDeviceShadow({
              deviceIds: vehicleData.gpsDtl.model,
            }).unwrap();

            if (response.code === 0 && response.data.length > 0) {
              setIsDeviceOnline(response.data[0].expand.status);
            }
          } catch (singaporeError) {
            // Fallback to India API
            try {
              const fallbackResponse = await getIndiaDeviceShadow({
                deviceIds: vehicleData.gpsDtl.model,
              }).unwrap();

              if (
                fallbackResponse.code === 0 &&
                fallbackResponse.data.length > 0
              ) {
                setIsDeviceOnline(fallbackResponse.data[0].expand.status);
              }
            } catch (indiaError) {
              console.error("Both APIs failed for device shadow:", indiaError);
              setIsDeviceOnline(null);
            }
          }
        } else {
          // Other users use Singapore API
          const response = await getMettaxDeviceShadow({
            deviceIds: vehicleData.gpsDtl.model,
          }).unwrap();

          if (response.code === 0 && response.data.length > 0) {
            setIsDeviceOnline(response.data[0].expand.status);
          }
        }
      } catch (error) {
        console.error("Error checking device status:", error);
        setIsDeviceOnline(null);
      }
    }
  };

  useEffect(() => {
    checkDeviceStatus();
    checkBSJVehicleStatus();
  }, [vehicleData.gpsDtl.model, auth.userId]);

  const checkIfDriverNameAndNumberExists = () => {
    if (
      vehicleData.drivers.driverName &&
      vehicleData.drivers.driverName.trim().toLowerCase() !== "na" &&
      vehicleData.drivers.phoneNumber &&
      vehicleData.drivers.phoneNumber.trim().toLowerCase() !== "na"
    ) {
      if (vehicleData.drivers.driverName && vehicleData.drivers.phoneNumber) {
        return `${vehicleData.drivers.driverName} / ${vehicleData.drivers.phoneNumber}`;
      } else {
        return "NA";
      }
    } else {
      return "NA";
    }
  };

  const getCurrentDriverForAmbulance = () => {
    if (Number(auth.userId) === 833193 && ambulanceData) {
      const ambulances = ambulanceData.ambulances;

      const matchedAmbulance = ambulances.find(
        (ambulance) => ambulance.ambulanceNumber === vehicleData.vehReg,
      );

      if (matchedAmbulance?.driver) {
        return {
          ...matchedAmbulance.driver,
          attendance: {
            punchTime: matchedAmbulance.driver.latestPunchTime,
            punchLocation: "", // Not provided in new structure
          },
        };
      }

      return null;
    }
    return null;
  };

  const getCurrentEmtForAmbulance = () => {
    if (Number(auth.userId) === 833193 && ambulanceData) {
      const ambulances = ambulanceData.ambulances;

      const matchedAmbulance = ambulances.find(
        (ambulance) => ambulance.ambulanceNumber === vehicleData.vehReg,
      );

      if (matchedAmbulance?.emt) {
        return {
          ...matchedAmbulance.emt,
          attendance: {
            punchTime: matchedAmbulance.emt.latestPunchTime,
            punchLocation: "", // Not provided in new structure
          },
        };
      }

      return null;
    }
    return null;
  };

  const activeItemsCount = useMemo(() => {
    let count = isCheckInAccount(Number(auth.userId)) ? 1 : 3;

    if (isCheckInAccount(Number(auth.userId))) count++;
    if (auth.isAc && !isCheckInAccount(Number(auth.userId))) count++;
    if (auth.isTemp) count = count + 3;
    if (auth.isEveVehicle) count++;
    if (auth.isMarketVehicle || auth.isPadlock || auth.isEveVehicle) count++;
    if (auth.isOdometer || auth.isEveVehicle || Number(auth.userId) === 87056)
      count++;
    if (vehicleData.tyres) count++;
    if (Number(auth.userId) === 833188 || Number(auth.userId) === 78227)
      count++;

    return count;
  }, [auth, vehicleData.tyres]);

  const maxSliderValue = useMemo(
    () => activeItemsCount * 80,
    [activeItemsCount],
  );

  const containerWidth = 260;

  const handleRightClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOverviewSliderStyle((prev) => {
      const remainingScrollSpace = maxSliderValue + prev - containerWidth;

      if (remainingScrollSpace > 0) {
        return prev - 100;
      } else {
        return prev;
      }
    });
  };

  const handleLeftClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOverviewSliderStyle((prev) => {
      if (overviewSliderStyle === 0) {
        return prev;
      } else {
        return prev + 100;
      }
    });
  };

  const handleVehicleSelect = () => {
    dispatch(
      addRecentlyClickedVehicle({
        vId: vehicleData.vId,
        vehReg: vehicleData.vehReg,
      }),
    );

    dispatch(
      trackingDashboard.util.invalidateTags(["Selected-Vehicle-Itinerary"]),
    );
    dispatch(
      trackingDashboard.util.invalidateTags(["Selected-Vehicle-Diagnostic"]),
    );
    dispatch(
      setSelectedVehicleCustomRange({
        dateRangeToDisplay: { startDate: "", endDate: "" },
        dateRangeForDataFetching: { startDate: "", endDate: "" },
        customRangeSelected: "Today",
        previousDateRange: { startDate: "", endDate: "" },
      }),
    );
    dispatch(setVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));
    dispatch(setLiveVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));

    dispatch(setOpenStoppageIndex(-1));
    dispatch(
      setSelectedVehicleStatus({
        ...vehicleData,
        searchType: "",
        selectedVehicleHistoryTab: selectedVehicle.selectedVehicleHistoryTab,
        nearbyVehicles: [],
        prevVehicleSelected: selectedVehicle.prevVehicleSelected,
      }),
    );
    dispatch(setNearbyVehicles(undefined));
    dispatch(setRadiusInKilometers(0));
  };

  const getVehicleModeColor = (
    mode: "RUNNING" | "STOPPED" | "IDLE" | "NOT WORKING",
  ) => {
    if (mode === "RUNNING") {
      return "text-primary-green";
    } else if (mode === "STOPPED" && Number(auth.userId) === 833081) {
      return "text-red-600";
    } else if (mode === "IDLE") {
      return "text-yellow-600";
    } else if (mode === "NOT WORKING") {
      return "text-red-600";
    } else if (mode === "STOPPED") {
      return "text-primary-green";
    } else {
      return "";
    }
  };

  const getBatteryStatusForUser833188 = () => {
    // Only for users 833188 and 78227
    if (Number(auth.userId) !== 833188 && Number(auth.userId) !== 78227) {
      return null;
    }
    const alcoholLevel = vehicleData.gpsDtl.alcoholLevel;
    if (!alcoholLevel && alcoholLevel !== 0) {
      return "NA";
    }
    const numericValue = Math.floor(Number(alcoholLevel));
    if (isNaN(numericValue)) {
      return "NA";
    }

    if (numericValue === 0) {
      return "0";
    }

    // Apply the mapping logic
    if (numericValue > 65) {
      return "100";
    } else if (numericValue < 55) {
      return "0";
    } else {
      const batteryPercentage = Math.round(
        ((numericValue - 55) / (65 - 55)) * 100,
      );
      return batteryPercentage.toString();
    }
  };

  return (
    <div className="relative select-none ">
      {isCheckInAccount(Number(auth.userId)) ? null : (
        <>
          <ShareUrl vehicleData={vehicleData} />
          <Options vehicleData={vehicleData} />
          <MapYourVehicle vehicleData={vehicleData} />
          <DriversInfo vehicleData={vehicleData} />
          <CreatePOI vehicleData={vehicleData} type="Vehicle_Based" />
        </>
      )}

      <div>
        {auth.accessLabel === 6 &&
        vehicleData.ELOCKInfo &&
        vehicleData.ELOCKInfo.Unhealthy &&
        vehicleData.ELOCKInfo.Unhealthy.data &&
        Array.isArray(vehicleData.ELOCKInfo.Unhealthy.data) &&
        vehicleData.ELOCKInfo.Unhealthy.data[0] == 1 ? (
          <Tooltip
            title={vehicleData.ELOCKInfo.UnhealthyDesc!}
            placement="rightTop"
          >
            <div>
              <Badge.Ribbon
                text="Unhealthy"
                color="#C12F3B"
                className="z-10 cursor-pointer"
              />
            </div>
          </Tooltip>
        ) : null}
        {vehicleData.gpsDtl.ticket_status &&
          vehicleData.gpsDtl.ticket_status !== "Service Completed" && (
            <Tooltip
              title={vehicleData.ELOCKInfo.UnhealthyDesc ?? ""}
              placement="leftTop"
            >
              <div>
                <Badge.Ribbon
                  text={vehicleData.gpsDtl.ticket_status}
                  color="#1581BF"
                  className="z-10"
                  placement="start"
                />
              </div>
            </Tooltip>
          )}
        <div className="h-2"></div>

        <Card
          className={`text-wrap overflow-clip shadow-xl  shadow-s-dark text-sm rounded-3xl cursor-pointer`}
          styles={{
            body: {
              borderRadius: ".5rem",
              border:
                selectedVehicle.vId === vehicleData.vId
                  ? "1.5px solid #478C83"
                  : "1.5px solid transparent",
              background:
                vehicleData.gpsDtl.immoblizeStatus == 1 &&
                !isKmtAccount(Number(auth.userId), Number(auth.parentUser))
                  ? "white"
                  : "white",
            },
          }}
          onClick={() => {
            handleVehicleSelect();
            dispatch(setVehicleDetailsStatus({ type: "vehicle" }));
          }}
        >
          <div className="flex flex-col items-baseline gap-0.5 overflow-hidden relative">
            <div className="flex justify-between items-start gap-1 w-full">
              <div>
                <div className="flex items-center gap-2">
                  {vehicleData.vId ? (
                    <Tooltip
                      title={`SID: ${vehicleData.vId}`}
                      placement="top"
                      mouseEnterDelay={0.5}
                    >
                      <p className={`font-extrabold text-base break-all`}>
                        {vehicleData.vehReg}
                      </p>
                    </Tooltip>
                  ) : (
                    <div
                      className={`font-extrabold text-base flex items-center gap-1`}
                    >
                      <span>{vehicleData.vehReg}</span>
                      {Number(auth.userId) === 85184 &&
                        vehicleData.transporterVendor !== "None" && (
                          <>
                            <span>-</span>
                            <span className="font-semibold text-sm">
                              {vehicleData.transporterVendor}
                            </span>
                          </>
                        )}
                    </div>
                  )}

                  {vehicleData.gpsDtl.model &&
                    vehicleData.gpsDtl.model.length < 20 &&
                    isNaN(Number(vehicleData.gpsDtl.model)) &&
                    !vehicleData.gpsDtl.model.includes("##BSJ") && (
                      <p
                        className="text-[10px] text-gray-700 font-medium"
                        style={{ fontFamily: "Roboto, sans-serif" }}
                      >
                        {vehicleData.gpsDtl.model}
                      </p>
                    )}
                </div>
                {vehicleData.gpsDtl.tyres && (
                  <p className="text-xs text-gray-500">
                    Tyres: {vehicleData.gpsDtl.tyres}
                  </p>
                )}

                {vehicleData.gpsDtl.mode !== "RUNNING" &&
                !isCheckInAccount(Number(auth.userId)) &&
                vehicleData.gpsDtl.speed === 0 ? (
                  <p className="text-xs font-bold text-red-600">
                    {vehicleData.gpsDtl.mode === "NOT WORKING"
                      ? "Not Working Hours: "
                      : `${currentModeArr[0]}${currentModeArr
                          .slice(1, currentModeArr.length)
                          .join("")
                          .toLowerCase()} since: `}
                    <span className="font-bold">
                      {vehicleData.gpsDtl.mode === "NOT WORKING"
                        ? `${vehicleData.gpsDtl.notworkingHrs} hrs`
                        : vehicleData.gpsDtl.modeTime}
                    </span>
                  </p>
                ) : null}
                {`${auth.userId}` === "81491" ? (
                  <p className="text-xs font-bold mb-2 mt-0.5">
                    Odometer Reading: {vehicleData.gpsDtl.tel_odometer} KM
                  </p>
                ) : null}

                <p
                  className={`text-xs font-semibold text-gray-500 ${getVehicleModeColor(
                    vehicleData.gpsDtl.mode,
                  )}`}
                >
                  Last data received at{" "}
                  {auth.accessLabel === 6 &&
                  vehicleData.gpsDtl.controllernum === "CONTROLLER"
                    ? vehicleData?.gpsDtl?.latLngDtl?.gpstime
                    : vehicleData?.gpsDtl?.latLngDtl?.gpstime}
                </p>

                {selectedVehicleListTab === "non active" &&
                  vehicleData.gpsDtl.inactiveReason && (
                    <p className="text-xs font-semibold text-red-600 mt-0.5">
                      Inactive Reason:{" "}
                      {vehicleData.gpsDtl.inactiveReason.startsWith("Other:")
                        ? vehicleData.gpsDtl.inactiveReason.substring(6)
                        : vehicleData.gpsDtl.inactiveReason}
                    </p>
                  )}
              </div>

              <div className="flex gap-1 items-center mt-2">
                <div className="flex items-center gap-2 justify-center">
                  <NoGpsKm data={vehicleData} />
                  <PowerDisconnected data={vehicleData} />
                  <Elock data={vehicleData} />
                  <Padlock data={vehicleData} />
                  <DTC data={vehicleData} />
                  <Passenger data={vehicleData} />
                  <Fuel data={vehicleData} />

                  {(auth.isVideoTelematics &&
                    vehicleData.gpsDtl.model &&
                    (!isNaN(Number(vehicleData.gpsDtl.model)) ||
                      vehicleData.gpsDtl.model.includes("##BSJ"))) ||
                  (vehicleData.gpsDtl.model &&
                    vehicleData.gpsDtl.model.includes("##BSJ")) ? (
                    <Tooltip
                      title={`${
                        vehicleData.gpsDtl.model &&
                        vehicleData.gpsDtl.model.includes("##BSJ")
                          ? `BSJ Vehicle - ${
                              isBSJVehicleOnline === null
                                ? "Checking status..."
                                : isBSJVehicleOnline
                                  ? "Online"
                                  : "Offline"
                            }`
                          : `Video Telematics - ${
                              isDeviceOnline === null
                                ? "Checking status..."
                                : isDeviceOnline
                                  ? "Online"
                                  : "Offline"
                            }`
                      }`}
                      mouseEnterDelay={2}
                    >
                      <div
                        className={`px-1 py-0.5 relative ${
                          vehicleData.gpsDtl.model &&
                          vehicleData.gpsDtl.model.includes("##BSJ")
                            ? isBSJVehicleOnline === null
                              ? "text-gray-600"
                              : isBSJVehicleOnline
                                ? " text-green-50"
                                : " text-red-600"
                            : isDeviceOnline === null
                              ? "text-gray-600"
                              : isDeviceOnline
                                ? " text-green-50"
                                : " text-red-600"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedVehicle.vId !== vehicleData.vId) {
                            handleVehicleSelect();
                          }
                          if (auth.isVideoTelematics) {
                            dispatch(
                              setVehicleDetailsStatus({ type: "video" }),
                            );
                            vehicleData.gpsDtl.model !== null &&
                              dispatch(
                                setSelectedVehicleDeviceId(
                                  vehicleData.gpsDtl.model,
                                ),
                              );
                          }
                        }}
                      >
                        <VideoCameraTwoTone
                          twoToneColor={
                            vehicleData.gpsDtl.model &&
                            vehicleData.gpsDtl.model.includes("##BSJ")
                              ? isBSJVehicleOnline === null
                                ? "#6B7280"
                                : isBSJVehicleOnline
                                  ? "#478C83"
                                  : "#6B7280"
                              : isDeviceOnline === null
                                ? "#6B7280"
                                : isDeviceOnline
                                  ? "#478C83"
                                  : "#6B7280"
                          }
                        />

                        {((vehicleData.gpsDtl.model &&
                          vehicleData.gpsDtl.model.includes("##BSJ") &&
                          isBSJVehicleOnline) ||
                          (auth.isVideoTelematics && isDeviceOnline)) && (
                          <div className="absolute -top-0.5 -right-0.5">
                            <div className="w-2 h-2 bg-red-500 rounded-full border border-white" />

                            <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  ) : null}
                </div>

                {vehicleData.gpsDtl.alertCount > 0 ? (
                  <WarningOutlined
                    color=""
                    style={{ fontSize: "20px", color: "#FED400" }}
                  />
                ) : null}

                {isCheckInAccount(Number(auth.userId)) ? null : (
                  <div
                    className="flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(setOptionsIndex(vehicleData.vId));
                    }}
                  >
                    <Tooltip title="Options" mouseEnterDelay={2}>
                      <div className="p-2 px-3 bg-white rounded-full ">
                        <div className="w-[3px] relative select-none ">
                          <Image
                            src={moreIcon}
                            width={20}
                            height={20}
                            alt="more dropdown icon"
                            className="-mb-[2px] rotate-90"
                          />
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <div className="font-bold text-gray-600 w-6 relative overflow-visible">
                <Tooltip
                  title={
                    getPrimaryAddress()
                      ? "GPS location"
                      : "GPS location not fixed"
                  }
                  placement="left"
                  mouseEnterDelay={1}
                >
                  {!getPrimaryAddress() ? (
                    <Image
                      src={cancelMarkerIcon}
                      alt="current location"
                      width={20}
                      height={25}
                      className="relative z-0"
                    />
                  ) : (
                    <Image
                      src={markerIcon}
                      alt="current location"
                      width={20}
                      height={25}
                      className="relative z-0"
                    />
                  )}
                </Tooltip>
              </div>

              <Tooltip
                title={getPrimaryAddress()}
                placement="right"
                mouseEnterDelay={1}
              >
                <p
                  className={`text-sm  truncate w-[310px]  ${
                    getLatestGPSTime(vehicleData) === "GPS"
                      ? "text-primary-green"
                      : ""
                  }`}
                >
                  {auth.accessLabel === 6 &&
                  isHourAgo(vehicleData.GPSInfo.gpstime)
                    ? "Cabin device not working"
                    : getPrimaryAddress()}
                </p>
              </Tooltip>
            </div>
            {auth.accessLabel === 6 &&
            vehicleData.ELOCKInfo &&
            vehicleData.ELOCKInfo.addr ? (
              <div className="flex items-center gap-1 mb-1">
                <div className="font-bold text-gray-600 w-6 relative">
                  <Tooltip
                    title={
                      vehicleData.ELOCKInfo.gps_fix !== 1
                        ? "Elock location not fixed"
                        : "Elock location"
                    }
                    placement="left"
                    mouseEnterDelay={1}
                  >
                    {vehicleData.ELOCKInfo.gps_fix !== 1 ? (
                      <div className="w-[20px] h-[2px] bg-black rotate-45 absolute top-[11.9px] -right-[0.5px] rounded-md"></div>
                    ) : null}
                    <LockOutlined style={{ fontSize: "20px" }} />
                  </Tooltip>
                </div>
                <Tooltip
                  title={`${vehicleData.ELOCKInfo.addr?.replaceAll("_", " ")}`}
                  placement="right"
                  mouseEnterDelay={1}
                >
                  <p
                    className={`text-sm  truncate w-[310px]  ${
                      getLatestGPSTime(vehicleData) === "ELOCK"
                        ? "text-primary-green"
                        : ""
                    }`}
                  >
                    {auth.accessLabel === 6 &&
                    isHourAgo(vehicleData.ELOCKInfo.gpstime)
                      ? "Elock device not working"
                      : auth.accessLabel === 6 &&
                          vehicleData.ELOCKInfo.gps_fix !== 1
                        ? vehicleData.ELOCKInfo.addr?.replaceAll("_", " ")
                        : vehicleData.gpsDtl.controllernum === "CONTROLLER" &&
                            vehicleData.ELOCKInfo.addr
                          ? vehicleData.ELOCKInfo.addr?.replaceAll("_", " ")
                          : vehicleData.gpsDtl.latLngDtl.addr?.replaceAll(
                              "_",
                              " ",
                            )}
                  </p>
                </Tooltip>
              </div>
            ) : null}

            {isCheckInAccount(Number(auth.userId)) ? null : (
              <div className="flex items-center gap-1 mb-1">
                <div className="font-bold text-gray-600 w-6 ">
                  <Tooltip
                    title={
                      Number(auth.userId) === 87364 ||
                      Number(auth.parentUser) === 87364
                        ? "Geofence"
                        : "POI"
                    }
                    placement="left"
                    mouseEnterDelay={1}
                  >
                    <Image
                      src={poiIcon}
                      alt="current location"
                      width={20}
                      height={26}
                    />
                  </Tooltip>
                </div>
                <Tooltip
                  title={stablePOI}
                  placement="right"
                  mouseEnterDelay={1}
                >
                  <p className="text-sm truncate w-[310px]">{stablePOI}</p>
                </Tooltip>
              </div>
            )}

            {isCheckInAccount(Number(auth.userId)) ? null : Number(
                auth.userId,
              ) === 833193 ? (
              <div className="flex items-center gap-1 mb-1">
                <div className="font-bold text-gray-600 w-6 ">
                  <Tooltip title="Driver" placement="left" mouseEnterDelay={1}>
                    <Image
                      src={driverIcon}
                      alt="driver"
                      width={30}
                      height={26}
                    />
                  </Tooltip>
                </div>
                <div className="flex gap-2 truncate w-[310px]">
                  <div className="flex flex-col">
                    <Tooltip
                      title={`${
                        getCurrentDriverForAmbulance()?.name || "No Driver"
                      }`}
                      placement="right"
                      mouseEnterDelay={1}
                    >
                      <p className="text-xs font-semibold">
                        {(() => {
                          const driver = getCurrentDriverForAmbulance();
                          return driver?.name || "No Driver";
                        })()}
                      </p>
                    </Tooltip>
                    {getCurrentDriverForAmbulance()?.employeeSystemId && (
                      <Tooltip
                        title={`Employee ID: ${
                          getCurrentDriverForAmbulance()?.employeeSystemId ||
                          "N/A"
                        }`}
                        placement="right"
                        mouseEnterDelay={1}
                      >
                        <p className="text-[10px] text-gray-600">
                          {(() => {
                            const driver = getCurrentDriverForAmbulance();
                            return driver?.employeeSystemId || "";
                          })()}
                        </p>
                      </Tooltip>
                    )}
                    {(() => {
                      const driver = getCurrentDriverForAmbulance();
                      const attendance = driver?.attendance;
                      return attendance ? (
                        <Tooltip
                          title={`Attendance: ${attendance.punchTime || "N/A"}`}
                          placement="right"
                          mouseEnterDelay={1}
                        >
                          <p className="text-[10px] text-green-600">
                            {attendance.punchTime || "Present"}
                          </p>
                        </Tooltip>
                      ) : null;
                    })()}
                  </div>
                  <div className="border h-10 mx-0.5 bg-gray-900" />
                  <div className="font-bold text-gray-600 w-6 pt-2">
                    <Tooltip title="EMT" placement="left" mouseEnterDelay={1}>
                      <Image src={emtIcon} alt="emt" width={26} height={26} />
                    </Tooltip>
                  </div>
                  <div className="flex flex-col">
                    <Tooltip
                      title={`${getCurrentEmtForAmbulance()?.name || "No EMT"}`}
                      placement="right"
                      mouseEnterDelay={1}
                    >
                      <p className="text-xs font-semibold">
                        {(() => {
                          const emt = getCurrentEmtForAmbulance();
                          return emt?.name || "No EMT";
                        })()}
                      </p>
                    </Tooltip>
                    {getCurrentEmtForAmbulance()?.employeeSystemId && (
                      <Tooltip
                        title={`Employee ID: ${
                          getCurrentEmtForAmbulance()?.employeeSystemId || "N/A"
                        }`}
                        placement="right"
                        mouseEnterDelay={1}
                      >
                        <p className="text-[10px] text-gray-600">
                          {(() => {
                            const emt = getCurrentEmtForAmbulance();
                            return emt?.employeeSystemId || "";
                          })()}
                        </p>
                      </Tooltip>
                    )}
                    {(() => {
                      const emt = getCurrentEmtForAmbulance();
                      const attendance = emt?.attendance;
                      return attendance ? (
                        <Tooltip
                          title={`Attendance: ${attendance.punchTime || "N/A"}`}
                          placement="right"
                          mouseEnterDelay={1}
                        >
                          <p className="text-[10px] text-blue-600">
                            {attendance.punchTime || "Present"}
                          </p>
                        </Tooltip>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 mb-1">
                {auth.isAlcohol && getAlcoholStatus(vehicleData) ? (
                  <div className="font-bold text-gray-600 w-6 ">
                    <Tooltip
                      title="Driver is drunk"
                      placement="left"
                      mouseEnterDelay={1}
                    >
                      <Image
                        src={drunkDriverIcon}
                        alt="driver"
                        width={24}
                        height={30}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <div className="font-bold text-gray-600 w-6 ">
                    <Tooltip
                      title="Driver"
                      placement="left"
                      mouseEnterDelay={1}
                    >
                      <Image
                        src={driverIcon}
                        alt="driver"
                        width={50}
                        height={26}
                      />
                    </Tooltip>
                  </div>
                )}
                <div className="flex gap-2 truncate w-[310px]">
                  <Tooltip
                    title={`${vehicleData.drivers.driverName}`}
                    placement="right"
                    mouseEnterDelay={1}
                  >
                    <p className="text-sm">
                      {checkIfDriverNameAndNumberExists()}
                    </p>
                  </Tooltip>
                  <div
                    className="text-primary-green"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(setDriverInfoIndex(vehicleData.vId));
                      dispatch(setOptionsIndex(-1));
                    }}
                  >
                    <Tooltip
                      title={
                        checkIfDriverNameAndNumberExists() === "NA"
                          ? "Create Driver"
                          : "Edit Driver"
                      }
                      mouseEnterDelay={1}
                    >
                      <FormOutlined />
                    </Tooltip>
                  </div>
                </div>
              </div>
            )}

            <div className="flex mt-4 w-full text-center overflow-hidden relative">
              <div className="flex items-center bg-white h-[84px] mr-2 z-10">
                <div
                  className={`hover:opacity-50 ${
                    overviewSliderStyle === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-100 cursor-pointer"
                  }transition-opacity duration-300`}
                  onClick={(e) => {
                    handleLeftClick(e);
                  }}
                >
                  <LeftCircleOutlined />
                </div>
              </div>

              <div id="items">
                <div
                  className="flex gap-4 text-center overflow-hidden w-[100%] relative"
                  style={{
                    transform: `${
                      maxSliderValue <= 260
                        ? "translateX(0px)"
                        : `translateX(${overviewSliderStyle}px)`
                    }`,
                    transition: "transform 0.3s ease",
                  }}
                >
                  <a
                    href={`https://www.google.com/maps/search/${
                      getPrimaryCoordinates().lat
                    },${getPrimaryCoordinates().lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="z-20 relative"
                  >
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {`${getPrimaryCoordinates().lat.toFixed(
                          4,
                        )} ${getPrimaryCoordinates().lng.toFixed(4)}`}
                      </div>
                      <div className="mt-1">Lat | Lng</div>
                    </div>
                  </a>
                  {isCheckInAccount(Number(auth.userId)) ? null : (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {checkIfIgnitionOnOrOff({
                          ignitionState:
                            vehicleData.gpsDtl.ignState.toLowerCase() as
                              | "off"
                              | "on",
                          speed: vehicleData.gpsDtl.speed,
                          mode: vehicleData.gpsDtl.mode,
                        }) === "On"
                          ? vehicleData.gpsDtl.speed
                          : 0}{" "}
                        km/h
                      </div>
                      <div className="mt-1">Speed</div>
                    </div>
                  )}
                  {isCheckInAccount(Number(auth.userId)) ||
                  auth.accessLabel == 4 ? null : (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.ignState.slice(0, 1).toUpperCase() +
                          vehicleData.gpsDtl.ignState.slice(1).toLowerCase()}
                      </div>
                      <div className="mt-1">Ignition</div>
                    </div>
                  )}

                  {auth.isAc &&
                  !isCheckInAccount(Number(auth.userId)) &&
                  auth.accessLabel !== 4 ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.acState}
                      </div>
                      <div className="mt-1">AC</div>
                    </div>
                  ) : null}

                  {auth.isTemp ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs min-w-20 h-[84px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.temperature?.toFixed(2)} °C
                      </div>
                      <div className="mt-1">Temp</div>
                    </div>
                  ) : null}

                  {auth.isTemp ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs min-w-20 h-[84px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.alcoholLevel} °C
                      </div>
                      <div className="mt-1">Humidity</div>
                    </div>
                  ) : null}

                  {auth.isEveVehicle ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.tel_rfid} km
                      </div>
                      <div className="mt-1">Distance to Empty</div>
                    </div>
                  ) : null}

                  {auth.isMarketVehicle ||
                  auth.isPadlock ||
                  auth.isEveVehicle ||
                  (Number(auth.userId) === 87162 &&
                    Number(auth.userId) !== 78227) ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-semibold">
                        {auth.isCrackPadlock || Number(auth.userId) === 87162
                          ? vehicleData.gpsDtl.percentageBttry
                          : (() => {
                              const v = Number(
                                vehicleData.gpsDtl.main_powervoltage,
                              );
                              return Number.isFinite(v) ? v.toFixed(2) : "0";
                            })()}
                        {auth.isCrackPadlock || Number(auth.userId) === 87162
                          ? ""
                          : "%"}
                      </div>
                      <div className="mt-1">Battery Status</div>
                    </div>
                  ) : null}
                  {auth.isPadlock &&
                  Number(auth.userId) !== 833188 &&
                  Number(auth.userId) !== 78227 &&
                  Number(auth.userId) !== 87162 &&
                  Number(auth.userId) !== 87162 ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {auth.isCrackPadlock
                          ? vehicleData.gpsDtl.percentageBttry
                          : vehicleData.gpsDtl.volt
                            ? vehicleData.gpsDtl.volt >= 4
                              ? 100
                              : vehicleData.gpsDtl.volt === 3.9
                                ? 80
                                : vehicleData.gpsDtl.volt === 3.8
                                  ? 40
                                  : vehicleData.gpsDtl.volt <= 3.7
                                    ? 20
                                    : 0
                            : "0"}
                        {auth.isCrackPadlock ? "" : "%"}
                      </div>
                      <div className="mt-1">Battery Status</div>
                    </div>
                  ) : auth.accessLabel === 4 &&
                    Number(auth.userId) !== 833087 &&
                    Number(auth.userId) !== 833188 &&
                    Number(auth.userId) !== 78227 ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.percentageBttry}%
                      </div>
                      <div className="mt-1">Battery Status</div>
                    </div>
                  ) : null}

                  {Number(auth.userId) === 833087 ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {Math.floor(vehicleData.gpsDtl.main_powervoltage) >=
                        12 ? (
                          "100%"
                        ) : Math.floor(vehicleData.gpsDtl.main_powervoltage) ===
                          11 ? (
                          "80%"
                        ) : Math.floor(vehicleData.gpsDtl.main_powervoltage) ===
                          10 ? (
                          "60%"
                        ) : Math.floor(vehicleData.gpsDtl.main_powervoltage) ===
                          9 ? (
                          Math.floor(vehicleData.gpsDtl.main_powervoltage) ===
                          8 ? (
                            "20%"
                          ) : Math.floor(vehicleData.gpsDtl.main_powervoltage) <
                            8 ? (
                            <p className="text-bold text-yellow-500">Low</p>
                          ) : (
                            <p className="text-bold text-yellow-500">Low</p>
                          )
                        ) : (
                          <p className="text-bold text-yellow-500">Low</p>
                        )}
                      </div>
                      <div className="mt-1">Battery Status</div>
                    </div>
                  ) : null}

                  {isCheckInAccount(Number(auth.userId)) ? (
                    <>
                      <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                        <div className="font-bold">
                          {vehicleData.gpsDtl.volt} %
                        </div>
                        <div className="mt-1">Mobile Battery</div>
                      </div>
                      <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                        <div
                          className={`font-bold ${
                            moment(
                              vehicleData.gpsDtl.latLngDtl.gpstime,
                            ).date() === moment().date()
                              ? "text-primary-green"
                              : "text-red-700"
                          }`}
                        >
                          {moment(
                            vehicleData.gpsDtl.latLngDtl.gpstime,
                          ).date() === moment().date()
                            ? "Checked In"
                            : "Not Checked"}
                        </div>
                        <div
                          className={`mt-1 ${
                            moment(
                              vehicleData.gpsDtl.latLngDtl.gpstime,
                            ).date() === moment().date()
                              ? "text-primary-green"
                              : "text-red-700"
                          }`}
                        >
                          Status
                        </div>
                      </div>
                    </>
                  ) : null}

                  {auth.isOdometer ||
                  auth.isEveVehicle ||
                  Number(auth.userId) === 87056 ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {vehicleData.gpsDtl.tel_odometer
                          ? vehicleData.gpsDtl.tel_odometer.toFixed(2)
                          : "0.00"}{" "}
                        km
                      </div>
                      <div className="mt-1">Odometer</div>
                    </div>
                  ) : null}

                  {vehicleData.tyres ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">{vehicleData.tyres}</div>
                      <div className="mt-1">Tyres</div>
                    </div>
                  ) : null}

                  {Number(auth.userId) === 833188 ||
                  Number(auth.userId) === 78227 ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-bold">
                        {(() => {
                          const batteryStatus = getBatteryStatusForUser833188();
                          if (batteryStatus === "NA" || batteryStatus === "0") {
                            return batteryStatus;
                          }
                          return `${batteryStatus}%`;
                        })()}
                      </div>
                      <div className="mt-1">Battery Status</div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center bg-white h-[84px] z-10 absolute right-0">
                <div
                  className={`hover:opacity-50 ${
                    overviewSliderStyle + maxSliderValue - containerWidth <= 0
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-100 cursor-pointer"
                  }transition-opacity duration-300`}
                  onClick={(e) => {
                    handleRightClick(e);
                  }}
                >
                  <RightCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
