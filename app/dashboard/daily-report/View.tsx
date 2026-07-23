"use client";

import {
  useLazyGetAllVehiclesQuery,
  useLazyGetpathwithDateDaignosticQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import {
  CalendarOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Spin,
  Statistic,
  Table,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

interface SlotData {
  distance: number;
  maxSpeed: number;
}

interface VehicleReportRow {
  key: string;
  veh_id: number;
  vehicleNum: string;
  slots: { [slotIndex: number]: SlotData };
  totalKm: number;
  totalMaxSpeed: number;
  loading: boolean;
}

const SLOTS = [
  { start: "00:00", end: "02:00", label: "00:00 - 02:00" },
  { start: "02:00", end: "04:00", label: "02:00 - 04:00" },
  { start: "04:00", end: "06:00", label: "04:00 - 06:00" },
  { start: "06:00", end: "08:00", label: "06:00 - 08:00" },
  { start: "08:00", end: "10:00", label: "08:00 - 10:00" },
  { start: "10:00", end: "12:00", label: "10:00 - 12:00" },
  { start: "12:00", end: "14:00", label: "12:00 - 14:00" },
  { start: "14:00", end: "16:00", label: "14:00 - 16:00" },
  { start: "16:00", end: "18:00", label: "16:00 - 18:00" },
  { start: "18:00", end: "20:00", label: "18:00 - 20:00" },
  { start: "20:00", end: "22:00", label: "20:00 - 22:00" },
  { start: "22:00", end: "00:00", label: "22:00 - 00:00" },
];

const getHourFromDatetime = (dt: string) => {
  if (!dt) return -1;
  try {
    const parts = dt.trim().split(/\s+/);
    const timePart = parts.length > 1 ? parts[1] : parts[0];
    if (timePart && timePart.includes(":")) {
      return parseInt(timePart.split(":")[0]);
    }
  } catch (e) {
    // ignore
  }
  return -1;
};

export const View = () => {
  const { groupId, userId } = useSelector((state: RootState) => state.auth);
  const allVehicles = useSelector((state: RootState) => state.allVehicles);

  // Filter States
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    dayjs().subtract(1, "day"),
  );

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Report States
  const [reportList, setReportList] = useState<VehicleReportRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [triggerAllVehicles] = useLazyGetAllVehiclesQuery();
  const [triggerPathDiagnostic] = useLazyGetpathwithDateDaignosticQuery();

  const filteredReportList = useMemo(() => {
    if (!searchText) return reportList;
    return reportList.filter((v) =>
      v.vehicleNum.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [reportList, searchText]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  // useEffect to only fetch path diagnostics for visible page vehicles (at max 10 at a time)
  useEffect(() => {
    if (filteredReportList.length === 0 || !userId) return;

    // Calculate visible rows on the current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleVehicles = filteredReportList.slice(startIndex, endIndex);

    // Find which visible vehicles still need loading
    const vehiclesToLoad = visibleVehicles.filter((v) => v.loading);

    if (vehiclesToLoad.length === 0) return;

    const startDateStr = selectedDate.format("YYYY-MM-DD 00:00:00");
    const endDateStr = selectedDate.format("YYYY-MM-DD 23:59:59");

    // Fetch diagnostics only for the visible vehicles
    vehiclesToLoad.forEach(async (vehicle) => {
      try {
        const pathData = await triggerPathDiagnostic({
          vId: vehicle.veh_id,
          startDate: startDateStr,
          endDate: endDateStr,
          userId: String(userId),
        }).unwrap();

        const slots = Array.from({ length: 12 }).reduce<{
          [key: number]: SlotData;
        }>((acc, _, idx) => {
          acc[idx] = { distance: 0, maxSpeed: 0 };
          return acc;
        }, {});

        if (pathData?.data && Array.isArray(pathData.data)) {
          pathData.data.forEach((segment: any) => {
            const distance = parseFloat(segment.totalDistance) || 0;
            const timeMin = Number(segment.totalTimeInMIN) || 0;
            const speed = timeMin > 0 ? distance / (timeMin / 60) : 0;

            const hour = getHourFromDatetime(segment.fromTimetoMatch);
            if (hour >= 0 && hour < 24) {
              const slotIndex = Math.floor(hour / 2);
              slots[slotIndex].distance += distance;
              if (
                segment.mode === "Running" &&
                speed > slots[slotIndex].maxSpeed
              ) {
                slots[slotIndex].maxSpeed = speed;
              }
            }
          });
        }

        const totalKm =
          parseFloat(
            String(pathData?.totalDistance || "0").replace(/[^\d.]/g, ""),
          ) || 0;
        const totalMaxSpeed = Math.max(
          0,
          ...Object.values(slots).map((s) => s.maxSpeed),
        );

        setReportList((prev) =>
          prev.map((row) =>
            row.veh_id === vehicle.veh_id
              ? { ...row, slots, totalKm, totalMaxSpeed, loading: false }
              : row,
          ),
        );
      } catch (err) {
        console.error(
          `Failed to fetch path diagnostics for ${vehicle.vehicleNum}:`,
          err,
        );
        setReportList((prev) =>
          prev.map((row) =>
            row.veh_id === vehicle.veh_id ? { ...row, loading: false } : row,
          ),
        );
      }
    });
  }, [
    currentPage,
    pageSize,
    filteredReportList,
    selectedDate,
    userId,
    triggerPathDiagnostic,
  ]);

  const handleGenerateReport = async () => {
    if (!groupId || !userId) {
      message.error("Authentication session missing. Please log in again.");
      return;
    }

    setIsLoading(true);
    setReportList([]);
    setCurrentPage(1); // Reset page on new generate

    // Fetch vehicles list if not already available in Redux
    let targetVehicles = allVehicles.filter(
      (v) => v.id !== 0 && v.veh_reg !== "",
    );
    if (targetVehicles.length === 0) {
      try {
        const res = await triggerAllVehicles({
          token: String(groupId),
        }).unwrap();
        if (res?.list) {
          targetVehicles = res.list.filter(
            (v: any) => v.id !== 0 && v.veh_reg !== "",
          );
        }
      } catch (err) {
        console.error("Failed to fetch vehicles list:", err);
      }
    }

    if (targetVehicles.length === 0) {
      message.warning("No vehicles found in your account.");
      setIsLoading(false);
      return;
    }

    // Prepare initial state of report rows with loading status
    const initialRows: VehicleReportRow[] = targetVehicles.map((v) => ({
      key: String(v.id),
      veh_id: Number(v.id),
      vehicleNum: String(v.veh_reg),
      slots: Array.from({ length: 12 }).reduce<{ [key: number]: SlotData }>(
        (acc, _, idx) => {
          acc[idx] = { distance: 0, maxSpeed: 0 };
          return acc;
        },
        {},
      ),
      totalKm: 0,
      totalMaxSpeed: 0,
      loading: true,
    }));

    setReportList(initialRows);
    setIsLoading(false);
  };

  const [hasAutoRun, setHasAutoRun] = useState(false);

  useEffect(() => {
    if (groupId && userId && !hasAutoRun) {
      setHasAutoRun(true);
      handleGenerateReport();
    }
  }, [groupId, userId, hasAutoRun]);

  const handleExportCSV = () => {
    if (reportList.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const headers = [
      "S.No",
      "Vehicle Registration",
      "Total KM",
      "Total Max Speed (KM/H)",
      ...SLOTS.flatMap((s) => [
        `${s.label} (KM)`,
        `${s.label} Max Speed (KM/H)`,
      ]),
    ];

    const csvRows = [
      headers,
      ...reportList.map((item, index) => [
        index + 1,
        item.vehicleNum,
        item.totalKm.toFixed(2),
        item.totalMaxSpeed.toFixed(0),
        ...SLOTS.flatMap((_, idx) => {
          const slot = item.slots[idx];
          return slot
            ? [slot.distance.toFixed(2), slot.maxSpeed.toFixed(0)]
            : ["0.00", "0"];
        }),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `daily_time_slot_report_${selectedDate.format("YYYY-MM-DD")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      width: 70,
      fixed: "left" as const,
      align: "center" as const,
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Vehicle Registration",
      dataIndex: "vehicleNum",
      key: "vehicleNum",
      width: 150,
      fixed: "left" as const,
      sorter: (a: VehicleReportRow, b: VehicleReportRow) =>
        a.vehicleNum.localeCompare(b.vehicleNum),
    },
    {
      title: "Total KM",
      dataIndex: "totalKm",
      key: "totalKm",
      width: 110,
      align: "right" as const,
      sorter: (a: VehicleReportRow, b: VehicleReportRow) =>
        a.totalKm - b.totalKm,
      render: (val: number) => (
        <span className="font-semibold text-emerald-600">
          {val.toFixed(2)} KM
        </span>
      ),
    },
    {
      title: "Total Max Speed",
      dataIndex: "totalMaxSpeed",
      key: "totalMaxSpeed",
      width: 130,
      align: "right" as const,
      sorter: (a: VehicleReportRow, b: VehicleReportRow) =>
        a.totalMaxSpeed - b.totalMaxSpeed,
      render: (val: number) => (
        <span
          className={`font-semibold ${
            val > 80 ? "text-rose-600" : "text-neutral-700"
          }`}
        >
          {val.toFixed(0)} KM/H
        </span>
      ),
    },
    ...SLOTS.map((slot, index) => ({
      title: slot.label,
      key: `slot_${index}`,
      width: 140,
      align: "center" as const,
      render: (record: VehicleReportRow) => {
        if (record.loading) {
          return <Spin size="small" />;
        }
        const data = record.slots[index];
        if (!data || (data.distance === 0 && data.maxSpeed === 0)) {
          return <span className="text-neutral-300">-</span>;
        }
        return (
          <div className="flex flex-col text-xs leading-normal">
            <span className="font-semibold text-neutral-800">
              {data.distance.toFixed(2)} KM
            </span>
            <span className="text-neutral-500">
              Max: {data.maxSpeed.toFixed(0)} KM/H
            </span>
          </div>
        );
      },
    })),
  ];

  // Stats Computations
  const loadedRows = reportList.filter((r) => !r.loading);
  const totalVehiclesCount = reportList.length;
  const totalDistanceSum = loadedRows.reduce(
    (acc, curr) => acc + curr.totalKm,
    0,
  );
  const avgMaxSpeed =
    loadedRows.length > 0
      ? loadedRows.reduce((acc, curr) => acc + curr.totalMaxSpeed, 0) /
        loadedRows.length
      : 0;

  return (
    <div className="p-6 w-full space-y-6 overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
            Daily Time Slot Report
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Analyze vehicle movement patterns and speed metrics in 2-hour
            segments.
          </p>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          disabled={reportList.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 border-none h-10 px-5 rounded-md text-white shadow-sm flex items-center gap-2"
        >
          Export CSV
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="shadow-sm border-neutral-200/80 rounded-xl overflow-visible">
        <Row gutter={[24, 24]} align="middle">
          {/* Date Selection */}
          <Col xs={24} md={9}>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Select Date
              </span>
              <DatePicker
                className="w-full h-10"
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
                prefix={<CalendarOutlined className="text-neutral-400 mr-1" />}
              />
            </div>
          </Col>

          {/* Search Vehicle Input */}
          <Col xs={24} md={9}>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Search Vehicle
              </span>
              <Input
                className="w-full h-10"
                placeholder="Search by registration number..."
                value={searchText}
                onChange={handleSearchChange}
                prefix={<SearchOutlined className="text-neutral-400 mr-1" />}
                allowClear
              />
            </div>
          </Col>

          {/* Submit Button */}
          <Col xs={24} md={6}>
            <div className="flex flex-col gap-2 h-full justify-end">
              <span className="hidden md:block text-xs font-semibold text-transparent uppercase tracking-wider select-none">
                Action
              </span>
              <Button
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={handleGenerateReport}
                loading={isLoading}
                className="w-full h-10 border-none rounded-md shadow-sm text-white font-medium flex items-center justify-center gap-2"
              >
                Generate Report
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Summary Dashboard */}
      {reportList.length > 0 && (
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={8}>
            <Card className="h-full shadow-sm border-neutral-100 hover:border-blue-100 rounded-xl transition duration-300">
              <Statistic
                title={
                  <span className="text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                    Total Vehicles
                  </span>
                }
                value={totalVehiclesCount}
                valueStyle={{ color: "#4274D9", fontWeight: 700 }}
                suffix={
                  <span className="text-sm font-medium text-neutral-400 ml-1">
                    Vehicle
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="h-full shadow-sm border-neutral-100 hover:border-emerald-100 rounded-xl transition duration-300">
              <Statistic
                title={
                  <span className="text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                    Total Distance Covered
                  </span>
                }
                value={totalDistanceSum}
                precision={2}
                valueStyle={{ color: "#059669", fontWeight: 700 }}
                suffix={
                  <span className="text-sm font-medium text-neutral-400 ml-1">
                    KM
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="h-full shadow-sm border-neutral-100 hover:border-amber-100 rounded-xl transition duration-300">
              <Statistic
                title={
                  <span className="text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                    Avg Max Speed
                  </span>
                }
                value={avgMaxSpeed}
                precision={1}
                valueStyle={{ color: "#d97706", fontWeight: 700 }}
                suffix={
                  <span className="text-sm font-medium text-neutral-400 ml-1">
                    KM/H
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Report Table Card */}
      <Card className="shadow-sm border-neutral-200/80 rounded-xl overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredReportList.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize,
          )}
          loading={reportList.length === 0 && isLoading}
          scroll={{ x: 2000 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredReportList.length,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size) setPageSize(size);
            },
            pageSizeOptions: ["10", "20", "50"],
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} vehicles`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-neutral-400">
                    No report generated. Select a date and click Generate
                    Report to start.
                  </span>
                }
              />
            ),
          }}
          className="custom-table"
        />
      </Card>
    </div>
  );
};

export default View;
