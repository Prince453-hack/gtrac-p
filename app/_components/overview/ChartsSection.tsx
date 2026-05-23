"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { BarChart } from "./charts/BarChart";
import { LineChart } from "./charts/LineChart";
import { ScatterChart } from "./charts/ScatterChart";
import { ServiceReminderChart } from "./charts/ServiceReminderChart";
import {
  useLazyGetAlertsByDateQuery,
  useLazyGetDTCResultQuery,
  useLazyGetConsolidateDetailQuery,
  useLazyGetRawFuelWithDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { Spin } from "antd";
import { AlertByDateLorryData } from "@/app/_globalRedux/services/types/alerts";
import ChartDataLabels from "chartjs-plugin-datalabels";
import annotationPlugin from "chartjs-plugin-annotation";
import { computeMetrics } from "../dashboard/fuelAdblue/FuelAndAdblueTabs";
import { Chart } from "chart.js";

type DTCAlerts =
  | "Acceleration"
  | "Battery"
  | "Brake"
  | "Engine"
  | "SafetySystems"
  | "Sensor"
  | "General";
const validDTCAlerts: DTCAlerts[] = [
  "Acceleration",
  "Battery",
  "Brake",
  "Engine",
  "SafetySystems",
  "Sensor",
  "General",
];
type DailyData = {
  date: string;
  mileage: number;
  distance: number;
  fuelConsumed: number;
  engineHours: number;
};

type Point = {
  odometer: string;
  fuel: number;
  adblue: number;
  time: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  location: string;
  event: "filled" | "theft" | null;
  amountFilled: number | null;
  amountStolen: number | null;
  distanceSinceLastFill: number | null;
};

const fuelEfficiencyVehicleNumber = [
  12427786, 12427960, 12427961, 12428431, 12428430, 12428516, 12423390,
  12422014, 12421809, 12420157, 12420220, 12420219, 12421235, 12421234,
  12421273, 12421699, 12421700,
];

function getDtcCount(dtcAlerts: GetDTCResponse["list"]): Record<any, number> {
  const count: Record<DTCAlerts, number> = {
    Acceleration: 0,
    Battery: 0,
    Brake: 0,
    Engine: 0,
    SafetySystems: 0,
    Sensor: 0,
    General: 0,
  };

  dtcAlerts.forEach((alert) => {
    for (let i = 1; i <= 10; i++) {
      const category = (alert as any)[`SPN${i}_Category`];
      if (
        typeof category === "string" &&
        validDTCAlerts.includes(category as DTCAlerts)
      ) {
        count[category as DTCAlerts]++;
      }
    }
  });

  return count;
}

const generateReminderData = () => [
  {
    vehicle: "HR26DQ5551",
    service: "Amc service due for vehicle",
    days: "3 days",
    color: "bg-red-200",
  },
  {
    vehicle: "HR62MBS241",
    service: "Permit document due for vehicle",
    days: "7 days",
    color: "bg-red-200",
  },
  {
    vehicle: "HR3KG3421",
    service: "Service due for oil filter this vehicle",
    days: "15 days",
    color: "bg-red-200",
  },
  {
    vehicle: "HR62BU0973",
    service: "Amc service due for vehicle",
    days: "21 days",
    color: "bg-blue-200",
  },
  {
    vehicle: "HR26DQ2323",
    service: "Permit document due for vehicle",
    days: "24 days",
    color: "bg-blue-200",
  },
  {
    vehicle: "HR26HI4526",
    service: "Service due for oil filter this vehicle",
    days: "26 days",
    color: "bg-blue-200",
  },
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  annotationPlugin
);

type ReminderListData = Array<{
  vehicle: string;
  service: string;
  days: string;
  color: string;
}>;

type ChartConfig =
  | {
      chartType: "double-area";
      title: string;
      subtitle?: string;
      series: Array<{
        name: string;
        color: string;
        alertType?: string;
        alertResponseKey?: string;
      }>;
      data: Array<{ day: string; values: number[] }>;
    }
  | {
      chartType: "bar";
      title: string;
      subtitle?: string;
      series: Array<{
        name: string;
        color: string;
        alertType?: string;
        alertResponseKey?: string;
      }>;
      data: Array<{ day: string; values: number[] }>;
    }
  | {
      chartType: "reminder-list";
      title: string;
      subtitle?: string;
      series: Array<{
        name: string;
        color: string;
        alertType?: string;
        alertResponseKey?: string;
      }>;
      data: ReminderListData;
    }
  | {
      chartType: "line";
      title: string;
      subtitle?: string;
      series: Array<{
        name: string;
        color: string;
        alertType?: string;
        alertResponseKey?: string;
      }>;
      data: any;
    }
  | {
      chartType: "dot";
      title: string;
      subtitle?: string;
      series: Array<{
        name: string;
        color: string;
        alertType?: string;
        alertResponseKey?: string;
      }>;
      data: any;
    }
  | {
      chartType: "area";
      title: string;
      subtitle?: string;
      series: Array<{
        name: string;
        color: string;
        alertType?: string;
        alertResponseKey?: string;
      }>;
      data: any;
    };

const ChartCard = ({
  chart,
  isLoading,
}: {
  chart: ChartConfig;
  isLoading: boolean;
}) => {
  if (!chart || !chart.chartType) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-gray-900 ml-1">
            {chart.title}
          </h3>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <Spin size="large" spinning />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-gray-900 ml-1">
          {chart.title}
        </h3>
      </div>
      {chart.chartType === "bar" && (
        <BarChart series={chart.series} data={chart.data} fill={false} />
      )}
      {chart.chartType === "reminder-list" && (
        <ServiceReminderChart data={chart.data} />
      )}
      {chart.chartType === "line" && (
        <LineChart series={chart.series} data={chart.data} fill={false} />
      )}
      {chart.chartType === "dot" && (
        <ScatterChart series={chart.series} data={chart.data} />
      )}
      {chart.chartType === "area" && (
        <LineChart series={chart.series} data={chart.data} fill={true} />
      )}
    </div>
  );
};

