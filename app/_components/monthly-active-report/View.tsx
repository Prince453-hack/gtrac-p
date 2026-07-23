"use client";

import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  DatePicker,
  Button,
  Table,
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Input,
} from "antd";
import {
  CalendarOutlined,
  SearchOutlined,
  CarOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;

interface DailyResult {
  date: string;
  day: number;
  count: number;
  vehicles: string[];
}

const View = () => {
  const { groupId } = useSelector((state: RootState) => state.auth);

  // Default range: Start of current month to today
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([dayjs().startOf("month"), dayjs()]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiList, setApiList] = useState<any[]>([]);
  const [minKm, setMinKm] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleGenerateReport = React.useCallback(async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      setError("Please select a date range.");
      return;
    }
    if (!groupId) {
      setError("Active group token not found.");
      return;
    }

    setLoading(true);
    setError(null);

    const startDate = dateRange[0];
    const endDate = dateRange[1];

    const startDateStr = startDate.format("YYYY-MM-DD 00:00:00");
    const endDateStr = endDate.format("YYYY-MM-DD 23:59:59");

    const url = `${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/consolidateKM/?token=${groupId}&startdate=${encodeURIComponent(startDateStr)}&enddate=${encodeURIComponent(endDateStr)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      if (data && data.success && Array.isArray(data.list)) {
        setApiList(data.list);
      } else {
        throw new Error(
          data?.message || "Invalid or empty response format from API.",
        );
      }
    } catch (err: any) {
      setError(
        err?.message || "An unexpected error occurred during data fetching.",
      );
      setApiList([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, groupId]);

  React.useEffect(() => {
    if (groupId) {
      handleGenerateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Dynamically compute reportData based on active km threshold and API results
  const reportData = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1] || apiList.length === 0) {
      return [];
    }

    const startDate = dateRange[0];
    const endDate = dateRange[1];
    const dateMap: {
      [key: string]: { count: number; vehicles: string[] };
    } = {};

    // Pre-populate dateMap for all dates in the range
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    const dateList: string[] = [];

    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateKey = current.format("DD-MM-YYYY");
      dateMap[dateKey] = { count: 0, vehicles: [] };
      dateList.push(dateKey);
      current = current.add(1, "day");
    }

    // Aggregate list items based on active threshold (minKm)
    apiList.forEach((item: any) => {
      const dateKey = item.dateof; // e.g. "01-07-2026"
      if (dateMap[dateKey] !== undefined) {
        const km = Number(item.km || 0);
        if (km > minKm) {
          dateMap[dateKey].vehicles.push(item.vehicleNum || "Unknown");
          dateMap[dateKey].count++;
        }
      }
    });

    return dateList.map((dateKey, index) => {
      const formattedDate = dayjs(dateKey, "DD-MM-YYYY").format("DD-MMM-YYYY");
      return {
        date: formattedDate,
        day: index + 1,
        count: dateMap[dateKey].count,
        vehicles: dateMap[dateKey].vehicles,
      };
    });
  }, [apiList, minKm, dateRange]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    if (reportData.length === 0) {
      return { sum: 0, average: 0, maxCount: 0, maxDay: "-" };
    }
    const sum = reportData.reduce((acc, curr) => acc + curr.count, 0);
    const average = sum / reportData.length;

    let maxCount = 0;
    let maxDay = "-";
    reportData.forEach((d) => {
      if (d.count > maxCount) {
        maxCount = d.count;
        maxDay = d.date;
      }
    });

    return { sum, average, maxCount, maxDay };
  }, [reportData]);

  // Filtered table data based on registration search
  const filteredTableData = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const query = searchQuery.toLowerCase().trim();
    return reportData.filter((row) =>
      row.vehicles.some((v) => v.toLowerCase().includes(query)),
    );
  }, [reportData, searchQuery]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      sorter: (a: DailyResult, b: DailyResult) => a.day - b.day,
      render: (text: string) => (
        <span className="font-semibold text-slate-700">{text}</span>
      ),
    },
    {
      title: "Active Vehicle Count",
      dataIndex: "count",
      key: "count",
      width: 180,
      sorter: (a: DailyResult, b: DailyResult) => a.count - b.count,
      render: (count: number) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            count > 0
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}
        >
          {count} Active
        </span>
      ),
    },
    {
      title: "Active Vehicle Numbers",
      dataIndex: "vehicles",
      key: "vehicles",
      render: (vehicles: string[]) => {
        if (vehicles.length === 0)
          return <span className="text-slate-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-2">
            {vehicles.map((v, i) => (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-2 py-0.5 rounded font-medium"
              >
                {v}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6 w-full overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Monthly Active Vehicle Report
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Fleet utilization and daily availability patterns based on active
            kilometers.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="shadow-sm border-neutral-100 rounded-xl bg-gradient-to-r from-slate-50 to-white">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={14}>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <CalendarOutlined /> SELECT DATE RANGE
              </span>
              <RangePicker
                value={dateRange}
                onChange={(val) => setDateRange(val as any)}
                className="w-full h-10 rounded-lg hover:border-emerald-500 focus:border-emerald-500"
                format="DD-MMM-YYYY"
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <ThunderboltOutlined /> MIN KM FACTOR
              </span>
              <Input
                type="number"
                value={minKm}
                onChange={(e) => setMinKm(Number(e.target.value) || 0)}
                placeholder="e.g. 50"
                className="w-full h-10 rounded-lg"
                suffix="KM"
              />
            </div>
          </Col>
          <Col xs={24} md={4} className="text-right">
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleGenerateReport}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 border-none font-semibold text-sm rounded-lg shadow-sm mt-5 transition-colors"
            >
              Generate Report
            </Button>
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert
          message="Report Generation Failed"
          description={error}
          type="error"
          showIcon
          closable
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <Spin size="large" />
          <span className="text-slate-400 font-semibold text-sm animate-pulse">
            Analyzing operational statistics day by day...
          </span>
        </div>
      ) : reportData.length > 0 ? (
        <div className="space-y-6">
          {/* KPI Analytics Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8}>
              <Card className="rounded-xl border-neutral-100 shadow-sm hover:shadow transition-shadow relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <div className="absolute right-4 top-4 opacity-15">
                  <ThunderboltOutlined className="text-5xl" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Average Active Vehicles
                </span>
                <h2 className="text-4xl font-extrabold mt-1">
                  {metrics.average.toFixed(2)}
                </h2>
                <div className="text-xs text-slate-600/80 mt-2 font-medium">
                  Average active across selected dates
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={8} md={8}>
              <Card className="rounded-xl border-neutral-100 shadow-sm hover:shadow transition-shadow relative overflow-hidden bg-white">
                <div className="absolute right-4 top-4 text-purple-500 opacity-10">
                  <CalendarOutlined className="text-5xl" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Days
                </span>
                <h2 className="text-4xl font-extrabold text-slate-800 mt-1">
                  {reportData.length}
                </h2>
                <div className="text-xs text-slate-400 mt-2 font-medium">
                  Denominator used for average calculations
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card className="rounded-xl border-neutral-100 shadow-sm hover:shadow transition-shadow relative overflow-hidden bg-white">
                <div className="absolute right-4 top-4 text-amber-500 opacity-10">
                  <BarChartOutlined className="text-5xl" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Max Active Count Vehicle
                </span>
                <h2 className="text-4xl font-extrabold text-slate-800 mt-1">
                  {metrics.maxCount}
                </h2>
                <div className="text-xs text-slate-400 mt-2 font-medium truncate">
                  Max recorded on {metrics.maxDay}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Details Table */}
          <Card
            className="shadow-sm border-neutral-100 rounded-xl"
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={filteredTableData.map((row) => ({
                ...row,
                key: row.day,
              }))}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} days`,
              }}
              className="custom-table"
            />
          </Card>
        </div>
      ) : (
        <Card className="text-center py-20 border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-xl">
          <CalendarOutlined className="text-6xl text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-600">
            No report generated
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            Choose your date range and click the Generate Report button to
            fetch daily active fleet details.
          </p>
        </Card>
      )}
    </div>
  );
};

export default View;
