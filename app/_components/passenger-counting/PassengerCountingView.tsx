"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import moment from "moment";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "antd";

interface ViewProps {
  serviceId: string | null;
}

type RangeKey = "today" | "yesterday" | "last3Days" | "lastWeek";

type PassengerCountEntry = {
  id: number;
  datetime: string;
  hin: number;
  hout: number;
  inside: number;
  total: number;
  timestamp?: string;
  push_by?: string;
};

type PassengerCountResponse = {
  startTime: string;
  endTime: string;
  count: number;
  data: PassengerCountEntry[];
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

const PASSENGER_COUNT_ROUTE = "/api/passenger-count";

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

const getLatestEntry = (entries: PassengerCountEntry[]) => {
  return entries.reduce((latest, entry) => {
    return moment(entry.datetime).isAfter(moment(latest.datetime))
      ? entry
      : latest;
  }, entries[0]);
};

const calculateMetrics = (
  response: PassengerCountResponse | null,
): PassengerMetrics => {
  const entries = response?.data || [];

  if (entries.length === 0) {
    return {
      total: 0,
      incoming: 0,
      outgoing: 0,
      inside: 0,
      records: response?.count || 0,
    };
  }

  const latest = getLatestEntry(entries);

  return {
    total: new Set(entries.map((entry) => entry.total)).size,
    incoming: entries.reduce((sum, entry) => sum + (entry.hin || 0), 0),
    outgoing: entries.reduce((sum, entry) => sum + (entry.hout || 0), 0),
    inside: latest.inside || 0,
    records: response?.count || entries.length,
  };
};

const buildTrendData = (
  response: PassengerCountResponse | null,
): TrendPoint[] => {
  const entries = response?.data || [];

  const lastSevenDays = Array.from({ length: 7 }, (_, index) =>
    moment().subtract(6 - index, "days"),
  );

  return lastSevenDays.map((day) => {
    const dateKey = day.format("YYYY-MM-DD");
    const dayEntries = entries
      .filter((entry) => getDateKey(entry.datetime) === dateKey)
      .sort(
        (left, right) =>
          moment(left.datetime).valueOf() - moment(right.datetime).valueOf(),
      );

    const latestTotal = dayEntries.length
      ? dayEntries[dayEntries.length - 1].total || 0
      : 0;

    return {
      date: day.format("MMM D"),
      total: latestTotal,
    };
  });
};

const fetchPassengerCount = async (
  startTime: string,
  endTime: string,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({ startTime, endTime });
  const response = await fetch(
    `${PASSENGER_COUNT_ROUTE}?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load passenger count data");
  }

  return (await response.json()) as PassengerCountResponse;
};

const StatCard = ({
  title,
  value,
  subtitle,
  accentClass,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  accentClass: string;
  iconBg: string;
}) => (
  <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
        <div className={`mt-3 text-4xl font-semibold ${accentClass}`}>
          {value}
        </div>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}
      >
        <Image
          src="/assets/images/Persons.png"
          alt={title}
          width={22}
          height={22}
        />
      </div>
    </div>
  </div>
);

const PassengerCountingView = ({ serviceId }: ViewProps) => {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [rangeData, setRangeData] = useState<PassengerCountResponse | null>(
    null,
  );
  const [trendDataSource, setTrendDataSource] =
    useState<PassengerCountResponse | null>(null);
  const [loadingRange, setLoadingRange] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedBounds = useMemo(
    () => getRangeBounds(selectedRange),
    [selectedRange],
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadRange = async () => {
      setLoadingRange(true);
      setError(null);

      try {
        const response = await fetchPassengerCount(
          selectedBounds.startTime,
          selectedBounds.endTime,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setRangeData(response);
        }
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setRangeData(null);
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
  }, [selectedBounds.endTime, selectedBounds.startTime]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTrend = async () => {
      setLoadingTrend(true);

      try {
        const response = await fetchPassengerCount(
          formatApiDateTime(moment().subtract(6, "days").startOf("day")),
          formatApiDateTime(moment().endOf("day")),
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setTrendDataSource(response);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTrendDataSource(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTrend(false);
        }
      }
    };

    loadTrend();

    return () => controller.abort();
  }, []);

  const metrics = calculateMetrics(rangeData);
  const chartData = buildTrendData(trendDataSource);
  const activeRangeLabel = RANGE_OPTIONS.find(
    (option) => option.key === selectedRange,
  )?.label;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          {RANGE_OPTIONS.map((option) => {
            const active = option.key === selectedRange;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                    : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                value={metrics.total.toLocaleString()}
                subtitle={`Records in range: ${metrics.records.toLocaleString()}`}
                accentClass="text-emerald-500"
                iconBg="bg-emerald-100"
              />
              <StatCard
                title="In"
                value={metrics.incoming.toLocaleString()}
                subtitle="Sum of incoming counts"
                accentClass="text-sky-500"
                iconBg="bg-sky-100"
              />
              <StatCard
                title="Out"
                value={metrics.outgoing.toLocaleString()}
                subtitle="Sum of outgoing counts"
                accentClass="text-fuchsia-500"
                iconBg="bg-fuchsia-100"
              />
              <StatCard
                title="Inside"
                value={metrics.inside.toLocaleString()}
                subtitle="Latest inside value in range"
                accentClass="text-amber-500"
                iconBg="bg-amber-100"
              />
            </>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">
                7 day trend
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Daily total passengers
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Latest total per day across the last seven days.
            </p>
          </div>

          <div className="mt-6 h-[360px] w-full">
            {loadingTrend ? (
              <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50">
                <Skeleton active className="w-full px-4 sm:px-10" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
                    fill="#10b981"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerCountingView;