const alertsCharts: ChartConfig[] = [
  {
    chartType: "area",
    title: "Driver Behaviour",
    subtitle: "Harsh Braking | Free Wheeling | Harsh Acceleration | RPM Spike",
    series: [
      {
        name: "Harsh Braking",
        color: "rgb(254, 202, 202)",
        alertType: "harshBreaking",
        alertResponseKey: "harshBreak",
      },
      {
        name: "Free Wheeling",
        color: "rgb(187, 247, 208)",
        alertType: "Freewheeling",
        alertResponseKey: "freewheeling",
      },
      {
        name: "Harsh Acceleration",
        color: "rgb(191, 219, 254)",
        alertType: "harshAcceleration",
        alertResponseKey: "harshacc",
      },
    ],
    data: [],
  },
  {
    chartType: "bar",
    title: "Vehicle Health",
    subtitle: "DTC Counts by Category",
    series: [{ name: "DTC Count", color: "rgb(254, 202, 202)" }],
    data: [],
  },
  {
    chartType: "bar",
    title: "Gps",
    subtitle: "Battery Disconnect | Overspeed | Excessive Idling",
    series: [
      {
        name: "Battery Disconnect",
        color: "rgb(254, 202, 202)",
        alertType: "Mainpower",
        alertResponseKey: "mainpower",
      },
      {
        name: "Overspeed",
        color: "rgb(187, 247, 208)",
        alertType: "Overspeeding",
        alertResponseKey: "overspeedKMT",
      },
      {
        name: "Excessive Idling",
        color: "rgb(191, 219, 254)",
        alertType: "ContinousDrive",
        alertResponseKey: "idle",
      },
    ],
    data: [],
  },
  {
    chartType: "reminder-list",
    title: "Service & Document Reminder",
    series: [{ name: "Service Reminder", color: "rgb(191, 219, 254)" }],
    data: generateReminderData(),
  },
];

const trendsData: ChartConfig[] = [
  {
    chartType: "area",
    title: "Run/Idle Trend",
    subtitle: "",
    series: [
      { name: "Run", color: "rgb(254, 202, 202)" },
      { name: "Idle", color: "rgb(187, 247, 208)" },
    ],
    data: [],
  },
  {
    chartType: "bar",
    title: "Run Trend",
    subtitle: "",
    series: [{ name: "Run", color: "rgb(191, 219, 254)" }],
    data: [],
  },
  {
    chartType: "bar",
    title: "Idle Trend",
    subtitle: "",
    series: [{ name: "Idle", color: "rgb(254, 240, 138)" }],
    data: [],
  },
  // {
  // 	chartType: 'area',
  // 	title: 'Fuel Trend',
  // 	subtitle: '',
  // 	series: [{ name: 'Fuel', color: 'rgb(221, 214, 254)' }],
  // 	data: [],
  // },
];

