"use client";

import {
  ConnectedIcon,
  DirectUnlockIcon,
  DisconnectedIcon,
  DoorClose,
  DoorOpen,
  GPSIcon,
  GPSOffIcon,
  LocationIcon,
  LockIcon,
  LockOff,
  ReportIconNew,
  TruckIcon,
  UnlockedIcon,
} from "@/public/assets/svgs/nav";
import { Skeleton, Modal, Input, Button } from "antd";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useLazyGetSearchVhlDataQuery } from "@/app/_globalRedux/services/getSearchData/index";
import { useGetElockDataQuery } from "@/app/_globalRedux/services/elock";
import { useGetUnlockLockReportQuery } from "@/app/_globalRedux/services/unlockLockReport";
import { useLazyConvertLatLngToAddressQuery } from "@/app/_globalRedux/services/trackingDashboard";
import ReportTabs from "./ReportTabs";
import InfoCard from "./InfoCard";
import { cn } from "@/lib/utils";
import { isDirectUnlockUser } from "@/app/helpers/directUnlock";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface HomeProps {
  systemId: string;
}

export default function Home({ systemId }: HomeProps) {
  const [currentAddress, setCurrentAddress] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showElockData, setShowElockData] = useState(true);
  const [elockAddress, setElockAddress] = useState("");
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockedModalOpen, setIsUnlockedModalOpen] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showActivationKey, setShowActivationKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDirectUnlockModalOpen, setIsDirectUnlockModalOpen] = useState(false);
  const [isDirectUnlocking, setIsDirectUnlocking] = useState(false);

  const { userId, groupId } = useSelector((state: RootState) => state.auth);

  const [getSearchVhlData, { data: searchData }] =
    useLazyGetSearchVhlDataQuery();
  const [convertLatLngToAddress] = useLazyConvertLatLngToAddressQuery();

  useEffect(() => {
    if (!systemId || !userId || !groupId) {
      return;
    }

    getSearchVhlData({
      token: groupId.toString(),
      vehreg: systemId,
      userid: userId.toString(),
    });
  }, [systemId, userId, groupId, getSearchVhlData]);

  const searchVehicle = searchData?.list?.[0];

  const gpsInfoVid = searchVehicle?.vId;

  const {
    data: elockData,
    isLoading: elockLoading,
    error: elockError,
  } = useGetElockDataQuery(
    {
      vId: gpsInfoVid || 0,
      cId: gpsInfoVid || 0,
    },
    {
      skip: !gpsInfoVid,
    },
  );

  const elockVehicle = elockData?.elock;
  const dashboardVehicle = elockData?.dashboard;

  const pickText = (...values: unknown[]) => {
    for (const value of values) {
      if (value === null || value === undefined) continue;

      const text = String(value).trim();
      if (text) return text;
    }

    return "N/A";
  };

  const pickNumber = (...values: unknown[]) => {
    for (const value of values) {
      if (value === null || value === undefined) continue;

      const numberValue = typeof value === "number" ? value : Number(value);
      if (!Number.isNaN(numberValue)) return numberValue;
    }

    return 0;
  };

  const getFieldText = (field: string) =>
    showElockData
      ? pickText(
          (elockVehicle as any)?.[field],
          (dashboardVehicle as any)?.[field],
        )
      : pickText(
          (dashboardVehicle as any)?.[field],
          (elockVehicle as any)?.[field],
        );

  const getFieldNumber = (field: string) =>
    showElockData
      ? pickNumber(
          (elockVehicle as any)?.[field],
          (dashboardVehicle as any)?.[field],
        )
      : pickNumber(
          (dashboardVehicle as any)?.[field],
          (elockVehicle as any)?.[field],
        );

  const getReportUrl = (reportType: string) => {
    if (reportType === "Elock") {
      const idToUse = gpsInfoVid || systemId;
      return `https://gtrac.in/newtracking/reports/elock_lock_unlock_get.php?vehicle=${idToUse}&CtrlId=${idToUse}&token=${groupId}&userid=${userId}`;
    }

    const reportParam =
      reportType === "Idle Report"
        ? "Idle"
        : reportType === "Overspeed"
          ? "OverSpeed"
          : reportType;

    return `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=${reportParam}&vehicle=${systemId}&token=${groupId}&userid=${userId}`;
  };

  // Get date range for unlock report (last week)
  const getWeekDateRange = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formatDateTime = (date: Date, isStart: boolean) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const time = isStart ? "00:00:00" : "23:59:59";

      return `${year}-${month}-${day} ${time}`;
    };

    return {
      start: formatDateTime(weekAgo, true),
      end: formatDateTime(now, false),
    };
  };

  const weekDateRange = getWeekDateRange();

  // Fetch unlock lock report data
  const { data: unlockReportData } = useGetUnlockLockReportQuery(
    {
      vId: gpsInfoVid || 0,
      gps_start_date: weekDateRange.start,
      gps_end_date: weekDateRange.end,
    },
    {
      skip: !gpsInfoVid,
    },
  );

  const getSortableTimestamp = (timeString?: string) => {
    if (!timeString) return 0;

    const timestamp = new Date(timeString).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const formatDisplayDateTime = (timeString?: string) => {
    const timestamp = getSortableTimestamp(timeString);

    if (!timestamp) return "N/A";

    return new Date(timestamp).toLocaleString();
  };

  const getLatestLockUnlockTime = () => {
    const unlockList = unlockReportData?.data || [];
    if (unlockList.length === 0) return "N/A";

    const latestEvent = [...unlockList]
      .map((item) => ({
        ...item,
        startTimestamp: getSortableTimestamp(item.start_time),
        endTimestamp: getSortableTimestamp(item.end_time),
      }))
      .filter((item) => item.startTimestamp || item.endTimestamp)
      .sort((a, b) => {
        return b.startTimestamp - a.startTimestamp;
      })[0];

    const displayTime = latestEvent?.endTimestamp
      ? latestEvent.end_time
      : latestEvent?.start_time;

    return formatDisplayDateTime(displayTime);
  };

  const getIdleStartDateTime = () => {
    const idleSince = getFieldText("idle_since");

    if (!idleSince || idleSince === "N/A") return "N/A";

    const parts = idleSince.split(":");
    if (parts.length < 2) return "N/A";

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
    const totalMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
    const idleStartTime = new Date(Date.now() - totalMs);

    return idleStartTime.toLocaleString();
  };

  const formatIdleDuration = () => {
    const idleSince = getFieldText("idle_since");
    if (!idleSince || idleSince === "N/A") return "N/A";

    const parts = idleSince.split(":");
    if (parts.length < 2) return idleSince;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (hours === 0 && minutes === 0) return "0 min";
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  const currentMode =
    (showElockData ? getFieldText("mode") : getFieldText("mode")) || "";
  const isRunningMode = currentMode.trim().toLowerCase() === "running";

  const currentLocationLat = getFieldNumber("lat") || undefined;
  const currentLocationLng = getFieldNumber("lng") || undefined;

  // Fetch current location address from lat/lng
  useEffect(() => {
    if (
      currentLocationLat == null ||
      currentLocationLng == null ||
      Number.isNaN(Number(currentLocationLat)) ||
      Number.isNaN(Number(currentLocationLng))
    ) {
      setCurrentAddress("N/A");
      return;
    }

    setCurrentAddress("Loading address...");

    convertLatLngToAddress({
      userId: Number(userId),
      latitude: Number(currentLocationLat),
      longitude: Number(currentLocationLng),
    })
      .then((response) => {
        const address = response?.data?.loc || "Address not found";
        setCurrentAddress(address.replace(/_/g, " "));
      })
      .catch((error) => {
        console.error("Error fetching current location address:", error);
        setCurrentAddress("Unable to fetch address");
      });
  }, [currentLocationLat, currentLocationLng, userId, convertLatLngToAddress]);

  // Fetch elock data address from lat/lng
  useEffect(() => {
    const address = searchVehicle?.ELOCKInfo?.addr;

    if (address) {
      setElockAddress(address.replace(/_/g, " "));
      return;
    }

    setElockAddress(currentAddress || "N/A");
  }, [searchVehicle, currentAddress]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptionsMenu && !(event.target as Element).closest(".relative")) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  // Helper function to check connection status
  const isConnected = () => {
    const dashboardConnected = dashboardVehicle?.Connected?.data?.[0];
    const elockConnected = elockVehicle?.Connected?.data?.[0];
    return dashboardConnected === 1 || elockConnected === 1;
  };

  const isLocked = () => {
    const elockLockStatus = elockVehicle?.locknput?.data?.[0];
    return elockLockStatus === 1;
  };

  const isGPSOn = () => {
    const dashboardGPSStatus = dashboardVehicle?.gps_fix;
    return dashboardGPSStatus === 1;
  };

  const isDoorOpen = () => {
    const doorOpen = Number(elockVehicle?.door);
    if (doorOpen > 80) {
      return true;
    } else {
      false;
    }
  };

  // Handle lock icon click
  const handleLockClick = () => {
    if (isLocked()) {
      setIsUnlockedModalOpen(true);
    } else {
      setIsLockModalOpen(true);
    }
  };

  // Handle proceed from unlocked modal
  const handleProceed = () => {
    setIsUnlockedModalOpen(false);
    setShowVerificationModal(true);
  };

  // Handle generate verification code
  const handleGenerateCode = async () => {
    // Validate verification code is at least 6 digits
    if (verificationCode.length < 6) {
      return;
    }

    setIsGenerating(true);

    // Get jny_distance from the search API response
    const deviceId = searchVehicle?.gpsDtl?.jny_distance || "";
    const vehicleId = searchVehicle?.vId || "";

    const formData = new FormData();
    formData.append("device_number", verificationCode);
    formData.append("device_id", deviceId.toString());

    try {
      // Step 1: Generate the code
      const response = await fetch(
        "https://gtrac.in/newtracking/reports/utilities.php?action=generate_code",
        {
          method: "POST",
          body: formData,
        },
      );

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Response might be plain text (the code itself)
        data = responseText;
      }

      // Get the generated code from response - check multiple possible property names
      let code = "";
      if (typeof data === "string" || typeof data === "number") {
        code = String(data);
      } else if (data) {
        code =
          data?.code ||
          data?.otp ||
          data?.generated_code ||
          data?.result ||
          data?.data ||
          "";
      }

      // Show the activation key immediately after generating
      setGeneratedCode(code.toString() || "Code generated");
      setShowActivationKey(true);

      // Step 2: Save code details in background
      const saveFormData = new URLSearchParams();
      saveFormData.append("vehicle_id", vehicleId.toString());
      saveFormData.append("device_id", deviceId.toString());
      saveFormData.append("device_number", verificationCode);
      saveFormData.append("code", code.toString());
      saveFormData.append("accessed_by", "website");
      saveFormData.append("location", currentAddress || "N/A");

      // Call save API in background
      fetch("https://gtrac.in/newtracking/reports/save_code_details.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: saveFormData.toString(),
        redirect: "follow",
      });
    } catch (error) {
      setGeneratedCode("Error generating code");
      setShowActivationKey(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle retry - reset to input state
  const handleRetry = () => {
    setShowActivationKey(false);
    setGeneratedCode("");
    setVerificationCode("");
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsLockModalOpen(false);
    setShowVerificationModal(false);
    setShowActivationKey(false);
    setVerificationCode("");
    setGeneratedCode("");
  };

  const basicInfoData = [
    {
      label: "Last Update",
      value: getFieldText("gpstime"),
      textSize: "text-xs",
    },
    {
      label: "VR ID",
      value: getFieldText("vr_id"),
    },
    {
      label: "Speed",
      value: `${getFieldNumber("speed")} km/h`,
    },
    {
      label: "Vendor Name",
      value: getFieldText("vendor_name"),
    },

    {
      label: "Mode",
      value: getFieldText("mode"),
    },
  ];

  const driverInfoData = [
    {
      label: "Driver Code",
      value: getFieldText("driver_code"),
      textSize: "text-xs",
    },
    {
      label: "Mobile No",
      value: getFieldText("driver_contact_no"),
    },
    {
      label: "Supervisor No",
      value: getFieldText("supervisor_no"),
    },
    {
      label: "Driver Name",
      value: getFieldText("driver_name"),
    },
    {
      label: "CPT",
      value: getFieldText("cpt"),
    },
  ];

  const operationStatusData = [
    {
      label: isRunningMode ? "Mode" : "Idle Since",
      value: isRunningMode ? "Running" : getIdleStartDateTime(),
      textSize: "text-xs",
    },
    {
      label: "Idle Hours",
      value: isRunningMode ? "-" : formatIdleDuration(),
      textSize: "text-xs",
    },
    {
      label: "Source",
      value: getFieldText("source"),
    },
    {
      label: "Destination",
      value: getFieldText("destination"),
    },
    {
      label: "Lane No",
      value: getFieldText("route_no"),
    },
  ];
  return (
    <div className="p-1 grid grid-cols-4 min-h-screen overflow-y-auto bg-white">
      <div className="col-span-3">
        {/* nav */}
        <div className="flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-1">
            <Image
              src={TruckIcon}
              width={35}
              height={35}
              alt="truck"
              draggable="false"
            />
            <h1 className="text-xl font-semibold mb-1 mr-5">
              {dashboardVehicle?.veh_reg}
            </h1>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="flex flex-col items-center">
              <Image
                src={isGPSOn() ? GPSIcon : GPSOffIcon}
                width={23}
                height={23}
                alt={isGPSOn() ? "GPS On" : "GPS Off"}
                draggable="false"
              />
              <p className="text-xs">{isGPSOn() ? "GPS On" : "GPS Off"}</p>
            </div>

            <div className="h-8 w-px bg-gray-300 mx-2" />

            <div className="flex flex-col items-center">
              <Image
                src={isConnected() ? ConnectedIcon : DisconnectedIcon}
                width={23}
                height={23}
                alt={isConnected() ? "connected" : "disconnected"}
                draggable="false"
              />
              <p className="text-xs">
                {isConnected() ? "Connected" : "Disconnected"}
              </p>
            </div>

            <div className="h-8 w-px bg-gray-300 mx-2" />

            <div className="flex flex-col items-center">
              <Image
                src={isDoorOpen() ? DoorOpen : DoorClose}
                width={23}
                height={23}
                alt={isDoorOpen() ? "Door Open" : "Door Close"}
                draggable="false"
              />
              <p className="text-xs">
                {isDoorOpen() ? "Door Open" : "Door Closed"}
              </p>
            </div>

            <div className="h-8 w-px bg-gray-300 mx-2" />

            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={handleLockClick}
            >
              <Image
                src={isLocked() ? UnlockedIcon : LockIcon}
                width={23}
                height={23}
                alt={isLocked() ? "Unlocked" : "Locked"}
                draggable="false"
              />
              <p
                className={cn(
                  "text-xs hover:underline underline-offset-2",
                  isLocked() ? "decoration-red-600" : "decoration-[#478C83]",
                )}
              >
                {isLocked() ? "Unlocked" : "Locked"}
              </p>
            </div>

            {isDirectUnlockUser.includes(String(groupId)) && (
              <>
                <div className="h-8 w-px bg-gray-300 mx-2" />

                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setIsDirectUnlockModalOpen(true)}
                >
                  <Image
                    src={DirectUnlockIcon}
                    width={23}
                    height={23}
                    alt="direct unlock"
                    draggable="false"
                  />
                  <p className="text-xs hover:underline underline-offset-2">
                    Direct Unlock
                  </p>
                </div>
              </>
            )}

            <div className="h-8 w-px bg-gray-300 mx-2" />

            <div className="flex flex-col items-center relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              <p className="text-xs">Options</p>

              {showOptionsMenu && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32">
                  <button
                    onClick={() => {
                      setShowElockData(!showElockData);
                      setShowOptionsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showElockData ? "Default View" : "Elock Data"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* content */}
        <div className="grid grid-cols-3 gap-10 mt-2 p-4 ">
          {elockLoading || !elockData || !searchData ? (
            <>
              <div className="border border-gray-200 rounded-xl">
                <h1 className="font-semibold p-2 bg-gray-100 border-b border-gray-200">
                  Basic Information
                </h1>
                <div className="p-2">
                  <Skeleton active paragraph={{ rows: 3 }} title={false} />
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl">
                <h1 className="font-semibold p-2 bg-gray-100 border-b border-gray-200">
                  Driver Information
                </h1>
                <div className="p-2">
                  <Skeleton active paragraph={{ rows: 3 }} title={false} />
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl">
                <h1 className="font-semibold p-2 bg-gray-100 border-b border-gray-200">
                  Operation Status
                </h1>
                <div className="p-2">
                  <Skeleton active paragraph={{ rows: 3 }} title={false} />
                </div>
              </div>
            </>
          ) : (
            <>
              <InfoCard title="Basic Information" data={basicInfoData} />
              <InfoCard title="Driver Information" data={driverInfoData} />
              <InfoCard title="Operation Status" data={operationStatusData} />
            </>
          )}
        </div>

        {/* Details */}
        <div className="mt-4 border border-gray-200 rounded-xl m-4 py-1">
          <div className="flex items-center justify-between text-sm border-b border-gray-200 py-2 px-4">
            <div className="flex items-center justify-center space-x-2">
              <Image
                src={LocationIcon}
                width={18}
                height={18}
                alt="location"
                draggable="false"
              />
              <p className="font-medium">Current Location :</p>
            </div>
            <h1>
              {showElockData ? elockAddress || currentAddress : currentAddress}
              {currentLocationLat != null && currentLocationLng != null ? (
                <span className="ml-1 text-gray-700 text-xs">
                  ({Number(currentLocationLat).toFixed(5)},{" "}
                  {Number(currentLocationLng).toFixed(5)})
                </span>
              ) : null}
            </h1>
          </div>
          <div className="flex items-center justify-between text-sm py-2 px-4 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <Image
                src={LockOff}
                width={18}
                height={18}
                alt="lock"
                draggable="false"
              />
              <p className="font-medium">Lock Engaged Date and Time :</p>
            </div>
            <h1>{getLatestLockUnlockTime()}</h1>
          </div>
          <div className="flex items-center justify-between text-sm py-2 px-4">
            <div className="flex items-center justify-center space-x-2">
              <Image
                src={ReportIconNew}
                width={18}
                height={18}
                alt="report"
                draggable="false"
              />
              <p className="font-medium">Report :</p>
            </div>
            <div className="flex items-center justify-center space-x-1 text-xs">
              <a
                href={getReportUrl("Journey")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline underline-offset-2 cursor-pointer hover:text-blue-400"
              >
                Journey
              </a>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <a
                href={getReportUrl("Idle Report")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline underline-offset-2 cursor-pointer hover:text-blue-400"
              >
                Idle Report
              </a>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <a
                href={getReportUrl("Summary")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline underline-offset-2 cursor-pointer hover:text-blue-400"
              >
                Summary
              </a>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <a
                href={getReportUrl("Overspeed")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline underline-offset-2 cursor-pointer hover:text-blue-400"
              >
                Overspeed
              </a>
              <div className="h-4 w-px bg-gray-300 mx-2" />
              <a
                href={getReportUrl("Elock")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline underline-offset-2 cursor-pointer hover:text-blue-400"
              >
                Elock
              </a>
            </div>
          </div>
        </div>

        {/* Report */}
        <div className="mt-10 mx-4 mb-24">
          <ReportTabs
            systemId={systemId}
            fallbackVehId={gpsInfoVid}
            vehicleReg={elockData?.dashboard.veh_reg}
          />
        </div>
      </div>

      {/* Map */}
      <div className="col-span-1 h-full">
        <MapComponent
          lat={dashboardVehicle?.lat ? Number(dashboardVehicle.lat) : undefined}
          lng={dashboardVehicle?.lng ? Number(dashboardVehicle.lng) : undefined}
        />
      </div>

      {/* Verification Code Modal (when locked) */}
      <Modal
        title={
          <div className="bg-[#478C83] text-white px-4 py-3 -mx-6 -mt-5 rounded-t-lg">
            <h3 className="text-lg font-semibold">
              {showActivationKey
                ? "GENERATED ELOCK ACTIVATION KEY"
                : "ENTER ELOCK ONE TIME VERIFICATION CODE"}
            </h3>
          </div>
        }
        open={isLockModalOpen || showVerificationModal}
        onCancel={handleCloseModal}
        footer={null}
        centered
        width={500}
        closeIcon={<span className="text-gray-400 text-xl">&times;</span>}
      >
        {showActivationKey ? (
          <>
            <div className="py-8 px-2 text-center">
              <p className="text-sm text-gray-600 mb-2">Activation Key:</p>
              <p className="text-3xl font-bold text-[#478C83] tracking-widest">
                {generatedCode}
              </p>
            </div>
            <div className="flex justify-end gap-3 pb-4 px-2">
              <Button onClick={handleRetry} className="px-6">
                Retry
              </Button>
              <Button
                onClick={handleCloseModal}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white border-none px-6"
              >
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="py-6 px-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Code:
              </label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full border border-gray-300 rounded-md"
                placeholder=""
              />
            </div>
            <div className="flex justify-end gap-3 pb-4 px-2">
              <Button
                type="primary"
                onClick={handleGenerateCode}
                loading={isGenerating}
                className="bg-[#478C83] hover:bg-[#3a756e] border-none px-6"
              >
                Generate Verification Code
              </Button>
              <Button
                onClick={handleCloseModal}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white border-none px-6"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Unlocked Message Modal */}
      <Modal
        title={null}
        open={isUnlockedModalOpen}
        onCancel={() => setIsUnlockedModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div className="py-8 text-center">
          <p className="text-lg text-gray-700">E-lock is already unlocked</p>
        </div>
        <div className="flex justify-end gap-3 pb-4 px-2">
          <Button
            onClick={() => setIsUnlockedModalOpen(false)}
            className="px-6"
          >
            Close
          </Button>
          <Button
            type="primary"
            onClick={handleProceed}
            className="bg-[#478C83] hover:bg-[#3a756e] border-none px-6"
          >
            Proceed
          </Button>
        </div>
      </Modal>

      {/* Direct Unlock Modal */}
      <Modal
        title={
          <div className="bg-[#478C83] text-white px-4 py-3 -mx-6 -mt-5 rounded-t-lg">
            <h3 className="text-lg font-semibold">DIRECT UNLOCKING</h3>
          </div>
        }
        open={isDirectUnlockModalOpen}
        onCancel={() => setIsDirectUnlockModalOpen(false)}
        footer={null}
        centered
        width={500}
        closeIcon={<span className="text-gray-400 text-xl">&times;</span>}
      >
        <div className="py-6 px-2">
          <p className="text-base text-gray-700">
            Are you sure to send a command to{" "}
            <span className="font-semibold">
              {dashboardVehicle?.veh_reg || systemId}
            </span>{" "}
            ?
          </p>
        </div>
        <div className="flex justify-end gap-3 pb-4 px-2">
          <Button
            type="primary"
            loading={isDirectUnlocking}
            onClick={async () => {
              setIsDirectUnlocking(true);
              try {
                const vehicleId = elockVehicle?.Vid || "";
                const deviceId = searchVehicle?.gpsDtl?.jny_distance || "";
                const deviceNumber = elockVehicle?.mobile_no || "";
                const lat = dashboardVehicle?.lat || "";
                const lng = dashboardVehicle?.lng || "";
                const locationWithCoords = `${currentAddress.replace(/_/g, " ")} (${lat}, ${lng})`;

                const formData = new FormData();
                formData.append("vehicle_id", vehicleId.toString());
                formData.append("device_id", deviceId.toString());
                formData.append("device_number", deviceNumber.toString());
                formData.append("accessed_by", "website");
                formData.append("location", locationWithCoords);

                await fetch(
                  "https://gtrac.in/newtracking/reports/utilities.php?action=generate_gsm_cammand",
                  {
                    method: "POST",
                    body: formData,
                  },
                );

                setIsDirectUnlockModalOpen(false);
              } catch (error) {
                console.error("Error sending direct unlock command:", error);
              } finally {
                setIsDirectUnlocking(false);
              }
            }}
            className="bg-[#5cb85c] hover:bg-[#4cae4c] border-none px-6"
          >
            Confirm{elockVehicle?.mobile_no || systemId}
          </Button>
          <Button
            onClick={() => setIsDirectUnlockModalOpen(false)}
            className="bg-[#d9534f] hover:bg-[#c9302c] text-white border-none px-6"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
