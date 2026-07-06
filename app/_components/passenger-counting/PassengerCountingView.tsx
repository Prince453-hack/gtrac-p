"use client";

import { DatePicker, Modal, Skeleton } from "antd";
import dayjs from "dayjs";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "./StatCard";

interface ViewProps {
  serviceId: string | null;
}

type RangeKey = "today" | "yesterday" | "last3Days" | "lastWeek";

type SnapshotEntry = {
  cam_imei_entry: string;
  cam_imei_exit: string;
  id: number;
  device_ts: string;
  entry_count: number;
  exit_count: number;
  inside_count: number;
  total_count: number;
  male_count: number;
  female_count: number;
  unknown_count: number;
  received_at: string;
};

type PassengerMetrics = {
  total: number;
  incoming: number;
  outgoing: number;
  inside: number;
  records: number;
};

type TrendPoint = {
  date: string;
  total: number;
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last3Days", label: "Last 3 Days" },
  { key: "lastWeek", label: "Last Week" },
];

const formatApiDateTime = (value: moment.Moment) =>
  value.format("YYYY-MM-DD HH:mm:ss");

const getRangeBounds = (rangeKey: RangeKey) => {
  const todayStart = moment().startOf("day");
  const todayEnd = moment().endOf("day");

  switch (rangeKey) {
    case "yesterday": {
      const day = moment().subtract(1, "day");
      return {
        startTime: formatApiDateTime(day.clone().startOf("day")),
        endTime: formatApiDateTime(day.clone().endOf("day")),
      };
    }
    case "last3Days":
      return {
        startTime: formatApiDateTime(
          moment().subtract(2, "days").startOf("day"),
        ),
        endTime: formatApiDateTime(todayEnd),
      };
    case "lastWeek":
      return {
        startTime: formatApiDateTime(
          moment().subtract(6, "days").startOf("day"),
        ),
        endTime: formatApiDateTime(todayEnd),
      };
    case "today":
    default:
      return {
        startTime: formatApiDateTime(todayStart),
        endTime: formatApiDateTime(todayEnd),
      };
  }
};

const getDateKey = (value: string) => moment(value).format("YYYY-MM-DD");

const getLatestEntry = (entries: SnapshotEntry[]) => {
  return entries.reduce((latest, entry) => {
    const entryTime = entry.device_ts || entry.received_at;
    const latestTime = latest.device_ts || latest.received_at;
    return moment(entryTime).isAfter(moment(latestTime)) ? entry : latest;
  }, entries[0]);
};

const calculateMetrics = (
  entries: SnapshotEntry[] | null,
): PassengerMetrics & { male: number; female: number } => {
  const data = entries || [];

  if (data.length === 0) {
    return {
      total: 0,
      incoming: 0,
      outgoing: 0,
      inside: 0,
      records: 0,
      male: 0,
      female: 0,
    };
  }

  const latest = getLatestEntry(data);

  const incoming = data.reduce(
    (sum, entry) => sum + (entry.entry_count || 0),
    0,
  );
  return {
    total: incoming,
    incoming,
    outgoing: data.reduce((sum, entry) => sum + (entry.exit_count || 0), 0),
    inside: latest.inside_count || 0,
    records: data.length,
    male: data.reduce((sum, entry) => sum + (entry.male_count || 0), 0),
    female: data.reduce((sum, entry) => sum + (entry.female_count || 0), 0),
  };
};

const fetchSnapshots = async (
  startTime?: string,
  endTime?: string,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams();
  if (startTime) params.set("startTime", startTime);
  if (endTime) params.set("endTime", endTime);

  const queryString = params.toString();
  const url = queryString ? `/api/snapshots?${queryString}` : "/api/snapshots";

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load snapshot data");
  }

  return (await response.json()) as SnapshotEntry[];
};

const fetchLatestSnapshot = async (signal?: AbortSignal) => {
  const response = await fetch("/api/snapshots/latest", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load snapshot data");
  }

  return (await response.json()) as SnapshotEntry;
};

const MOCK_DATA_ENTRIES = [
  {
    dateStr: "2026-05-21",
    metrics: {
      total: 13,
      incoming: 13,
      outgoing: 11,
      inside: 2,
      records: 13,
    },
    videoUrl:
      "https://player.cloudinary.com/embed/?cloud_name=duzzksohs&public_id=new_ucwn5r",
  },
  {
    dateStr: "2026-06-10",
    metrics: {
      total: 9,
      incoming: 9,
      outgoing: 8,
      inside: 1,
      records: 9,
    },
    videoUrl:
      "https://res.cloudinary.com/dby6lec6u/video/upload/v1781240783/video_bfzao7.mp4",
  },
];

