"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Skeleton, Select, Button } from "antd";
import { useGetElockAlertReportQuery } from "@/app/_globalRedux/services/elockAlert";
import CustomDatePicker from "../common/datePicker";

interface AlertReportsTableProps {
  systemId: string;
  vehId?: number;
  fallbackVehId?: number;
  vehicleReg?: string;
}

export interface AlertReportsTableRef {
  exportData: () => void;
}

const AlertReportsTable = forwardRef<
  AlertReportsTableRef,
  AlertReportsTableProps
>(({ systemId, vehId, fallbackVehId, vehicleReg }, ref) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [currentPage, setCurrentPage] = useState(1);
  const [customDateRange, setCustomDateRange] = useState<Date[]>([
    new Date(),
    new Date(),
  ]);
  const itemsPerPage = 5;

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
        // Today only: 00:00:00 to 23:59:59 of today
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

  const dateRange = getCurrentDateRange();

  const mainVid = vehId || parseInt(systemId);
  const shouldSkipForCustomRange =
    selectedTimeRange === "custom" &&
    (!customDateRange[0] || !customDateRange[1]);

  const {
    data: mainAlertData,
    isLoading: mainAlertsLoading,
    error: mainAlertsError,
  } = useGetElockAlertReportQuery(
    {
      vId: mainVid,
      gps_start_date: dateRange.start,
      gps_end_date: dateRange.end,
    },
    {
      skip: (!systemId && !vehId) || shouldSkipForCustomRange,
    },
  );

  const hasMainAlerts =
    !!mainAlertData && Array.isArray(mainAlertData.data) && mainAlertData.data.length > 0;

  const {
    data: fallbackAlertData,
    isLoading: fallbackAlertsLoading,
    error: fallbackAlertsError,
  } = useGetElockAlertReportQuery(
    {
      vId: fallbackVehId || 0,
      gps_start_date: dateRange.start,
      gps_end_date: dateRange.end,
    },
    {
      skip:
        !fallbackVehId ||
        shouldSkipForCustomRange ||
        hasMainAlerts ||
        (!systemId && !vehId),
    },
  );

  const alertsLoading = mainAlertsLoading || fallbackAlertsLoading;
  const alertsError = mainAlertsError || fallbackAlertsError;
  const alertData = hasMainAlerts ? mainAlertData : fallbackAlertData;

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const alertList = alertData?.data || [];

  // Export data to CSV
  const exportData = () => {
    if (alertList.length === 0) {
      return;
    }

    const headers = ["Title", "Description", "Time", "Remarks"];
    const csvData = alertList.map((alert) => [
      alert.title,
      alert.description,
      formatTime(alert.log_time),
      alert.remark || "N/A",
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
      `alert_reports_${vehicleReg || "vehicle"}_${new Date().toISOString().split("T")[0]}.csv`,
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

  // Reset page when time range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTimeRange]);

  // Calculate pagination
  const totalPages = Math.ceil(alertList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlerts = alertList.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Alert Reports</h2>
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
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-200">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {alertsLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </td>
              </tr>
            ) : alertsError ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-red-500">
                  Error loading alert data
                </td>
              </tr>
            ) : currentAlerts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No alerts found for the selected time range
                </td>
              </tr>
            ) : (
              currentAlerts.map((alert, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {alert.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {alert.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatTime(alert.log_time)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {alert.remark || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, alertList.length)}{" "}
            of {alertList.length} results
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

AlertReportsTable.displayName = "AlertReportsTable";

export default AlertReportsTable;
