"use client";

import React, { useMemo, useState } from "react";
import { Table, DatePicker, Button, Tag, Tooltip, Space, Spin } from "antd";
import Image from "next/image";
import { VehicleBox } from "@/public/assets/svgs/nav";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { useGetAllTrackingDataQuery } from "@/app/_globalRedux/services/breathAnalyzer";
import type { BreathAnalyzerTrackingItem } from "@/app/_globalRedux/services/breathAnalyzer";

const { RangePicker } = DatePicker;

const View = () => {
  const today = dayjs();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([today.startOf("day"), today.endOf("day")]);
  const [tempRange, setTempRange] = useState<[Dayjs, Dayjs]>(range);

  const { data, isLoading, isFetching } = useGetAllTrackingDataQuery();

  const rows: BreathAnalyzerTrackingItem[] = data?.data || [];

  const startDate = range[0].format("YYYY-MM-DD");
  const endDate = range[1].format("YYYY-MM-DD");

  const rangeStart = range[0].startOf("day").toDate().getTime();
  const rangeEnd = range[1].endOf("day").toDate().getTime();

  const filteredRows = rows.filter((r) => {
    const t = r.timestamp || r.created_at || r.updated_at;
    if (!t) return false;
    const tm = new Date(t).getTime();
    return tm >= rangeStart && tm <= rangeEnd;
  });

  const avatarColors = [
    '#C13383', // purple
    '#F69D39', // orange
    '#E03F4F', // red
    '#8BDFDD', // sky
    '#59B292', // green
    '#F5C857', // amber
  ];

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getColorFor = (s?: string) => {
    if (!s) return avatarColors[0];
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      // simple hash
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const columns: ColumnsType<BreathAnalyzerTrackingItem> = useMemo(
    () => [
      {
        title: "Vehicle",
        dataIndex: "vehicle_number",
        key: "vehicle_number",
        render: (v: string) => (
          <div className="flex items-center gap-2">
            <Image src={VehicleBox} alt="vehicle" width={20} height={20} />
            <span className="font-medium">{v}</span>
          </div>
        ),
        sorter: (a, b) => (a.vehicle_number || "").localeCompare(b.vehicle_number || ""),
      },
      {
        title: "Employee",
        dataIndex: "employee_name",
        key: "employee_name",
        render: (v: string, record) => {
          const name = v || '';
          const initials = getInitials(name || record.employee_id);
          const bg = getColorFor(name || record.employee_id);

          return (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: bg }}
              >
                {initials}
              </div>
              <div>
                <div className="font-semibold">{name || '-'}</div>
                <div className="text-sm text-gray-500">{record.employee_id}</div>
              </div>
            </div>
          );
        },
        sorter: (a, b) => (a.employee_name || "").localeCompare(b.employee_name || ""),
      },
      {
        title: "Location",
        dataIndex: "location_address",
        key: "location_address",
        render: (v: string) => (
          <Tooltip title={v}>
            <div style={{ maxWidth: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
          </Tooltip>
        ),
      },
      {
        title: "Coordinates",
        dataIndex: "latitude",
        key: "coords",
        render: (_: any, record) => {
          const href = `https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`;
          const latNum = Number(record.latitude);
          const lonNum = Number(record.longitude);
          const display = Number.isFinite(latNum) && Number.isFinite(lonNum)
            ? `${latNum.toFixed(3)}, ${lonNum.toFixed(3)}`
            : `${record.latitude}, ${record.longitude}`;
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-[#58C1F0] hover:border-[#58C1F0] text-[#1D4ED8] hover:text-[#1D4ED8] bg-[#E8F6FF] transition-colors duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
              </svg>
              <span className="text-sm">{display}</span>
            </a>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (v: string) => {
          const upper = (v || "").toUpperCase();
          const color = upper.includes("NOT") ? "green" : upper.includes("DRUNK") ? "red" : "green";
          return <Tag color={color}>{v || "-"}</Tag>;
        },
        filters: [
          { text: "DRUNK", value: "DRUNK" },
          { text: "NOT DRUNK", value: "NOT DRUNK" },
        ],
        onFilter: (value, record) =>
          (record.status || "").toString().toUpperCase() === (value as string).toUpperCase(),
      },
      {
        title: "Timestamp",
        dataIndex: "timestamp",
        key: "timestamp",
        render: (v: string | null, record) => {
          const t = v || record.created_at || record.updated_at;

          if (!t) return "-";

          const dateStr = dayjs(t).format("DD-MMM-YYYY HH:mm:ss");
          const diffMinutes = dayjs().diff(dayjs(t), 'minute');

          let label = '';

          if (diffMinutes <= 10) {
            label = 'Latest';
          } else if (diffMinutes < 60) {
            label = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
          } else if (diffMinutes < 1440) {
            const hrs = Math.floor(diffMinutes / 60);
            label = `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
          } else {
            const days = Math.floor(diffMinutes / 1440);
            label = `${days} day${days === 1 ? '' : 's'} ago`;
          }

          return (
            <div>
              <div className="font-medium">{dateStr}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          );
        },
        sorter: (a, b) => {
          const ta = new Date(a.timestamp || a.created_at || a.updated_at).getTime();
          const tb = new Date(b.timestamp || b.created_at || b.updated_at).getTime();
          return ta - tb;
        },
      },
    ],
    []
  );

  const exportCsv = () => {
    const header = ["vehicle_number", "employee_id", "employee_name", "latitude", "longitude", "location_address", "status", "timestamp"];
    const csvRows = [header.join(",")];
    for (const r of filteredRows) {
      const ts = r.timestamp || r.created_at || r.updated_at || "";
      csvRows.push(
        [r.vehicle_number, r.employee_id, r.employee_name, r.latitude, r.longitude, `"${(r.location_address || "").replace(/"/g, '""') }"`, r.status, ts].join(",")
      );
    }
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `breath-analyzer-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 overflow-y-auto">
      <div className="mb-10 mt-5">
        <h2 className="text-3xl font-semibold">Breath Analyzer Report</h2>
      </div>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RangePicker
                value={tempRange}
                onChange={(val) => {
                  if (val && val[0] && val[1]) setTempRange([val[0], val[1]] as [Dayjs, Dayjs]);
                }}
                allowClear={false}
                format="YYYY-MM-DD"
              />
              <Button
                type="primary"
                onClick={() => setRange(tempRange)}
                disabled={
                  tempRange[0].isSame(range[0]) && tempRange[1].isSame(range[1])
                }
              >
                Apply
              </Button>
            </div>
          </div>
          <div>
            <Space>
              <Button onClick={() => {
                const todayRange = [dayjs().startOf("day"), dayjs().endOf("day")] as [Dayjs, Dayjs];
                setRange(todayRange);
                setTempRange(todayRange);
              }}>Today</Button>
              <Button onClick={() => {
                const yesterdayRange = [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")] as [Dayjs, Dayjs];
                setRange(yesterdayRange);
                setTempRange(yesterdayRange);
              }}>Yesterday</Button>
              <Button type="primary" onClick={exportCsv} disabled={!rows || rows.length === 0}>
                Export Data
              </Button>
            </Space>
          </div>
        </div>

        <div>
          {(isLoading || isFetching) && (
            <div className="mb-4">
              <Spin />
            </div>
          )}
          <Table
            rowKey={(r) => r.uuid}
            columns={columns}
            dataSource={filteredRows}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </div>
      </Space>
    </div>
  );
};

export default View;