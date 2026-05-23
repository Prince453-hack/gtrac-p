"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import VehicleTable, { Vehicle } from "./VehicleTable";

export default function Home() {
  const [data, setData] = useState<Vehicle[]>([]);
  const [timeFilter, setTimeFilter] = useState("six_to_nine");
  const [dayFilter, setDayFilter] = useState("all");

  // Initialize with current date to prevent hydration mismatch
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  useEffect(() => {
    fetch("https://gtrac.in:3636/api/vehicle-sequences")
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          setData(response.data.data);
        }
      })
      .catch((err) => console.error("Error fetching:", err));
  }, []);

  // Generate year options (current year ± 2 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 2; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  const years = generateYears();
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getMonthYearDisplay = () => {
    return format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy");
  };

  const handleExportToExcel = async () => {
    try {
      const filteredData = data.filter((item) => {
        const itemDate = new Date(item.date);
        const monthMatch =
          itemDate.getMonth() === selectedMonth &&
          itemDate.getFullYear() === selectedYear;

        if (!monthMatch) return false;

        // Day filter
        const dayName = itemDate
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();

        if (dayFilter === "saturday" && dayName !== "saturday") return false;
        if (dayFilter === "sunday" && dayName !== "sunday") return false;
        if (
          dayFilter === "weekdays" &&
          (dayName === "saturday" || dayName === "sunday")
        )
          return false;
        if (
          dayFilter === "weekoff" &&
          !(dayName === "saturday" || dayName === "sunday")
        ) {
          return false;
        }

        // Distance filter
        const km =
          timeFilter === "six_to_nine"
            ? item.six_to_nine_km
            : timeFilter === "nine_to_six"
              ? item.nine_to_six_km
              : item.total_distance;

        if (!km || km === 0) return false;

        return true;
      });

      const groupedData = filteredData.reduce(
        (acc, item) => {
          if (!acc[item.vehicle_no]) acc[item.vehicle_no] = {};
          const date = new Date(item.date).getDate();
          acc[item.vehicle_no][date] = item;
          return acc;
        },
        {} as Record<string, Record<number, Vehicle>>,
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Vehicle Data");

      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
      ).getDate();

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // Filter dates for Excel based on dayFilter
      const allowedDates: number[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(selectedYear, selectedMonth, d);
        const dayName = dateObj
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();

        if (dayFilter === "saturday" && dayName !== "saturday") continue;
        if (dayFilter === "sunday" && dayName !== "sunday") continue;
        if (
          dayFilter === "weekdays" &&
          (dayName === "saturday" || dayName === "sunday")
        )
          continue;
        if (
          dayFilter === "weekoff" &&
          !(dayName === "saturday" || dayName === "sunday")
        )
          continue;

        allowedDates.push(d);
      }

      // --------------------------
      // Headers
      // --------------------------

      const dateHeader = ["Vehicle No"];
      const subHeader = [""];

      allowedDates.forEach((day) => {
        const dateObj = new Date(selectedYear, selectedMonth, day);
        const headerText = `${
          days[dateObj.getDay()]
        }/${day} ${dateObj.toLocaleString("default", { month: "short" })}`;

        // 5 columns per day
        for (let i = 0; i < 5; i++) {
          dateHeader.push(headerText);
        }
        subHeader.push("Distance", "Start", "End", "Run", "Stop");
      });

      worksheet.addRow(dateHeader);
      worksheet.addRow(subHeader);

      let colIndex = 2;
      allowedDates.forEach(() => {
        worksheet.mergeCells(1, colIndex, 1, colIndex + 4);
        colIndex += 5;
      });

      // ============================
      // 4️⃣ ROW CREATION (Only filtered dates)
      // ============================

      Object.keys(groupedData).forEach((vehicleNo) => {
        const row: (string | number)[] = [vehicleNo];

        allowedDates.forEach((d) => {
          const item = groupedData[vehicleNo][d];

          if (!item) {
            row.push("N/A", "N/A", "N/A", "N/A", "N/A");
            return;
          }

          const km =
            timeFilter === "six_to_nine"
              ? item.six_to_nine_km
              : timeFilter === "nine_to_six"
                ? item.nine_to_six_km
                : item.total_distance;

          row.push(
            km ?? "N/A",
            timeFilter === "six_to_nine"
              ? item.six_to_nine_start_time
              : timeFilter === "nine_to_six"
                ? item.nine_to_six_start_time
                : item.start_time,

            timeFilter === "six_to_nine"
              ? item.six_to_nine_end_time
              : timeFilter === "nine_to_six"
                ? item.nine_to_six_end_time
                : item.end_time,

            timeFilter === "six_to_nine"
              ? item.six_to_nine_running
              : timeFilter === "nine_to_six"
                ? item.nine_to_six_running
                : item.running,

            timeFilter === "six_to_nine"
              ? item.six_to_nine_stoppage_hrs
              : timeFilter === "nine_to_six"
                ? item.nine_to_six_stoppage_hrs
                : item.stoppage_hrs,
          );
        });

        worksheet.addRow(row);
      });

      // Export File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `VehicleData-${selectedYear}-${selectedMonth + 1}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 overflow-y-auto">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Vehicle Performance Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monthly calendar view with comprehensive metrics
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end text-black">
            {/* Month Selector */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month & Year
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Previous Month"
                >
                  ←
                </button>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextMonth}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Next Month"
                >
                  →
                </button>
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="six_to_nine">6 AM - 9 PM</option>
                <option value="nine_to_six">9 PM - 6 AM</option>
              </select>
            </div>

            {/* Day Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days
              </label>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Days</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekoff">Weekoff</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                  setTimeFilter("all");
                  setDayFilter("all");
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Reset All
              </button>
            </div>

            <button
              onClick={handleExportToExcel}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              Export to Excel
            </button>
          </div>

          {/* Active Filters Summary */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-blue-900">Viewing:</span>
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-200 text-blue-800 font-medium">
                📅 {getMonthYearDisplay()}
              </span>
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-200 text-blue-800">
                ⏰{" "}
                {timeFilter === "all"
                  ? "24 Hours"
                  : timeFilter === "six_to_nine"
                    ? "6AM-9PM"
                    : "9PM-6AM"}
              </span>
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-200 text-blue-800">
                📆{" "}
                {dayFilter === "all"
                  ? "All Days"
                  : dayFilter === "weekdays"
                    ? "Weekdays"
                    : dayFilter === "weekoff"
                      ? "Weekoff (Sat & Sun)"
                      : dayFilter.charAt(0).toUpperCase() + dayFilter.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Table with Widgets */}
        <div className="sticky top-0 z-50 bg-white">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <VehicleTable
              data={data}
              timeFilter={timeFilter}
              dayFilter={dayFilter}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
