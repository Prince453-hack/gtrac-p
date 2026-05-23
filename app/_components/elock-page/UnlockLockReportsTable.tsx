"use client";

import { useGetElockDataQuery } from "@/app/_globalRedux/services/elock";
import { useGetElockDirectCommandQuery } from "@/app/_globalRedux/services/elockDirect";
import { useGetElockOtpCommandQuery } from "@/app/_globalRedux/services/elockOtp";
import { useLazyConvertLatLngToAddressQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useGetUnlockLockReportQuery } from "@/app/_globalRedux/services/unlockLockReport";
import { RootState } from "@/app/_globalRedux/store";
import { EyeIcon } from "@/public/assets/svgs/nav";
import { Select, Skeleton, Tooltip } from "antd";
import Image from "next/image";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import CustomDatePicker from "../common/datePicker";

interface UnlockLockReportsTableProps {
  systemId: string;
  vehId?: number;
  fallbackVehId?: number;
  vehicleReg?: string;
}

export interface UnlockLockReportsTableRef {
  exportData: () => void;
}

const UnlockLockReportsTable = forwardRef<
  UnlockLockReportsTableRef,
  UnlockLockReportsTableProps
>(({ systemId, vehId, fallbackVehId, vehicleReg }, ref) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [currentPage, setCurrentPage] = useState(1);
  const [customDateRange, setCustomDateRange] = useState<Date[]>([
    new Date(),
    new Date(),
  ]);
  const [locationData, setLocationData] = useState<
    Record<number, { startLocation?: string; endLocation?: string }>
  >({});
  const itemsPerPage = 5;

  const { userId } = useSelector((state: RootState) => state.auth);
  const [convertLatLngToAddress] = useLazyConvertLatLngToAddressQuery();

  // Get current date and calculate date range based on selection
  const getCurrentDateRange = () => {
    const now = new Date();

    // Format using local date components to avoid UTC offset issues
    // and always include full time 00:00:00 / 23:59:59
    const formatDateTime = (date: Date, isStart: boolean) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const time = isStart ? "00:00:00" : "23:59:59";
      return `${year}-${month}-${day} ${time}`;
    };

    const addDays = (date: Date, days: number) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    };

    switch (selectedTimeRange) {
      case "yesterday": {
        const yesterday = addDays(now, -1);
        // Full day: 00:00:00 to 23:59:59 of yesterday
        return {
          start: formatDateTime(yesterday, true),
          end: formatDateTime(yesterday, false),
        };
      }
      case "week": {
        const today = now;
        const weekAgo = addDays(today, -7);
        // From weekAgo 00:00:00 to today 23:59:59
        return {
          start: formatDateTime(weekAgo, true),
          end: formatDateTime(today, false),
        };
      }
      case "custom": {
        const startBase = customDateRange[0] || now;
        const endBase = customDateRange[1] || startBase;
        // From selected start 00:00:00 to selected end 23:59:59
        return {
          start: formatDateTime(startBase, true),
          end: formatDateTime(endBase, false),
        };
      }
      default: {
        const today = now;
        return {
          start: formatDateTime(today, true),
          end: formatDateTime(today, false),
        };
      }
    }
  };

  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
  };

  const handleCustomSubmit = () => {
    if (customDateRange[0] && customDateRange[1]) {
      setCurrentPage(1);
    }
  };

  const currentDateRange = getCurrentDateRange();
  const mainVid = vehId || parseInt(systemId);
  const shouldSkipForCustomRange =
    selectedTimeRange === "custom" &&
    (!customDateRange[0] || !customDateRange[1]);

  const {
    data: mainUnlockData,
    isLoading: mainUnlockLoading,
    error: mainUnlockError,
  } = useGetUnlockLockReportQuery(
    {
      vId: mainVid,
      gps_start_date: currentDateRange.start,
      gps_end_date: currentDateRange.end,
    },
    {
      skip: (!systemId && !vehId) || shouldSkipForCustomRange,
    },
  );

  const hasMainUnlocks =
    !!mainUnlockData &&
    Array.isArray(mainUnlockData.data) &&
    mainUnlockData.data.length > 0;

  const {
    data: fallbackUnlockData,
    isLoading: fallbackUnlockLoading,
    error: fallbackUnlockError,
  } = useGetUnlockLockReportQuery(
    {
      vId: fallbackVehId || 0,
      gps_start_date: currentDateRange.start,
      gps_end_date: currentDateRange.end,
    },
    {
      skip:
        !fallbackVehId ||
        shouldSkipForCustomRange ||
        hasMainUnlocks ||
        (!systemId && !vehId),
    },
  );

  const unlockData = hasMainUnlocks ? mainUnlockData : fallbackUnlockData;
  const unlockLoading = mainUnlockLoading || fallbackUnlockLoading;
  const unlockError = mainUnlockError || fallbackUnlockError;

  const { data: elockData } = useGetElockDataQuery(
    {
      vId: vehId || parseInt(systemId),
      cId: vehId || parseInt(systemId),
    },
    {
      skip: !systemId && !vehId,
    },
  );

  // Get vid from elockData.dashboard for OTP/direct commands
  const gpsDtlVid = elockData?.dashboard?.Vid;

  // Fetch OTP command data with the same date range
  const { data: otpCommandData } = useGetElockOtpCommandQuery(
    {
      vId: gpsDtlVid || vehId || parseInt(systemId),
      gps_start_date: currentDateRange.start,
      gps_end_date: currentDateRange.end,
    },
    {
      skip: (!gpsDtlVid && !systemId && !vehId) || shouldSkipForCustomRange,
    },
  );

  // Fetch Direct command data with the same date range
  const { data: directCommandData } = useGetElockDirectCommandQuery(
    {
      vId: gpsDtlVid || vehId || parseInt(systemId),
      gps_start_date: currentDateRange.start,
      gps_end_date: currentDateRange.end,
    },
    {
      skip: (!gpsDtlVid && !systemId && !vehId) || shouldSkipForCustomRange,
    },
  );

  const isWithinTimeWindow = (
    targetTime: string,
    checkTime: string,
    windowHours: number = 1,
  ): boolean => {
    const target = new Date(targetTime).getTime();
    const check = new Date(checkTime).getTime();
    const windowMs = windowHours * 60 * 60 * 1000;
    return Math.abs(target - check) <= windowMs;
  };

  // Determine unlock method based on start_time
  const getUnlockMethod = useMemo(() => {
    return (startTime: string): string => {
      const otpCommands = otpCommandData?.data || [];
      const directCommands = directCommandData?.data || [];

      // Check if unlock time matches OTP command (±1 hour)
      const matchedOtp = otpCommands.find((cmd) =>
        isWithinTimeWindow(startTime, cmd.update_time),
      );
      if (matchedOtp) {
        return "Unlocked By OTP";
      }
      const matchedDirect = directCommands.find((cmd) =>
        isWithinTimeWindow(startTime, cmd.send_datetime),
      );
      if (matchedDirect) {
        return "Unlocked By Direct Command";
      }
      return "Unlocked by Other Medium";
    };
  }, [otpCommandData, directCommandData]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const getSortableTimestamp = (timeString?: string) => {
    if (!timeString) {
      return 0;
    }

    const timestamp = new Date(timeString).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const unlockList = useMemo(() => {
    const reports = [...(unlockData?.data || [])];

    return reports.sort(
      (a, b) =>
        getSortableTimestamp(b.start_time || b.end_time) -
        getSortableTimestamp(a.start_time || a.end_time),
    );
  }, [unlockData?.data]);

  // Export data to CSV
  const exportData = () => {
    if (unlockList.length === 0) {
      return;
    }

    const headers = [
      "Lock Status",
      "Unlock Method",
      "Start Time",
      "Start Location",
      "End Time",
      "End Location",
      "Duration",
    ];
    const csvData = unlockList.map((report, index) => [
      report.event,
      report.event === "Unlocked" ? getUnlockMethod(report.start_time) : "N/A",
      formatTime(report.start_time),
      locationData[index]?.startLocation?.replace(/_/g, " ") || "N/A",
      formatTime(report.end_time),
      locationData[index]?.endLocation?.replace(/_/g, " ") || "N/A",
      report.duration,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `unlock_lock_reports_${vehicleReg || "vehicle"}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Expose exportData to parent via ref
  useImperativeHandle(ref, () => ({
    exportData,
  }));

  // Convert lat/lng to addresses for each report
  useEffect(() => {
    if (unlockList.length > 0 && userId) {
      unlockList.forEach((report, index) => {
        // Use existing location data or convert from lat/lng if not available
        const startLocation = report.start_location || "Loading...";
        const endLocation = report.end_location || "Loading...";

        // Set initial location data
        if (!locationData[index]) {
          setLocationData((prev) => ({
            ...prev,
            [index]: {
              startLocation: startLocation,
              endLocation: endLocation,
            },
          }));
        }

        // Convert start location if not provided and coordinates exist
        if (
          !report.start_location &&
          report.start_lat &&
          report.start_long &&
          locationData[index]?.startLocation === "Loading..."
        ) {
          convertLatLngToAddress({
            userId: Number(userId),
            latitude: Number(report.start_lat),
            longitude: Number(report.start_long),
          })
            .then((response) => {
              const address = response?.data?.loc || "Address not found";
              setLocationData((prev) => ({
                ...prev,
                [index]: { ...prev[index], startLocation: address },
              }));
            })
            .catch(() => {
              setLocationData((prev) => ({
                ...prev,
                [index]: {
                  ...prev[index],
                  startLocation: "Unable to fetch address",
                },
              }));
            });
        }

        // Convert end location if not provided and coordinates exist
        if (
          !report.end_location &&
          report.end_lat &&
          report.end_long &&
          locationData[index]?.endLocation === "Loading..."
        ) {
          convertLatLngToAddress({
            userId: Number(userId),
            latitude: Number(report.end_lat),
            longitude: Number(report.end_long),
          })
            .then((response) => {
              const address = response?.data?.loc || "Address not found";
              setLocationData((prev) => ({
                ...prev,
                [index]: { ...prev[index], endLocation: address },
              }));
            })
            .catch(() => {
              setLocationData((prev) => ({
                ...prev,
                [index]: {
                  ...prev[index],
                  endLocation: "Unable to fetch address",
                },
              }));
            });
        }
      });
    }
  }, [unlockList, userId, convertLatLngToAddress, locationData]);

  // Reset page when time range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTimeRange]);

  // Calculate pagination
  const totalPages = Math.ceil(unlockList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUnlocks = unlockList.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Un-Lock Reports</h2>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedTimeRange}
            onChange={handleTimeRangeChange}
            style={{ width: 120 }}
            options={[
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "week", label: "Week" },
              { value: "custom", label: "Custom" },
            ]}
          />
          {selectedTimeRange === "custom" && (
            <div className="flex items-center space-x-2">
              <CustomDatePicker
                dateRange={customDateRange}
                setDateRange={setCustomDateRange}
                showTimeSelect={false}
                format="dd/MM/yyyy"
                onComplete={handleCustomSubmit}
                datePickerStyles="py-2 px-3 h-8"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                Lock Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                Start Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200 max-w-48">
                Start Location
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                End Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200 max-w-48">
                End Location
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {unlockLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </td>
              </tr>
            ) : unlockError ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                  Error loading unlock/lock data
                </td>
              </tr>
            ) : currentUnlocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No unlock/lock reports found for the selected time range
                </td>
              </tr>
            ) : (
              currentUnlocks.map((report, index) => {
                const currentIndex = startIndex + index;
                const startAddress =
                  locationData[currentIndex]?.startLocation?.replace(
                    /_/g,
                    " ",
                  ) || "Loading...";
                const formatCoord = (v?: string | number) => {
                  const n =
                    v === null || v === undefined || v === "" ? NaN : Number(v);
                  return Number.isFinite(n) ? n.toFixed(5) : "";
                };
                const startLat = formatCoord(report.start_lat);
                const startLong = formatCoord(report.start_long);
                const startLatLng =
                  startLat && startLong ? `${startLat}, ${startLong}` : "";
                const startTooltip = startLatLng
                  ? `${startAddress} (${startLatLng})`
                  : startAddress;

                const endAddress =
                  locationData[currentIndex]?.endLocation?.replace(/_/g, " ") ||
                  "Loading...";
                const endLat = formatCoord(report.end_lat);
                const endLong = formatCoord(report.end_long);
                const endLatLng =
                  endLat && endLong ? `${endLat}, ${endLong}` : "";
                const endTooltip = endLatLng
                  ? `${endAddress} (${endLatLng})`
                  : endAddress;

                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center ${
                          report.event === "Locked"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        <p className="mr-1">{report.event}</p>
                        {report.event === "Unlocked" && (
                          <Tooltip
                            title={getUnlockMethod(report.start_time)}
                            placement="top"
                          >
                            <Image
                              src={EyeIcon}
                              width={12}
                              height={12}
                              alt="unlocked"
                              draggable="false"
                              className="cursor-pointer"
                            />
                          </Tooltip>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatTime(report.start_time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-48 truncate">
                      <Tooltip title={startTooltip} placement="topLeft">
                        <span>{startAddress}</span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatTime(report.end_time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-48 truncate">
                      <Tooltip title={endTooltip} placement="topLeft">
                        <span>{endAddress}</span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {report.duration}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, unlockList.length)}{" "}
            of {unlockList.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
                    ? "bg-[#2875DE] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UnlockLockReportsTable.displayName = "UnlockLockReportsTable";

export default UnlockLockReportsTable;