const getMatchingMockEntries = (start: moment.Moment, end: moment.Moment) => {
  return MOCK_DATA_ENTRIES.filter((entry) => {
    const entryDate = moment(entry.dateStr, "YYYY-MM-DD");
    return (
      entryDate.isSameOrAfter(start, "day") &&
      entryDate.isSameOrBefore(end, "day")
    );
  });
};

const PassengerCountingView = ({ serviceId }: ViewProps) => {
  const [selectedRange, setSelectedRange] = useState<"today" | "custom">(
    "today",
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [queryDates, setQueryDates] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [rangeData, setRangeData] = useState<SnapshotEntry[] | null>(null);
  const [snapshotData, setSnapshotData] = useState<SnapshotEntry | null>(null);
  const [loadingRange, setLoadingRange] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const [activeCamTab, setActiveCamTab] = useState<"entry" | "exit">("entry");
  const [currentTime, setCurrentTime] = useState<moment.Moment>(moment());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedBounds = useMemo(() => {
    if (selectedRange === "today") {
      const todayStart = moment().startOf("day");
      const todayEnd = moment().endOf("day");
      return {
        startTime: formatApiDateTime(todayStart),
        endTime: formatApiDateTime(todayEnd),
      };
    } else {
      const start = queryDates
        ? moment(queryDates.start).startOf("day")
        : moment().startOf("day");
      const end = queryDates
        ? moment(queryDates.end).endOf("day")
        : moment().endOf("day");
      return {
        startTime: formatApiDateTime(start),
        endTime: formatApiDateTime(end),
      };
    }
  }, [selectedRange, queryDates]);

  const activeMockEntries = useMemo(() => {
    const start = moment(
      selectedBounds.startTime,
      "YYYY-MM-DD HH:mm:ss",
    ).startOf("day");
    const end = moment(selectedBounds.endTime, "YYYY-MM-DD HH:mm:ss").endOf(
      "day",
    );
    return getMatchingMockEntries(start, end);
  }, [selectedBounds]);

  useEffect(() => {
    if (activeMockEntries.length > 0) {
      // Default selected video url to the first available mock entry
      setSelectedVideoUrl(activeMockEntries[0].videoUrl);
      setLoadingRange(false);
      return;
    }

    const controller = new AbortController();

    const loadRange = async () => {
      setLoadingRange(true);
      setError(null);

      try {
        if (selectedRange === "today") {
          const snapshotRes = await fetchLatestSnapshot(controller.signal);
          if (!controller.signal.aborted) {
            setRangeData(null);
            setSnapshotData(snapshotRes);
          }
        } else {
          const historyRes = await fetchSnapshots(
            selectedBounds.startTime,
            selectedBounds.endTime,
            controller.signal,
          );
          if (!controller.signal.aborted) {
            setRangeData(historyRes);
            setSnapshotData(null);
          }
        }
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setRangeData(null);
          setSnapshotData(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load passenger count data",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRange(false);
        }
      }
    };

    loadRange();

    return () => controller.abort();
  }, [
    selectedBounds.endTime,
    selectedBounds.startTime,
    activeMockEntries,
    selectedRange,
  ]);

  useEffect(() => {
    setLoadingTrend(false);
  }, [selectedRange, queryDates]);

  const metrics = useMemo(() => {
    if (selectedRange === "today" && snapshotData) {
      return {
        total: snapshotData.total_count,
        incoming: snapshotData.entry_count,
        outgoing: snapshotData.exit_count,
        inside: snapshotData.inside_count,
        records: snapshotData.total_count,
        male: snapshotData.male_count,
        female: snapshotData.female_count,
      };
    }

    if (activeMockEntries.length > 0) {
      const sortedMocks = [...activeMockEntries].sort((a, b) =>
        moment(a.dateStr).diff(moment(b.dateStr)),
      );
      const incoming = sortedMocks.reduce(
        (sum, m) => sum + m.metrics.incoming,
        0,
      );
      const total = incoming;
      const outgoing = sortedMocks.reduce(
        (sum, m) => sum + m.metrics.outgoing,
        0,
      );
      const inside = sortedMocks.reduce((sum, m) => sum + m.metrics.inside, 0);
      const records = sortedMocks.reduce(
        (sum, m) => sum + m.metrics.records,
        0,
      );
      return { total, incoming, outgoing, inside, records, male: 0, female: 0 };
    }
    const computed = calculateMetrics(rangeData);
    return {
      ...computed,
    };
  }, [rangeData, activeMockEntries, selectedRange, snapshotData]);

  const chartData = useMemo(() => {
    const start = moment(
      selectedBounds.startTime,
      "YYYY-MM-DD HH:mm:ss",
    ).startOf("day");
    const end = moment(selectedBounds.endTime, "YYYY-MM-DD HH:mm:ss").endOf(
      "day",
    );
    const daysCount = end.diff(start, "days") + 1;

    if (activeMockEntries.length > 0) {
      if (daysCount === 1) {
        const singleMock = activeMockEntries[0];
        const targetDay = moment(singleMock.dateStr, "YYYY-MM-DD");
        const days = Array.from({ length: 7 }, (_, index) =>
          targetDay.clone().subtract(6 - index, "days"),
        );
        return days.map((day) => {
          const dateStr = day.format("YYYY-MM-DD");
          const matchingMock = activeMockEntries.find(
            (m) => m.dateStr === dateStr,
          );
          return {
            date: day.format("MMM D"),
            total: matchingMock ? matchingMock.metrics.total : 0,
          };
        });
      } else if (daysCount <= 31) {
        const days = Array.from({ length: daysCount }, (_, index) =>
          start.clone().add(index, "days"),
        );
        return days.map((day) => {
          const dateStr = day.format("YYYY-MM-DD");
          const matchingMock = activeMockEntries.find(
            (m) => m.dateStr === dateStr,
          );
          return {
            date: day.format("MMM D"),
            total: matchingMock ? matchingMock.metrics.total : 0,
          };
        });
      } else {
        return activeMockEntries.map((m) => ({
          date: moment(m.dateStr).format("MMM D"),
          total: m.metrics.total,
        }));
      }
    }
    if (rangeData && Array.isArray(rangeData) && rangeData.length > 0) {
      const dailyTotals: { [key: string]: number } = {};
      rangeData.forEach((entry) => {
        const dateStr = moment(entry.device_ts || entry.received_at).format(
          "YYYY-MM-DD",
        );
        dailyTotals[dateStr] =
          (dailyTotals[dateStr] || 0) + (entry.total_count || 0);
      });

      const anchor =
        selectedRange === "custom" && queryDates
          ? moment(queryDates.start)
          : moment().subtract(6, "days").startOf("day");

      const lastSevenDays = Array.from({ length: 7 }, (_, index) =>
        anchor.clone().add(index, "days"),
      );
      return lastSevenDays.map((day) => {
        const dateKey = day.format("YYYY-MM-DD");
        let total = dailyTotals[dateKey] || 0;

        if (
          selectedRange === "today" &&
          day.isSame(moment(), "day") &&
          snapshotData
        ) {
          total = snapshotData.total_count;
        }

        return {
          date: day.format("MMM D"),
          total,
        };
      });
    }

    const anchor =
      selectedRange === "custom" && queryDates
        ? moment(queryDates.start)
        : moment().subtract(6, "days").startOf("day");
    const lastSevenDays = Array.from({ length: 7 }, (_, index) =>
      anchor.clone().add(index, "days"),
    );
    return lastSevenDays.map((day) => {
      let total = 0;

      if (
        selectedRange === "today" &&
        day.isSame(moment(), "day") &&
        snapshotData
      ) {
        total = snapshotData.total_count;
      }

      return {
        date: day.format("MMM D"),
        total,
      };
    });
  }, [
    activeMockEntries,
    selectedBounds,
    selectedRange,
    queryDates,
    snapshotData,
  ]);
  return (
    <div className="min-h-full p-6 lg:p-8 bg-white overflow-y-auto">
      <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5 mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            Passenger Counting
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Real-time analytics
          </p>
        </div>
      </div>

      <div className="mx-auto space-y-8">
        {/* Filters Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-10 shadow-sm w-full sm:w-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4 text-slate-500 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <DatePicker
                value={startDate ? dayjs(startDate) : null}
                onChange={(date) => setStartDate(date ? date.toDate() : null)}
                placeholder="Start Date"
                format="DD/MM/YYYY"
                bordered={false}
                suffixIcon={null}
                className="w-[110px] text-sm p-0 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-10 shadow-sm w-full sm:w-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-4 h-4 text-slate-500 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <DatePicker
                value={endDate ? dayjs(endDate) : null}
                onChange={(date) => setEndDate(date ? date.toDate() : null)}
                placeholder="End Date"
                format="DD/MM/YYYY"
                bordered={false}
                suffixIcon={null}
                className="w-[110px] text-sm p-0 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeMockEntries.length > 0 && (
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition cursor-pointer w-full sm:w-auto text-sm font-semibold shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play Event Video</span>
              </button>
            )}
            <button
              type="button"
              disabled={!startDate || !endDate}
              onClick={() => {
                if (startDate && endDate) {
                  setQueryDates({ start: startDate, end: endDate });
                  setSelectedRange("custom");
                }
              }}
              className={`rounded-lg px-6 h-10 text-sm font-semibold transition-all duration-200 w-full sm:w-auto flex items-center justify-center ${
                startDate && endDate
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              Submit
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingRange ? (
            <>
              <Skeleton active paragraph={{ rows: 2 }} />
              <Skeleton active paragraph={{ rows: 2 }} />
              <Skeleton active paragraph={{ rows: 2 }} />
              <Skeleton active paragraph={{ rows: 2 }} />
            </>
          ) : (
            <>
              <StatCard
                title="Total"
                value={metrics.incoming.toLocaleString()}
                maleValue={metrics.male}
                femaleValue={metrics.female}
                subtitle="Total entry counts"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 018.625 21c-2.227 0-4.303-.64-6.059-1.745v-.079a2.91 2.91 0 012.91-2.91H8a4.964 4.964 0 012.766.837m.074.004c.49.91.774 1.954.774 3.067V21M17 6.75a3 3 0 11-6 0 3 3 0 016 0zm-9 3a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Entry"
                value={metrics.incoming.toLocaleString()}
                maleValue={metrics.male}
                femaleValue={metrics.female}
                subtitle="Sum of incoming counts"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M10 17l5-5-5-5M13 12H3"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Exit"
                value={metrics.outgoing.toLocaleString()}
                showGender={false}
                subtitle="Sum of outgoing counts"
                iconBg="bg-red-50"
                iconColor="text-red-500"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h3M19 12h-10M14 7l5 5-5 5"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Inside"
                value={metrics.inside.toLocaleString()}
                maleValue={metrics.male}
                femaleValue={metrics.female}
                subtitle="Latest inside value"
                iconBg="bg-slate-50"
                iconColor="text-slate-500"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Camera Tabs Section */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-4 mb-5">
            <div className="sm:w-1/3">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Camera Summary
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {activeCamTab === "entry"
                  ? `Entry Camera: ${snapshotData?.cam_imei_entry || "C15CBDCP1000692283"}`
                  : `Exit Camera: ${snapshotData?.cam_imei_exit || "1A146DCP1000670037"}`}
              </p>
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit sm:mx-auto">
              <button
                type="button"
                onClick={() => setActiveCamTab("entry")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeCamTab === "entry"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Entry Cam
              </button>
              <button
                type="button"
                onClick={() => setActiveCamTab("exit")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeCamTab === "exit"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Exit Cam
              </button>
            </div>

            <div className="hidden sm:block sm:w-1/3" />
          </div>

          {/* Today Summary Table in Excel format */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Today Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200">
                      Status
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200">
                      Start
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-200">
                      End
                    </th>
                    <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 hover:bg-slate-50/50">
                    <td className="px-4 py-3 border-r border-slate-200">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono border-r border-slate-200">
                      {(() => {
                        const startVal = snapshotData?.received_at || "2026-07-06T05:24:08.000Z";
                        return moment.utc(startVal).utcOffset("+05:30").format("HH:mm:ss");
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono border-r border-slate-200">
                      {currentTime.utcOffset("+05:30").format("HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold font-mono">
                      {(() => {
                        const startVal =
                          snapshotData?.received_at || "2026-07-06T05:24:08.000Z";
                        const startMoment = moment.utc(startVal).utcOffset("+05:30");
                        const currentIST = currentTime.clone().utcOffset("+05:30");
                        const diffMs = currentIST.diff(startMoment);
                        if (diffMs < 0) return "00:00:00";

                        const durationSec = Math.floor(diffMs / 1000);
                        const hours = Math.floor(durationSec / 3600);
                        const minutes = Math.floor((durationSec % 3600) / 60);
                        const seconds = durationSec % 60;

                        return [
                          String(hours).padStart(2, "0"),
                          String(minutes).padStart(2, "0"),
                          String(seconds).padStart(2, "0"),
                        ].join(":");
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Daily Passengers
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Total passenger count across the last seven days
              </p>
            </div>
            <p className="text-xs text-slate-400 font-medium">Last 7 days</p>
          </div>

          <div className="mt-8 h-[360px] w-full">
            {loadingTrend ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50">
                <Skeleton active className="w-full px-4 sm:px-10" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [value, "Total"]}
                    labelStyle={{ color: "#0f172a" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <Modal
        title="Event Video Playback"
        open={isVideoModalOpen}
        onCancel={() => setIsVideoModalOpen(false)}
        footer={null}
        width={800}
        centered
        styles={{
          body: { padding: 0, backgroundColor: "#000", overflow: "hidden" },
        }}
      >
        {activeMockEntries.length > 1 && (
          <div className="flex justify-center gap-2 p-3 bg-slate-900 border-b border-slate-800">
            {activeMockEntries.map((entry) => (
              <button
                key={entry.dateStr}
                type="button"
                onClick={() => setSelectedVideoUrl(entry.videoUrl)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  selectedVideoUrl === entry.videoUrl
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {moment(entry.dateStr).format("MMM D, YYYY")}
              </button>
            ))}
          </div>
        )}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56.25%",
            height: 0,
          }}
        >
          {selectedVideoUrl && (
            <iframe
              src={selectedVideoUrl}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PassengerCountingView;