const analysisData: ChartConfig[] = [
  {
    chartType: "bar",
    title: "Least Used Vehicles",
    subtitle: "",
    series: [{ name: "Least Used Vehicles", color: "rgb(191, 219, 254)" }],
    data: [],
  },
  {
    chartType: "bar",
    title: "Most Used Vehicles",
    subtitle: "",
    series: [{ name: "Most Used Vehicles", color: "rgb(254, 202, 202)" }],
    data: [],
  },
  {
    chartType: "bar",
    title: "Fuel Efficiency Meter",
    subtitle: "",
    series: [{ name: "Fuel Efficiency Meter", color: "rgb(187, 247, 208)" }],
    data: [],
  },
];

const fetchChartData = async ({
  series,
  startDate,
  endDate,
  getAlertsByDateTrigger,
  userId,
  groupId,
}: {
  series: Array<{ alertType?: string; alertResponseKey?: string }>;
  startDate: Date;
  endDate: Date;
  getAlertsByDateTrigger: ReturnType<typeof useLazyGetAlertsByDateQuery>[0];
  userId: string;
  groupId: string;
}) => {
  const alertTypes = series
    .map((s) => s.alertType)
    .filter((type) => type !== undefined);

  const promises = alertTypes.map((alertType) =>
    getAlertsByDateTrigger({
      startDateTime: moment(startDate).format("YYYY-MM-DD HH:mm"),
      endDateTime: moment(endDate).format("YYYY-MM-DD HH:mm"),
      vehId: 0,
      vehReg: "",
      alertType,
      userId,
      token: groupId,
    }).unwrap()
  );

  const results = await Promise.all(promises);

  const days = [];
  let current = moment(startDate).startOf("day");
  const end = moment(endDate).startOf("day");
  while (current.isSameOrBefore(end)) {
    days.push(current.format("DD-MM"));
    current.add(1, "day");
  }

  const seriesCounts = results.map((result, i) => {
    const alertKey = series[i].alertResponseKey;
    const alerts = result.list.flatMap((lorry) =>
      alertKey ? lorry[alertKey as keyof AlertByDateLorryData] || [] : []
    );
    const countByDay: Record<string, number> = {};
    alerts.forEach((alert) => {
      const day = moment(alert.starttime).format("DD-MM");
      countByDay[day] = (countByDay[day] || 0) + 1;
    });
    return countByDay;
  });

  const data = days.map((day, index) => {
    const values = seriesCounts.map((countByDay) => countByDay[day] || 0);
    return { day, values };
  });

  return data;
};

const fetchConsolidateData = async ({
  startDate,
  endDate,
  getConsolidateDetailTrigger,
  userId,
  groupId,
}: {
  startDate: Date;
  endDate: Date;
  getConsolidateDetailTrigger: ReturnType<
    typeof useLazyGetConsolidateDetailQuery
  >[0];
  userId: string;
  groupId: string;
}) => {
  const days = [];
  let current = moment(startDate).startOf("day");
  const end = moment(endDate).startOf("day");
  while (current.isSameOrBefore(end)) {
    days.push(current.format("DD-MM"));
    current.add(1, "day");
  }

  const promises = days.map((day, index) => {
    const dayStart = moment(startDate).add(index, "days").format("YYYY-MM-DD");
    return getConsolidateDetailTrigger({
      token: groupId,
      userId,
      startDate: dayStart,
    }).unwrap();
  });

  const results = await Promise.all(promises);

  function timeStringToHours(timeStr: string): number {
    if (typeof timeStr === "number") return 0;
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return Number((hours + minutes / 60 + seconds / 3600).toFixed(2));
  }

  const dailyData = days
    .map((day, index) => {
      const dayData = results[index]?.list || [];
      if (!Array.isArray(dayData)) return null;
      const totalRunning = dayData
        .filter((p) => p.Total_KM !== 0)
        .reduce((sum, item) => sum + timeStringToHours(item.Running_Hours), 0);
      const totalIdle = dayData
        .filter((p) => p.Total_KM !== 0)
        .reduce((sum, item) => sum + timeStringToHours(item.Idle_Hours), 0);
      return {
        day,
        runningHours: Math.round(totalRunning * 100) / 100,
        idleHours: Math.round(totalIdle * 100) / 100,
      };
    })
    .filter((p) => p !== null);

  const vehicleMap = new Map<
    string,
    { runningHours: number; idleHours: number; totalKm: number }
  >();

  results.forEach((result) => {
    if (result && Array.isArray(result.list)) {
      result.list.forEach((item) => {
        const vehReg = item.vehicleNum;
        if (!vehicleMap.has(vehReg)) {
          vehicleMap.set(vehReg, { runningHours: 0, idleHours: 0, totalKm: 0 });
        }
        const vehicle = vehicleMap.get(vehReg)!;
        vehicle.runningHours += timeStringToHours(item.Running_Hours);
        vehicle.idleHours += timeStringToHours(item.Idle_Hours);
        vehicle.totalKm += item.Total_KM;
      });
    }
  });
  const vehicleData = Array.from(vehicleMap, ([vehReg, data]) => ({
    vehReg,
    ...data,
  }));

  return { dailyData, vehicleData };
};

