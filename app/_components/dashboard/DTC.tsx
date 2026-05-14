"use client";

import { useLazyGetVehicleParametersQuery } from "@/app/_globalRedux/services/getMinMaxAlertValue";
import {
  useLazyGetDTCResultQuery,
  useLazyGetRawFuelWithDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import exportDtcPdf from "@/app/helpers/exportDtcPdf";
import { updateAlertParametersFromString } from "@/app/helpers/extraVehKmToData";
import DtcIcon from "@/public/assets/images/common/dtc.png";
import DtcIconGreen from "@/public/assets/images/common/dtcgreen.png";
import accelerationImg from "@/public/assets/svgs/dtc/acceleration.svg";
import batteryImg from "@/public/assets/svgs/dtc/battery.svg";
import brakeImg from "@/public/assets/svgs/dtc/brake.svg";
import engineImg from "@/public/assets/svgs/dtc/engine.svg";
import fuelSystem from "@/public/assets/svgs/dtc/fuel-system.svg";
import generalImg from "@/public/assets/svgs/dtc/general.svg";
import safetySystemsImg from "@/public/assets/svgs/dtc/safety-systems.svg";
import sensorImg from "@/public/assets/svgs/dtc/sensor.svg";
import { CalendarOutlined, DownloadOutlined } from "@ant-design/icons";
import { Button, Modal, Spin, Tag, Tooltip } from "antd";
import {
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  LinearScale,
  PointElement,
} from "chart.js";
import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import ChartDataLabels from "chartjs-plugin-datalabels";
import moment from "moment";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Scatter } from "react-chartjs-2";
import { useSelector } from "react-redux";
import TableN from "../alerts-dashboard/table";
import { computeMetrics, Point } from "./fuelAdblue/FuelAndAdblueTabs";
import NoDataFound from "./NoDataFound";

type DailyData = {
  date: string;
  mileage: number;
  distance: number;
  fuelConsumed: number;
  engineHours: number;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  ChartTooltip,
  ChartDataLabels,
  annotationPlugin,
);

const parseExtraVhlParameter = (str: string): Record<string, string> => {
  if (!str) return {};
  const pairs = str.split("##");
  const result: Record<string, string> = {};
  pairs.forEach((pair) => {
    const [key, value] = pair.split(":-");
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });
  return result;
};

export interface ScatterChartDataProps {
  labels?: string[];
  datasets: {
    label: string;
    data: { x: number; y: number }[];
    backgroundColor: string;
    datalabels?: {
      display: boolean;
    };
  }[];
}

const findLastNonZero = (raw: RawDataWithoutLocation[]): number => {
  const rev = [...raw].reverse();
  let temperature = 0;

  rev.find((point) => {
    const params = parseExtraVhlParameter(point.extraVhlparameter);
    const tempStr = params["Engine Coolant Temperature"];
    if (!tempStr) return false;

    const match = tempStr.match(/^-?\d+\.?\d*/);
    if (!match) return false;

    const temp = parseFloat(match[0]);
    if (temp !== 0) {
      temperature = temp;
      return true;
    }
    return false;
  });

  return temperature;
};

function ScatterChart({
  scatterChartData,
}: {
  scatterChartData: ScatterChartDataProps;
}) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      datalabels: {
        display: false,
      },
      annotation: {
        annotations: {
          line1: {
            type: "line" as const,
            yMin: 70,
            yMax: 70,
            borderColor: "oklch(54.6% 0.245 262.881)",
            borderWidth: 1,
            borderDash: [3, 5],
          },
          line2: {
            type: "line" as const,
            yMin: 100,
            yMax: 100,
            borderColor: "oklch(54.6% 0.245 262.881)",
            borderWidth: 1,
            borderDash: [3, 5],
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Odometer",
        },
      },
      y: {
        title: {
          display: true,
          text: "Value",
        },
      },
    },
  };

  return <Scatter data={scatterChartData} options={options} height={400} />;
}

type AlertServerity = "GREEN" | "YELLOW" | "RED";

