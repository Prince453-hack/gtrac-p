"use client";

import {
  AlertCountsResult,
  AlertFetchParams,
  FetchedAlertData,
  calculateAllAlertCounts,
  fetchAllAlertsWithDate,
} from "@/app/_components/overview/utils/allAlertsCount";
import { useGetAlarmInfoMutation } from "@/app/_globalRedux/services/gpstracktech";
import { useLazyGetHaltingHoursInPoiQuery } from "@/app/_globalRedux/services/haltingHours";
import { useIndiaGetMettaxAlarmsMutation } from "@/app/_globalRedux/services/indiaMettax";
import { useGetMettaxAlarmsMutation } from "@/app/_globalRedux/services/mettax";
import {
  useGetCountDetailsQuery,
  useGetVehiclesByStatusQuery,
  useLazyGetConsolidateKMQuery,
  useLazyGetDTCResultQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { GetAlertsPopupsResponse } from "@/app/_globalRedux/services/types/alerts";
import { RootState } from "@/app/_globalRedux/store";
import {
  AlertOutlined,
  CarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Pagination, Spin, Tabs } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
dayjs.extend(isBetween);

// Type alias for dashcam alerts
type DashcamAlert = any;

// Shared color classes for alert styling
const ALERT_COLOR_CLASSES = {
  red: {
    title: "text-red-700",
    background: "bg-red-50",
    border: "border-red-300",
    badge: "bg-red-200 text-red-800",
    count: "text-red-900 bg-red-300",
  },
  orange: {
    title: "text-orange-700",
    background: "bg-orange-50",
    border: "border-orange-300",
    badge: "bg-orange-200 text-orange-800",
    count: "text-orange-900 bg-orange-300",
  },
  yellow: {
    title: "text-yellow-700",
    background: "bg-yellow-50",
    border: "border-yellow-300",
    badge: "bg-yellow-200 text-yellow-800",
    count: "text-yellow-900 bg-yellow-300",
  },
  green: {
    title: "text-purple-700",
    background: "bg-purple-50",
    border: "border-purple-300",
    badge: "bg-purple-200 text-purple-800",
    count: "text-purple-900 bg-purple-300",
  },
  blue: {
    title: "text-blue-700",
    background: "bg-blue-50",
    border: "border-blue-300",
    badge: "bg-blue-200 text-blue-800",
    count: "text-blue-900 bg-blue-300",
  },
  indigo: {
    title: "text-indigo-700",
    background: "bg-indigo-50",
    border: "border-indigo-300",
    badge: "bg-indigo-200 text-indigo-800",
    count: "text-indigo-900 bg-indigo-300",
  },
} as const;

type ColorScheme = keyof typeof ALERT_COLOR_CLASSES;

// Reusable Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  colorClass: string; // e.g., "red", "yellow", "green"
}

