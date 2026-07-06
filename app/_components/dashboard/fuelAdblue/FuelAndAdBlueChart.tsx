"use client";

import React, { useEffect, useMemo } from "react";
import Chart from "chart.js/auto";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { computeMetrics, Point } from "./FuelAndAdblueTabs";
import useWindowSize from "@/app/hooks/useWindowSize";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import moment from "moment";
export const vehiclePairs: Record<string, string> = {
  "12449386": "1201000730",
  "12449853": "1235000315",
  "12448978": "1235000290",
  "12449127": "1235000295",
  "12449128": "1235000296",
  "12448979": "1201000728",
  "12449665": "1235000308",
  "12449666": "1235000309",
  "12449834": "1235000314",
  "12449216": "1201000729",
  "12449832": "1204004523",
  "12448916": "1235000289",
  "12448801": "1204004389",
  "12449315": "1235000300",
  "12449353": "1235000305",
  "12449314": "1235000299",
  "12449733": "1235000312",
  "12449731": "1235000310",
  "12448973": "1201000727",
  "12449852": "1201000732",
  "12449059": "1235000291",
  "12449389": "1201000731",
  "12449214": "1235000297",
  "12448981": "1201000724",
  "12448977": "1201000725",
  "12449318": "1235000304",
  "12449132": "1235000301",
  "12448975": "1201000726",
  "12449215": "1235000298",
  "12449854": "1235000316",
  "12449833": "1235000313",
  "12449060": "1235000292",
  "12449316": "1235000302",
  "12448802": "1235000281",
  "12449467": "1235000306",
  "12449317": "1235000303",
  "12449126": "1235000294",
  "12448917": "1204004467",
  "12449732": "1235000311",
  "12448974": "1201000723",
  "12448795": "1201000717",
};

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
            : d.odometer,
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
                  odometer,
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
            suggestedMax:
              Number(userId) === 833863
                ? 50
                : maxAdblue > 0
                  ? maxAdblue * 1.2
                  : 100,
            max: Number(userId) === 833863 ? 50 : undefined,
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

  const isSpecialUser = Number(userId) === 833193;

  // Build chart data; the parent component maps fuelData correctly
  const chartData = useMemo(() => {
    return rawData || [];
  }, [rawData]);

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
      isSpecialUser ? moment(d.time).format("DD/MM HH:mm") : d.odometer,
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
            stepped: isSpecialUser ? "before" : false,
          },
          {
            data: chartData.map((d: any) => d.fuel),
            fill: false,
            borderWidth: 2,
            borderDash: [5, 5],
            borderColor: "rgb(130, 202, 157)",
            pointRadius: 0,
            stepped: isSpecialUser ? "before" : false,
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
                const label = context.label;
                if (isSpecialUser) {
                  return `Fuel: ${fuel?.toFixed(2)} L / Date: ${label}`;
                }
                return `Fuel: ${fuel?.toFixed()} L / Odometer: ${Number(
                  label,
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
              text: isSpecialUser ? "Date" : "Odometer (km)",
            },
            grid: { display: false },
          },
          y: {
            title: { display: true, text: "Fuel (L)" },
            beginAtZero: true,
            suggestedMax:
              Number(userId) === 833863
                ? 350
                : Math.max(...chartData.map((d: any) => d.fuel)) * 1.2 || 100,
            max: Number(userId) === 833863 ? 350 : undefined,
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