export const getColorFromStatus = (status: string) => {
  if (status === "Good" || status === "GREEN") {
    return (
      <Tag color="green" title="Good">
        <div className="flex gap-1 items-center">
          <div className="bg-primary-green h-1 w-1 rounded-full" />
          Good
        </div>
      </Tag>
    );
  } else if (status === "Moderate" || status === "YELLOW") {
    return (
      <Tag color="orange" title="Moderate">
        <div className="flex gap-1 items-center">
          <div className="bg-orange-300 h-1 w-1 rounded-full" />
          Moderate
        </div>
      </Tag>
    );
  } else if (status === "Severe" || status === "RED") {
    return (
      <Tag color="red" title="Severe">
        <div className="flex gap-1 items-center">
          <div className="bg-red-300 h-1 w-1 rounded-full" />
          Severe
        </div>
      </Tag>
    );
  } else {
    return (
      <Tag color={"green"} title="Good">
        <div className="flex gap-1 items-center">
          <div className="bg-green-300 h-1 w-1 rounded-full" />
          Good
        </div>
      </Tag>
    );
  }
};

const getColorFromStatusForAlerts = (status: string) => {
  if (status === "Good" || status === "GREEN") {
    return (
      <Tag color="yellow-inverse" title="Minor">
        <div className="flex gap-1 items-center px-1 py-0.5 font-semibold">
          Minor
        </div>
      </Tag>
    );
  } else if (status === "Moderate" || status === "YELLOW") {
    return (
      <Tag color="orange-inverse" title="Moderate">
        <div className="flex gap-1 items-center px-1 py-0.5 font-semibold">
          Moderate
        </div>
      </Tag>
    );
  } else if (status === "Severe" || status === "RED") {
    return (
      <Tag color="red-inverse" title="Severe">
        <div className="flex gap-1 items-center px-1 py-0.5 font-semibold">
          Severe
        </div>
      </Tag>
    );
  } else {
    return (
      <Tag color="yellow-inverse" title="Minor">
        <div className="flex gap-1 items-center px-1 py-0.5 font-semibold">
          Minor
        </div>
      </Tag>
    );
  }
};

// Helper: dynamic color/status logic for all alert cards
const renderAlertStatus = (
  category: string,
  activeAlerts: any[],
  getColorFromStatus: (status: string) => JSX.Element,
  getColorFromStatusForAlerts: (status: string) => JSX.Element,
  defaultStatus: string,
) => {
  const activeFault = activeAlerts.find((alert) => {
    const spn1 = alert?.SPN_Category;
    const spn2 = alert?.SPNCategory;
    const spn3 = alert?.SPN_Category?.toString();
    return (
      (spn1 && spn1.toString().toLowerCase() === category.toLowerCase()) ||
      (spn2 && spn2.toString().toLowerCase() === category.toLowerCase()) ||
      (spn3 && spn3.toLowerCase() === category.toLowerCase())
    );
  });

  if (!activeFault) {
    return getColorFromStatus(defaultStatus);
  }
  const severityString =
    activeFault.category || // e.g. "GREEN" | "YELLOW" | "RED"
    activeFault.category?.toString() ||
    activeFault.FMI_Category ||
    activeFault.FMICategory ||
    activeFault.FMI ||
    null;

  if (severityString && typeof severityString === "string") {
    return getColorFromStatusForAlerts(severityString);
  }
  return getColorFromStatusForAlerts(severityString as any);
};

function aggregateSPNData(
  data: Record<string, any>,
  maxCodes: number = 10,
): any[] {
  const aggregatedData: any[] = [];
  if (!data) return aggregatedData;

  for (let i = 1; i <= maxCodes; i++) {
    const spnCode = data[`SPN${i}_Code`];

    if (spnCode === null || spnCode === undefined) continue; // skip missing

    const spnDescription = data[`SPN${i}_Description`];
    const spnDescriptionExpansion = data[`SPN${i}_DetailedExplanation`];
    const spnPossibleCauses = data[`SPN${i}_Causes`];
    const spnRecommendedActions = data[`SPN${i}_RecommendedAction`];
    const spnSymptoms = data[`SPN${i}_Symptoms`];
    const spnCategory = data[`SPN${i}_Category`];
    const fmiCategory = data[`FMI${i}_Category`];

    aggregatedData.push({
      SPN_Code: <p className="text-blue-500 font-bold text-sm">#{spnCode}</p>,
      SPN_Description: spnDescription,
      SPN_Category: spnCategory,
      FMI_Category: getColorFromStatusForAlerts(fmiCategory),
      Set_At: `${data.odometer} Km`,
      category: (fmiCategory as AlertServerity) ?? ("GREEN" as AlertServerity),
      SPN_Possible_Causes: spnPossibleCauses,
      SPN_Recommended_Actions: spnRecommendedActions,
      SPN_Symptoms: spnSymptoms,
      SPN_Description_Expansion: spnDescriptionExpansion,
    });
  }

  return aggregatedData;
}

