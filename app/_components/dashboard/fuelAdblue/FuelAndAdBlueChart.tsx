"use client";

import React, { useEffect, useMemo } from "react";
import Chart from "chart.js/auto";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { computeMetrics, Point } from "./FuelAndAdblueTabs";
import useWindowSize from "@/app/hooks/useWindowSize";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import moment from "moment";

type PluginData = {
  event: string | null;
  amountFilled: number | null;
  amountStolen: number | null;
  distanceSinceLastFill: number | null;
  odometer: string;
  fuel: number;
  adblue: number;
  time: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  location: string;
}[];

const eventDotPlugin = (events: PluginData, datasetIndex: number) => {
  return {
    id: "eventDotPlugin",
    afterDatasetsDraw(chart: any) {
      const meta = chart.getDatasetMeta(datasetIndex);
      const ctx = chart.ctx;
      events.forEach((ev, idx) => {
        if (ev && ev.event) {
          const point = meta.data[idx];
          if (point) {
            ctx.fillStyle = ev.event === "filled" ? "#14b8a6" : "#f43f5e";
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      });
    },
  };
};

export const AdblueChart = ({
  data,
  rawData,
}: {
  data: VehicleData;
  rawData?: Point[];
}) => {
  const windowWidth = useWindowSize().width;
  const { userId } = useSelector((state: RootState) => state.auth);
  const chartData = (rawData || []).filter((d) => d.adblue >= 1);
  const adblueEvents = useMemo(() => {
    if (chartData.length === 0) return [];
    return computeMetrics(chartData, "adblue", 5);
  }, [chartData]);

  useEffect(() => {
    const canvasId = `adblueChart${data.vehReg}`;
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!ctx) return;

    if (chartData.length === 0) {
      const chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [],
        },
        options: {
          responsive: true,
          layout: {
            padding: { top: 30, bottom: 30, left: 50, right: 50 },
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "No adblue data available",
              font: { size: 16 },
              color: "#666",
            },
            datalabels: {
              opacity: 0,
            },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      });
      return () => chart.destroy();
    }

    const maxAdblue = Math.max(...chartData.map((d) => d.adblue));
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.map((d) =>
          Number(userId) === 833193
            ? moment(d.time).format("DD-MM-YYYY HH:mm")
            : d.odometer
        ),
        datasets: [
          {
            data: chartData.map((d) => d.adblue),
            fill: true,
            borderWidth: 0,
            backgroundColor: "#e0f2fe",
            pointRadius: 0,
            stepped: "before",
          },
          {
            data: chartData.map((d) => d.adblue),
            fill: false,
            borderWidth: 2,
            borderDash: [5, 5],
            borderColor: "#0284c7",
            pointRadius: 0,
            stepped: "before",
          },
        ],
      },
      options: {
        responsive: true,
        layout: {
          padding: { top: 30, bottom: 30, left: 50, right: 50 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: "nearest",
            intersect: false,
            filter: (tooltipItem) => tooltipItem.datasetIndex === 0,
            callbacks: {
              title: () => "",
              label: (context) => {
                const adblue = context.parsed.y;
                const odometer = context.label;
                return `Adblue: ${adblue?.toFixed()} L / Odometer: ${Number(
                  odometer
                )?.toFixed()} Km`;
              },
            },
          },
          datalabels: {
            opacity: 0,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: Number(userId) === 833193 ? "Date" : "Odometer (km)",
            },
            grid: { display: false },
          },
          y: {
            title: { display: true, text: "Adblue (L)" },
            beginAtZero: true,
            suggestedMax: maxAdblue > 0 ? maxAdblue * 1.2 : 100,
            grid: { display: false },
          },
        },
      },
      plugins: [eventDotPlugin(adblueEvents, 1)],
    });

    return () => chart.destroy();
  }, [data.vehReg, adblueEvents, chartData]);

  return (
    <canvas
      id={`adblueChart${data.vehReg}`}
      width={windowWidth}
      height="380"
      className="mt-5"
    />
  );
};

