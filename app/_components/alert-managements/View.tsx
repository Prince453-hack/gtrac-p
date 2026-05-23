"use client";

import { useGetAlertsByDateQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import {
  EnrouteIcon,
  GeofenceIcon,
  SearchIcon,
} from "@/public/assets/svgs/nav";
import { Button, Table, Select } from "antd";
import moment from "moment";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";
import CustomDatePicker from "../common/datePicker";

const View = () => {
  const todayStart = moment().startOf("day").toDate();
  const currentTime = new Date();

  const [dateRange, setDateRange] = useState<Date[]>([todayStart, currentTime]);
  const [apiDateRange, setApiDateRange] = useState<Date[]>([
    todayStart,
    currentTime,
  ]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAlertType, setSelectedAlertType] = useState<string>("all");
  const { userId, groupId } = useSelector((state: RootState) => state.auth);

  const startDateTime = moment(apiDateRange[0]).format("YYYY-MM-DD HH:mm:ss");
  const endDateTime = moment(apiDateRange[1]).format("YYYY-MM-DD HH:mm:ss");

  // Fetch Enroute Halt Alerts
  const { data: enrouteHaltData, isFetching: isEnrouteFetching } =
    useGetAlertsByDateQuery(
      {
        userId: String(userId),
        token: String(groupId),
        alertType: "EnrouteHalt",
        startDateTime,
        endDateTime,
        vehReg: "0",
        vehId: "0",
      },
      {
        skip: !userId || !groupId,
      },
    );

  // Fetch Geofence Exit Alerts
  const { data: geofenceExitData, isFetching: isGeofenceFetching } =
    useGetAlertsByDateQuery(
      {
        userId: String(userId),
        token: String(groupId),
        alertType: "GeofenceExitAlert",
        startDateTime,
        endDateTime,
        vehReg: "0",
        vehId: "0",
      },
      {
        skip: !userId || !groupId,
      },
    );

  const enrouteHaltCount = Array.isArray(
    (enrouteHaltData as any)?.list?.[0]?.finalgetEnrouteHalt,
  )
    ? (enrouteHaltData as any).list[0].finalgetEnrouteHalt.length
    : 0;
  const geofenceExitCount = Array.isArray(
    (geofenceExitData as any)?.list?.[0]?.finalgetGeofenceExitAlert,
  )
    ? (geofenceExitData as any).list[0].finalgetGeofenceExitAlert.length
    : 0;

  const handleApply = () => {
    setApiDateRange([...dateRange]);
  };

  // Function to determine the date label
  const getDateLabel = () => {
    const startOfToday = moment().startOf("day");
    const endOfToday = moment().endOf("day");
    const startOfYesterday = moment().subtract(1, "day").startOf("day");
    const endOfYesterday = moment().subtract(1, "day").endOf("day");

    const selectedStart = moment(apiDateRange[0]);
    const selectedEnd = moment(apiDateRange[1]);

    if (
      selectedStart.isSame(startOfToday, "day") &&
      selectedEnd.isBetween(startOfToday, endOfToday, null, "[]")
    ) {
      return "Today";
    }

    if (
      selectedStart.isSame(startOfYesterday, "day") &&
      selectedEnd.isBetween(startOfYesterday, endOfYesterday, null, "[]")
    ) {
      return "Yesterday";
    }

    // For custom dates, show the date range
    if (selectedStart.isSame(selectedEnd, "day")) {
      return selectedStart.format("DD MMM");
    } else {
      return `${selectedStart.format("DD MMM")} - ${selectedEnd.format("DD MMM")}`;
    }
  };

  // Prepare table data
  const enrouteHaltAlerts =
    (enrouteHaltData as any)?.list?.[0]?.finalgetEnrouteHalt || [];
  const geofenceExitAlerts =
    (geofenceExitData as any)?.list?.[0]?.finalgetGeofenceExitAlert || [];

  // Combine all alerts for the table
  const rawAlerts = [
    ...enrouteHaltAlerts.map((alert: any, index: number) => ({
      key: `enroute-${index}`,
      vehicle_no: alert.vehicle_no,
      exception_type: alert.exception_type,
      starttime: alert.starttime,
      startlocation: alert.startlocation,
      msg: alert.msg,
    })),
    ...geofenceExitAlerts.map((alert: any, index: number) => ({
      key: `geofence-${index}`,
      vehicle_no: alert.vehicle_no,
      exception_type: alert.exception_type,
      starttime: alert.starttime,
      startlocation: alert.startlocation,
      msg: alert.msg,
    })),
  ];

  const groupedAlertsMap = rawAlerts.reduce(
    (acc: Record<string, any>, alert) => {
      const groupKey = `${alert.vehicle_no}-${alert.exception_type}-${alert.startlocation}`;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          ...alert,
          count: 1,
          times: [alert.starttime],
          latestTime: alert.starttime,
          earliestTime: alert.starttime,
        };
      } else {
        acc[groupKey].count += 1;
        acc[groupKey].times.push(alert.starttime);
        if (moment(alert.starttime).isAfter(moment(acc[groupKey].latestTime))) {
          acc[groupKey].latestTime = alert.starttime;
        }
        if (
          moment(alert.starttime).isBefore(moment(acc[groupKey].earliestTime))
        ) {
          acc[groupKey].earliestTime = alert.starttime;
        }
      }
      return acc;
    },
    {},
  );

  const allAlerts = Object.values(groupedAlertsMap).map(
    (alert: any, index: number) => ({
      ...alert,
      key: `grouped-${index}`,
    }),
  );

  // Filter alerts based on search term and alert type
  const filteredAlerts = allAlerts.filter((alert) => {
    const matchesSearch =
      alert.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.exception_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.startlocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedAlertType === "all" || alert.exception_type === selectedAlertType;

    return matchesSearch && matchesType;
  });

  // Table columns
  const columns = [
    {
      title: "Vehicle Number",
      dataIndex: "vehicle_no",
      key: "vehicle_no",
      width: 180,
    },
    {
      title: "Alert Type",
      dataIndex: "exception_type",
      key: "exception_type",
      width: 180,
      render: (text: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-sm ${
            text === "Enroute Halt"
              ? "bg-red-700 text-white"
              : "bg-pink-700 text-white"
          }`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "latestTime",
      key: "starttime",
      width: 240,
      render: (text: string) => moment(text).format("DD MMM YYYY, HH:mm"),
    },
    {
      title: "Location",
      dataIndex: "startlocation",
      key: "startlocation",
      ellipsis: true,
      render: (text: string) => {
        const locationMatch = text.match(/at (.+?)(?:\s+-\s+(.+))?$/);
        return locationMatch ? locationMatch[1] : text;
      },
    },
  ];

  return (
    <div className="min-h-screen overflow-auto">
      <div className="p-6 min-h-full">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-semibold text-4xl">Alert Managements</h1>
          <div className="flex items-center gap-3">
            <CustomDatePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
              datePickerStyles="h-8 text-base"
            />
            <Button
              type="primary"
              onClick={handleApply}
              loading={isEnrouteFetching || isGeofenceFetching}
              className="bg-primary-green hover:bg-primary-green/90 h-10"
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-8 max-w-5xl mb-8">
          <div className="h-36 border-[#F87171] bg-[#FEF2F2] border py-4 px-6 rounded-2xl flex flex-col space-y-5 justify-center">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-lg">Enroute Halt Alerts</h1>
              <p className="text-gray-600 text-xs border px-1.5 py-0.5 rounded-2xl border-gray-300">
                {getDateLabel()}
              </p>
            </div>
            <div className="flex items-center justify-start space-x-2">
              <Image src={EnrouteIcon} width={40} height={40} alt="enroute" />

              <p className="font-bold text-3xl">{enrouteHaltCount}</p>
            </div>
          </div>

          <div className="h-36 border-[#F472B6] bg-[#FDF2F8] border py-4 px-6 rounded-2xl flex flex-col space-y-5 justify-center">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-lg">Geofence Exit Alerts</h1>
              <p className="text-gray-600 text-xs border px-1.5 py-0.5 rounded-2xl border-gray-300">
                {getDateLabel()}
              </p>
            </div>
            <div className="flex items-center justify-start space-x-2">
              <Image src={GeofenceIcon} width={40} height={40} alt="enroute" />

              <p className="font-bold text-3xl">{geofenceExitCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border mb-16">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="">
              <h2 className="text-xl font-semibold">Alert Details</h2>
              <p className="text-gray-600 text-sm mt-1">
                Showing {filteredAlerts.length} alerts for{" "}
                {getDateLabel().toLowerCase()}
                {(searchTerm || selectedAlertType !== "all") &&
                  ` (filtered from ${allAlerts.length} total)`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={selectedAlertType}
                onChange={setSelectedAlertType}
                placeholder="Filter by Alert Type"
                className="min-w-40 rounded-full"
                options={[
                  { value: "all", label: "All Alert Types" },
                  { value: "Enroute Halt", label: "Enroute Halt" },
                  { value: "Geofence Alert", label: "Geofence Exit" },
                ]}
              />
              <div className="flex w-fit items-center space-x-2 rounded-full border border-gray-500 px-2 py-1 bg-gray-50">
                <input
                  type="search"
                  placeholder="Search Vehicles"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-2 py-1 focus:ring-0 focus:outline-none bg-gray-50 h-7 rounded-2xl min-w-80"
                />
                <button className="cursor-pointer rounded-full bg-[#10b981] py-1 px-2 text-white">
                  <Image
                    src={SearchIcon}
                    width={20}
                    height={20}
                    alt="search"
                    draggable="false"
                    className="rounded-full"
                  />
                </button>
              </div>
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={filteredAlerts}
            pagination={{
              pageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} alerts`,
            }}
            loading={isEnrouteFetching || isGeofenceFetching}
            className="rounded-2xl px-2"
          />
        </div>
      </div>
    </div>
  );
};

export default View;