const fetchFuelEfficiencyReport = async ({
  userId,
  getRawDataTrigger,
}: {
  userId: string;
  getRawDataTrigger: ReturnType<typeof useLazyGetRawFuelWithDateQuery>[0];
}) => {
  const promises = fuelEfficiencyVehicleNumber.map((vehicleNumber) =>
    getRawDataTrigger({
      userId: Number(userId),
      vehId: vehicleNumber,
      startDate: moment(new Date())
        .subtract(7, "days")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm"),
      endDate: moment(new Date()).format("YYYY-MM-DD HH:mm"),
      interval: "30",
    }).unwrap()
  );

  const results = await Promise.all(promises);

  const allRawData = results.flatMap((result) => result.rawdata);

  return allRawData;
};

const ChartsSection = ({
  expandedSection,
  selectedDateRangeDateJs,
}: {
  expandedSection: "ALERTS" | "TRENDS" | "ANALYSIS";
  selectedDateRangeDateJs: Date | Date[];
}) => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const [getAlertsByDateTrigger] = useLazyGetAlertsByDateQuery();
  const [getDTCTrigger] = useLazyGetDTCResultQuery();
  const [getConsolidateDetailTrigger] = useLazyGetConsolidateDetailQuery();
  const [getRawDataTrigger, { data: rawData, isLoading: isGetRawDataLoading }] =
    useLazyGetRawFuelWithDateQuery();

  const [chartsData, setChartsData] = useState<Record<string, any>>({});
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [vehicleAnalysis, setVehicleAnalysis] = useState<any[]>([]);
  const [isDriverBehaviourLoading, setIsDriverBehaviourLoading] =
    useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isDTCLoading, setIsDtcLoading] = useState(false);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [isAnalysisLoading, setIsAnaylsisLoading] = useState(false);
  const [isFuelEfficiencyLoading, setIsFuelEfficientLoading] = useState(false);
  const [consolidatedRawData, setConsolidatedRawData] = useState<any[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const getLeastUsedVehicles = (vehicleAggregate: any[], topN: number) => {
    const sorted = [...vehicleAggregate]
      .sort((a, b) => a.totalKm - b.totalKm)
      ?.filter((p) => p.totalKm > 10);

    return sorted
      .slice(0, topN)
      .map((v) => ({ day: v.vehReg, values: [v.totalKm] }));
  };

  const getMostUsedVehicles = (vehicleAggregate: any[], topN: number) => {
    const sorted = [...vehicleAggregate].sort((a, b) => b.totalKm - a.totalKm);
    return sorted
      .slice(0, topN)
      .map((v) => ({ day: v.vehReg, values: [v.totalKm] }));
  };

  useEffect(() => {
    if (expandedSection !== "ALERTS" || !selectedDateRangeDateJs) return;
    if (userId && groupId) {
      const [startDate, endDate] = Array.isArray(selectedDateRangeDateJs)
        ? selectedDateRangeDateJs
        : [
            moment(selectedDateRangeDateJs).startOf("day").toDate(),
            selectedDateRangeDateJs,
          ];

      const fetchDriverBehaviour = async () => {
        setIsDriverBehaviourLoading(true);
        try {
          const data = await fetchChartData({
            series: alertsCharts[0].series,
            startDate,
            endDate,
            getAlertsByDateTrigger,
            userId,
            groupId,
          });
          setChartsData((prev) => ({ ...prev, "Driver Behaviour": data }));
        } catch (error) {
          console.error("Error fetching Driver Behaviour data:", error);
        } finally {
          setIsDriverBehaviourLoading(false);
        }
      };

      const fetchGps = async () => {
        setIsGpsLoading(true);
        try {
          const data = await fetchChartData({
            series: alertsCharts[2].series,
            startDate,
            endDate,
            getAlertsByDateTrigger,
            userId,
            groupId,
          });
          setChartsData((prev) => ({ ...prev, Gps: data }));
        } catch (error) {
          console.error("Error fetching Gps data:", error);
        } finally {
          setIsGpsLoading(false);
        }
      };

      const fetchDTCAlerts = async () => {
        setIsDtcLoading(true);
        try {
          const data = await getDTCTrigger({
            vehicleId: 0,
            token: groupId,
          });
          const dtcCounts = getDtcCount(data?.data?.list ?? []);

          const categories = Object.keys(dtcCounts);
          const vehicleHealthData = categories.map((category) => ({
            day: category,
            values: [dtcCounts[category]],
          }));
          setChartsData((prev) => ({
            ...prev,
            "Vehicle Health": vehicleHealthData,
          }));
        } catch (error) {
          console.error(`Error fetching dtc alerts:`, error);
        } finally {
          setIsDtcLoading(false);
        }
      };

      fetchDriverBehaviour();
      fetchGps();
      fetchDTCAlerts();
    }
  }, [
    expandedSection,
    selectedDateRangeDateJs,
    getAlertsByDateTrigger,
    userId,
    groupId,
  ]);

  useEffect(() => {
    if (
      (expandedSection !== "TRENDS" && expandedSection !== "ANALYSIS") ||
      !selectedDateRangeDateJs
    )
      return;
    if (dailyData.length !== 0 && vehicleAnalysis.length !== 0) return;
    if (userId && groupId) {
      const [startDate, endDate] = Array.isArray(selectedDateRangeDateJs)
        ? selectedDateRangeDateJs
        : [
            moment(selectedDateRangeDateJs).startOf("day").toDate(),
            selectedDateRangeDateJs,
          ];

      const fetchTrendsData = async () => {
        setIsTrendsLoading(true);
        setIsAnaylsisLoading(true);
        try {
          const data = await fetchConsolidateData({
            startDate,
            endDate,
            getConsolidateDetailTrigger,
            userId,
            groupId,
          });
          setDailyData(data.dailyData);
          setVehicleAnalysis(data.vehicleData);
        } catch (error) {
          console.error("Error fetching trends data:", error);
        } finally {
          setIsAnaylsisLoading(false);
          setIsTrendsLoading(false);
        }
      };

      fetchTrendsData();
    }
  }, [
    expandedSection,
    selectedDateRangeDateJs,
    getConsolidateDetailTrigger,
    userId,
    groupId,
  ]);

  useEffect(() => {
    if (expandedSection === "ANALYSIS") {
      const fetchFuelEfficiencyData = async () => {
        setIsFuelEfficientLoading(true);
        try {
          const data = await fetchFuelEfficiencyReport({
            userId,
            getRawDataTrigger,
          });
          setConsolidatedRawData(data);
        } catch (err) {
          console.error("This is a tragic error");
        } finally {
          setIsFuelEfficientLoading(false);
        }
      };

      fetchFuelEfficiencyData();
    }
  }, [userId, groupId, expandedSection]);

  const fuelEfficiencyDailyData = useMemo(() => {
    if (!rawData?.rawdata || rawData.rawdata.length === 0) return [];

    const groupedByDate: { [key: string]: RawDataWithoutLocation[] } = {};

    rawData.rawdata.forEach((item) => {
      const date = moment(item.gps_time).format("YYYY-MM-DD");
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(item);
    });

    const result: DailyData[] = [];

    Object.entries(groupedByDate).forEach(([date, dayData]) => {
      const filteredData = dayData
        .filter(
          (p) =>
            p.tel_fuel !== 0 &&
            p.gps_speed >= 2 &&
            p.gps_speed <= 5 &&
            p.tel_fuel !== undefined &&
            p.tel_fuel !== null
        )
        .sort(
          (a, b) =>
            new Date(a.gps_time).getTime() - new Date(b.gps_time).getTime()
        );

      if (filteredData.length < 2) return;

      const points: Point[] = filteredData.map((p) => ({
        odometer: p.tel_odometer.toString(),
        fuel: p.tel_fuel,
        adblue: 0,
        time: p.gps_time,
        gps_latitude: p.gps_latitude,
        gps_longitude: p.gps_longitude,
        location: "",
        event: null,
        amountFilled: null,
        amountStolen: null,
        distanceSinceLastFill: null,
      }));

      const enriched = computeMetrics(
        points,
        "fuel",
        Number(userId) === 833193 ? 10 : 70
      );

      const totalAddedFuel = enriched.reduce(
        (sum, pt) => sum + (pt.amountFilled ?? 0),
        0
      );
      const totalStolenFuel = enriched.reduce(
        (sum, pt) => sum + (pt.amountStolen ?? 0),
        0
      );

      const startFuel = points[0].fuel;
      const endFuel = points[points.length - 1].fuel;
      const fuelConsumed =
        startFuel - endFuel + totalAddedFuel - totalStolenFuel;

      const startOdometer = Number(points[0].odometer);
      const endOdometer = Number(points[points.length - 1].odometer);
      const distance = Math.abs(endOdometer - startOdometer);

      const mileage = fuelConsumed > 0 ? distance / fuelConsumed : 0;
      const engineHours = distance > 0 ? distance / 40 : 0;

      result.push({
        date: moment(date).format("DD MMM YYYY"),
        mileage: mileage ? (mileage > 6 ? 0 : mileage) : 0,
        distance: distance || 0,
        fuelConsumed: fuelConsumed ? (mileage > 6 ? 0 : fuelConsumed) : 0,
        engineHours: engineHours || 0,
      });
    });

    return result.sort(
      (a, b) =>
        moment(a.date, "DD MMM YYYY").valueOf() -
        moment(b.date, "DD MMM YYYY").valueOf()
    );
  }, [consolidatedRawData]);

  const fuelEfficiencyChartData = useMemo(() => {
    if (fuelEfficiencyDailyData.length === 0) return null;

    const mileages = fuelEfficiencyDailyData
      .map((d) => d.mileage)
      .filter((p) => p !== 0);
    const meanMileage =
      mileages.reduce((sum, val) => sum + val, 0) / mileages.length;

    return {
      labels: fuelEfficiencyDailyData.map((d) => d.date),
      datasets: [
        {
          type: "bar" as const,
          label: "Fuel Efficiency (above mean)",
          data: fuelEfficiencyDailyData.map((d) =>
            d.mileage >= meanMileage ? d.mileage : null
          ),
          backgroundColor: "rgba(135, 206, 250, 0.8)", // Light blue
          borderColor: "rgba(135, 206, 250, 1)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          type: "bar" as const,
          label: "Fuel Efficiency (below mean)",
          data: fuelEfficiencyDailyData.map((d) =>
            d.mileage < meanMileage ? d.mileage : null
          ),
          backgroundColor: "rgba(255, 182, 193, 0.8)", // Light pink/red
          borderColor: "rgba(255, 182, 193, 1)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          type: "line" as const,
          label: "Distance",
          data: fuelEfficiencyDailyData.map((d) => d.distance),
          borderColor: "rgba(75, 192, 192, 1)", // Green
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderWidth: 3,
          fill: false,
          tension: 0.1,
          yAxisID: "y1",
        },
        {
          type: "line" as const,
          label: "Mean Efficiency",
          data: fuelEfficiencyDailyData.map(() => meanMileage),
          borderColor: "rgba(54, 162, 235, 0.8)",
          backgroundColor: "rgba(54, 162, 235, 0.1)",
          borderWidth: 2,
          borderDash: [10, 5],
          fill: false,
          pointRadius: 0,
          yAxisID: "y",
        },
      ],
      meanMileage,
    };
  }, [fuelEfficiencyDailyData]);

  useEffect(() => {
    if (!chartRef.current || !fuelEfficiencyChartData) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: fuelEfficiencyChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (context) => {
                const datasetLabel = context.dataset.label || "";
                const value = context.parsed.y;

                if (datasetLabel.includes("Distance")) {
                  return `${datasetLabel}: ${value?.toFixed(2)} km`;
                }
                return `${datasetLabel}: ${value?.toFixed(2)} kmpl`;
              },
            },
          },
          datalabels: {
            opacity: 0,
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Date",
            },
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Mileage (kmpl)",
            },
            beginAtZero: true,
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Distance (km)",
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [fuelEfficiencyChartData]);

  switch (expandedSection) {
    case "ALERTS":
      return (
        <div className="grid grid-cols-2 gap-5 h-[calc(100vh-330px)] overflow-y-scroll rounded-md pl-2 scrollbar scrollbar-w-0.5 scrollbar-thumb-blue-500 scrollbar-thumb-rounded-full">
          {alertsCharts.map((chart, index) => {
            let chartIsLoading = false;
            if (chart.title === "Driver Behaviour") {
              chartIsLoading = isDriverBehaviourLoading;
            } else if (chart.title === "Gps") {
              chartIsLoading = isGpsLoading;
            } else if (chart.title === "Vehicle Health") {
              chartIsLoading = isDTCLoading;
            }
            return (
              <ChartCard
                key={index}
                chart={{
                  ...chart,
                  data: chartsData[chart.title] || chart.data,
                }}
                isLoading={chartIsLoading}
              />
            );
          })}
        </div>
      );
    case "TRENDS":
      const runIdleData = dailyData.map((item) => ({
        day: item.day,
        values: [item.runningHours, item.idleHours],
      }));
      const runData = dailyData.map((item) => ({
        day: item.day,
        values: [item.runningHours],
      }));
      const idleData = dailyData.map((item) => ({
        day: item.day,
        values: [item.idleHours],
      }));

      const updatedTrendsData: ChartConfig[] = [
        { ...trendsData[0], data: runIdleData } as ChartConfig,
        { ...trendsData[1], data: runData } as ChartConfig,
        { ...trendsData[2], data: idleData } as ChartConfig,
        { ...trendsData[3], data: [] } as ChartConfig,
      ];

      return (
        <div className="grid grid-cols-2 gap-5 h-[calc(100vh-330px)] overflow-y-scroll rounded-md pl-2 scrollbar scrollbar-w-0.5 scrollbar-thumb-blue-500 scrollbar-thumb-rounded-full">
          {updatedTrendsData.map((chart, index) => (
            <ChartCard key={index} chart={chart} isLoading={isTrendsLoading} />
          ))}
        </div>
      );
    case "ANALYSIS":
      const leastUsedVehicles = getLeastUsedVehicles(vehicleAnalysis, 7);
      const mostUsedVehicles = getMostUsedVehicles(vehicleAnalysis, 7);

      const updatedAnalysisData: ChartConfig[] = [
        { ...analysisData[0], data: leastUsedVehicles } as ChartConfig,
        { ...analysisData[1], data: mostUsedVehicles } as ChartConfig,
        { ...analysisData[2], data: [] } as ChartConfig,
      ];

      return (
        <div className="grid grid-cols-2 gap-5 h-[calc(100vh-330px)] overflow-y-scroll rounded-md pl-2 scrollbar scrollbar-w-0.5 scrollbar-thumb-blue-500 scrollbar-thumb-rounded-full">
          {updatedAnalysisData.map((chart, index) => {
            if (chart.title === "Fuel Efficiency Meter") {
              if (isFuelEfficiencyLoading) {
                return (
                  <div
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                    key={chart.title}
                  >
                    <div className="mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 ml-1">
                        {chart.title}
                      </h3>
                    </div>
                    <div className="h-[200px] flex items-center justify-center">
                      <Spin size="large" spinning />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                  key={chart.title}
                >
                  <div className="mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 ml-1">
                      Fuel Efficiency Report
                    </h3>
                  </div>

                  <div className="h-[363px] mb-4">
                    <canvas ref={chartRef} />
                  </div>
                </div>
              );
            } else {
              return (
                <ChartCard
                  key={index}
                  chart={chart}
                  isLoading={isAnalysisLoading}
                />
              );
            }
          })}
        </div>
      );
    default:
      return null;
  }
};

export default ChartsSection;
