"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Spin, Button, Modal } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import CustomDatePicker from "@/app/_components/common/datePicker";
import {
  useLazyGetEcoTripDetailsQuery,
  EcoTripItem,
} from "@/app/_globalRedux/services/ecoTripDetails";
import { useLazyGetpathwithDateDaignosticQuery } from "@/app/_globalRedux/services/trackingDashboard";
import dynamic from "next/dynamic";

const TripOverviewMiniMap = dynamic(() => import("./trip-overview-minimap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
      Loading Map...
    </div>
  ),
});

interface TripOverviewClientProps {
  userId?: string;
}

const TripOverviewClient: React.FC<TripOverviewClientProps> = ({ userId }) => {
  const [dateRange, setDateRange] = useState<Date[]>([
    dayjs().startOf("day").toDate(),
    dayjs().endOf("day").toDate(),
  ]);

  // State for column filtering search queries
  const [filters, setFilters] = useState({
    veh_no: "",
    Booking_no: "",
    Pickup_loc: "",
    coords: "",
    Pickup_time: "",
    trip_started: "",
    end_trip: "",
  });

  // State for trip statistics modal
  const [selectedTrip, setSelectedTrip] = useState<EcoTripItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reduxUserId = useSelector((state: RootState) => state.auth?.userId);
  const activeUserId = userId || reduxUserId || "833916";

  const [
    getPathDiagnostic,
    {
      data: diagnosticData,
      isLoading: isDiagLoading,
      isFetching: isDiagFetching,
    },
  ] = useLazyGetpathwithDateDaignosticQuery();

  const { maxSpeed, avgSpeed } = useMemo(() => {
    if (!diagnosticData?.patharry || diagnosticData.patharry.length === 0) {
      return { maxSpeed: "—", avgSpeed: "—" };
    }
    const speeds = diagnosticData.patharry
      .map((item) => Number(item.speed))
      .filter((speed) => !isNaN(speed));
    if (speeds.length === 0) {
      return { maxSpeed: "—", avgSpeed: "—" };
    }
    const max = Math.max(...speeds);
    const avg = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
    return {
      maxSpeed: `${max} km/h`,
      avgSpeed: `${avg.toFixed(2)} km/h`,
    };
  }, [diagnosticData]);

  const handleOpenModal = (trip: EcoTripItem) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);

    const sDate = trip.trip_started
      ? dayjs(trip.trip_started).format("YYYY-MM-DD HH:mm")
      : trip.Pickup_time
        ? dayjs(trip.Pickup_time).format("YYYY-MM-DD HH:mm")
        : dayjs().startOf("day").format("YYYY-MM-DD HH:mm");

    const eDate = trip.end_trip
      ? dayjs(trip.end_trip).format("YYYY-MM-DD HH:mm")
      : dayjs().format("YYYY-MM-DD HH:mm");

    getPathDiagnostic({
      vId: trip.sys_service_id,
      startDate: sDate,
      endDate: eDate,
      userId: activeUserId,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  };

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return "-";
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Fetch data using RTK lazy query service
  const [trigger, { data, isLoading, isFetching }] =
    useLazyGetEcoTripDetailsQuery();

  const handleFetchData = () => {
    const startDateStr = dayjs(dateRange[0]).format("YYYY-MM-DD HH:mm:ss");
    const endDateStr = dayjs(dateRange[1]).format("YYYY-MM-DD HH:mm:ss");
    trigger({
      startDate: startDateStr,
      endDate: endDateStr,
    });
  };

  // Run initial fetch on mount
  useEffect(() => {
    handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (
    columnKey: keyof typeof filters,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  const getHeaderTitle = (
    title: string,
    columnKey: keyof typeof filters,
    align: "center" | "left" = "center",
  ) => (
    <div
      className={`flex flex-col gap-1.5 py-1 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}
    >
      <span className="font-semibold text-gray-700 text-sm">{title}</span>
      <input
        type="text"
        placeholder={`Search ${title}`}
        value={filters[columnKey]}
        onChange={(e) => handleFilterChange(columnKey, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-neutral-200 rounded font-normal focus:outline-none focus:border-green-500 bg-white placeholder-gray-400"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );

  // Locally filtered list based on column search values
  const filteredData = useMemo(() => {
    const list = data?.list || [];
    return list.filter((item) => {
      const matchVehNo = (item.veh_no || "")
        .toLowerCase()
        .includes(filters.veh_no.toLowerCase());

      const matchBooking = (item.Booking_no || "")
        .toLowerCase()
        .includes(filters.Booking_no.toLowerCase());

      const matchPickupLoc = (item.Pickup_loc || "")
        .toLowerCase()
        .includes(filters.Pickup_loc.toLowerCase());

      const lat =
        item.Pickup_lat !== undefined && item.Pickup_lat !== null
          ? item.Pickup_lat.toFixed(6)
          : "-";
      const lon =
        item.Pickup_lon !== undefined && item.Pickup_lon !== null
          ? item.Pickup_lon.toFixed(6)
          : "-";
      const coordsStr = `${lat}, ${lon}`;
      const matchCoords = coordsStr
        .toLowerCase()
        .includes(filters.coords.toLowerCase());

      const formattedPickupTime = item.Pickup_time
        ? dayjs(item.Pickup_time).format("DD-MMM-YYYY HH:mm:ss")
        : "";
      const matchPickupTime = formattedPickupTime
        .toLowerCase()
        .includes(filters.Pickup_time.toLowerCase());

      const formattedTripStarted = item.trip_started
        ? dayjs(item.trip_started).format("DD-MMM-YYYY HH:mm:ss")
        : "";
      const matchTripStarted = formattedTripStarted
        .toLowerCase()
        .includes(filters.trip_started.toLowerCase());

      const formattedEndTrip = item.end_trip
        ? dayjs(item.end_trip).format("DD-MMM-YYYY HH:mm:ss")
        : "";
      const matchEndTrip = formattedEndTrip
        .toLowerCase()
        .includes(filters.end_trip.toLowerCase());

      return (
        matchVehNo &&
        matchBooking &&
        matchPickupLoc &&
        matchCoords &&
        matchPickupTime &&
        matchTripStarted &&
        matchEndTrip
      );
    });
  }, [data, filters]);

  const columns = [
    {
      title: getHeaderTitle("Vehicle No", "veh_no", "center"),
      dataIndex: "veh_no",
      key: "veh_no",
      align: "center" as const,
      width: 150,
      render: (val: string) => (
        <span className="inline-block text-neutral-800 borderfont-semibold select-all hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-text">
          {val || "-"}
        </span>
      ),
    },
    {
      title: getHeaderTitle("Booking No", "Booking_no", "center"),
      dataIndex: "Booking_no",
      key: "Booking_no",
      align: "center" as const,
      width: 150,
      render: (val: string) => (
        <span className="inline-block px-2.5 py-1 rounded bg-neutral-50 text-neutral-800 border border-neutral-200 font-semibold select-all hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-text">
          {val || "-"}
        </span>
      ),
    },
    {
      title: getHeaderTitle("Pickup Location", "Pickup_loc", "left"),
      dataIndex: "Pickup_loc",
      key: "Pickup_loc",
      align: "left" as const,
      render: (val: string) => (
        <span className="text-neutral-700 font-medium">{val || "-"}</span>
      ),
    },
    {
      title: getHeaderTitle("Coordinates", "coords", "center"),
      key: "coords",
      align: "center" as const,
      width: 180,
      render: (_: any, item: any) => {
        const latVal = Number(item.Pickup_lat);
        const lonVal = Number(item.Pickup_lon);
        if (!Number.isFinite(latVal) || !Number.isFinite(lonVal)) return "-";

        const display = `${latVal.toFixed(3)}, ${lonVal.toFixed(3)}`;
        const href = `https://www.google.com/maps/search/?api=1&query=${latVal},${lonVal}`;
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#58C1F0] hover:border-[#58C1F0] text-[#1D4ED8] hover:text-[#1D4ED8] bg-[#E8F6FF] transition-all duration-150"
          >
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
            </svg>
            <span className="text-sm font-medium">{display}</span>
          </a>
        );
      },
    },
    {
      title: getHeaderTitle("Pickup Time", "Pickup_time", "center"),
      dataIndex: "Pickup_time",
      key: "Pickup_time",
      align: "center" as const,
      width: 180,
      render: (val: string) =>
        val ? dayjs(val).format("DD-MMM-YYYY HH:mm:ss") : "-",
    },
    {
      title: getHeaderTitle("Trip Started", "trip_started", "center"),
      dataIndex: "trip_started",
      key: "trip_started",
      align: "center" as const,
      width: 180,
      render: (val: string) =>
        val ? dayjs(val).format("DD-MMM-YYYY HH:mm:ss") : "-",
    },
    {
      title: getHeaderTitle("End Trip", "end_trip", "center"),
      dataIndex: "end_trip",
      key: "end_trip",
      align: "center" as const,
      width: 180,
      render: (val: string) =>
        val ? dayjs(val).format("DD-MMM-YYYY HH:mm:ss") : "-",
    },
    {
      title: "Trip Statistics",
      key: "action",
      align: "center" as const,
      width: 140,
      render: (_: any, item: EcoTripItem) => (
        <Button
          type="primary"
          ghost
          onClick={() => handleOpenModal(item)}
          className="hover:border-green-600 hover:text-green-600 border-neutral-300 text-neutral-700 text-xs rounded"
        >
          View Stats
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Trip Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-[380px] max-w-full">
            <CustomDatePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
              datePickerStyles="py-1.5 px-3 border-none bg-neutral-50 hover:bg-neutral-100 transition-colors"
              showTimeSelect={true}
              format="dd/MM/yyyy h:mm aa"
            />
          </div>
          <Button
            type="primary"
            onClick={handleFetchData}
            loading={isLoading || isFetching}
            className="h-[36px] font-medium"
          >
            Submit
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center">
            <Spin size="large" tip="Loading Eco Trip Details..." />
          </div>
        )}
        <Table
          rowKey={(r) => r.sys_service_id || r.Booking_no}
          columns={columns}
          dataSource={filteredData}
          scroll={{ y: "calc(100vh - 280px)" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          bordered
          locale={{
            emptyText: "No eco trips found for the selected date range.",
          }}
        />
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={850}
        centered
        destroyOnClose
        bodyStyle={{ padding: "24px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Trip Overview</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-2.5">
              <svg
                className="w-5 h-5 flex-shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {selectedTrip?.trip_started
                  ? dayjs(selectedTrip.trip_started).format(
                      "DD MMM YYYY | hh:mm A",
                    )
                  : selectedTrip?.Pickup_time
                    ? dayjs(selectedTrip.Pickup_time).format(
                        "DD MMM YYYY | hh:mm A",
                      )
                    : "—"}
                {" – "}
                {selectedTrip?.end_trip
                  ? dayjs(selectedTrip.end_trip).format("DD MMM YYYY | hh:mm A")
                  : "—"}
              </span>
            </div>
          </div>

          {/* cleanLocation helper */}
          {(() => {
            const cleanLocation = (loc?: string) => {
              if (!loc) return "—";
              return loc.split("##")[0].replaceAll("_", " ");
            };

            const endLocFull = diagnosticData?.data?.[0]?.endLocation
              ? cleanLocation(diagnosticData.data[0].endLocation)
              : "";
            const endLocParts = endLocFull.split(",");
            const endLocHeading = endLocParts.slice(0, 2).join(",");
            const endLocSub =
              endLocParts.length > 2
                ? endLocParts.slice(2).join(",").trim()
                : "";

            return (
              <>
                {isDiagLoading || isDiagFetching ? (
                  <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                    <Spin size="large" tip="Fetching trip statistics..." />
                  </div>
                ) : (
                  <>
                    {/* Route Card */}
                    <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm grid grid-cols-[1fr_120px_1fr] items-center gap-4">
                      {/* Start point */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
                            {selectedTrip?.Pickup_loc
                              ? selectedTrip.Pickup_loc.split(",")
                                  .slice(0, 2)
                                  .join(",")
                              : "—"}
                          </h4>
                          <p
                            className="text-xs text-slate-400 font-semibold mt-1 truncate"
                            title={selectedTrip?.Pickup_loc}
                          >
                            {selectedTrip?.Pickup_loc &&
                            selectedTrip.Pickup_loc.split(",").length > 2
                              ? selectedTrip.Pickup_loc.split(",")
                                  .slice(2)
                                  .join(",")
                                  .trim()
                              : ""}
                          </p>
                        </div>
                      </div>

                      {/* Connecting line */}
                      <div className="w-full relative flex items-center justify-center">
                        <div className="w-full border-t-2 border-dashed border-slate-200"></div>
                        <div className="absolute left-1/4 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                        <div className="absolute left-2/4 w-2.5 h-2.5 bg-slate-300 rounded-full border border-white"></div>
                        <div className="absolute left-3/4 w-2.5 h-2.5 bg-slate-300 rounded-full border border-white"></div>
                      </div>

                      {/* End point */}
                      <div className="flex items-center gap-3.5 min-w-0 text-right justify-end">
                        <div className="min-w-0">
                          <h4
                            className="text-sm font-bold text-slate-800 leading-tight truncate"
                            title={endLocHeading}
                          >
                            {endLocHeading || "—"}
                          </h4>
                          <p
                            className="text-xs text-slate-400 font-semibold mt-1 truncate"
                            title={endLocSub}
                          >
                            {endLocSub || ""}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Stats Section: Grid of 2 Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Card 1: Trip Statistics */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">
                          Trip Statistics
                        </h3>

                        <div className="space-y-3.5">
                          {/* Distance */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                <svg
                                  className="w-5 h-5 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-500">
                                Distance Traveled
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">
                              {diagnosticData?.totalDistance || "—"}
                            </span>
                          </div>

                          {/* Max. Speed */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                                <svg
                                  className="w-5 h-5 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-500">
                                Max. Speed
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">
                              {maxSpeed}
                            </span>
                          </div>

                          {/* Avg. Speed */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
                                <svg
                                  className="w-5 h-5 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-500">
                                Avg. Speed
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">
                              {avgSpeed}
                            </span>
                          </div>

                          {/* Travel Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                <svg
                                  className="w-5 h-5 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-500">
                                Travel Time
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">
                              {diagnosticData?.runningTime || "—"}
                            </span>
                          </div>

                          {/* Fuel Economy */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                                <svg
                                  className="w-5 h-5 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-500">
                                Fuel Economy
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">
                              --
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Score Analysis */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between opacity-60 select-none">
                        <h3 className="text-lg font-bold text-slate-400 mb-2">
                          Score Analysis
                        </h3>

                        {/* Semi-circular gauge chart — fully self-contained SVG */}
                        <div
                          className="mx-auto mt-2 grayscale"
                          style={{ width: 200, height: 130 }}
                        >
                          <svg viewBox="0 0 200 120" width="200" height="130">
                            {/* Background arc */}
                            <path
                              d="M 28 90 A 72 72 0 0 1 172 90"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="14"
                              strokeLinecap="round"
                            />
                            {/* Foreground arc: empty/grey */}
                            <path
                              d="M 28 90 A 72 72 0 0 1 172 90"
                              fill="none"
                              stroke="#cbd5e1"
                              strokeWidth="14"
                              strokeLinecap="round"
                              strokeDasharray="226.2"
                              strokeDashoffset={226.2}
                            />

                            {/* Label: 0 */}
                            <text
                              x="28"
                              y="108"
                              fill="#cbd5e1"
                              fontSize="11"
                              fontWeight="700"
                              textAnchor="middle"
                            >
                              0
                            </text>
                            {/* Label: 100 */}
                            <text
                              x="172"
                              y="108"
                              fill="#cbd5e1"
                              fontSize="11"
                              fontWeight="700"
                              textAnchor="middle"
                            >
                              100
                            </text>

                            {/* Score number */}
                            <text
                              x="100"
                              y="82"
                              fill="#94a3b8"
                              fontSize="32"
                              fontWeight="800"
                              textAnchor="middle"
                              dominantBaseline="auto"
                            >
                              N/A
                            </text>
                            {/* Label */}
                            <text
                              x="100"
                              y="100"
                              fill="#94a3b8"
                              fontSize="9"
                              fontWeight="700"
                              textAnchor="middle"
                              letterSpacing="1"
                            >
                              NOT AVAILABLE
                            </text>
                          </svg>
                        </div>

                        {/* Legends grid */}
                        <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold grayscale opacity-50">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">00 - 74</span>
                            <span className="text-slate-500 font-bold">
                              Okay
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">75 - 84</span>
                            <span className="text-slate-500 font-bold">
                              Fair
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">85 - 99</span>
                            <span className="text-slate-500 font-bold">
                              Good
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">100</span>
                            <span className="text-slate-500 font-bold">
                              Excellent
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mini Map Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        <h3 className="text-lg font-bold text-slate-800">
                          Trip Route Map
                        </h3>
                      </div>
                      <div
                        className="w-full rounded-xl overflow-hidden border border-slate-100 relative z-10"
                        style={{ height: "320px" }}
                      >
                        <TripOverviewMiniMap
                          path={diagnosticData?.patharry || []}
                        />
                      </div>
                    </div>

                    {/* Events Log list */}
                    <div className="space-y-3.5">
                      <h3 className="text-lg font-bold text-slate-800">
                        All Events
                      </h3>

                      {/* Event 1: OSL */}
                      <div className="bg-green-50/30 border border-green-100/50 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-green-100/60 flex items-center justify-center text-green-600 flex-shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Over Speed Limit (OSL)
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Keep it up! Driving within speed limits improves
                              safety and vehicle efficiency.
                            </p>
                          </div>
                        </div>
                        <div className="text-green-600 flex-shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Event 2: HB */}
                      <div className="bg-green-50/30 border border-green-100/50 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-green-100/60 flex items-center justify-center text-green-600 flex-shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Harsh Braking (HB)
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Well done! Smooth deceleration extends brake life
                              and ensures passenger comfort.
                            </p>
                          </div>
                        </div>
                        <div className="text-green-600 flex-shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Event 3: HA */}
                      <div className="bg-green-50/30 border border-green-100/50 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-green-100/60 flex items-center justify-center text-green-600 flex-shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Harsh Acceleration (HA)
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Well done! Steady acceleration saves fuel and
                              reduces engine wear.
                            </p>
                          </div>
                        </div>
                        <div className="text-green-600 flex-shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Event 4: IDL */}
                      <div className="bg-green-50/30 border border-green-100/50 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-green-100/60 flex items-center justify-center text-green-600 flex-shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Idle (IDL)
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Keep it up! Lower idling durations decrease fuel
                              usage and emission footprint.
                            </p>
                          </div>
                        </div>
                        <div className="text-green-600 flex-shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Event 5: BAT */}
                      <div className="bg-green-50/30 border border-green-100/50 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-green-100/60 flex items-center justify-center text-green-600 flex-shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Braking After Turn (BAT)
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Well done! Exiting turn at a steady speed improves
                              safety and comfort.
                            </p>
                          </div>
                        </div>
                        <div className="text-green-600 flex-shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
};

export default TripOverviewClient;
