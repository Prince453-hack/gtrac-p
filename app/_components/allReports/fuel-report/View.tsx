"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  Input,
  Button,
  Spin,
  Dropdown,
  DatePicker,
  Tooltip as AntTooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { FuelIcon, TitleIcon } from "@/public/assets/svgs/nav";
import { ArrowUpOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetVehicleReportQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import moment from "moment";

interface IdleFuelRecord {
  vehicleNumber: string;
  idleFuel: number;
  date: string;
}

interface FuelRecord {
  key: string;
  srNo: number;
  vehicleNumber: string;
  fillingTime: string;
  event: string;
  fuel: string;
  location: string;
}

// Deduplication helper: groups by date + whole number value, uses 12-hour sliding window
const deduplicateFuelRecords = (records: FuelRecord[]): FuelRecord[] => {
  const groups: { [key: string]: FuelRecord[] } = {};

  // Group by date and whole number value (ignore decimals)
  records.forEach((record) => {
    const date = moment(record.fillingTime).format("YYYY-MM-DD");
    const wholeValue = Math.floor(parseInt(record.fuel) || 0);
    const key = `${date}-${wholeValue}-${record.vehicleNumber}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(record);
  });

  const result: FuelRecord[] = [];

  Object.values(groups).forEach((group) => {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Sort by time
      const sorted = group.sort((a, b) =>
        moment(a.fillingTime).diff(moment(b.fillingTime)),
      );

      // Keep track of which entries to keep using 12-hour sliding window
      const toKeep: FuelRecord[] = [];

      sorted.forEach((record) => {
        const recordTime = moment(record.fillingTime);

        // Check if there's any kept entry within 12 hours before this one
        const hasRecentEntry = toKeep.some((keptRecord) => {
          const keptTime = moment(keptRecord.fillingTime);
          const hoursDiff = recordTime.diff(keptTime, "hours", true);
          return hoursDiff >= 0 && hoursDiff <= 12;
        });

        // If no recent entry within 12 hours, keep this one
        if (!hasRecentEntry) {
          toKeep.push(record);
        }
      });

      result.push(...toKeep);
    }
  });

  return result;
};

const fuelColumns: ColumnsType<FuelRecord> = [
  {
    title: "Sr. No",
    dataIndex: "srNo",
    key: "srNo",
    width: 80,
  },
  {
    title: "Vehicle Number",
    dataIndex: "vehicleNumber",
    key: "vehicleNumber",
  },
  {
    title: "Filling time",
    dataIndex: "fillingTime",
    key: "fillingTime",
  },
  {
    title: "Event",
    dataIndex: "event",
    key: "event",
    sorter: (a: FuelRecord, b: FuelRecord) => a.event.localeCompare(b.event),
    render: (event: string) => (
      <span
        className={`${event === "Theft" ? "bg-red-500" : "bg-[#0C7261]"} text-white px-3 py-1 rounded-md text-sm`}
      >
        {event}
      </span>
    ),
  },
  {
    title: "Fuel",
    dataIndex: "fuel",
    key: "fuel",
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
    width: 200,
    render: (location: string) => (
      <AntTooltip title={location} placement="topLeft">
        <span className="block truncate max-w-[180px]">{location}</span>
      </AntTooltip>
    ),
  },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative">
        <div className="bg-[#1F2937] text-white text-center px-3 py-2 rounded-lg text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-lg font-bold">{payload[0].value}</p>
          <p className="text-gray-300">Litres</p>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1F2937]" />
      </div>
    );
  }
  return null;
};

const Page = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [totalFuelFill, setTotalFuelFill] = useState(0);
  const [totalFuelTheft, setTotalFuelTheft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<
    "today" | "yesterday" | "week" | "custom"
  >("week");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isChartLoading, setIsChartLoading] = useState(false);
  // Table states
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [searchText, setSearchText] = useState("");
  const [tableStartDate, setTableStartDate] = useState<string>("");
  const [tableEndDate, setTableEndDate] = useState<string>("");
  const [isTableLoading, setIsTableLoading] = useState(false);

  const [fuelChartData, setFuelChartData] = useState(() => {
    const data = [];
    for (let i = 7; i >= 1; i--) {
      data.push({
        day: moment().subtract(i, "days").format("DD MMM"),
        fullDate: moment().subtract(i, "days").format("YYYY-MM-DD"),
        value: 0,
      });
    }
    return data;
  });

  const [selectedIdleDay, setSelectedIdleDay] = useState<number>(0);
  const [idleFuelData, setIdleFuelData] = useState<IdleFuelRecord[]>([]);
  const [isIdleLoading, setIsIdleLoading] = useState(false);

  const {
    groupId: token,
    userId,
    parentUser,
  } = useSelector((state: RootState) => state.auth);

  const [getVehicleReport] = useLazyGetVehicleReportQuery();

  const endDate = moment()
    .subtract(1, "day")
    .endOf("day")
    .format("YYYY-MM-DD HH:mm");
  const startDate = moment()
    .subtract(7, "days")
    .startOf("day")
    .format("YYYY-MM-DD HH:mm");

  const weekDays = useMemo(() => {
    const days = [];

    for (let i = 7; i >= 1; i--) {
      const dayMoment = moment().subtract(i, "days");
      days.push({
        day: dayMoment.format("ddd"),
        dateNum: dayMoment.format("DD"),
        dayIndex: 8 - i, // 1 to 7
        fullDate: dayMoment.format("YYYY-MM-DD"),
        isPast: true, // All days are in the past
      });
    }
    return days;
  }, []);

  const getPeriodLabel = () => {
    switch (chartPeriod) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "custom":
        return "Custom";
      default:
        return "Last 7 Days";
    }
  };

  // Fetch vehicles using mob API
  const { data: vehiclesData, isLoading: isVehiclesLoading } =
    useGetVehiclesByStatusQuery({
      token: token?.toString() || "",
      userId: userId?.toString() || "",
      pUserId: parentUser?.toString() || "1",
      mode: "",
    });

  // Filter vehicles with fuel <= 100
  const filteredVehicles = useMemo(() => {
    return (vehiclesData?.list || []).filter((vehicle: any) => {
      return vehicle.gpsDtl?.fuel && vehicle.gpsDtl.fuel <= 100;
    });
  }, [vehiclesData?.list]);

  // Fetch fuel data for ALL filtered vehicles
  useEffect(() => {
    const fetchAllFuelData = async () => {
      if (!filteredVehicles.length || !userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      let fillTotal = 0;
      let theftTotal = 0;
      const allRecords: FuelRecord[] = [];
      let recordCounter = 1;

      // Track fuel by date (last 7 days)
      const dateFuelMap: { [key: string]: number } = {};
      for (let i = 7; i >= 1; i--) {
        const dateKey = moment().subtract(i, "days").format("YYYY-MM-DD");
        dateFuelMap[dateKey] = 0;
      }

      const baseUrl = process.env.NEXT_PUBLIC_TRACKING_DASHBOARD;
      const encodedStartDate = encodeURIComponent(startDate);
      const encodedEndDate = encodeURIComponent(endDate);

      for (const vehicle of filteredVehicles) {
        try {
          const fillRes = await fetch(
            `${baseUrl}/AllFillTheftLog?sys_service_id=${vehicle.vId}&startdate=${encodedStartDate}&enddate=${encodedEndDate}&TypeFT=1&userid=${userId}`,
          );
          const fillData = await fillRes.json();

          if (fillData?.success && fillData?.list) {
            fillData.list.forEach((item: any) => {
              const fuelValue = parseFloat(item.value) || 0;
              const isTheft = item.type?.toLowerCase().includes("theft");

              if (isTheft) {
                theftTotal += fuelValue;
              } else {
                fillTotal += fuelValue;
                const dateKey = moment(item.fillingTime).format("YYYY-MM-DD");
                if (dateFuelMap[dateKey] !== undefined) {
                  dateFuelMap[dateKey] += fuelValue;
                }
              }

              allRecords.push({
                key: `${isTheft ? "theft" : "fill"}-${vehicle.vId}-${recordCounter}`,
                srNo: recordCounter++,
                vehicleNumber: vehicle.vehReg || vehicle.vId.toString(),
                fillingTime: item.fillingTime || "",
                event: isTheft ? "Theft" : "Filling",
                fuel: `${Math.round(fuelValue)}L`,
                location: item.event_address?.replace(/_/g, " ") || "N/A",
              });
            });
          }

          const theftRes = await fetch(
            `${baseUrl}/AllFillTheftLog?sys_service_id=${vehicle.vId}&startdate=${encodedStartDate}&enddate=${encodedEndDate}&TypeFT=2&userid=${userId}`,
          );
          const theftData = await theftRes.json();

          if (theftData?.success && theftData?.list) {
            theftData.list.forEach((item: any) => {
              const fuelValue = parseFloat(item.value) || 0;
              const isTheft = item.type?.toLowerCase().includes("theft");

              if (isTheft) {
                theftTotal += fuelValue;
              } else {
                fillTotal += fuelValue;
              }

              // Add records to table
              allRecords.push({
                key: `${isTheft ? "theft" : "fill"}-${vehicle.vId}-${recordCounter}`,
                srNo: recordCounter++,
                vehicleNumber: vehicle.vehReg || vehicle.vId.toString(),
                fillingTime: item.fillingTime || "",
                event: isTheft ? "Theft" : "Filling",
                fuel: `${Math.round(fuelValue)}L`,
                location: item.event_address?.replace(/_/g, " ") || "N/A",
              });
            });
          }
        } catch (error) {
          // Error fetching data for vehicle
        }
      }

      setTotalFuelFill(fillTotal);
      setTotalFuelTheft(theftTotal);

      // Update chart data with fuel grouped by date
      const chartDataByDate = [];
      for (let i = 7; i >= 1; i--) {
        const dateKey = moment().subtract(i, "days").format("YYYY-MM-DD");
        const displayLabel = moment().subtract(i, "days").format("DD MMM");
        chartDataByDate.push({
          day: displayLabel,
          fullDate: dateKey,
          value: Math.round(dateFuelMap[dateKey] || 0),
        });
      }
      setFuelChartData(chartDataByDate);

      allRecords.sort(
        (a, b) =>
          moment(b.fillingTime).valueOf() - moment(a.fillingTime).valueOf(),
      );
      const deduplicatedRecords = deduplicateFuelRecords(allRecords);
      deduplicatedRecords.sort(
        (a, b) =>
          moment(b.fillingTime).valueOf() - moment(a.fillingTime).valueOf(),
      );
      deduplicatedRecords.forEach((record, index) => {
        record.srNo = index + 1;
      });
      setFuelRecords(deduplicatedRecords);

      setIsLoading(false);
    };

    if (!isVehiclesLoading && filteredVehicles.length > 0) {
      fetchAllFuelData();
    }
  }, [filteredVehicles, userId, startDate, endDate, isVehiclesLoading]);

  // Fetch idle fuel data for all vehicles
  const fetchIdleFuelData = async (targetDate?: string) => {
    if (!filteredVehicles.length || !userId || !token) return;

    setIsIdleLoading(true);
    const allIdleData: IdleFuelRecord[] = [];
    const queryStartDate = targetDate || startDate;
    const queryEndDate = targetDate || endDate;

    for (const vehicle of filteredVehicles) {
      try {
        const response = await getVehicleReport({
          vId: vehicle.vId,
          startdate: queryStartDate,
          enddate: queryEndDate,
          requestfor: parseInt(token?.toString() || "0"),
          userid: parseInt(userId?.toString() || "0"),
        }).unwrap();

        if (response?.list?.[0]) {
          const reportData = response.list[0];
          const idleFuel = parseFloat(reportData.idle_fuel_consumed || "0");
          if (idleFuel > 0) {
            allIdleData.push({
              vehicleNumber: vehicle.vehReg || vehicle.vId.toString(),
              idleFuel: Math.round(idleFuel),
              date: queryStartDate,
            });
          }
        }
      } catch (error) {
        // Error fetching idle data for vehicle
      }
    }

    // Sort by idle fuel descending
    allIdleData.sort((a, b) => b.idleFuel - a.idleFuel);
    setIdleFuelData(allIdleData);
    setIsIdleLoading(false);
  };

  // Fetch idle data when vehicles are loaded
  useEffect(() => {
    if (!isVehiclesLoading && filteredVehicles.length > 0) {
      fetchIdleFuelData();
    }
  }, [filteredVehicles, isVehiclesLoading]);

  // Handle idle day click
  const handleIdleDayClick = (dayIndex: number) => {
    const selectedDay = weekDays.find((d) => d.dayIndex === dayIndex);
    if (selectedDay && selectedDay.isPast) {
      setSelectedIdleDay(dayIndex);
      fetchIdleFuelData(selectedDay.fullDate);
    }
  };

  // Fetch chart data based on selected period
  const fetchChartData = async (chartStart: string, chartEnd: string) => {
    if (!filteredVehicles.length || !userId) return;

    setIsChartLoading(true);
    // Track fuel by date (last 7 days)
    const dateFuelMap: { [key: string]: number } = {};
    for (let i = 7; i >= 1; i--) {
      const dateKey = moment().subtract(i, "days").format("YYYY-MM-DD");
      dateFuelMap[dateKey] = 0;
    }

    const baseUrl = process.env.NEXT_PUBLIC_TRACKING_DASHBOARD;

    for (const vehicle of filteredVehicles) {
      try {
        const encodedStart = chartStart.replace(" ", "%20");
        const encodedEnd = chartEnd.replace(" ", "%20");
        const fillRes = await fetch(
          `${baseUrl}/AllFillTheftLog?sys_service_id=${vehicle.vId}&startdate=${encodedStart}&enddate=${encodedEnd}&TypeFT=1&userid=${userId}`,
        );
        const fillData = await fillRes.json();

        if (fillData?.success && fillData?.list) {
          fillData.list.forEach((item: any) => {
            const fuelValue = parseFloat(item.value) || 0;
            const isTheft = item.type?.toLowerCase().includes("theft");
            // Only add non-theft (filling) records to chart
            if (!isTheft) {
              const dateKey = moment(item.fillingTime).format("YYYY-MM-DD");
              if (dateFuelMap[dateKey] !== undefined) {
                dateFuelMap[dateKey] += fuelValue;
              }
            }
          });
        }
      } catch (error) {
        // Error fetching data
      }
    }

    // Build chart data from date map
    const chartDataByDate: { day: string; fullDate: string; value: number }[] =
      [];
    for (let i = 7; i >= 1; i--) {
      const dateKey = moment().subtract(i, "days").format("YYYY-MM-DD");
      const displayLabel = moment().subtract(i, "days").format("DD MMM");
      chartDataByDate.push({
        day: displayLabel,
        fullDate: dateKey,
        value: Math.round(dateFuelMap[dateKey] || 0),
      });
    }
    setFuelChartData(chartDataByDate);
    setIsChartLoading(false);
  };

  // Handle period change
  const handlePeriodChange = (
    period: "today" | "yesterday" | "week" | "custom",
  ) => {
    setChartPeriod(period);
    if (period === "custom") {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      let range;
      if (period === "today") {
        range = {
          start: moment().startOf("day").format("YYYY-MM-DD HH:mm"),
          end: moment().endOf("day").format("YYYY-MM-DD HH:mm"),
        };
      } else if (period === "yesterday") {
        range = {
          start: moment()
            .subtract(1, "day")
            .startOf("day")
            .format("YYYY-MM-DD HH:mm"),
          end: moment()
            .subtract(1, "day")
            .endOf("day")
            .format("YYYY-MM-DD HH:mm"),
        };
      } else {
        range = { start: startDate, end: endDate };
      }
      fetchChartData(range.start, range.end);
    }
  };

  // Handle custom date submit
  const handleCustomSubmit = () => {
    if (customStartDate && customEndDate) {
      fetchChartData(customStartDate, customEndDate);
      setShowCustomPicker(false);
    }
  };

  // Dropdown menu items
  const periodMenuItems = [
    {
      key: "today",
      label: "Today",
      onClick: () => handlePeriodChange("today"),
    },
    {
      key: "yesterday",
      label: "Yesterday",
      onClick: () => handlePeriodChange("yesterday"),
    },
    {
      key: "week",
      label: "Last 7 Days",
      onClick: () => handlePeriodChange("week"),
    },
    {
      key: "custom",
      label: "Custom",
      onClick: () => handlePeriodChange("custom"),
    },
  ];

  // Filter table data based on search text
  const filteredTableData = useMemo(() => {
    if (!searchText) return fuelRecords;
    return fuelRecords.filter((record) =>
      record.vehicleNumber.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [fuelRecords, searchText]);

  // Fetch table data for specific date range
  const fetchTableData = async (tblStart: string, tblEnd: string) => {
    if (!filteredVehicles.length || !userId) return;

    setIsTableLoading(true);
    const allRecords: FuelRecord[] = [];
    let recordCounter = 1;
    const baseUrl = process.env.NEXT_PUBLIC_TRACKING_DASHBOARD;

    for (const vehicle of filteredVehicles) {
      try {
        // Fetch Fill data
        const fillRes = await fetch(
          `${baseUrl}/AllFillTheftLog?sys_service_id=${vehicle.vId}&startdate=${tblStart}&enddate=${tblEnd}&TypeFT=1&userid=${userId}`,
        );
        const fillData = await fillRes.json();

        if (fillData?.success && fillData?.list) {
          fillData.list.forEach((item: any) => {
            const fuelValue = parseFloat(item.value) || 0;
            const isTheft = item.type?.toLowerCase().includes("theft");
            allRecords.push({
              key: `${isTheft ? "theft" : "fill"}-${vehicle.vId}-${recordCounter}`,
              srNo: recordCounter++,
              vehicleNumber: vehicle.vehReg || vehicle.vId.toString(),
              fillingTime: item.fillingTime || "",
              event: isTheft ? "Theft" : "Filling",
              fuel: `${Math.round(fuelValue)}L`,
              location: item.event_address?.replace(/_/g, " ") || "N/A",
            });
          });
        }

        // Fetch Theft data
        const theftRes = await fetch(
          `${baseUrl}/AllFillTheftLog?sys_service_id=${vehicle.vId}&startdate=${tblStart}&enddate=${tblEnd}&TypeFT=2&userid=${userId}`,
        );
        const theftData = await theftRes.json();

        if (theftData?.success && theftData?.list) {
          theftData.list.forEach((item: any) => {
            const fuelValue = parseFloat(item.value) || 0;
            const isTheft = item.type?.toLowerCase().includes("theft");
            allRecords.push({
              key: `${isTheft ? "theft" : "fill"}-${vehicle.vId}-${recordCounter}`,
              srNo: recordCounter++,
              vehicleNumber: vehicle.vehReg || vehicle.vId.toString(),
              fillingTime: item.fillingTime || "",
              event: isTheft ? "Theft" : "Filling",
              fuel: `${Math.round(fuelValue)}L`,
              location: item.event_address?.replace(/_/g, " ") || "N/A",
            });
          });
        }
      } catch (error) {
        // Error fetching data
      }
    }

    allRecords.sort(
      (a, b) =>
        moment(b.fillingTime).valueOf() - moment(a.fillingTime).valueOf(),
    );
    const deduplicatedRecords = deduplicateFuelRecords(allRecords);
    deduplicatedRecords.sort(
      (a, b) =>
        moment(b.fillingTime).valueOf() - moment(a.fillingTime).valueOf(),
    );
    deduplicatedRecords.forEach((record, index) => {
      record.srNo = index + 1;
    });
    setFuelRecords(deduplicatedRecords);
    setIsTableLoading(false);
  };

  // Handle table date filter submit
  const handleTableDateSubmit = () => {
    if (tableStartDate && tableEndDate) {
      fetchTableData(tableStartDate, tableEndDate);
    }
  };

  // Export to Excel/CSV
  const exportToExcel = () => {
    const dataToExport =
      filteredTableData.length > 0 ? filteredTableData : fuelRecords;
    if (dataToExport.length === 0) return;

    const headers = [
      "Sr. No",
      "Vehicle Number",
      "Filling Time",
      "Event",
      "Fuel",
      "Location",
    ];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((row) =>
        [
          row.srNo,
          row.vehicleNumber,
          row.fillingTime,
          row.event,
          row.fuel,
          `"${row.location.replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fuel_report_${moment().format("YYYY-MM-DD")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`p-2 pb-8 bg-gray-100 min-h-screen overflow-y-auto ${
        isFullScreen ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* Top Section - Always visible */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white col-span-2 flex flex-col space-y-1.5 px-4 py-3 rounded-lg shadow-sm">
          <h1 className="font-medium text-xl text-gray-800">Fuel Monitoring</h1>
          <p className="text-sm text-gray-500">
            Fuel insights that keep your journey efficient.
          </p>
        </div>

        <div className="col-span-2 bg-white rounded-lg shadow-sm py-3 px-8 flex items-center justify-between">
          <div className="flex items-center justify-center space-x-2">
            <div className="text-2xl border border-gray-300 px-3 py-2 rounded-lg">
              <Image
                src={FuelIcon}
                alt="Title"
                width={23}
                height={23}
                draggable="false"
              />
            </div>
            <div className="flex flex-col space-y-0.5">
              <h1 className="text-sm text-gray-600">Total Fuel Fill</h1>
              <p className="font-semibold text-2xl text-gray-900">
                {isLoading ? (
                  <Spin size="small" />
                ) : (
                  `${totalFuelFill.toLocaleString()} L`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div className="text-2xl border border-gray-300 px-3 py-2 rounded-lg">
              <Image
                src={FuelIcon}
                alt="Title"
                width={23}
                height={23}
                draggable="false"
              />
            </div>
            <div className="flex flex-col space-y-0.5">
              <h1 className="text-sm text-gray-600">Total Fuel Theft</h1>
              <p className="font-semibold text-2xl text-gray-900">
                {isLoading ? (
                  <Spin size="small" />
                ) : (
                  `${totalFuelTheft.toLocaleString()} L`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Hidden in fullscreen */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isFullScreen ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100 mt-3"
        }`}
      >
        <div className="grid grid-cols-3 gap-3">
          {/* Fuel Report Chart */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm h-72 p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Image
                  src={TitleIcon}
                  alt="Title"
                  width={25}
                  height={25}
                  draggable="false"
                />
                <h1 className="font-medium text-gray-800">Fuel Report</h1>
              </div>
              <div className="flex items-center space-x-2">
                {showCustomPicker && (
                  <div className="flex items-center space-x-2">
                    <DatePicker
                      placeholder="Start Date"
                      size="small"
                      onChange={(date) =>
                        setCustomStartDate(
                          date ? date.format("YYYY-MM-DD") : "",
                        )
                      }
                    />
                    <DatePicker
                      placeholder="End Date"
                      size="small"
                      onChange={(date) =>
                        setCustomEndDate(date ? date.format("YYYY-MM-DD") : "")
                      }
                    />
                    <Button
                      type="primary"
                      size="small"
                      className="bg-[#0C7261] hover:bg-[#0a6355]"
                      onClick={handleCustomSubmit}
                      loading={isChartLoading}
                    >
                      Submit
                    </Button>
                  </div>
                )}
                <Dropdown menu={{ items: periodMenuItems }} trigger={["click"]}>
                  <button className="flex items-center space-x-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600">
                    <span>{getPeriodLabel()}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </Dropdown>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full">
              {isChartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fuelChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      content={<CustomTooltip />}
                    />
                    <defs>
                      <linearGradient
                        id="barGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#0C7261" />
                        <stop offset="100%" stopColor="#4FA597" />
                      </linearGradient>
                    </defs>
                    <Bar
                      dataKey="value"
                      fill="url(#barGradient)"
                      radius={[10, 10, 10, 10]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Fuel Consumed Idle */}
          <div className="col-span-1 bg-white rounded-xl shadow-sm h-72 p-2">
            <div className="flex items-center justify-start space-x-1">
              <Image
                src={TitleIcon}
                alt="Title"
                width={25}
                height={25}
                draggable="false"
              />
              <h1>Fuel Consumed (Idle)</h1>
            </div>

            <div className="flex items-center justify-center space-x-3 mb-3 mt-2 mx-1">
              {weekDays.map((item) => (
                <div
                  key={item.dayIndex}
                  onClick={() =>
                    item.isPast && handleIdleDayClick(item.dayIndex)
                  }
                  className={`flex text-xs flex-col items-center border text-center w-10 px-1 py-4 rounded-full transition-all ${
                    selectedIdleDay === item.dayIndex
                      ? "bg-[#4FA597] text-white border-transparent cursor-pointer"
                      : item.isPast
                        ? "border-gray-400 text-gray-700 cursor-pointer hover:bg-gray-100"
                        : "border-gray-200 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <span className="text-[10px]">{item.day}</span>
                  <span className="text-xs font-medium">{item.dateNum}</span>

                  <div className="w-1 h-1 rounded-full bg-white mt-1" />
                </div>
              ))}
            </div>

            <div className="mt-2 px-2 max-h-40 overflow-y-auto scroll-smooth">
              {isIdleLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Spin size="small" />
                </div>
              ) : idleFuelData.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                  No idle fuel data
                </div>
              ) : (
                idleFuelData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-200 pb-1 mb-1"
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <div className="size-2 rounded-full bg-[#0C7261]" />
                      <p className="text-[13px] truncate max-w-[100px]">
                        {item.vehicleNumber}
                      </p>
                    </div>
                    <div
                      className={`flex items-center justify-center space-x-px p-1 text-xs rounded-xl ${
                        item.idleFuel > 20
                          ? "bg-red-100 text-red-600"
                          : "bg-[#13D65A1A] text-[#0BA94A]"
                      }`}
                    >
                      <ArrowUpOutlined className="size-3 mr-1" />
                      {item.idleFuel}L
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/*Data Section*/}
      <div
        className={`bg-white rounded-2xl w-full shadow-md p-4 transition-all duration-300 mt-3 mb-7 ${
          isFullScreen ? "h-[calc(100vh-110px)] flex flex-col" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <Image
              src={TitleIcon}
              alt="Title"
              width={25}
              height={25}
              draggable="false"
            />
            <h1 className="font-medium text-gray-800">Fuel Details</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Input
              placeholder="Search Vehicle"
              className="w-48"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              suffix={
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
            <DatePicker
              placeholder="Start Date"
              size="middle"
              onChange={(date) =>
                setTableStartDate(date ? date.format("YYYY-MM-DD") : "")
              }
            />
            <DatePicker
              placeholder="End Date"
              size="middle"
              onChange={(date) =>
                setTableEndDate(date ? date.format("YYYY-MM-DD") : "")
              }
            />
            <Button
              type="primary"
              size="middle"
              className="bg-[#0C7261] hover:bg-[#0a6355]"
              onClick={handleTableDateSubmit}
              loading={isTableLoading}
              disabled={!tableStartDate || !tableEndDate}
            >
              Filter
            </Button>
            <Button
              type="primary"
              className="bg-[#0C7261] hover:bg-[#0a6355] flex items-center space-x-1"
              onClick={exportToExcel}
              disabled={filteredTableData.length === 0}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export Excel</span>
            </Button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="border border-gray-200 rounded-md p-1.5 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isFullScreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={isFullScreen ? "flex-1 overflow-hidden" : ""}>
          <Spin spinning={isTableLoading || isLoading}>
            <Table
              columns={fuelColumns}
              dataSource={filteredTableData}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total) => `Total ${total} records`,
              }}
              scroll={isFullScreen ? { y: "calc(100vh - 300px)" } : { y: 200 }}
              className="fuel-table"
            />
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default Page;