export const DTC = ({ data }: { data: VehicleData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const { data: vehicleParamsData } = useSelector(
    (state: RootState) => state.minMaxAlertsParameter,
  );
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const isDTCDataFresh = (): boolean => {
    try {
      const gpsTime = data.gpsDtl?.latLngDtl?.gpstime;
      const dtcLastCheck = (data.gpsDtl as any)?.dtc_lastcheck;

      if (!dtcLastCheck) {
        return true;
      }

      if (!gpsTime) {
        return false;
      }

      const gpsTimeMoment = moment(gpsTime, "DD MMMM YYYY HH:mm");
      const dtcLastCheckMoment = moment(dtcLastCheck, "YYYY-MM-DD HH:mm");
      const diffInHours = Math.abs(
        gpsTimeMoment.diff(dtcLastCheckMoment, "hours", true),
      );
      return diffInHours > 1;
    } catch (error) {
      console.error("Error calculating DTC freshness:", error);
      return false;
    }
  };

  const [scatterChartData, setScatterChartData] =
    useState<ScatterChartDataProps>({ datasets: [] });

  const [activeAlerts, setActiveAlerts] = useState<
    {
      FMI_Category: string;
      FMI_Code: number;
      FMI_Description: string;
      SPN_Category: string;
      SPN_Code: number;
      SPN_Description: string;
      SPN_Possible_Causes: string;
      SPN_Recommended_Actions: string;
      SPN_Symptoms: string;
      SPN_Description_Expansion: string;
    }[]
  >([]);

  const tableHead = ["Code", "Issue", "Alert", "Severity"];
  const tableParametersHeader = ["Type", "Value", "Minimum", "Maximum"];
  const engineOpeningTemperatureHeader = ["Results", "Current", "Ideal"];

  const [getDTCquery, { data: dtcResultData, isLoading: isDtcLoading }] =
    useLazyGetDTCResultQuery();
  const [getRawData, { data: rawData, isLoading: isGetRawDataLoading }] =
    useLazyGetRawFuelWithDateQuery();
  const [
    getVehicleParameters,
    { data: minMaxParametersData, isLoading: isMinMaxLoading },
  ] = useLazyGetVehicleParametersQuery();

  const [predectiveAlerts, setPredectiveAlerts] = useState([
    {
      icon: (
        <Image
          src={accelerationImg}
          alt="acceleration"
          width={40}
          height={40}
        />
      ),
      category: "Acceleration",
      serverity: "GREEN" as "GREEN" | "YELLOW" | "RED",
    },
    {
      icon: <Image src={batteryImg} alt="battery" width={40} height={40} />,
      category: "Battery",
      serverity: "GREEN",
    },
    {
      icon: <Image src={brakeImg} alt="brake" width={40} height={40} />,
      category: "Brake",
      serverity: "GREEN",
    },
    {
      icon: <Image src={engineImg} alt="engine" width={40} height={40} />,
      category: "Engine",
      serverity: "GREEN",
    },
  ]);

  const [otherAlerts, setOtherAlerts] = useState([
    {
      icon: <Image src={fuelSystem} alt="other" width={40} height={40} />,
      category: "Fuel System",
      serverity: "GREEN",
    },
    {
      icon: (
        <Image
          src={safetySystemsImg}
          alt="safetySystems"
          width={40}
          height={40}
        />
      ),
      category: "Safety Systems",
      serverity: "GREEN",
    },
    {
      icon: <Image src={generalImg} alt="general" width={40} height={40} />,
      category: "General",
      serverity: "GREEN",
    },
    {
      icon: <Image src={sensorImg} alt="transmission" width={40} height={40} />,
      category: "Sensor",
      serverity: "GREEN",
    },
  ]);

  const [alertParameterData, setAlertParameters] = useState([
    {
      type: "Add blue (DEF) Level",
      value: <></>,
      min: "",
      max: "",
      unit: "Ltr",
    },
    { type: "Engine Fuel rate", value: <></>, min: "", max: "", unit: "l/h" },
    {
      type: "Engine Total Fuel Used",
      value: <></>,
      min: "",
      max: "",
      unit: "Ltr",
    },
    {
      type: "Engine Total Idle Fuel Used",
      value: <></>,
      min: "",
      max: "",
      unit: "Ltr",
    },
    {
      type: "Engine Total Idle Hrs",
      value: <></>,
      min: "",
      max: "",
      unit: "Hrs",
    },
    {
      type: "Engine Total Hrs of Operation",
      value: <></>,
      min: "",
      max: "",
      unit: "Hrs",
    },
    {
      type: "Engine Oil Pressure",
      value: <></>,
      min: "",
      max: "",
      unit: "Kpa",
    },
    {
      type: "Engine Oil Temperature",
      value: <></>,
      min: "",
      max: "",
      unit: "°C",
    },
    {
      type: "Engine Coolant Temperature",
      value: <></>,
      min: "",
      max: "",
      unit: "°C",
    },
    {
      type: "Engine Intake Manifold 1 Temperature",
      value: <></>,
      min: "",
      max: "",
      unit: "°C",
    },
    {
      type: "Engine Intake Manifold 1 Pressure",
      value: <></>,
      min: "",
      max: "",
      unit: "Kpa",
    },
    {
      type: "Accelerator Pedal Position",
      value: <></>,
      min: "",
      max: "",
      unit: "%",
    },
    {
      type: "Total Vehicle Distance",
      value: <></>,
      min: "",
      max: "",
      unit: "Km",
    },
    { type: "Fuel Level", value: <></>, min: "", max: "", unit: "%" },
  ]);

  const [engineOpeningTemperature, setEngineOpeningTemperature] = useState({
    results: "",
    current: "",
    ideal: "",
  });

  useEffect(() => {
    if (isModalOpen) {
      updateAlertParametersFromString(
        data.gpsDtl.extraVhlparameter,
        setAlertParameters,
      );
    }
  }, [isModalOpen, data.gpsDtl.extraVhlparameter]);

  // Update alert parameters with min/max data from API
  useEffect(() => {
    if (
      minMaxParametersData &&
      minMaxParametersData.list &&
      minMaxParametersData.list.length > 0
    ) {
      const apiData = minMaxParametersData.list[0];

      setAlertParameters((prevData) =>
        prevData.map((param) => {
          switch (param.type) {
            case "Add blue (DEF) Level":
              return {
                ...param,
                min: apiData.AddBlueMin,
                max: apiData.AddBlueMax,
              };
            case "Engine Fuel rate":
              return {
                ...param,
                min: apiData.EngineFuelRateMin,
                max: apiData.EngineFuelRateMax,
              };
            case "Engine Total Fuel Used":
              return {
                ...param,
                min: apiData.EngineTotalFuelUsedMin,
                max: apiData.EngineTotalFuelUsedMax,
              };
            case "Engine Total Idle Fuel Used":
              return {
                ...param,
                min: apiData.EngineIdleFuelUsedMin,
                max: apiData.EngineIdleFuelUsedMax,
              };
            case "Engine Total Idle Hrs":
              return {
                ...param,
                min: apiData.EngineIdleHoursMin,
                max: apiData.EngineIdleHoursMax,
              };
            case "Engine Total Hrs of Operation":
              return {
                ...param,
                min: apiData.EngineHoursOperationMin,
                max: apiData.EngineHoursOperationMax,
              };
            case "Engine Oil Pressure":
              return {
                ...param,
                min: apiData.EngineOilPressureMin,
                max: apiData.EngineOilPressureMax,
              };
            case "Engine Oil Temperature":
              return {
                ...param,
                min: apiData.EngineOilTempMin,
                max: apiData.EngineOilTempMax,
              };
            case "Engine Coolant Temperature":
              return {
                ...param,
                min: apiData.EngineCoolantTempMin,
                max: apiData.EngineCoolantTempMax,
              };
            case "Engine Intake Manifold 1 Temperature":
              return {
                ...param,
                min: apiData.EngineIntakeManifoldTempMin,
                max: apiData.EngineIntakeManifoldTempMax,
              };
            case "Engine Intake Manifold 1 Pressure":
              return {
                ...param,
                min: apiData.EngineIntakeManifoldPressureMin,
                max: apiData.EngineIntakeManifoldPressureMax,
              };
            case "Accelerator Pedal Position":
              return {
                ...param,
                min: apiData.AcceleratorPedalPosMin,
                max: apiData.AcceleratorPedalPosMax,
              };
            case "Total Vehicle Distance":
              return {
                ...param,
                min: apiData.TotalVehicleDistanceMin,
                max: apiData.TotalVehicleDistanceMax,
              };
            case "Fuel Level":
              return {
                ...param,
                min: apiData.FuelLevelMin,
                max: apiData.FuelLevelMax,
              };
            default:
              return param;
          }
        }),
      );
    }
  }, [minMaxParametersData]);

  useEffect(() => {
    if (
      dtcResultData &&
      Array.isArray(dtcResultData.list) &&
      dtcResultData.list.length > 0
    ) {
      const vehicleSpecificData = (
        dtcResultData.list as Array<Record<string, any>>
      ).filter(
        (row) => row.sys_service_id === data.vehicleTrip?.sys_service_id,
      );

      if (vehicleSpecificData.length === 0) {
        // Try filtering by vId as alternative identifier
        const fallbackData = (
          dtcResultData.list as Array<Record<string, any>>
        ).filter((row) => row.sys_service_id === data.vId);

        if (fallbackData.length === 0) {
          // No vehicle-specific data found, don't show any data
          setActiveAlerts([]);
          return;
        }

        // Use vId-matched data
        const candidate = fallbackData.find((row) => {
          for (let i = 1; i <= 10; i++) {
            const code = row[`SPN${i}_Code`];
            if (code !== null && code !== undefined) return true;
          }
          return false;
        });

        if (!candidate) {
          setActiveAlerts([]);
          return;
        }

        const agregatedData = aggregateSPNData(
          {
            ...candidate,
            odometer: data.gpsDtl.tel_odometer,
          },
          10,
        );

        setActiveAlerts(agregatedData);
        return;
      }

      // Pick first row that contains at least one valid SPN*_Code
      const candidate = vehicleSpecificData.find((row) => {
        for (let i = 1; i <= 10; i++) {
          const code = row[`SPN${i}_Code`];
          if (code !== null && code !== undefined) return true;
        }
        return false;
      });

      if (!candidate) {
        setActiveAlerts([]);
        return;
      }

      const agregatedData = aggregateSPNData(
        {
          ...candidate,
          odometer: data.gpsDtl.tel_odometer,
        },
        10,
      );

      // aggregated active alerts prepared
      setActiveAlerts(agregatedData);
    }
  }, [
    dtcResultData,
    data.gpsDtl.tel_odometer,
    data.vehicleTrip?.sys_service_id,
  ]);

  const processRawDataForScatterChart = (
    rawdata: RawDataWithoutLocation[],
  ): ScatterChartDataProps => {
    if (!rawdata || rawdata.length === 0) {
      return { datasets: [] };
    }

    const sortedRawdata = [...rawdata].sort(
      (a, b) => new Date(a.gps_time).getTime() - new Date(b.gps_time).getTime(),
    );

    const inRangeData: { x: number; y: number }[] = [];
    const aboveRangeData: { x: number; y: number }[] = [];
    const belowRangeData: { x: number; y: number }[] = [];

    let previousOdometer: number | null = null;

    sortedRawdata
      .filter((p) => p.tel_odometer !== 0 && p.tel_odometer !== null)
      .forEach((data) => {
        const currentOdometer = data.tel_odometer;
        if (previousOdometer === null || currentOdometer !== previousOdometer) {
          const params = parseExtraVhlParameter(data.extraVhlparameter);
          const temperatureStr = params["Engine Coolant Temperature"];
          if (temperatureStr) {
            const temperatureMatch = temperatureStr.match(/^-?\d+\.?\d*/);
            if (temperatureMatch) {
              const temperature = parseFloat(temperatureMatch[0]);
              if (!isNaN(temperature)) {
                if (temperature >= 70 && temperature <= 100) {
                  inRangeData.push({ x: currentOdometer, y: temperature });
                } else if (temperature > 100) {
                  aboveRangeData.push({ x: currentOdometer, y: temperature });
                } else if (temperature < 70) {
                  belowRangeData.push({ x: currentOdometer, y: temperature });
                }
              }
            }
          }
          previousOdometer = currentOdometer;
        }
      });

    return {
      datasets: [
        {
          label: "Engine Temperature In Ideal Range",
          data: inRangeData,
          backgroundColor: "#478D81",
        },
        {
          label: "Engine Temperature Above Ideal Range",
          data: aboveRangeData,
          backgroundColor: "#FF6F61",
        },
        {
          label: "Engine Temperature Below Ideal Range",
          data: belowRangeData,
          backgroundColor: "#6B9DFF",
        },
      ],
    };
  };

  useEffect(() => {
    if (rawData && rawData.rawdata.length > 0) {
      const processedData = processRawDataForScatterChart(rawData.rawdata);
      setEngineOpeningTemperature({
        results: "Engine Operating Temperature",
        current: findLastNonZero(rawData.rawdata).toString(),
        ideal: "70 ℃ - 100 ℃",
      });
      setScatterChartData(processedData);
    }
  }, [rawData]);

  const dailyData = useMemo(() => {
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
            p.tel_fuel !== null,
        )
        .sort(
          (a, b) =>
            new Date(a.gps_time).getTime() - new Date(b.gps_time).getTime(),
        );

      if (filteredData.length < 2) return;

      const points: Point[] = filteredData.map((p) => ({
        odometer: p.tel_odometer.toString(),
        fuel: p.tel_fuel,
        adblue: 0, // Assuming adblue is not used here
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
        Number(userId) === 833193 ? 10 : 70,
      );

      const totalAddedFuel = enriched.reduce(
        (sum, pt) => sum + (pt.amountFilled ?? 0),
        0,
      );
      const totalStolenFuel = enriched.reduce(
        (sum, pt) => sum + (pt.amountStolen ?? 0),
        0,
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
        moment(b.date, "DD MMM YYYY").valueOf(),
    );
  }, [rawData]);

  const chartData = useMemo(() => {
    if (dailyData.length === 0) return null;

    const mileages = dailyData.map((d) => d.mileage).filter((p) => p !== 0);
    const meanMileage =
      mileages.reduce((sum, val) => sum + val, 0) / mileages.length;

    return {
      labels: dailyData.map((d) => d.date),
      datasets: [
        {
          type: "bar" as const,
          label: "Fuel Efficiency (above mean)",
          data: dailyData.map((d) =>
            d.mileage >= meanMileage ? d.mileage : null,
          ),
          backgroundColor: "rgba(135, 206, 250, 0.8)", // Light blue
          borderColor: "rgba(135, 206, 250, 1)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          type: "bar" as const,
          label: "Fuel Efficiency (below mean)",
          data: dailyData.map((d) =>
            d.mileage < meanMileage ? d.mileage : null,
          ),
          backgroundColor: "rgba(255, 182, 193, 0.8)", // Light pink/red
          borderColor: "rgba(255, 182, 193, 1)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          type: "line" as const,
          label: "Distance",
          data: dailyData.map((d) => d.distance),
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
          data: dailyData.map(() => meanMileage),
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
  }, [dailyData]);

  const totals = useMemo(() => {
    if (dailyData.length === 0)
      return { distance: 0, engineHours: 0, fuelConsumed: 0, efficiency: 0 };

    const filteredDailyData = dailyData.filter((p) => p.mileage !== 0);
    const totalDistance = filteredDailyData.reduce(
      (sum, d) => sum + d.distance,
      0,
    );
    const totalFuelConsumed = filteredDailyData.reduce(
      (sum, d) => sum + d.fuelConsumed,
      0,
    );
    const totalEngineHours = filteredDailyData.reduce(
      (sum, d) => sum + d.engineHours,
      0,
    );
    const overallEfficiency =
      totalFuelConsumed > 0 ? totalDistance / totalFuelConsumed : 0;

    return {
      distance: totalDistance,
      engineHours: totalEngineHours,
      fuelConsumed: totalFuelConsumed,
      efficiency: overallEfficiency,
    };
  }, [dailyData]);

  useEffect(() => {
    if (!chartRef.current || !chartData) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: chartData,
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
  }, [chartData]);

  const exportToPdf = async () => {
    try {
      setIsExporting(true);
      setIsShared(false);

      // Get chart elements for capturing with multiple fallback options
      let scatterChartElement = document.querySelector(
        ".scatter-chart-container",
      ) as HTMLElement;

      // Fallback options if main selector doesn't work
      if (!scatterChartElement) {
        scatterChartElement = document.querySelector(
          ".scatter-chart-container canvas",
        ) as HTMLElement;
      }

      if (!scatterChartElement) {
        scatterChartElement = document.querySelector(
          "[data-testid='scatter-chart']",
        ) as HTMLElement;
      }

      const exportData = {
        activeAlerts: isDTCDataFresh() ? [] : activeAlerts,
        alertParameters: alertParameterData,
        engineTemperature: engineOpeningTemperature,
        dailyData: [],
        totals: {},
        scatterChartElement,
        barChartElement: undefined,
        vehicleReg: data.vehReg,
        odometer: data.gpsDtl.tel_odometer || 0,
        lastUpdated:
          moment(dtcResultData?.list[0]?.gps_time)?.format(
            "Do MM, YYYY hh:mm",
          ) || "N/A",
      };

      await exportDtcPdf(exportData);

      // Show "Shared" status permanently
      setIsShared(true);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {data.gpsDtl.immoblizeStatus === 1 ||
      (data.gpsDtl.fuel &&
        Number(userId) !== 833193 &&
        data.gpsDtl.fuel <= 100 &&
        data.gpsDtl.port !== 31500) ? (
        <Tooltip title="DTC Alerts" mouseEnterDelay={1}>
          <div
            className="w-[20px] cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);

              const vehicleId = data.vId;

              if (vehicleId) {
                const startDate = moment(new Date())
                  .subtract(7, "days")
                  .startOf("day")
                  .format("YYYY-MM-DD HH:mm");
                const endDate = moment(new Date()).format("YYYY-MM-DD HH:mm");

                getRawData({
                  userId: Number(userId),
                  vehId: data.vId,
                  startDate,
                  endDate,
                  interval: "30",
                });

                getDTCquery({
                  vehicleId: 0,
                  token: groupId,
                });

                // Fetch vehicle parameters for min/max values
                getVehicleParameters({
                  vehid: data.vId,
                  userid: userId,
                  startdate: startDate,
                  enddate: endDate,
                });
              }
            }}
          >
            <Image
              src={!isDTCDataFresh() ? DtcIcon : DtcIconGreen}
              alt="dtc alerts icon"
              width={20}
              height={20}
            />
          </div>
        </Tooltip>
      ) : null}

      <Modal
        open={isModalOpen}
        onCancel={(e) => {
          e.stopPropagation();
          setIsModalOpen(false);
        }}
        footer={null}
        style={{ top: 0 }}
        centered
        width={"90vw"}
        height={"90vh"}
        title={
          <div
            className="flex items-start justify-between mt-6 pl-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-bold">DTC ({data.vehReg})</div>
            <div className="flex-col">
              <div className="text-sm font-medium mr-5 text-neutral-600 border p-1.5 px-2 rounded-md flex items-center gap-2 w-full">
                <CalendarOutlined />
                <div>Last Updated At:</div>
                <div className="bg-gray-300 h-[12px] w-[2px]" />
                <div>
                  {moment(dtcResultData?.list[0]?.gps_time)?.format(
                    "Do MM, YYYY hh:mm",
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 font-normal text-sm mt-2">
                <div className="border rounded-md p-2">
                  Odometer (Km) :-{" "}
                  <span className="font-semibold">
                    {data.gpsDtl.tel_odometer?.toFixed()} Km
                  </span>
                </div>
                <div className="border rounded-md p-2">
                  Engine Hours :-{" "}
                  <span className="font-semibold">
                    {
                      alertParameterData.find(
                        (d) => d.type === "Engine Total Hrs of Operation",
                      )?.value
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div
          className="flex flex-col gap-4 overflow-y-scroll px-4"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="grid grid-cols-2 divide-x">
            <div className="space-y-1 pr-4">
              <p className="font-semibold mb-2 text-base text-neutral-700">
                Predictive Alerts
              </p>
              <div className="flex justify-between items-center gap-4">
                {predectiveAlerts.map((alert) => (
                  <div
                    key={alert.category}
                    className="border rounded-xl flex flex-col items-center justify-center space-y-1 w-full py-4 px-2"
                  >
                    <div className="flex items-center justify-center">
                      {alert.icon}
                    </div>
                    <div className="text-center">{alert.category}</div>
                    <div className="text-center">
                      {isDTCDataFresh()
                        ? getColorFromStatus("Good")
                        : renderAlertStatus(
                            alert.category,
                            activeAlerts,
                            getColorFromStatus,
                            getColorFromStatusForAlerts,
                            "Good",
                          )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 pl-4">
              <p className="font-semibold mb-2 text-base text-neutral-700">
                Other Alerts
              </p>
              <div className="flex justify-between items-center gap-4">
                {otherAlerts.map((alert) => (
                  <div
                    key={alert.category}
                    className="border rounded-xl flex flex-col items-center justify-center space-y-1 w-full py-4 px-2"
                  >
                    <div className="flex items-center justify-center">
                      {alert.icon}
                    </div>
                    <div className="text-center">{alert.category}</div>
                    <div className="text-center">
                      {isDTCDataFresh()
                        ? getColorFromStatus("Good")
                        : renderAlertStatus(
                            alert.category,
                            activeAlerts,
                            getColorFromStatus,
                            getColorFromStatusForAlerts,
                            "Good",
                          )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid items-start gap-4 grid-cols-6 w-full space-y-2">
            {/* Export PDF button - always available */}
            <div className="col-span-6 flex justify-end">
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportToPdf}
                  loading={isExporting}
                  size="small"
                  style={{
                    backgroundColor: "#478C83",
                    borderColor: "#478C83",
                  }}
                >
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
                {isShared && (
                  <span className="text-primary-green font-medium text-sm">
                    Shared ✓
                  </span>
                )}
              </div>
            </div>

            {/* Only show Active Code section when DTC data is NOT fresh (red icon) */}
            {!isDTCDataFresh() && (
              <div className="col-span-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-base text-neutral-700">
                    Active Code
                  </p>
                </div>
                {isDtcLoading ? (
                  <div className="max-h-[200px] min-h-[200px] flex justify-center items-center">
                    <Spin spinning size="large" />
                  </div>
                ) : activeAlerts.length ? (
                  <div className="max-h-[80vh] overflow-y-scroll">
                    <TableN
                      tableHead={tableHead}
                      tableData={activeAlerts}
                      isStripped={false}
                      type="active_code"
                    />
                  </div>
                ) : (
                  <div className="max-h-[200px] min-h-[200px] border rounded-md">
                    <NoDataFound />
                  </div>
                )}
              </div>
            )}

            {minMaxParametersData &&
            minMaxParametersData.list &&
            minMaxParametersData.list.length > 0 ? (
              <div className="col-span-3">
                <p className="font-semibold mb-2 text-base text-neutral-700">
                  Alerts Parameters
                </p>
                {isMinMaxLoading ? (
                  <div className="border rounded-lg px-3 py-[21.5px] w-full h-full flex justify-center items-center min-h-[200px]">
                    <Spin spinning size="large" />
                  </div>
                ) : (
                  <TableN
                    tableHead={tableParametersHeader}
                    tableData={alertParameterData}
                    isStripped={false}
                    type="para"
                  />
                )}
              </div>
            ) : null}

            <div className="col-span-3">
              <p className="font-semibold mb-2 text-base text-neutral-700">
                Engine Temperature Vs Time
              </p>
              <div className="border rounded-lg px-3 py-[21.5px] w-full h-full">
                {isGetRawDataLoading ? (
                  <div className="max-h-[495px] min-h-[495px] flex justify-center items-center">
                    <Spin spinning size="large" />
                  </div>
                ) : (
                  <>
                    <div
                      className="h-[363px] scatter-chart-container"
                      data-testid="scatter-chart"
                    >
                      <ScatterChart scatterChartData={scatterChartData} />
                    </div>
                    <TableN
                      tableHead={engineOpeningTemperatureHeader}
                      tableData={[engineOpeningTemperature]}
                      isStripped={false}
                      type="para"
                    />
                  </>
                )}
              </div>
            </div>

            {/* {data.gpsDtl.fuel && data.gpsDtl.fuel < 100 ? (
              <div className="col-span-3">
                <p className="font-semibold mb-2 text-base text-neutral-700">
                  Fuel Efficiency Report
                </p>
                <div className="border rounded-lg px-3 py-[21.5px] w-full h-full">
                  {isGetRawDataLoading ? (
                    <div className="max-h-[495px] min-h-[495px] flex justify-center items-center">
                      <Spin spinning size="large" />
                    </div>
                  ) : !dailyData || dailyData.length === 0 ? (
                    <div className="flex items-center justify-center h-[363px] text-gray-500">
                      No fuel efficiency data available
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="h-[363px] mb-4">
                        <canvas ref={chartRef} />
                      </div>
                      <TableN
                        tableHead={fuelEfficienyReportHeader}
                        tableData={[
                          {
                            distance: totals?.distance?.toFixed(2),
                            engineHours: totals?.engineHours?.toFixed(0),
                            fuelConsumed: totals?.fuelConsumed?.toFixed(0),
                            fuelEfficiency: totals?.efficiency?.toFixed(2),
                          },
                        ]}
                        isStripped={false}
                        type="para"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : null} */}
          </div>
        </div>
      </Modal>
    </>
  );
};