const StatCard = ({ label, value, colorClass }: StatCardProps) => (
  <div
    className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-4`}
  >
    <div className="flex items-center mb-2">
      <div className={`w-3 h-3 bg-${colorClass}-400 rounded-full mr-2`}></div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
  </div>
);

// Reusable Alert Card Component
interface AlertCardProps {
  alert: any;
  colorScheme: ColorScheme;
  formatAlertType: (type: string) => string;
  showRemark?: boolean;
  cardHeight?: string;
}

const AlertCard = ({
  alert,
  colorScheme,
  formatAlertType,
  showRemark = false,
  cardHeight = "h-40",
}: AlertCardProps) => {
  const colors = ALERT_COLOR_CLASSES[colorScheme] || ALERT_COLOR_CLASSES.blue;
  const vehicleNo = alert.vehicleno || alert.vehicle_no || "Unknown";
  const parts = alert.msg?.split(",") || [];
  const vehicleLine = parts.slice(0, 2).join(" ").trim();
  const locationLine = parts[2]?.trim();
  const alertTime = alert.datetime || alert.gps_time || alert.created_at;

  return (
    <div
      className={`w-full ${colors.background} border ${colors.border} shadow-sm ${cardHeight} m-2 rounded-xl p-3 border-l-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`px-2 py-0.5 ${colors.badge} border rounded-md flex items-center space-x-1`}
          >
            <AlertOutlined />
            <p className="font-semibold">{formatAlertType(alert.alert_type)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <CarOutlined className="mr-1" />
            {vehicleNo}
          </div>
        </div>
        {alert.alertcount && (
          <div className="flex space-x-1 text-sm items-center">
            <p>Alert Count</p>
            <p
              className={`flex items-center justify-center text-xs ${colors.count} border rounded-full w-5 h-5`}
            >
              {alert.alertcount}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-start space-x-3 mt-3">
        <div className="text-gray-600 space-y-1 text-sm">
          {vehicleLine && (
            <div className="flex items-start space-x-1">
              <MessageOutlined className="text-gray-500 mt-1" />
              <span className="line-clamp-2">{vehicleLine}</span>
            </div>
          )}
          {locationLine && (
            <div className="flex items-start space-x-1">
              <EnvironmentOutlined className="mt-[2px]" />
              <span className="line-clamp-1">{locationLine}</span>
            </div>
          )}
          {showRemark && alert.remark && (
            <div className="flex items-start space-x-1 mt-2">
              <MessageOutlined className="text-blue-500 mt-1" />
              <span className="text-blue-600 font-medium">
                Remark: {alert.remark}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-2">
        <ClockCircleOutlined className="text-gray-500 mr-1" />
        <p className="text-gray-600">{alertTime}</p>
      </div>
    </div>
  );
};

// Reusable Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
}

const EmptyState = ({ icon = "📢", title, message }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-6xl text-gray-300 mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-600 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-md">{message}</p>
  </div>
);

// Reusable Loading State Component
const LoadingState = ({
  message = "Loading alerts...",
}: {
  message?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Spin size="large" />
    <p className="text-gray-500 mt-4">{message}</p>
  </div>
);

const AlertList = ({ initialUserId }: { initialUserId?: string }) => {
  const auth = JSON.parse(
    localStorage.getItem("auth-session") || `{ "userId": "", "groupId": "" }`,
  );
  const userId = initialUserId || auth.userId;

  // Redux selectors
  const {
    userId: reduxUserId,
    groupId,
    parentUser,
    isVideoTelematics,
  } = useSelector((state: RootState) => state.auth);
  const currentUserId = reduxUserId || userId;
  const currentGroupId = groupId || auth.groupId;

  // API Hooks
  const [getDTCResult] = useLazyGetDTCResultQuery();
  const [getConsolidateKM] = useLazyGetConsolidateKMQuery();
  const [getHaltingHours] = useLazyGetHaltingHoursInPoiQuery();
  const [videoAlertsTrigger] = useGetMettaxAlarmsMutation();
  const [getIndiaMettaxAlarmsTrigger] = useIndiaGetMettaxAlarmsMutation();
  const [getGPSTrackTechAlarms] = useGetAlarmInfoMutation();

  // Vehicle data queries
  const { data: vehicleCounts } = useGetCountDetailsQuery(
    {
      userid: currentUserId,
      groupid: currentGroupId,
      puserid: parentUser,
    },
    {
      skip: !currentGroupId || !currentUserId || !parentUser,
    },
  );

  const { data: vehicleData } = useGetVehiclesByStatusQuery(
    {
      token: currentGroupId,
      userId: currentUserId,
      pUserId: currentUserId,
      mode: "",
    },
    {
      skip: !currentGroupId || !currentUserId,
      refetchOnMountOrArgChange: true,
    },
  );

  const [filters, setFilters] = useState({
    status: "",
    dateRange: [dayjs().startOf("day"), dayjs().endOf("day")] as
      | [dayjs.Dayjs, dayjs.Dayjs]
      | null,
    showOnlyNotificationAlerts: false,
  });

  const [chartView, setChartView] = useState<"total" | "seen">("total");
  const [currentPage, setCurrentPage] = useState(1);
  const ALERTS_PER_PAGE = 20;

  // State for total alerts data
  const [totalAlertsData, setTotalAlertsData] = useState<FetchedAlertData>({
    vehicleHealthAlerts: [],
    driverBehaviourAlerts: [],
    lessKmVehicles: [],
    lessKmCount: 0,
    lockAlerts: [],
    lockAlertsCount: 0,
    dashcamVideoAlerts: [],
    dashcamVideoAlertsCount: 0,
  });

  const [totalAlertCounts, setTotalAlertCounts] =
    useState<AlertCountsResult | null>(null);
  const [isLoadingTotalAlerts, setIsLoadingTotalAlerts] = useState(false);

  // State for categorized alerts (like in ODBDetailsSection)
  const [categorizedAlerts, setCategorizedAlerts] = useState<{
    enrouteHalt: any[];
    vehicleHealth: any[];
    driverBehaviour: any[];
    lesserKm: any[];
    geofenceHalt: any[];
    eLockAlerts: any[];
    fuelTheft: any[];
    dashCamAlerts: any[];
    geofenceExit: any[];
    challan: any[];
  }>({
    enrouteHalt: [],
    vehicleHealth: [],
    driverBehaviour: [],
    lesserKm: [],
    geofenceHalt: [],
    eLockAlerts: [],
    fuelTheft: [],
    dashCamAlerts: [],
    geofenceExit: [],
    challan: [],
  });

  type AlertsData = {
    remarkAlerts: AlertWithRemark[];
  };

  const [data, setData] = useState<AlertsData>({
    remarkAlerts: [],
  });

  // Define interface for alerts with remarks and created_at
  interface AlertWithRemark extends GetAlertsPopupsResponse {
    remark: string;
    created_at: string;
  }

  // New state for remark-filtered alerts
  const [remarkFilteredAlerts, setRemarkFilteredAlerts] = useState<
    AlertWithRemark[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);

  // Helper function to check if a vehicle is active (from ODBDetailsSection)
  const isVehicleActive = (vehicle: any): boolean => {
    const inactiveStatus = vehicle.gpsDtl?.inactiveStatus;
    return inactiveStatus !== 1 && inactiveStatus !== "1";
  };

  // Helper function to deduplicate alerts by vehicle and rounded timestamp
  const deduplicateAlerts = (alerts: any[]) => {
    const uniqueMap = new Map<string, any>();
    alerts.forEach((alert) => {
      const vehNo =
        alert.vehicleno || alert.vehicle_no || alert.vehicleNumber || "";
      const dateTime = alert.datetime || alert.gps_time || "";

      const roundedTime = dayjs(dateTime).format("YYYY-MM-DD HH:mm");
      const uniqueKey = `${vehNo.toString().trim()}_${roundedTime}`;
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, alert);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const getAlertTimestamp = (alert: any): number => {
    const alertTime =
      alert.gps_time ||
      alert.datetime ||
      alert.timestamp ||
      alert.time ||
      alert.date;

    if (!alertTime) return 0;

    const parsed = dayjs(alertTime);
    return parsed.isValid() ? parsed.valueOf() : 0;
  };

  // Keep only latest N alerts per vehicle per alert type (matches ODBDetailsSection)
  const limitLatestAlertsPerVehicleAndAlertType = (
    alertsList: any[],
    maxAlertsPerVehiclePerAlertType = 5,
  ): any[] => {
    const groupedAlerts = new Map<string, any[]>();

    alertsList.forEach((alert) => {
      const vehicleNo = (
        alert.vehicleno ||
        alert.vehicle_no ||
        alert.vehicleNumber ||
        "Unknown Vehicle"
      )
        .toString()
        .trim();

      const alertType = (alert.alert_type || "Unknown Alert")
        .toString()
        .trim()
        .toLowerCase();

      const groupKey = `${vehicleNo}::${alertType}`;

      if (!groupedAlerts.has(groupKey)) {
        groupedAlerts.set(groupKey, []);
      }

      groupedAlerts.get(groupKey)!.push(alert);
    });

    return Array.from(groupedAlerts.values()).flatMap((groupedVehicleAlerts) =>
      groupedVehicleAlerts
        .sort((a, b) => getAlertTimestamp(b) - getAlertTimestamp(a))
        .slice(0, maxAlertsPerVehiclePerAlertType),
    );
  };

  // Function to categorize alerts based on alert_type (match ODBDetailsSection)
  const categorizeAlerts = (alerts: any[]) => {
    const categorized: {
      enrouteHalt: any[];
      vehicleHealth: any[];
      driverBehaviour: any[];
      lesserKm: any[];
      geofenceHalt: any[];
      eLockAlerts: any[];
      fuelTheft: any[];
      dashCamAlerts: any[];
      geofenceExit: any[];
      challan: any[];
    } = {
      enrouteHalt: [],
      vehicleHealth: [],
      driverBehaviour: [],
      lesserKm: [],
      geofenceHalt: [],
      eLockAlerts: [],
      fuelTheft: [],
      dashCamAlerts: [],
      geofenceExit: [],
      challan: [],
    };

    // Filter by date range if provided
    let filteredAlerts = alerts;
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = filters.dateRange[0];
      const endDate = filters.dateRange[1];

      filteredAlerts = alerts.filter((alert: any) => {
        const alertTime =
          alert.alert_type?.toLowerCase() === "vehicle health alert"
            ? alert.gps_time || alert.datetime
            : alert.datetime;
        if (!alertTime) return false;
        const alertDayjs = dayjs(alertTime);
        return alertDayjs.isBetween(startDate, endDate, "day", "[]");
      });
    }

    filteredAlerts.forEach((alert: any) => {
      // Skip alerts with remarks (already resolved)
      if (alert.remark && alert.remark.trim() !== "") {
        return;
      }

      const rawAlertType = alert.alert_type ?? "";
      const normalizedAlertType = rawAlertType.toString().toLowerCase().trim();

      const vehReg = alert.vehicleno || alert.vehicle_no || alert.vehicleNumber;
      const normalizedVehReg = vehReg ? vehReg.toString().trim() : "";

      // Skip alerts with remarks (already resolved)
      if (alert.remark && alert.remark.trim() !== "") {
        return;
      }

      const alertType = normalizedAlertType;

      if (alertType === "main power disconnected") {
        return;
      }

      // Filter out unknown vehicles
      if (
        !vehReg ||
        normalizedVehReg === "" ||
        normalizedVehReg.toLowerCase() === "unknown vehicle" ||
        normalizedVehReg.toLowerCase() === "unknown"
      ) {
        return;
      }

      // Filter active vehicles only
      if (vehicleData?.list) {
        const cleanVehReg = normalizedVehReg.replace(/\s+[AB]\s*$/i, "").trim();
        const matchedVehicle = vehicleData.list.find((vehicle: any) => {
          const vehicleReg = vehicle.vehReg?.toString().trim();
          return vehicleReg === cleanVehReg || vehicleReg === normalizedVehReg;
        });

        if (matchedVehicle && !isVehicleActive(matchedVehicle)) {
          return;
        }
      }

      switch (alertType) {
        case "lesser km/day":
          categorized.lesserKm.push(alert);
          break;
        case "enroute halt alert":
          categorized.enrouteHalt.push(alert);
          break;
        case "geofence halt alert":
          categorized.geofenceHalt.push(alert);
          break;
        case "geofence alert":
          categorized.geofenceExit.push(alert);
          break;
        case "vehicle health alert":
        case "mainpower disconnected":
          categorized.vehicleHealth.push(alert);
          break;
        case "unlock on move":
        case "lock - unlocked":
        case "lock unlocked":
        case "elock alert":
        case "unhealthy elock alert":
        case "door open in non-geofence":
        case "door open in non geofence":
        case "lock unlocked":
        case "LOCK Unlocked":
          categorized.eLockAlerts.push(alert);
          break;
        case "phone call":
        case "handheldphonecall":
        case "smoke":
        case "smoking":
        case "fasten seat belt":
        case "tired":
        case "fatigue warn":
        case "fatigue warning":
        case "fatiguewarn":
        case "coverning camera":
          categorized.dashCamAlerts.push(alert);
          break;
        case "challan alert":
          categorized.challan.push(alert);
          break;
        default:
          categorized.driverBehaviour.push(alert);
          break;
      }
    });
    // Apply deduplication only to Driver Behaviour
    categorized.driverBehaviour = deduplicateAlerts(
      categorized.driverBehaviour,
    );

    // Apply per-vehicle-per-alert-type limits (default 5)
    categorized.enrouteHalt = limitLatestAlertsPerVehicleAndAlertType(
      categorized.enrouteHalt,
    );
    categorized.vehicleHealth = limitLatestAlertsPerVehicleAndAlertType(
      categorized.vehicleHealth,
    );
    categorized.driverBehaviour = limitLatestAlertsPerVehicleAndAlertType(
      categorized.driverBehaviour,
    );
    categorized.lesserKm = limitLatestAlertsPerVehicleAndAlertType(
      categorized.lesserKm,
    );
    categorized.geofenceHalt = limitLatestAlertsPerVehicleAndAlertType(
      categorized.geofenceHalt,
    );
    categorized.geofenceExit = limitLatestAlertsPerVehicleAndAlertType(
      categorized.geofenceExit,
    );
    categorized.eLockAlerts = limitLatestAlertsPerVehicleAndAlertType(
      categorized.eLockAlerts,
    );
    categorized.fuelTheft = limitLatestAlertsPerVehicleAndAlertType(
      categorized.fuelTheft,
    );
    categorized.dashCamAlerts = limitLatestAlertsPerVehicleAndAlertType(
      categorized.dashCamAlerts,
    );
    categorized.challan = limitLatestAlertsPerVehicleAndAlertType(
      categorized.challan,
    );

    setCategorizedAlerts(categorized);
  };

  // Function to fetch all alerts (like in ODBDetailsSection)
  const fetchAllAlerts = async () => {
    let data: any = false;
    let retryCount = 0;

    while (data === false && retryCount < 10) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${currentGroupId}`,
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        data = await response.json();
        if (data === false) {
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= 10) {
          setCategorizedAlerts({
            enrouteHalt: [],
            vehicleHealth: [],
            driverBehaviour: [],
            lesserKm: [],
            geofenceHalt: [],
            eLockAlerts: [],
            fuelTheft: [],
            dashCamAlerts: [],
            geofenceExit: [],
            challan: [],
          });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (data === false) {
      setCategorizedAlerts({
        enrouteHalt: [],
        vehicleHealth: [],
        driverBehaviour: [],
        lesserKm: [],
        geofenceHalt: [],
        eLockAlerts: [],
        fuelTheft: [],
        dashCamAlerts: [],
        geofenceExit: [],
        challan: [],
      });
      return;
    }

    if (data && Array.isArray(data)) {
      categorizeAlerts(data);
    } else {
      setCategorizedAlerts({
        enrouteHalt: [],
        vehicleHealth: [],
        driverBehaviour: [],
        lesserKm: [],
        geofenceHalt: [],
        eLockAlerts: [],
        fuelTheft: [],
        dashCamAlerts: [],
        geofenceExit: [],
        challan: [],
      });
    }
  };

  // Fetch total alerts using allAlertsCount utility
  const fetchTotalAlerts = async () => {
    if (!currentUserId || !currentGroupId || !vehicleData) return;

    setIsLoadingTotalAlerts(true);
    try {
      const apiHooks = {
        getDTCResult,
        videoAlertsTrigger,
        getIndiaMettaxAlarmsTrigger,
        getConsolidateKM,
        getHaltingHours,
      };

      const params: AlertFetchParams = {
        userId: currentUserId,
        groupId: currentGroupId,
        selectedDateRangeDateJs: filters.dateRange
          ? [filters.dateRange[0].toDate(), filters.dateRange[1].toDate()]
          : [dayjs().startOf("day").toDate(), dayjs().endOf("day").toDate()],
        isVideoTelematics: Boolean(isVideoTelematics),
      };

      const fetchedData = await fetchAllAlertsWithDate(
        apiHooks,
        params,
        vehicleData,
      );

      // Fetch BSJ alerts separately and add them to dashcam alerts
      const bsjAlerts = await fetchBSJAlerts(params);
      const combinedDashcamAlerts: DashcamAlert[] = [
        ...fetchedData.dashcamVideoAlerts,
        ...bsjAlerts,
      ];

      const updatedFetchedData = {
        ...fetchedData,
        dashcamVideoAlerts: combinedDashcamAlerts,
        dashcamVideoAlertsCount: combinedDashcamAlerts.length,
      };

      setTotalAlertsData(updatedFetchedData);

      // Calculate counts
      const counts = calculateAllAlertCounts(
        vehicleCounts,
        vehicleData,
        updatedFetchedData.vehicleHealthAlerts,
        updatedFetchedData.driverBehaviourAlerts,
        updatedFetchedData.lessKmCount,
        updatedFetchedData.lockAlertsCount,
        updatedFetchedData.dashcamVideoAlertsCount,
      );
      setTotalAlertCounts(counts);
    } catch (error) {
      console.error("Error fetching total alerts:", error);
    } finally {
      setIsLoadingTotalAlerts(false);
    }
  };

  // Function to fetch BSJ alerts specifically
  const fetchBSJAlerts = async (
    params: AlertFetchParams,
  ): Promise<DashcamAlert[]> => {
    if (
      !params.isVideoTelematics ||
      (Number(params.userId) !== 81707 && Number(params.userId) !== 4343)
    ) {
      return [];
    }

    try {
      // Use selected date range if provided, otherwise default to today
      let startDate: string;
      let endDate: string;

      if (
        params.selectedDateRangeDateJs &&
        params.selectedDateRangeDateJs.length === 2
      ) {
        startDate = dayjs(params.selectedDateRangeDateJs[0]).format(
          "YYYY-MM-DD 00:00:00",
        );
        endDate = dayjs(params.selectedDateRangeDateJs[1]).format(
          "YYYY-MM-DD 23:59:59",
        );
      } else {
        const today = dayjs();
        startDate = today.format("YYYY-MM-DD 00:00:00");
        endDate = today.format("YYYY-MM-DD 23:59:59");
      }

      // Find BSJ vehicles (same logic as ODBDetailsSection)
      const bsjVehicles =
        vehicleData?.list?.filter((vehicle: any) => {
          const model = vehicle.gpsDtl?.model;
          return model && model.toString().includes("##BSJ");
        }) || [];

      if (bsjVehicles.length === 0) {
        return [];
      }

      // Collect all BSJ IMEI numbers without ##BSJ prefix
      const bsjImeis = bsjVehicles
        .map((vehicle) => vehicle.gpsDtl?.model?.replace("##BSJ", "") || "")
        .filter((imei) => imei !== "");

      if (bsjImeis.length === 0) {
        return [];
      }

      // Call BSJ API (same structure as ODBDetailsSection)
      const bsjResponse = await getGPSTrackTechAlarms({
        ids: [201, 38, 202, 213, 200],
        pageNumber: 1,
        pageSize: 1000,
        queryParams: bsjImeis,
        queryType: 1,
        startTime: startDate,
        endTime: endDate,
      });

      if (bsjResponse.data?.code === 200 && bsjResponse.data?.data) {
        const mapGPSTrackTechAlarmType = (alarmType: number): string | null => {
          const alarmTypeMap: { [key: number]: string } = {
            201: "handheldPhoneCall", // Phone Call
            38: "smoking", // Smoking
            202: "fatigueWarn", // Fatigue
            213: "seatBelt", // Seatbelt
            200: "fatigueWarn", // Another fatigue type
          };
          return alarmTypeMap[alarmType] || null;
        };

        // Map BSJ alarms to the standard format
        const mappedBsjAlarms = bsjResponse.data.data
          .map((alarm: any) => {
            const mappedAlarmType = mapGPSTrackTechAlarmType(alarm.alarmType);
            if (!mappedAlarmType) return null;

            // Find corresponding vehicle to get registration
            const matchingVehicle = bsjVehicles.find(
              (v) => v.gpsDtl?.model?.replace("##BSJ", "") === alarm.deviceId,
            );

            const baseUrl = "https://y.gpstracktech.com";
            const videoUrl = alarm.aviPath
              ? `${baseUrl}${alarm.aviPath}`
              : undefined;
            const imageUrls = alarm.imagePath
              ? alarm.imagePath
                  .split(",")
                  .map((path: string) => `${baseUrl}${path}`)
              : undefined;

            return {
              id: alarm.alarmId,
              deviceId: alarm.deviceId,
              deviceName: alarm.deviceName,
              alarmType: mappedAlarmType,
              alarmTs: alarm.alarmTime,
              alarmTsEnd: alarm.alarmTime,
              lat: parseFloat(alarm.lat) || 0,
              lon: parseFloat(alarm.lon) || 0,
              alarmText: 0,
              serialNo: alarm.deviceId,
              fenceId: null,
              videoUrl: videoUrl,
              imageUrls: imageUrls,
              alarmName: alarm.alarmName,
              speed: alarm.speed,
              duration: alarm.duration,
              driverName: alarm.driverName,
              vehicleReg: matchingVehicle?.vehReg || alarm.deviceName,
              timestamp: alarm.alarmTime,
            } as DashcamAlert;
          })
          .filter((alarm): alarm is DashcamAlert => alarm !== null);

        return mappedBsjAlarms;
      }

      return [];
    } catch (error: any) {
      console.warn("Failed to fetch BSJ video alerts:", error);
      return [];
    }
  };

  // Fetch total alerts when dependencies change
  useEffect(() => {
    if (
      currentUserId &&
      currentGroupId &&
      vehicleData &&
      chartView === "total"
    ) {
      fetchTotalAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserId,
    currentGroupId,
    vehicleData,
    filters.dateRange,
    chartView,
  ]);

  // Fetch categorized alerts for total view when dependencies change
  useEffect(() => {
    if (
      currentUserId &&
      currentGroupId &&
      vehicleData &&
      chartView === "total"
    ) {
      fetchAllAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserId,
    currentGroupId,
    vehicleData,
    filters.dateRange,
    chartView,
  ]);

  // Fetch alerts with remarks from the specific API endpoint
  useEffect(() => {
    const fetchAlertsWithRemarks = async () => {
      let data: any = false;
      let retryCount = 0;

      setIsLoading(true);

      while (data === false && retryCount < 10) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_REACT_API}/alerts_popups.php?token=${auth.groupId}&showAll=1`,
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          data = await response.json();
          if (data === false) {
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          retryCount++;
          if (retryCount >= 10) {
            setRemarkFilteredAlerts([]);
            setIsLoading(false);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (data === false) {
        setRemarkFilteredAlerts([]);
        setIsLoading(false);
        return;
      }

      if (Array.isArray(data)) {
        const filteredAlerts = data.filter(
          (alert: any) => alert.remark && alert.remark.trim() !== "",
        );
        const sortedAlerts = filteredAlerts.sort((a: any, b: any) => {
          const dateA = dayjs(
            a.created_at || a.datetime,
            "YYYY-MM-DD HH:mm:ss",
          );
          const dateB = dayjs(
            b.created_at || b.datetime,
            "YYYY-MM-DD HH:mm:ss",
          );
          return dateB.valueOf() - dateA.valueOf();
        });
        setRemarkFilteredAlerts(sortedAlerts);
      }

      setIsLoading(false);
    };

    if (auth.groupId) {
      fetchAlertsWithRemarks();
    }
  }, [auth.groupId]);

  useEffect(() => {
    const filterByStatusAndDate = (alerts: AlertWithRemark[]) => {
      return alerts.filter((alert) => {
        let dateMatch = true;
        if (
          (alert.created_at || alert.datetime) &&
          filters.dateRange &&
          Array.isArray(filters.dateRange) &&
          filters.dateRange.length === 2 &&
          filters.dateRange[0] &&
          filters.dateRange[1]
        ) {
          const alertDate = dayjs(
            alert.created_at || alert.datetime,
            "YYYY-MM-DD HH:mm:ss",
          );
          const startDate = filters.dateRange[0].startOf("day");
          const endDate = filters.dateRange[1].endOf("day");
          dateMatch = alertDate.isBetween(startDate, endDate, null, "[]");
        }

        return dateMatch;
      });
    };

    const filteredAlerts = filterByStatusAndDate(remarkFilteredAlerts);

    // Sort alerts by time (newest first)
    const sortedAlerts = filteredAlerts.sort((a, b) => {
      const dateA = dayjs(a.created_at || a.datetime, "YYYY-MM-DD HH:mm:ss");
      const dateB = dayjs(b.created_at || b.datetime, "YYYY-MM-DD HH:mm:ss");
      return dateB.valueOf() - dateA.valueOf();
    });

    setData({
      remarkAlerts: sortedAlerts,
    });
  }, [remarkFilteredAlerts, filters]);

  // Function to get color scheme based on alert type
  const getColorSchemeForAlert = (alertType: string): string => {
    const type = alertType?.toLowerCase() || "";

    if (
      type.includes("harsh") ||
      type.includes("panic") ||
      type.includes("accident")
    ) {
      return "red";
    } else if (type.includes("overspeed") || type.includes("speed")) {
      return "orange";
    } else if (type.includes("night movement") || type.includes("idling")) {
      return "yellow";
    } else if (
      type.includes("unlock") ||
      type.includes("lock") ||
      type.includes("elock")
    ) {
      return "indigo";
    } else if (
      type.includes("gps") ||
      type.includes("unhealthy") ||
      type.includes("main power")
    ) {
      return "green";
    } else if (
      type.includes("free") ||
      type.includes("wheel") ||
      type.includes("night")
    ) {
      return "blue";
    } else {
      return "blue"; // default
    }
  };

  // Function to format alert type display
  const formatAlertType = (alertType: string) => {
    if (alertType?.toLowerCase() === "freewheeling") {
      return "Free Wheeling";
    }
    return alertType;
  };

  const renderAlerts = (title: string, alerts: AlertWithRemark[]) => {
    if (!alerts.length) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <ul className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.alert_id}
              alert={alert}
              colorScheme={
                getColorSchemeForAlert(alert.alert_type) as ColorScheme
              }
              formatAlertType={formatAlertType}
              showRemark={true}
              cardHeight="h-48"
            />
          ))}
        </ul>
      </div>
    );
  };

  const totalAlerts = data.remarkAlerts.length;

  // Check if there are any alerts with meaningful content
  const hasMessagefulAlerts = data.remarkAlerts.some(
    (alert) =>
      alert.msg &&
      alert.msg.trim() !== "" &&
      alert.vehicleno &&
      alert.vehicleno.trim() !== "" &&
      alert.alert_type &&
      alert.alert_type.trim() !== "" &&
      alert.remark &&
      alert.remark.trim() !== "",
  );

  // Get all alerts for total view (combining all categorized alerts)
  const getAllTotalAlerts = (): any[] => {
    const allAlerts = [
      ...categorizedAlerts.enrouteHalt,
      ...categorizedAlerts.vehicleHealth,
      ...categorizedAlerts.driverBehaviour,
      ...categorizedAlerts.lesserKm,
      ...categorizedAlerts.geofenceHalt,
      ...categorizedAlerts.eLockAlerts,
      ...categorizedAlerts.fuelTheft,
      ...categorizedAlerts.dashCamAlerts,
      ...categorizedAlerts.geofenceExit,
      ...categorizedAlerts.challan,
    ];

    // Sort by datetime (newest first)
    return allAlerts.sort((a, b) => {
      const dateA = dayjs(a.datetime || a.gps_time || a.created_at);
      const dateB = dayjs(b.datetime || b.gps_time || b.created_at);
      return dateB.valueOf() - dateA.valueOf();
    });
  };

  const allTotalAlerts = getAllTotalAlerts();
  const totalAlertsCount = allTotalAlerts.length;

  // Get paginated alerts based on current view
  const getPaginatedAlerts = () => {
    const alerts = chartView === "total" ? allTotalAlerts : data.remarkAlerts;
    const startIndex = (currentPage - 1) * ALERTS_PER_PAGE;
    const endIndex = startIndex + ALERTS_PER_PAGE;
    return alerts.slice(startIndex, endIndex);
  };

  const paginatedAlerts = getPaginatedAlerts();
  const currentTotalCount =
    chartView === "total" ? totalAlertsCount : totalAlerts;

  // Reset page when view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [chartView]);

  // Function to get chart data based on alert types
  const getChartData = () => {
    if (chartView === "seen") {
      // For seen view, group remark alerts by type (original logic)
      const alertCounts: { [key: string]: number } = {};
      data.remarkAlerts.forEach((alert) => {
        const type = alert.alert_type || "Other";
        alertCounts[type] = (alertCounts[type] || 0) + 1;
      });

      // Sort by count descending so larger segments appear first
      const sorted = Object.entries(alertCounts).sort((a, b) => b[1] - a[1]);

      // Color mapping based on alert box colors (light shades)
      const colorMapping: { [key: string]: string } = {
        red: "#fca5a5", // red-300
        orange: "#fdba74", // orange-300
        yellow: "#fde047", // yellow-300
        green: "#c084fc", // purple-300 (mapped to green alerts)
        blue: "#93c5fd", // blue-300
        indigo: "#a5b4fc", // indigo-300
      };

      return sorted.map(([type, count]) => {
        const colorScheme = getColorSchemeForAlert(type);
        const color = colorMapping[colorScheme] || colorMapping.blue;

        return {
          name: type,
          value: count,
          color: color,
        };
      });
    } else {
      const alertData = [
        {
          name: "Enroute Halt",
          value: categorizedAlerts.enrouteHalt.length,
          color: "#fca5a5", // red-300
        },
        {
          name: "Vehicle Health",
          value: categorizedAlerts.vehicleHealth.length,
          color: "#fde047", // yellow-300
        },
        {
          name: "Driver Behaviour",
          value: categorizedAlerts.driverBehaviour.length,
          color: "#c084fc", // purple-300
        },
        {
          name: "Lesser KM",
          value: categorizedAlerts.lesserKm.length,
          color: "#93c5fd", // blue-300
        },
        {
          name: "Geofence Halt",
          value: categorizedAlerts.geofenceHalt.length,
          color: "#67e8f9", // cyan-300
        },
        {
          name: "E-Lock",
          value: categorizedAlerts.eLockAlerts.length,
          color: "#a5b4fc", // indigo-300
        },
        {
          name: "Fuel Theft",
          value: categorizedAlerts.fuelTheft.length,
          color: "#fdba74", // orange-300
        },
        {
          name: "Dash Cam",
          value: categorizedAlerts.dashCamAlerts.length,
          color: "#bef264", // lime-300
        },
        {
          name: "Geofence Exit",
          value: categorizedAlerts.geofenceExit.length,
          color: "#f9a8d4", // pink-300
        },
        {
          name: "Challan",
          value: categorizedAlerts.challan.length,
          color: "#d8b4fe", // violet-300
        },
      ];

      // Filter out zero values and sort by count descending
      return alertData
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);
    }
  };

  const chartData = getChartData();
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">
          Alert Management
        </h2>
      </div>

      {/* Chart Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 w-full lg:w-80">
            {/* Chart Title and Toggle */}
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">
                Alert Distribution
              </h4>
              <div className="flex items-center justify-center">
                <Tabs
                  activeKey={chartView}
                  onChange={(key) => setChartView(key as "total" | "seen")}
                  size="small"
                  centered
                  items={[
                    {
                      key: "seen",
                      label: "Seen",
                    },
                    {
                      key: "total",
                      label: "Total",
                    },
                  ]}
                />
              </div>
            </div>

            {/* Pie Chart (no legend) */}
            <div className="relative flex items-center justify-center">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => `Alert Type: ${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        color: "#374151",
                        fontSize: "12px",
                        boxShadow:
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Center Text */}
              <div className="absolute flex flex-col items-center justify-center">
                {isLoadingTotalAlerts && chartView === "total" ? (
                  <Spin size="small" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-800">
                      {totalValue}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {chartView === "total" ? "Total Alerts" : "Seen Alerts"}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Alert Type Cards */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Alert Types
              </h3>
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                {/* Enroute Halt Alerts */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">
                      Enroute Halt Alerts
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.enrouteHalt.length
                      : data.remarkAlerts.filter(
                          (alert) =>
                            alert.alert_type?.toLowerCase() ===
                            "enroute halt alert",
                        ).length}
                  </div>
                </div>

                {/* Vehicle Health Alerts */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">
                      Vehicle Health Alerts
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.vehicleHealth.length
                      : data.remarkAlerts.filter(
                          (alert) =>
                            alert.alert_type?.toLowerCase() ===
                            "vehicle health alert",
                        ).length}
                  </div>
                </div>

                {/* Driver Behaviour */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">
                      Driver Behaviour
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.driverBehaviour.length
                      : data.remarkAlerts.filter((alert) => {
                          const alertType =
                            alert.alert_type?.toLowerCase() || "";
                          return (
                            alertType !== "lesser km/day" &&
                            alertType !== "enroute halt alert" &&
                            alertType !== "geofence halt alert" &&
                            alertType !== "vehicle health alert" &&
                            alertType !== "unlock on move" &&
                            alertType !== "lock - unlocked" &&
                            alertType !== "phone call" &&
                            alertType !== "smoke" &&
                            alertType !== "tired" &&
                            alertType !== "fatigue warn" &&
                            alertType !== "fatigue warning" &&
                            alertType !== "main power disconnected" &&
                            alertType !== "elock alert"
                          );
                        }).length}
                  </div>
                </div>

                {/* Lesser KM / Day */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">
                      Lesser KM / Day
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.lesserKm.length
                      : data.remarkAlerts.filter(
                          (alert) =>
                            alert.alert_type?.toLowerCase() === "lesser km/day",
                        ).length}
                  </div>
                </div>

                {/* Geofence Halt Alerts */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">
                      Geofence Halt Alerts
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.geofenceHalt.length
                      : data.remarkAlerts.filter(
                          (alert) =>
                            alert.alert_type?.toLowerCase() ===
                            "geofence halt alert",
                        ).length}
                  </div>
                </div>

                {/* E-Lock Alerts */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">E-Lock Alerts</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.eLockAlerts.length
                      : data.remarkAlerts.filter(
                          (alert) =>
                            alert.alert_type?.toLowerCase() ===
                              "unlock on move" ||
                            alert.alert_type?.toLowerCase() ===
                              "lock - unlocked" ||
                            alert.alert_type?.toLowerCase() === "elock alert",
                        ).length}
                  </div>
                </div>

                {/* Fuel Theft */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Fuel Theft</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.fuelTheft.length
                      : 0}
                  </div>
                </div>

                {/* Dash Cam Alerts */}
                <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-lime-400 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">
                      Dash Cam Alerts
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {chartView === "total"
                      ? categorizedAlerts.dashCamAlerts.length
                      : data.remarkAlerts.filter((alert) => {
                          const alertType =
                            alert.alert_type?.toLowerCase() || "";
                          return (
                            alertType === "phone call" ||
                            alertType === "smoke" ||
                            alertType === "handheldphonecall" ||
                            alertType === "smoking" ||
                            alertType === "tired" ||
                            alertType === "fatigue warn" ||
                            alertType === "fatigue warning" ||
                            alertType === "fasten seat belt"
                          );
                        }).length}
                  </div>
                </div>

                {/* Geofence Exit Alerts - Only for user 81707 */}
                {Number(currentUserId) === 81707 && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-pink-400 rounded-full mr-2"></div>
                      <span className="text-xs text-gray-600">
                        Geofence Exit
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {chartView === "total"
                        ? categorizedAlerts.geofenceExit.length
                        : data.remarkAlerts.filter(
                            (alert) =>
                              alert.alert_type?.toLowerCase() ===
                              "geofence exit alert",
                          ).length}
                    </div>
                  </div>
                )}

                {/* Challan Alerts - Only for user 81707 */}
                {Number(currentUserId) === 81707 && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-violet-400 rounded-full mr-2"></div>
                      <span className="text-xs text-gray-600">
                        Challan Alert
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {chartView === "total"
                        ? categorizedAlerts.challan.length
                        : data.remarkAlerts.filter(
                            (alert) =>
                              alert.alert_type?.toLowerCase() ===
                              "challan alert",
                          ).length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show loading, alerts or no alerts message */}
      {(chartView === "total" ? isLoadingTotalAlerts : isLoading) ? (
        <LoadingState />
      ) : currentTotalCount === 0 ? (
        <EmptyState
          title="No Alerts Found"
          message={
            filters.dateRange || filters.showOnlyNotificationAlerts
              ? "No alerts match your current filters. Try adjusting your date range or filter settings."
              : "There are currently no alerts to display."
          }
        />
      ) : (
        <>
          {chartView === "total" ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                All Alerts
              </h3>
              <ul className="space-y-4">
                {paginatedAlerts.map((alert: any, index: number) => (
                  <AlertCard
                    key={`${alert.alert_id || index}-${index}`}
                    alert={alert}
                    colorScheme={
                      getColorSchemeForAlert(alert.alert_type) as ColorScheme
                    }
                    formatAlertType={formatAlertType}
                    showRemark={false}
                    cardHeight="h-40"
                  />
                ))}
              </ul>
            </div>
          ) : (
            renderAlerts(
              "Alerts with Remarks",
              paginatedAlerts as AlertWithRemark[],
            )
          )}

          {/* Pagination */}
          {currentTotalCount > ALERTS_PER_PAGE && (
            <div className="flex justify-center mt-6 mb-4">
              <Pagination
                current={currentPage}
                total={currentTotalCount}
                pageSize={ALERTS_PER_PAGE}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} alerts`
                }
              />
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            Total Alerts:{" "}
            <span className="font-bold text-black">{currentTotalCount}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default AlertList;