export const FuelChart = ({
  data,
  rawData,
  fuelFillingEvents,
  fuelTheftEvents,
  fuelTrackingRawData,
}: {
  data: VehicleData;
  rawData?: Point[];
  fuelFillingEvents?: any[];
  fuelTheftEvents?: any[];
  fuelTrackingRawData?: any;
}) => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const windowWidth = useWindowSize().width;

  // Build chart data; only user 833193 should use fuelTrackingRawData, others use rawData as-is
  const chartData = useMemo(() => {
    const isSpecialUser = Number(userId) === 833193;
    if (fuelTrackingRawData?.list && isSpecialUser) {
      // Preserve existing behavior for 833193 (filter + sort)
      const fuelLevelEntries = fuelTrackingRawData.list
        .filter(
          (item: any) =>
            item.fueltype === "Fuel" &&
            item.rv !== undefined &&
            item.rv !== null &&
            item.rv > 5
        )
        .map((item: any) => ({
          odometer: item.odometer?.toString() || "0",
          fuel: item.rv,
          adblue: 0,
          time: item.gps_time,
          gps_latitude: null,
          gps_longitude: null,
          location: "Unknown Location",
          event: null,
          amountFilled: null,
          amountStolen: null,
          distanceSinceLastFill: null,
        }))
        .sort((a: any, b: any) => Number(a.odometer) - Number(b.odometer));
      return fuelLevelEntries;
    }

    // For all other users or when tracking data is absent, rely on rawData as-is
    return rawData || [];
  }, [rawData, fuelTrackingRawData, userId]);

  // For user 833193, keep existing logic (computeMetrics)
  const fuelEvents = useMemo(() => {
    if (Number(userId) === 833193) {
      return computeMetrics(chartData, "fuel", 50);
    }

    if (chartData.length === 0) return [];
    const threshold = 50;
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    const result: any[] = [];
    let baseline = Number(chartData[0]?.fuel ?? 0);
    let lastFillTime: Date | null = null;

    for (let i = 0; i < chartData.length; i++) {
      const curr = chartData[i];
      const currFuel = Number(curr.fuel ?? 0);
      const currTime = new Date(curr.time);

      if (currFuel < baseline) {
        baseline = currFuel;
      }

      const cumulativeRise = currFuel - baseline;

      const meetsThreshold = cumulativeRise >= threshold;
      const twelveHoursPassed =
        !lastFillTime ||
        currTime.getTime() - lastFillTime.getTime() >= twelveHoursInMs;
      const isFilled = meetsThreshold && twelveHoursPassed;

      result.push({
        ...curr,
        event: isFilled ? "filled" : null,
        amountFilled: isFilled ? cumulativeRise : null,
        amountStolen: null,
        distanceSinceLastFill: null,
      });

      if (isFilled) {
        baseline = currFuel;
        lastFillTime = currTime;
      }
    }
    return result;
  }, [chartData, userId]);

  useEffect(() => {
    const canvasId = `fuelChart${data.vehReg}`;
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!ctx) return;

    if (chartData.length === 0) {
      const chart = new Chart(ctx, {
        type: "line",
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          layout: { padding: { top: 30, bottom: 30, left: 50, right: 50 } },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "No fuel data available",
              font: { size: 16 },
              color: "#666",
            },
            datalabels: {
              opacity: 0,
            },
          },
          scales: { x: { display: false }, y: { display: false } },
        },
      });
      return () => chart.destroy();
    }

    let pointsToDraw: { x: number; y: number; color: string }[] = [];
    const xLabels = chartData.map((d: any) =>
      Number(userId) === 833193 ? moment(d.time).format("DD/MM") : d.odometer
    );
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: xLabels,
        datasets: [
          {
            data: chartData.map((d: any) => d.fuel),
            fill: true,
            borderWidth: 0,
            backgroundColor: "rgba(130, 202, 157, 0.2)",
            pointRadius: 0,
            stepped: Number(userId) === 833193 ? "before" : false,
          },
          {
            data: chartData.map((d: any) => d.fuel),
            fill: false,
            borderWidth: 2,
            borderDash: [5, 5],
            borderColor: "rgb(130, 202, 157)",
            pointRadius: 0,
            stepped: Number(userId) === 833193 ? "before" : false,
          },
        ],
      },
      options: {
        responsive: true,
        layout: { padding: { top: 30, bottom: 30, left: 50, right: 50 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: "nearest",
            intersect: false,
            filter: (tooltipItem) => tooltipItem.datasetIndex === 0,
            callbacks: {
              title: () => ``,
              label: (context) => {
                const fuel = context.parsed.y;
                const odometer = context.label;
                return `Fuel: ${fuel?.toFixed()} L / Odometer: ${Number(
                  odometer
                )?.toFixed()} Km`;
              },
            },
          },
          datalabels: {
            opacity: 0,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: Number(userId) === 833193 ? "Date" : "Odometer (km)",
            },
            grid: { display: false },
          },
          y: {
            title: { display: true, text: "Fuel (L)" },
            beginAtZero: true,
            suggestedMax:
              Math.max(...chartData.map((d: any) => d.fuel)) * 1.2 || 100,
            grid: { display: false },
          },
        },
        animation: {
          onComplete: function () {
            const meta = chart.getDatasetMeta(1);
            pointsToDraw = fuelEvents
              .map((ev: any, idx: number) => {
                if (!ev || !ev.event) return { x: 0, y: 0, color: "" };
                const point = meta.data[idx];
                if (!point) return { x: 0, y: 0, color: "" };
                return {
                  x: point.x,
                  y: point.y,
                  color: ev.event === "filled" ? "#14b8a6" : "#f43f5e",
                };
              })
              .filter((r: any) => r.x === 0 && r.y === 0);
            chart.draw();
          },
        },
      },
      plugins: [eventDotPlugin(fuelEvents, 1)],
    });

    return () => chart.destroy();
  }, [data.vehReg, fuelEvents, chartData, userId]);

  return (
    <canvas
      id={`fuelChart${data.vehReg}`}
      width={windowWidth}
      height="380"
      className="mt-5"
    />
  );
};
