import { useAddNormalAlertCommentMutation } from "@/app/_globalRedux/services/reactApi";
import {
  useGetCountDetailsQuery,
  useGetVehiclesByStatusQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { DownOutlined, TruckFilled, UpOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  message,
  Modal,
  Table,
  Tag,
  Tooltip as AntTooltip,
} from "antd";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCard } from "./components/AlertCard";
import AiSummaryModal from "./components/AiSummaryModal";
import { ModalHeader } from "./components/ModalHeader";
import ReusableAlertPieChart from "./components/ReusableAlertPieChart";
import {
  getConsistentDriverBehaviourAlertTypeColor,
  getConsistentVehicleHealthAlertTypeColor,
  getConsistentVideoAlertTypeColor,
  parseVehicleHealthMessage,
  processDriverBehaviourData,
  processELockAlertsData,
  processVehicleHealthData,
} from "./utils/pieChartDataProcessors";

interface ODBDetailsSectionProps {
  selectedDateRangeDateJs?: Date[];
  aiSummaryTrigger?: number;
  onSummaryLoadingChange?: (isLoading: boolean) => void;
}

type AlertRecord = Record<string, any>;

type CategorizedAlertsState = {
  enrouteHalt: AlertRecord[];
  vehicleHealth: AlertRecord[];
  driverBehaviour: AlertRecord[];
  lesserKm: AlertRecord[];
  geofenceHalt: AlertRecord[];
  geofenceExitAlerts: AlertRecord[];
  eLockAlerts: AlertRecord[];
  fuelTheft: AlertRecord[];
  dashCamAlerts: AlertRecord[];
  challanAlerts: AlertRecord[];
};

type SummaryCategoryPayload = {
  title: string;
  count: number;
  vehicleCount: number;
  coverageLabel: string;
  uniqueVehicleCount: number;
  topAlertTypes: { name: string; count: number }[];
  topVehicles: { vehicleNumber: string; count: number }[];
  recentAlerts: {
    vehicleNumber: string;
    alertType: string;
    message: string;
    time: string;
  }[];
};

const emptyCategorizedAlerts: CategorizedAlertsState = {
  enrouteHalt: [],
  vehicleHealth: [],
  driverBehaviour: [],
  lesserKm: [],
  geofenceHalt: [],
  geofenceExitAlerts: [],
  eLockAlerts: [],
  fuelTheft: [],
  dashCamAlerts: [],
  challanAlerts: [],
};

const getAlertVehicleNumber = (alert: AlertRecord): string => {
  const rawVehicle =
    alert.vehicleno ||
    alert.vehicle_no ||
    alert.vehicleNum ||
    alert.vehReg ||
    alert.vehicleNumber ||
    alert.vehicleReg ||
    "Unknown Vehicle";

  return rawVehicle.toString().trim() || "Unknown Vehicle";
};

const getAlertTimestampValue = (alert: AlertRecord): number => {
  const rawTime =
    alert.gps_time ||
    alert.datetime ||
    alert.timestamp ||
    alert.time ||
    alert.date;

  if (!rawTime) {
    return 0;
  }

  const parsedTime = moment(rawTime);
  return parsedTime.isValid() ? parsedTime.valueOf() : 0;
};

const getAlertTimeLabel = (alert: AlertRecord): string => {
  const rawTime =
    alert.gps_time ||
    alert.datetime ||
    alert.timestamp ||
    alert.time ||
    alert.date;

  if (!rawTime) {
    return "N/A";
  }

  const parsedTime = moment(rawTime);
  return parsedTime.isValid()
    ? parsedTime.format("DD MMM YYYY HH:mm")
    : rawTime;
};

const trimSummaryText = (value: string, maxLength = 180): string => {
  const normalizedValue = value.replace(/\s+/g, " ").trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 3)}...`;
};

const getAlertSubtypeForSummary = (
  sectionTitle: string,
  alert: AlertRecord,
): string => {
  if (sectionTitle === "Vehicle Health Alerts") {
    return parseVehicleHealthMessage(alert.msg || "").category.toUpperCase();
  }

  if (sectionTitle === "E-Lock Alerts") {
    return alert.alert_type || alert.message || "E-Lock Alert";
  }

  return alert.alert_type || sectionTitle;
};

const buildSummaryCategoryPayload = ({
  title,
  alerts,
  vehicleCount,
  coverageLabel,
}: {
  title: string;
  alerts: AlertRecord[];
  vehicleCount: number;
  coverageLabel: string;
}): SummaryCategoryPayload => {
  const typeCounts = new Map<string, number>();
  const vehicleCounts = new Map<string, number>();

  alerts.forEach((alert) => {
    const alertType = getAlertSubtypeForSummary(title, alert);
    const vehicleNumber = getAlertVehicleNumber(alert);

    typeCounts.set(alertType, (typeCounts.get(alertType) || 0) + 1);
    vehicleCounts.set(
      vehicleNumber,
      (vehicleCounts.get(vehicleNumber) || 0) + 1,
    );
  });

  const recentAlerts = [...alerts]
    .sort((firstAlert, secondAlert) => {
      return (
        getAlertTimestampValue(secondAlert) - getAlertTimestampValue(firstAlert)
      );
    })
    .slice(0, 8)
    .map((alert) => ({
      vehicleNumber: getAlertVehicleNumber(alert),
      alertType: getAlertSubtypeForSummary(title, alert),
      message: trimSummaryText(
        alert.msg ||
          alert.message ||
          alert.location ||
          alert.address ||
          "No message",
      ),
      time: getAlertTimeLabel(alert),
    }));

  const topAlertTypes = Array.from(typeCounts.entries())
    .sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const topVehicles = Array.from(vehicleCounts.entries())
    .sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])
    .slice(0, 8)
    .map(([vehicleNumber, count]) => ({ vehicleNumber, count }));

  return {
    title,
    count: alerts.length,
    vehicleCount,
    coverageLabel,
    uniqueVehicleCount: vehicleCounts.size,
    topAlertTypes,
    topVehicles,
    recentAlerts,
  };
};

// Reusable Remark Cell Component
interface RemarkCellProps {
  commentKey: string;
  commentInputs: { [key: string]: string };
  setCommentInputs: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  activeCommentInput: string | null;
  setActiveCommentInput: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  onSubmit: () => void;
  placeholder?: string;
}

const RemarkCell: React.FC<RemarkCellProps> = ({
  commentKey,
  commentInputs,
  setCommentInputs,
  activeCommentInput,
  setActiveCommentInput,
  isLoading,
  onSubmit,
  placeholder = "Enter remark...",
}) => {
  const isActive = activeCommentInput === commentKey;

  return (
    <div className="flex flex-col gap-1">
      {isActive ? (
        <div className="flex items-center gap-2">
          <Input
            size="small"
            placeholder={placeholder}
            value={commentInputs[commentKey] || ""}
            onChange={(e) =>
              setCommentInputs((prev) => ({
                ...prev,
                [commentKey]: e.target.value,
              }))
            }
            onPressEnter={onSubmit}
          />
          <Button
            size="small"
            type="primary"
            loading={isLoading}
            onClick={onSubmit}
          >
            Save
          </Button>
          <Button
            size="small"
            onClick={() => {
              setActiveCommentInput(null);
              setCommentInputs((prev) => ({
                ...prev,
                [commentKey]: "",
              }));
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="link"
          size="small"
          onClick={() => setActiveCommentInput(commentKey)}
          className="text-teal-600 p-0 h-auto text-left"
        >
          + Add Remark
        </Button>
      )}
    </div>
  );
};

const ODBDetailsSection = ({
  selectedDateRangeDateJs,
  aiSummaryTrigger = 0,
  onSummaryLoadingChange,
}: ODBDetailsSectionProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    title: string;
    count: number;
    sub: string;
    vehCount: number;
    bgColor: string;
    lineColor: string;
    vehicles?: VehicleData[] | any[];
    alerts?: any[];
  } | null>(null);

  // Simplified alert states
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [categorizedAlerts, setCategorizedAlerts] =
    useState<CategorizedAlertsState>(emptyCategorizedAlerts);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Pie chart filter states
  const [vehicleHealthFilters, setVehicleHealthFilters] = useState<string[]>(
    [],
  );
  const [driverBehaviourFilters, setDriverBehaviourFilters] = useState<
    string[]
  >([]);
  const [eLockFilters, setELockFilters] = useState<string[]>([]);
  const [dashCamFilters, setDashCamFilters] = useState<string[]>([]);

  // Handler for toggling pie chart filters
  const handleLegendClick = (
    filterName: string,
    currentFilters: string[],
    setFilters: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (currentFilters.includes(filterName)) {
      // Remove filter if already selected
      setFilters(currentFilters.filter((f) => f !== filterName));
    } else {
      // Add filter if not selected
      setFilters([...currentFilters, filterName]);
    }
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  );

  // Single API hook for fetching all alerts
  const [addNormalAlertComment] = useAddNormalAlertCommentMutation();

  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {},
  );
  const [commentLoading, setCommentLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [activeCommentInput, setActiveCommentInput] = useState<string | null>(
    null,
  );
  const { data: vehicleCounts } = useGetCountDetailsQuery(
    {
      userid: userId,
      groupid: groupId,
      puserid: parentUser,
    },
    {
      skip: !groupId || !userId || !parentUser,
    },
  );
  // Fetch detailed vehicle data to count fuel-enabled vehicles
  const { data: vehicleData } = useGetVehiclesByStatusQuery(
    {
      token: groupId,
      userId: userId,
      pUserId: userId,
      mode: "",
    },
    {
      skip: !groupId || !userId,
      refetchOnMountOrArgChange: true,
    },
  );

  // Single API call to fetch all alerts
  const fetchAllAlerts = async () => {
    let data: any = false;
    let retryCount = 0;

    setAlertsLoading(true);

    while (data === false && retryCount < 10) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${groupId}`,
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
          setCategorizedAlerts(emptyCategorizedAlerts);
          setAlertsLoading(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (data === false) {
      setCategorizedAlerts(emptyCategorizedAlerts);
      setAlertsLoading(false);
      return;
    }

    if (data && Array.isArray(data)) {
      categorizeAlerts(data);
    } else {
      setCategorizedAlerts(emptyCategorizedAlerts);
    }

    setAlertsLoading(false);
  };

  // Function to categorize alerts based on alert_type
  const categorizeAlerts = (alerts: any[]) => {
    const categorized: {
      enrouteHalt: any[];
      vehicleHealth: any[];
      driverBehaviour: any[];
      lesserKm: any[];
      geofenceHalt: any[];
      geofenceExitAlerts: any[];
      eLockAlerts: any[];
      fuelTheft: any[];
      dashCamAlerts: any[];
      challanAlerts: any[];
    } = {
      enrouteHalt: [],
      vehicleHealth: [],
      driverBehaviour: [],
      lesserKm: [],
      geofenceHalt: [],
      geofenceExitAlerts: [],
      eLockAlerts: [],
      fuelTheft: [],
      dashCamAlerts: [],
      challanAlerts: [],
    };

    // Filter by date range if provided
    let filteredAlerts = alerts;
    if (selectedDateRangeDateJs && selectedDateRangeDateJs.length === 2) {
      const startDate = moment(selectedDateRangeDateJs[0]);
      const endDate = moment(selectedDateRangeDateJs[1]);

      filteredAlerts = alerts.filter((alert: any) => {
        // For Vehicle Health Alerts, use gps_time; for others, use datetime
        const alertTime =
          alert.alert_type?.toLowerCase() === "vehicle health alert"
            ? alert.gps_time || alert.datetime
            : alert.datetime;
        if (!alertTime) return false;
        const alertMoment = moment(alertTime);
        return alertMoment.isBetween(startDate, endDate, "day", "[]");
      });
    }

    filteredAlerts.forEach((alert: any) => {
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
          categorized.geofenceExitAlerts.push(alert);
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
        case "LOCK Unlocked":
          categorized.eLockAlerts.push(alert);
          break;
        case "phone call":
        // case "Phone Call":
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
          categorized.challanAlerts.push(alert);
          break;
        default:
          categorized.driverBehaviour.push(alert);
          break;
      }
    });

    const getAlertTimestamp = (alert: any): number => {
      const alertTime =
        alert.gps_time ||
        alert.datetime ||
        alert.timestamp ||
        alert.time ||
        alert.date;

      if (!alertTime) return 0;

      const parsedTime = moment(alertTime);
      return parsedTime.isValid() ? parsedTime.valueOf() : 0;
    };

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

    categorized.vehicleHealth.sort((a: any, b: any) => {
      const aGpsTime = a.gps_time || a.datetime || 0;
      const bGpsTime = b.gps_time || b.datetime || 0;
      return new Date(bGpsTime).getTime() - new Date(aGpsTime).getTime();
    });

    const deduplicateAlerts = (alerts: any[]) => {
      const uniqueMap = new Map<string, any>();

      alerts.forEach((alert) => {
        const vehNo =
          alert.vehicleno || alert.vehicle_no || alert.vehicleNumber || "";
        const dateTime = alert.datetime || alert.gps_time || "";

        // Round timestamp to the nearest minute for grouping
        const roundedTime = moment(dateTime).format("YYYY-MM-DD HH:mm");
        const uniqueKey = `${vehNo.toString().trim()}_${roundedTime}`;

        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, alert);
        }
      });

      return Array.from(uniqueMap.values());
    };

    // Apply deduplication only to Driver Behaviour
    categorized.driverBehaviour = deduplicateAlerts(
      categorized.driverBehaviour,
    );

    // Keep only latest 3 alerts per vehicle for most alert categories
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
    categorized.geofenceExitAlerts = limitLatestAlertsPerVehicleAndAlertType(
      categorized.geofenceExitAlerts,
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
    categorized.challanAlerts = limitLatestAlertsPerVehicleAndAlertType(
      categorized.challanAlerts,
    );

    setCategorizedAlerts(categorized);
  };

  // Helper function to check if a vehicle is active
  const isVehicleActive = (vehicle: any): boolean => {
    const inactiveStatus = vehicle.gpsDtl?.inactiveStatus;
    return inactiveStatus !== 1 && inactiveStatus !== "1";
  };

  const processApiDashCamAlertsData = (alerts: any[]) => {
    if (!alerts || alerts.length === 0) return [];

    const alertTypeCounts: { [key: string]: number } = {};

    alerts.forEach((alert) => {
      const alertType = alert.alert_type || "Other";
      alertTypeCounts[alertType] = (alertTypeCounts[alertType] || 0) + 1;
    });

    return Object.entries(alertTypeCounts).map(([name, value]) => ({
      name,
      value,
      color: getConsistentVideoAlertTypeColor(name),
    }));
  };

  // Utility functions for formatting
  const formatTime = (t?: string) => {
    if (!t) return "N/A";
    const m = moment(t);
    return m.isValid() ? m.format("DD MMMM YYYY HH:mm") : t;
  };

  // Helper function to filter vehicles by search term
  const filterVehiclesBySearch = (
    vehicles: any[],
    searchTerm: string,
  ): any[] => {
    if (!searchTerm.trim()) {
      return vehicles;
    }

    const search = searchTerm.toLowerCase().trim();
    return vehicles.filter((vehicle) => {
      const vehReg = (
        vehicle.vehicleno ||
        vehicle.vehicle_no ||
        vehicle.vehicleNum ||
        vehicle.vehReg ||
        vehicle.vehicleNumber ||
        vehicle.vehicleReg ||
        ""
      )
        .toString()
        .toLowerCase();

      return vehReg.includes(search);
    });
  };

  // Simplified comment handling
  const handleCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    title: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    const commentKey = `${alertId}-${vehicleNumber}`;
    const comment = commentInputs[commentKey];

    if (!comment?.trim()) {
      return;
    }

    setCommentLoading((prev) => ({ ...prev, [commentKey]: true }));

    const normalizeAlertTypeForSubmission = (type?: string): string => {
      if (!type || !type.trim()) return "general";

      const lower = type.toLowerCase().trim();
      if (lower === "unhealthy elock alert") {
        return "Unhealthy Elock Alert";
      }

      return type;
    };

    try {
      await addNormalAlertComment({
        token: Number(groupId),
        remark: comment,
        issue: "",
        service_id: Number(vehicleId),
        alert_type: normalizeAlertTypeForSubmission(alertType),
      });

      setCommentInputs((prev) => ({ ...prev, [commentKey]: "" }));
      setActiveCommentInput(null);

      // Re-fetch alerts after comment submission
      await fetchAllAlerts();
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setCommentLoading((prev) => ({ ...prev, [commentKey]: false }));
    }
  };

  // Specific comment handlers for different alert types
  const handleEnrouteHaltCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    remark: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    return handleCommentSubmit(
      alertId,
      vehicleNumber,
      "Enroute Halt Alert",
      vehicleId,
      alertType || "Enroute_halt_alert",
    );
  };

  const handleLesserKmCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    remark: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    return handleCommentSubmit(
      alertId,
      vehicleNumber,
      "Lesser KM Alert",
      vehicleId,
      alertType || "lesser_km",
    );
  };

  const handleGeofenceHaltCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    remark: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    return handleCommentSubmit(
      alertId,
      vehicleNumber,
      "Geofence Halt Alert",
      vehicleId,
      alertType || "Geofence_Halt_alerts",
    );
  };

  const handleGeofenceExitCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    remark: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    return handleCommentSubmit(
      alertId,
      vehicleNumber,
      "Geofence Exit Alert",
      vehicleId,
      alertType || "Geofence_Exit_alerts",
    );
  };

  const handleVehicleHealthCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    remark: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    return handleCommentSubmit(
      alertId,
      vehicleNumber,
      "Vehicle Health Alert",
      vehicleId,
      alertType || "health_alerts",
    );
  };

  const handleDashCamCommentSubmit = async (
    alertId: string,
    vehicleNumber: string,
    remark: string,
    vehicleId: string,
    alertType?: string,
  ) => {
    const commentKey = `${alertId}-${vehicleNumber}`;

    if (!remark?.trim()) {
      return;
    }

    setCommentLoading((prev) => ({ ...prev, [commentKey]: true }));

    try {
      await addNormalAlertComment({
        token: Number(groupId),
        remark: remark,
        issue: "",
        service_id: Number(vehicleId),
        alert_type: alertType || "dash_cam_alerts",
      });

      setCommentInputs((prev) => ({ ...prev, [commentKey]: "" }));
      setActiveCommentInput(null);

      // Re-fetch alerts after comment submission
      await fetchAllAlerts();
    } catch (error) {
      console.error("Error submitting dash cam comment:", error);
    } finally {
      setCommentLoading((prev) => ({ ...prev, [commentKey]: false }));
    }
  };

  // Simplified useEffect to fetch alerts
  useEffect(() => {
    if (userId && groupId) {
      fetchAllAlerts();
    }
  }, [userId, groupId, vehicleData, selectedDateRangeDateJs]);

  // Update selected item when modal is open
  useEffect(() => {
    if (selectedItem && modalOpen) {
      const updatedItem = { ...selectedItem };

      switch (selectedItem.title) {
        case "Driver Behaviour":
          updatedItem.vehicles = categorizedAlerts.driverBehaviour;
          updatedItem.count = categorizedAlerts.driverBehaviour.length;
          break;
        case "E-Lock Alerts":
          updatedItem.vehicles = categorizedAlerts.eLockAlerts;
          updatedItem.count = categorizedAlerts.eLockAlerts.length;
          break;
        case "Enroute Halt Alerts":
          updatedItem.vehicles = categorizedAlerts.enrouteHalt;
          updatedItem.count = categorizedAlerts.enrouteHalt.length;
          break;
        case "Vehicle Health Alerts":
          updatedItem.vehicles = categorizedAlerts.vehicleHealth;
          updatedItem.count = categorizedAlerts.vehicleHealth.length;
          break;
        case "Lesser KM / Day":
          updatedItem.vehicles = categorizedAlerts.lesserKm;
          updatedItem.count = categorizedAlerts.lesserKm.length;
          break;
        case "Geofence Halt Alerts":
          updatedItem.vehicles = categorizedAlerts.geofenceHalt;
          updatedItem.count = categorizedAlerts.geofenceHalt.length;
          break;
        case "Geofence Exit Alerts":
          updatedItem.vehicles = categorizedAlerts.geofenceExitAlerts;
          updatedItem.count = categorizedAlerts.geofenceExitAlerts.length;
          break;
        case "Dash Cam Alerts":
          updatedItem.vehicles = categorizedAlerts.dashCamAlerts;
          updatedItem.count = categorizedAlerts.dashCamAlerts.length;
          break;
        case "Challan Alerts":
          updatedItem.vehicles = categorizedAlerts.challanAlerts;
          updatedItem.count = categorizedAlerts.challanAlerts.length;
          break;
        default:
          break;
      }

      setSelectedItem(updatedItem);
    }
  }, [categorizedAlerts, selectedItem?.title, modalOpen]);

  useEffect(() => {
    if (selectedItem && modalOpen) {
      setCurrentPage(1);
      setSearchTerm("");
      setExpandedRows([]);

      setTimeout(() => {
        const modalBody = document.querySelector(".ant-modal-body");
        if (modalBody) {
          modalBody.scrollTop = 0;
        }
      }, 100);
    }
  }, [selectedItem?.title, modalOpen]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const calculatedCounts = useMemo(() => {
    const totalVehicles =
      vehicleCounts?.list.find((e) => e.mode === "ALL")?.count || 0;

    let fuelEnabledVehicles = 0;
    let lockEnabledVehicles = 0;
    let dashcamEnabledVehicles = 0;

    if (vehicleData?.list) {
      const hasFuelData = (v: VehicleData) => {
        return Boolean(v.gpsDtl?.fuel && v.gpsDtl.fuel <= 100);
      };

      const hasController = (v: VehicleData) => {
        return v.gpsDtl?.controllernum === "CONTROLLER";
      };

      const hasDashcam = (v: VehicleData) => {
        const model = v.gpsDtl?.model;
        return Boolean(
          model &&
          (/^\d+$/.test(model.toString().trim()) ||
            model.toString().includes("##BSJ")),
        );
      };

      const vehicles = vehicleData.list.filter(
        (vehicle) => vehicle.vId !== null,
      );
      fuelEnabledVehicles = vehicles.filter(hasFuelData).length;
      lockEnabledVehicles = vehicles.filter(hasController).length;
      dashcamEnabledVehicles = vehicles.filter(hasDashcam).length;
    }

    return {
      totalVehicles,
      fuelEnabledVehicles,
      lockEnabledVehicles,
      dashcamEnabledVehicles,
      enrouteHaltCount: categorizedAlerts.enrouteHalt.length,
      vehicleHealthCount: categorizedAlerts.vehicleHealth.length,
      driverBehaviourCount: categorizedAlerts.driverBehaviour.length,
      lessKmCount: categorizedAlerts.lesserKm.length,
      lockAlertsCount: categorizedAlerts.eLockAlerts.length,
      geofenceHaltCount: categorizedAlerts.geofenceHalt.length,
      geofenceExitAlertsCount: categorizedAlerts.geofenceExitAlerts.length,
      dashcamVideoAlertsCount: categorizedAlerts.dashCamAlerts.length,
      challanAlertsCount: categorizedAlerts.challanAlerts.length,
    };
  }, [vehicleCounts, vehicleData, categorizedAlerts]);

  // Simplified export function
  const handleExport = () => {
    if (
      !selectedItem ||
      !selectedItem.vehicles ||
      selectedItem.vehicles.length === 0
    ) {
      return;
    }

    const currentDate = moment().format("YYYY-MM-DD");
    let csvContent = "";
    let filename = "";

    // Common CSV headers and data for all alert types
    filename = `${selectedItem.title.replace(
      /[^a-zA-Z0-9]/g,
      "_",
    )}_${currentDate}.csv`;
    csvContent = "Alert ID,Vehicle Number,Alert Type,Message,Date Time\n";

    (selectedItem.vehicles as any[]).forEach((alert) => {
      const alertId = alert.alert_id || "N/A";
      const vehNo = alert.vehicleno || alert.vehicle_no || "Unknown Vehicle";
      const alertType = (alert.alert_type || "Alert").replace(/,/g, " ");
      const message = (alert.msg || "No Message").replace(/,/g, " ");
      const dateTime = alert.datetime || "No Time";

      csvContent += `"${alertId}","${vehNo}","${alertType}","${message}","${dateTime}"\n`;
    });

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleCardClick = (item: {
    title: string;
    count: number;
    sub: string;
    vehCount: number;
    bgColor: string;
    lineColor: string;
    vehicles?: VehicleData[] | any[];
  }) => {
    if (!item.vehicles || item.vehicles.length === 0 || item.count === 0) {
      message.info(`No ${item.title} is Present`);
      return;
    }

    setSelectedItem(item);
    setModalOpen(true);
    setCurrentPage(1); // Reset pagination to page 1
    setSearchTerm(""); // Reset search when opening new modal
    // Reset all filters
    setVehicleHealthFilters([]);
    setDriverBehaviourFilters([]);
    setELockFilters([]);
    setDashCamFilters([]);
    setTimeout(() => {
      const modalBody = document.querySelector(".ant-modal-body");
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }, 100);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setCurrentPage(1);
    setSearchTerm("");
    setExpandedRows([]);
    // Reset all filters
    setVehicleHealthFilters([]);
    setDriverBehaviourFilters([]);
    setELockFilters([]);
    setDashCamFilters([]);
  };

  const baseFleetOverView = [
    {
      title: "Enroute Halt Alerts",
      count: calculatedCounts.enrouteHaltCount,
      bgColor: "#FFC9C9D4",
      lineColor: "#FF8F8F",
      sub: "Total Vehicle",
      vehCount: calculatedCounts.totalVehicles,
      vehicles: categorizedAlerts.enrouteHalt,
      remarkCount: 3,
    },
    {
      title: "Vehicle Health Alerts",
      count: calculatedCounts.vehicleHealthCount,
      bgColor: "#FFF7D4",
      lineColor: "#FFE67C",
      sub: "Total OBD Vehicle",
      vehCount: calculatedCounts.fuelEnabledVehicles,
      vehicles: categorizedAlerts.vehicleHealth,
      remarkCount: 5,
    },
    {
      title: "Driver Behaviour",
      count: calculatedCounts.driverBehaviourCount,
      bgColor: "#D3F9D8",
      lineColor: "#7BF78B",
      sub: "Total Vehicle",
      vehCount: calculatedCounts.totalVehicles,
      vehicles: categorizedAlerts.driverBehaviour,
      remarkCount: 2,
    },
    {
      title: "Lesser KM / Day",
      count: calculatedCounts.lessKmCount,
      bgColor: "#D0EBFF",
      lineColor: "#7CBDED",
      sub: "Total Vehicle",
      vehCount: calculatedCounts.totalVehicles,
      vehicles: categorizedAlerts.lesserKm,
      remarkCount: 7,
    },
    {
      title: "Geofence Halt Alerts",
      count: calculatedCounts.geofenceHaltCount,
      bgColor: "#DAF3FF",
      lineColor: "#A1DCF8",
      sub: "Total Vehicle",
      vehCount: calculatedCounts.totalVehicles,
      vehicles: categorizedAlerts.geofenceHalt,
      remarkCount: 1,
    },
    {
      title: "E-Lock Alerts",
      count: calculatedCounts.lockAlertsCount,
      bgColor: "#F4DFFF",
      lineColor: "#DEAFF6",
      sub: "Total Lock Vehicle",
      vehCount: calculatedCounts.lockEnabledVehicles,
      vehicles: categorizedAlerts.eLockAlerts,
      remarkCount: 4,
    },
    {
      title: "Fuel Theft",
      count: 0,
      bgColor: "#FFEBEB",
      lineColor: "#FFAFAF",
      sub: "Total OBD Vehicle",
      vehCount: calculatedCounts.fuelEnabledVehicles,
      vehicles: categorizedAlerts.fuelTheft,
      remarkCount: 0,
    },
    {
      title: "Dash Cam Alerts",
      count: calculatedCounts.dashcamVideoAlertsCount,
      bgColor: "#ECFFD6",
      lineColor: "#C3F985",
      sub: "Total Dash Cam Vehicle",
      vehCount: calculatedCounts.dashcamEnabledVehicles,
      vehicles: categorizedAlerts.dashCamAlerts,
      remarkCount: 6,
    },
  ];

  // Add user-specific alerts for user 81707
  const userSpecificAlerts =
    Number(userId) === 81707
      ? [
          {
            title: "Geofence Exit Alerts",
            count: calculatedCounts.geofenceExitAlertsCount,
            bgColor: "#FDEDED",
            lineColor: "#FF8FB7",
            sub: "Total Vehicle",
            vehCount: calculatedCounts.totalVehicles,
            vehicles: categorizedAlerts.geofenceExitAlerts,
            remarkCount: 8,
          },
          {
            title: "Challan Alerts",
            count: calculatedCounts.challanAlertsCount,
            bgColor: "#FFE5CC",
            lineColor: "#E2A16F",
            sub: "Total Vehicle",
            vehCount: calculatedCounts.totalVehicles,
            vehicles: categorizedAlerts.challanAlerts,
            remarkCount: 0,
          },
        ]
      : [];

  const fleetOverView = [...baseFleetOverView, ...userSpecificAlerts];

  const overviewSummaryPayload = useMemo(() => {
    const formattedDateRange =
      selectedDateRangeDateJs && selectedDateRangeDateJs.length === 2
        ? `${moment(selectedDateRangeDateJs[0]).format("DD MMM YYYY")} - ${moment(
            selectedDateRangeDateJs[1],
          ).format("DD MMM YYYY")}`
        : "Current alert snapshot";

    const categories = fleetOverView.map((item) =>
      buildSummaryCategoryPayload({
        title: item.title,
        alerts: (item.vehicles || []) as AlertRecord[],
        vehicleCount: item.vehCount,
        coverageLabel: item.sub,
      }),
    );

    const totalOpenAlerts = categories.reduce(
      (total, category) => total + category.count,
      0,
    );

    return {
      generatedAt: moment().toISOString(),
      reportName: "Overview Alert Summary",
      dateRange: formattedDateRange,
      totals: {
        totalVehicles: calculatedCounts.totalVehicles,
        fuelEnabledVehicles: calculatedCounts.fuelEnabledVehicles,
        lockEnabledVehicles: calculatedCounts.lockEnabledVehicles,
        dashcamEnabledVehicles: calculatedCounts.dashcamEnabledVehicles,
        activeCategories: categories.filter((category) => category.count > 0)
          .length,
        totalOpenAlerts,
      },
      categories,
    };
  }, [selectedDateRangeDateJs, fleetOverView, calculatedCounts]);

  const summaryCategoryColors = useMemo(() => {
    return fleetOverView.reduce(
      (accumulator, item) => {
        accumulator[item.title] = item.lineColor;
        return accumulator;
      },
      {} as Record<string, string>,
    );
  }, [fleetOverView]);

  return (
    <div className="">
      <div className="mb-5">
        <div className="grid grid-cols-4 gap-5">
          {fleetOverView
            .slice(0, 4)
            .map(
              (
                {
                  title,
                  bgColor,
                  count,
                  lineColor,
                  sub,
                  vehCount,
                  vehicles,
                  remarkCount,
                },
                index,
              ) => (
                <AlertCard
                  key={index}
                  title={title}
                  count={count}
                  bgColor={bgColor}
                  lineColor={lineColor}
                  sub={sub}
                  vehCount={vehCount}
                  vehicles={vehicles}
                  alertsLoading={alertsLoading}
                  remarkCount={remarkCount}
                  onClick={() =>
                    handleCardClick({
                      title,
                      count,
                      sub,
                      vehCount,
                      bgColor,
                      lineColor,
                      vehicles,
                    })
                  }
                />
              ),
            )}
        </div>
      </div>

      <div className="">
        <div className="grid grid-cols-4 gap-5">
          {fleetOverView
            .slice(4, 10)
            .map(
              (
                {
                  title,
                  bgColor,
                  count,
                  lineColor,
                  sub,
                  vehCount,
                  vehicles,
                  remarkCount,
                },
                index,
              ) => (
                <AlertCard
                  key={index}
                  title={title}
                  count={count}
                  bgColor={bgColor}
                  lineColor={lineColor}
                  sub={sub}
                  vehCount={vehCount}
                  vehicles={vehicles}
                  alertsLoading={alertsLoading}
                  remarkCount={remarkCount}
                  onClick={() =>
                    handleCardClick({
                      title,
                      count,
                      sub,
                      vehCount,
                      bgColor,
                      lineColor,
                      vehicles,
                    })
                  }
                />
              ),
            )}
        </div>
      </div>

      <Modal
        title={null}
        open={modalOpen}
        onCancel={handleModalClose}
        footer={null}
        width="96%"
        style={{ maxWidth: 1250, maxHeight: "95vh" }}
        styles={{
          body: {
            maxHeight: "calc(95vh - 120px)",
            overflowY: "auto",
            padding: "0px",
          },
          mask: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        }}
        centered
        closable={false}
      >
        {selectedItem && (
          <div className="h-full flex flex-col">
            <div className="sticky top-0 z-10 bg-white p-1 border-b border-gray-200">
              <ModalHeader
                selectedItem={selectedItem}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onExport={handleExport}
                onClose={handleModalClose}
              />

              <div className="flex items-center justify-between mb-1 px-4">
                <div className="flex items-center gap-6 my-3">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center mr-3">
                        <span className="text-orange-600 text-xs">⚠</span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600">
                          Alert Count
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedItem.count}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mr-3">
                        <TruckFilled className="text-gray-600 text-xs" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600">
                          {selectedItem.sub}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedItem.vehCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  {selectedItem.title === "Vehicle Health Alerts" &&
                    selectedItem.vehicles &&
                    selectedItem.vehicles.length > 0 && (
                      <ReusableAlertPieChart
                        data={selectedItem.vehicles}
                        processData={processVehicleHealthData}
                        width={180}
                        height={140}
                        innerRadius={35}
                        outerRadius={60}
                        showLegend={true}
                        legendPosition="right"
                        tooltipFormatter={(value, name) => [
                          `${value} alerts`,
                          name,
                        ]}
                        onLegendClick={(name) =>
                          handleLegendClick(
                            name,
                            vehicleHealthFilters,
                            setVehicleHealthFilters,
                          )
                        }
                        selectedFilters={vehicleHealthFilters}
                      />
                    )}

                  {selectedItem.title === "Driver Behaviour" &&
                    selectedItem.vehicles &&
                    selectedItem.vehicles.length > 0 && (
                      <ReusableAlertPieChart
                        data={selectedItem.vehicles}
                        processData={processDriverBehaviourData}
                        width={180}
                        height={140}
                        innerRadius={35}
                        outerRadius={60}
                        showLegend={true}
                        legendPosition="right"
                        tooltipFormatter={(value, name) => [
                          `${value} alerts`,
                          name,
                        ]}
                        onLegendClick={(name) =>
                          handleLegendClick(
                            name,
                            driverBehaviourFilters,
                            setDriverBehaviourFilters,
                          )
                        }
                        selectedFilters={driverBehaviourFilters}
                      />
                    )}

                  {selectedItem.title === "E-Lock Alerts" &&
                    selectedItem.vehicles &&
                    selectedItem.vehicles.length > 0 && (
                      <ReusableAlertPieChart
                        data={selectedItem.vehicles}
                        processData={processELockAlertsData}
                        width={180}
                        height={140}
                        innerRadius={35}
                        outerRadius={60}
                        showLegend={true}
                        legendPosition="right"
                        tooltipFormatter={(value, name) => [
                          `${value} alerts`,
                          name,
                        ]}
                        onLegendClick={(name) =>
                          handleLegendClick(name, eLockFilters, setELockFilters)
                        }
                        selectedFilters={eLockFilters}
                      />
                    )}

                  {selectedItem.title === "Dash Cam Alerts" &&
                    selectedItem.vehicles &&
                    selectedItem.vehicles.length > 0 && (
                      <ReusableAlertPieChart
                        data={selectedItem.vehicles}
                        processData={processApiDashCamAlertsData}
                        width={180}
                        height={140}
                        innerRadius={35}
                        outerRadius={60}
                        showLegend={true}
                        legendPosition="right"
                        tooltipFormatter={(value, name) => [
                          `${value} alerts`,
                          name,
                        ]}
                        onLegendClick={(name) =>
                          handleLegendClick(
                            name,
                            dashCamFilters,
                            setDashCamFilters,
                          )
                        }
                        selectedFilters={dashCamFilters}
                      />
                    )}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-2">
              {/* Table View */}
              <div className="bg-white">
                <h3 className="text-base font-medium text-gray-800 mb-4">
                  {selectedItem.title === "Enroute Halt Alerts" ||
                  selectedItem.title === "Lesser KM / Day" ||
                  selectedItem.title === "Geofence Halt Alerts"
                    ? "Vehicle List"
                    : "Alert List"}
                </h3>
                <div>
                  {selectedItem.vehicles && selectedItem.vehicles.length > 0 ? (
                    (() => {
                      let columns: any[] = [];
                      let dataSource: any[] = [];

                      if (selectedItem.title === "Enroute Halt Alerts") {
                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehicleNumber",
                            key: "vehicleNumber",
                            width: 150,
                            render: (text: string) => (
                              <span className="font-semibold text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Halting Time",
                            dataIndex: "haltingTime",
                            key: "haltingTime",
                            width: 120,
                            render: (text: string) => (
                              <span className="font-semibold text-orange-500 p-1">
                                {text || "N/A"}
                              </span>
                            ),
                          },
                          {
                            title: "Message",
                            dataIndex: "message",
                            key: "message",
                            ellipsis: true,
                            render: (text: string) => (
                              <span className="text-gray-600">{text}</span>
                            ),
                          },
                          {
                            title: "Date Time",
                            dataIndex: "datetime",
                            key: "datetime",
                            width: 180,
                            render: (text: string) => (
                              <span className="text-gray-500 text-sm">
                                {formatTime(text)}
                              </span>
                            ),
                          },
                          {
                            title: "Remarks",
                            key: "remarks",
                            width: 180,
                            render: (_: any, record: any) => {
                              const commentKey = `${record.alertId}-${record.vehicleNumber}`;
                              return (
                                <RemarkCell
                                  commentKey={commentKey}
                                  commentInputs={commentInputs}
                                  setCommentInputs={setCommentInputs}
                                  activeCommentInput={activeCommentInput}
                                  setActiveCommentInput={setActiveCommentInput}
                                  isLoading={commentLoading[commentKey]}
                                  onSubmit={() =>
                                    handleEnrouteHaltCommentSubmit(
                                      record.alertId,
                                      record.vehicleNumber,
                                      commentInputs[commentKey],
                                      record.serviceId,
                                      record.alertType,
                                    )
                                  }
                                />
                              );
                            },
                          },
                        ];

                        dataSource = filterVehiclesBySearch(
                          selectedItem.vehicles as any[],
                          searchTerm,
                        ).map((alert, index) => ({
                          key: alert.alert_id || index,
                          alertId: alert.alert_id || "N/A",
                          vehicleNumber: alert.vehicleno || "Unknown Vehicle",
                          haltingTime: alert.issue || "N/A",
                          message: alert.msg || "No Message",
                          datetime: alert.datetime || "No Date",
                          serviceId: alert.sys_service_id || "0",
                          alertType: alert.alert_type || "Enroute Halt Alert",
                        }));
                      } else if (selectedItem.title === "Lesser KM / Day") {
                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehReg",
                            key: "vehReg",
                            width: 200,
                            render: (text: string) => (
                              <span className="font-semibold text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Description",
                            dataIndex: "description",
                            key: "description",
                            width: 500,
                            ellipsis: true,
                            render: (text: string) => (
                              <span className="text-gray-600">{text}</span>
                            ),
                          },
                          {
                            title: "Actual KM/Day",
                            dataIndex: "actualKm",
                            key: "actualKm",
                            width: 130,
                            render: (text: number) => (
                              <span className="font-semibold text-blue-500">
                                {text ? `${Math.round(text)} km` : "-"}
                              </span>
                            ),
                          },
                          {
                            title: "Remarks",
                            dataIndex: "remarks",
                            key: "remarks",
                            width: 300,
                            render: (text: string, record: any) => {
                              const commentKey = `${record.key}-${record.vehReg}`;

                              if (text && text.trim()) {
                                return (
                                  <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                                    {text}
                                  </span>
                                );
                              }

                              return (
                                <RemarkCell
                                  commentKey={commentKey}
                                  commentInputs={commentInputs}
                                  setCommentInputs={setCommentInputs}
                                  activeCommentInput={activeCommentInput}
                                  setActiveCommentInput={setActiveCommentInput}
                                  isLoading={commentLoading[commentKey]}
                                  onSubmit={() =>
                                    handleLesserKmCommentSubmit(
                                      record.key,
                                      record.vehReg,
                                      commentInputs[commentKey],
                                      record.vehId,
                                      record.alertType,
                                    )
                                  }
                                />
                              );
                            },
                          },
                        ];

                        dataSource = filterVehiclesBySearch(
                          selectedItem.vehicles as any[],
                          searchTerm,
                        ).map((alert, index) => ({
                          key: alert.alert_id || index,
                          vehReg: alert.vehicleno || "Unknown Vehicle",
                          description: alert.msg || "No description",
                          actualKm: parseFloat(alert.issue) || 0,
                          datetime: alert.datetime || "No date",
                          vehId: alert.sys_service_id || "0",
                          remarks: alert.remark || "",
                          alertType: alert.alert_type || "Lesser KM/Day",
                        }));
                      } else if (selectedItem.title === "E-Lock Alerts") {
                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehNo",
                            key: "vehNo",
                            width: 150,
                            render: (text: string) => (
                              <span className="font-semibold text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Alert Type",
                            dataIndex: "alertType",
                            key: "alertType",
                            width: 150,
                            render: (text: string) => (
                              <span className="text-purple-600 font-medium">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Message",
                            dataIndex: "message",
                            key: "message",
                            ellipsis: true,
                            render: (text: string) => (
                              <span className="text-gray-600">{text}</span>
                            ),
                          },
                          {
                            title: "Date Time",
                            dataIndex: "datetime",
                            key: "datetime",
                            width: 180,
                            render: (text: string) => (
                              <span className="text-gray-500 text-sm">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Remarks",
                            key: "Remarks",
                            width: 250,
                            render: (text: string, record: any) => {
                              const commentKey = `${record.alertId}-${record.vehNo}`;
                              return (
                                <RemarkCell
                                  commentKey={commentKey}
                                  commentInputs={commentInputs}
                                  setCommentInputs={setCommentInputs}
                                  activeCommentInput={activeCommentInput}
                                  setActiveCommentInput={setActiveCommentInput}
                                  isLoading={commentLoading[commentKey]}
                                  onSubmit={() =>
                                    handleCommentSubmit(
                                      record.alertId,
                                      record.vehNo,
                                      "E-Lock Alerts",
                                      record.vehicleId,
                                      record.alertType,
                                    )
                                  }
                                />
                              );
                            },
                          },
                        ];

                        let baseAlerts = filterVehiclesBySearch(
                          selectedItem.vehicles as any[],
                          searchTerm,
                        );

                        // Apply legend filter if any filters are selected
                        if (eLockFilters.length > 0) {
                          baseAlerts = baseAlerts.filter((alert: any) => {
                            const alertType =
                              alert.alert_type || alert.message || "Lock Alert";
                            return eLockFilters.includes(alertType);
                          });
                        }

                        dataSource = baseAlerts.map((alert, index) => ({
                          key: index,
                          vehNo:
                            alert.vehicleno ||
                            alert.vehicle_no ||
                            alert.vehicleNumber ||
                            "Unknown Vehicle",
                          alertType:
                            alert.alert_type || alert.message || "Lock Alert",
                          message:
                            alert.msg ||
                            alert.location ||
                            alert.address ||
                            "No Message",
                          datetime:
                            alert.datetime ||
                            alert.timestamp ||
                            alert.time ||
                            alert.date ||
                            "No Time",
                          alertId:
                            alert.alert_id || alert.id || index.toString(),
                          vehicleId:
                            alert.sys_service_id || alert.veh_id || "0",
                        }));
                      } else if (
                        selectedItem.title === "Geofence Halt Alerts"
                      ) {
                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehicleNumber",
                            key: "vehicleNumber",
                            width: 150,
                            render: (text: string) => (
                              <span className="font-semibold text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Halting Time",
                            dataIndex: "haltingTime",
                            key: "haltingTime",
                            width: 120,
                            render: (text: string) => (
                              <span className="font-semibold text-purple-600 p-1">
                                {text || "N/A"}
                              </span>
                            ),
                          },
                          {
                            title: "Message",
                            dataIndex: "message",
                            key: "message",
                            ellipsis: true,
                            render: (text: string) => (
                              <span className="text-gray-600 font-medium">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Date Time",
                            dataIndex: "datetime",
                            key: "datetime",
                            width: 180,
                            render: (text: string) => (
                              <span className="text-gray-500 text-sm">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Remarks",
                            key: "remarks",
                            width: 180,
                            render: (_: any, record: any) => {
                              const commentKey = `${record.key}-${record.vehicleNumber}`;
                              return (
                                <RemarkCell
                                  commentKey={commentKey}
                                  commentInputs={commentInputs}
                                  setCommentInputs={setCommentInputs}
                                  activeCommentInput={activeCommentInput}
                                  setActiveCommentInput={setActiveCommentInput}
                                  isLoading={commentLoading[commentKey]}
                                  onSubmit={() =>
                                    handleGeofenceHaltCommentSubmit(
                                      record.key,
                                      record.vehicleNumber,
                                      commentInputs[commentKey],
                                      record.serviceId,
                                      record.alertType,
                                    )
                                  }
                                />
                              );
                            },
                          },
                        ];

                        dataSource = filterVehiclesBySearch(
                          selectedItem.vehicles as any[],
                          searchTerm,
                        ).map((alert, index) => ({
                          key: alert.alert_id || index,
                          vehicleNumber: alert.vehicleno || "Unknown Vehicle",
                          haltingTime: alert.issue || "N/A",
                          message: alert.msg || "No Message",
                          datetime: alert.datetime || "No Date",
                          serviceId: alert.sys_service_id || "0",
                          alertType: alert.alert_type || "Geofence Halt Alert",
                        }));
                      } else if (
                        selectedItem.title === "Geofence Exit Alerts"
                      ) {
                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehicleNumber",
                            key: "vehicleNumber",
                            width: 120,
                            render: (text: string) => (
                              <span className="font-semibold text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Alert Type",
                            dataIndex: "alertType",
                            key: "alertType",
                            width: 120,
                            render: (text: string) => (
                              <span className="font-semibold text-pink-600  rounded">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Message",
                            dataIndex: "message",
                            key: "message",
                            ellipsis: true,
                            render: (text: string) => (
                              <span className="text-gray-600">{text}</span>
                            ),
                          },
                          {
                            title: "Date Time",
                            dataIndex: "datetime",
                            key: "datetime",
                            width: 180,
                            render: (text: string) => (
                              <span className="text-gray-500 text-sm">
                                {formatTime(text)}
                              </span>
                            ),
                          },
                          {
                            title: "Remarks",
                            key: "remarks",
                            width: 180,
                            render: (_: any, record: any) => {
                              const commentKey = `${record.key}-${record.vehicleNumber}`;
                              return (
                                <RemarkCell
                                  commentKey={commentKey}
                                  commentInputs={commentInputs}
                                  setCommentInputs={setCommentInputs}
                                  activeCommentInput={activeCommentInput}
                                  setActiveCommentInput={setActiveCommentInput}
                                  isLoading={commentLoading[commentKey]}
                                  onSubmit={() =>
                                    handleGeofenceExitCommentSubmit(
                                      record.key,
                                      record.vehicleNumber,
                                      commentInputs[commentKey] || "",
                                      record.serviceId,
                                      record.alertType,
                                    )
                                  }
                                />
                              );
                            },
                          },
                        ];

                        dataSource = filterVehiclesBySearch(
                          selectedItem.vehicles as any[],
                          searchTerm,
                        ).map((alert, index) => ({
                          key: alert.alert_id || index,
                          vehicleNumber: alert.vehicleno || "Unknown Vehicle",
                          alertType: alert.alert_type || "Geofence Alert",
                          message: alert.msg || "No Message",
                          datetime: alert.datetime || "No Date",
                          serviceId: alert.sys_service_id || "0",
                        }));
                      } else if (
                        selectedItem.title === "Vehicle Health Alerts"
                      ) {
                        // Group alerts by vehicle
                        const groupedHealthAlerts = (
                          selectedItem.vehicles as any[]
                        ).reduce((acc: any, alert: any) => {
                          const vehicleNo =
                            alert.vehicleno || "Unknown Vehicle";
                          if (!acc[vehicleNo]) {
                            acc[vehicleNo] = [];
                          }
                          acc[vehicleNo].push(alert);
                          return acc;
                        }, {});

                        // Filter grouped data by search term
                        const filteredGroupedHealthAlerts = Object.keys(
                          groupedHealthAlerts,
                        )
                          .filter(
                            (vehicleNo) =>
                              !searchTerm.trim() ||
                              vehicleNo
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase().trim()),
                          )
                          .reduce((acc: any, vehicleNo: string) => {
                            acc[vehicleNo] = groupedHealthAlerts[vehicleNo];
                            return acc;
                          }, {});

                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehicleNo",
                            key: "vehicleNo",
                            width: 200,
                            render: (text: string) => (
                              <span className="font-medium text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Total Alerts",
                            dataIndex: "totalAlerts",
                            key: "totalAlerts",
                            width: 120,
                            sorter: (a: any, b: any) =>
                              a.totalAlerts - b.totalAlerts,
                            render: (text: number) => (
                              <span className="font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Alert Distribution",
                            dataIndex: "alertDistribution",
                            key: "alertDistribution",
                            width: 200,
                            render: (alertTypes: any) => {
                              const data = Object.entries(alertTypes).map(
                                ([type, count]: [string, any]) => ({
                                  name: type.toUpperCase(),
                                  value: count,
                                  color:
                                    getConsistentVehicleHealthAlertTypeColor(
                                      type.toUpperCase(),
                                    ),
                                }),
                              );

                              return (
                                <div style={{ width: 120, height: 60 }}>
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <PieChart>
                                      <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={15}
                                        outerRadius={25}
                                        paddingAngle={2}
                                        dataKey="value"
                                      >
                                        {data.map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        formatter={(value: any, name: any) => [
                                          value,
                                          name,
                                        ]}
                                        contentStyle={{ fontSize: "12px" }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            },
                          },
                          {
                            title: "Actions",
                            key: "actions",
                            width: 80,
                            render: (_: any, record: any) => (
                              <Button
                                type="text"
                                icon={
                                  expandedRows.includes(record.key) ? (
                                    <UpOutlined />
                                  ) : (
                                    <DownOutlined />
                                  )
                                }
                                onClick={() => {
                                  const newExpandedRows = expandedRows.includes(
                                    record.key,
                                  )
                                    ? expandedRows.filter(
                                        (key) => key !== record.key,
                                      )
                                    : [...expandedRows, record.key];
                                  setExpandedRows(newExpandedRows);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              />
                            ),
                          },
                        ];

                        dataSource = Object.entries(filteredGroupedHealthAlerts)
                          .map(([vehicleNo, alerts]: [string, any]) => {
                            // Filter alerts by selected legend filters
                            let filteredAlerts = alerts;
                            if (vehicleHealthFilters.length > 0) {
                              filteredAlerts = alerts.filter((alert: any) => {
                                const parsedData = parseVehicleHealthMessage(
                                  alert.msg || "",
                                );
                                const alertType =
                                  parsedData.category.toUpperCase();
                                return vehicleHealthFilters.includes(alertType);
                              });
                            }

                            // Count alert types for this vehicle using parsed message data
                            const alertTypeCounts = filteredAlerts.reduce(
                              (acc: any, alert: any) => {
                                // Parse the message to get the category
                                const parsedData = parseVehicleHealthMessage(
                                  alert.msg || "",
                                );
                                const alertType =
                                  parsedData.category.toUpperCase();
                                acc[alertType] = (acc[alertType] || 0) + 1;
                                return acc;
                              },
                              {},
                            );

                            return {
                              key: vehicleNo,
                              vehicleNo,
                              totalAlerts: filteredAlerts.length,
                              alertDistribution: alertTypeCounts,
                              alerts: filteredAlerts, // Store filtered alerts for expansion
                            };
                          })
                          .filter((vehicle) => vehicle.totalAlerts > 0);
                      } else if (selectedItem.title === "Dash Cam Alerts") {
                        const groupedDashCamAlerts = (
                          selectedItem.vehicles as any[]
                        ).reduce((acc: any, alert: any) => {
                          const vehicleNo =
                            alert.vehicleno || "Unknown Vehicle";
                          if (!acc[vehicleNo]) {
                            acc[vehicleNo] = [];
                          }
                          acc[vehicleNo].push(alert);
                          return acc;
                        }, {});

                        const filteredGroupedDashCamAlerts = Object.keys(
                          groupedDashCamAlerts,
                        )
                          .filter(
                            (vehicleNo) =>
                              !searchTerm.trim() ||
                              vehicleNo
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase().trim()),
                          )
                          .reduce((acc: any, vehicleNo: string) => {
                            acc[vehicleNo] = groupedDashCamAlerts[vehicleNo];
                            return acc;
                          }, {});

                        columns = [
                          {
                            title: "Vehicle Number",
                            dataIndex: "vehicleNo",
                            key: "vehicleNo",
                            width: 200,
                            render: (text: string) => (
                              <span className="font-medium text-gray-800">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Total Alerts",
                            dataIndex: "totalAlerts",
                            key: "totalAlerts",
                            width: 120,
                            sorter: (a: any, b: any) =>
                              a.totalAlerts - b.totalAlerts,
                            render: (text: number) => (
                              <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                {text}
                              </span>
                            ),
                          },
                          {
                            title: "Alert Distribution",
                            dataIndex: "alertDistribution",
                            key: "alertDistribution",
                            width: 200,
                            render: (alertTypes: any) => {
                              const data = Object.entries(alertTypes).map(
                                ([type, count]: [string, any]) => ({
                                  name: type,
                                  value: count,
                                  color: getConsistentVideoAlertTypeColor(type),
                                }),
                              );

                              return (
                                <div style={{ width: 120, height: 60 }}>
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <PieChart>
                                      <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={15}
                                        outerRadius={25}
                                        paddingAngle={2}
                                        dataKey="value"
                                      >
                                        {data.map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        formatter={(value: any, name: any) => [
                                          value,
                                          name,
                                        ]}
                                        contentStyle={{ fontSize: "12px" }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            },
                          },
                          {
                            title: "Actions",
                            key: "actions",
                            width: 80,
                            render: (_: any, record: any) => (
                              <Button
                                type="text"
                                icon={
                                  expandedRows.includes(record.key) ? (
                                    <UpOutlined />
                                  ) : (
                                    <DownOutlined />
                                  )
                                }
                                onClick={() => {
                                  const newExpandedRows = expandedRows.includes(
                                    record.key,
                                  )
                                    ? expandedRows.filter(
                                        (key) => key !== record.key,
                                      )
                                    : [...expandedRows, record.key];
                                  setExpandedRows(newExpandedRows);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              />
                            ),
                          },
                        ];

                        dataSource = Object.entries(
                          filteredGroupedDashCamAlerts,
                        )
                          .map(([vehicleNo, alerts]: [string, any]) => {
                            // Filter alerts by selected legend filters
                            let filteredAlerts = alerts;
                            if (dashCamFilters.length > 0) {
                              //just changed this
                              filteredAlerts = alerts.filter((alert: any) => {
                                const alertType = (
                                  alert.alert_type || "Unknown"
                                ).toLowerCase();

                                return dashCamFilters
                                  .map((f) => f.toLowerCase())
                                  .includes(alertType);
                              });
                            }

                            const alertTypeCounts = filteredAlerts.reduce(
                              (acc: any, alert: any) => {
                                const alertType = alert.alert_type || "Unknown";
                                acc[alertType] = (acc[alertType] || 0) + 1;
                                return acc;
                              },
                              {},
                            );

                            return {
                              key: vehicleNo,
                              vehicleNo,
                              totalAlerts: filteredAlerts.length,
                              alertDistribution: alertTypeCounts,
                              alerts: filteredAlerts,
                            };
                          })
                          .filter((vehicle) => vehicle.totalAlerts > 0);
                      } else {
                        if (selectedItem.title === "Driver Behaviour") {
                          const groupedAlerts = (
                            selectedItem.vehicles as any[]
                          ).reduce((acc: any, alert: any) => {
                            const vehicleNo =
                              alert.vehicleno || "Unknown Vehicle";
                            if (!acc[vehicleNo]) {
                              acc[vehicleNo] = [];
                            }
                            acc[vehicleNo].push(alert);
                            return acc;
                          }, {});

                          const filteredGroupedAlerts = Object.keys(
                            groupedAlerts,
                          )
                            .filter(
                              (vehicleNo) =>
                                !searchTerm.trim() ||
                                vehicleNo
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase().trim()),
                            )
                            .reduce((acc: any, vehicleNo: string) => {
                              acc[vehicleNo] = groupedAlerts[vehicleNo];
                              return acc;
                            }, {});

                          columns = [
                            {
                              title: "Vehicle Number",
                              dataIndex: "vehicleNo",
                              key: "vehicleNo",
                              width: 200,
                              render: (text: string) => (
                                <span className="font-medium text-gray-800">
                                  {text}
                                </span>
                              ),
                            },
                            {
                              title: "Total Alerts",
                              dataIndex: "totalAlerts",
                              key: "totalAlerts",
                              width: 120,
                              sorter: (a: any, b: any) =>
                                a.totalAlerts - b.totalAlerts,
                              render: (text: number) => (
                                <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                  {text}
                                </span>
                              ),
                            },
                            {
                              title: "Alert Distribution",
                              dataIndex: "alertDistribution",
                              key: "alertDistribution",
                              width: 200,
                              render: (alertTypes: any) => {
                                const data = Object.entries(alertTypes).map(
                                  ([type, count]: [string, any]) => ({
                                    name: type,
                                    value: count,
                                    color:
                                      getConsistentDriverBehaviourAlertTypeColor(
                                        type,
                                      ),
                                  }),
                                );

                                return (
                                  <div style={{ width: 120, height: 60 }}>
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <PieChart>
                                        <Pie
                                          data={data}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={15}
                                          outerRadius={25}
                                          paddingAngle={2}
                                          dataKey="value"
                                        >
                                          {data.map((entry, index) => (
                                            <Cell
                                              key={`cell-${index}`}
                                              fill={entry.color}
                                            />
                                          ))}
                                        </Pie>
                                        <Tooltip
                                          formatter={(
                                            value: any,
                                            name: any,
                                          ) => [value, name]}
                                          contentStyle={{ fontSize: "12px" }}
                                        />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                );
                              },
                            },
                            {
                              title: "Actions",
                              key: "actions",
                              width: 80,
                              render: (_: any, record: any) => (
                                <Button
                                  type="text"
                                  icon={
                                    expandedRows.includes(record.key) ? (
                                      <UpOutlined />
                                    ) : (
                                      <DownOutlined />
                                    )
                                  }
                                  onClick={() => {
                                    const newExpandedRows =
                                      expandedRows.includes(record.key)
                                        ? expandedRows.filter(
                                            (key) => key !== record.key,
                                          )
                                        : [...expandedRows, record.key];
                                    setExpandedRows(newExpandedRows);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                />
                              ),
                            },
                          ];

                          dataSource = Object.entries(filteredGroupedAlerts)
                            .map(([vehicleNo, alerts]: [string, any]) => {
                              // Filter alerts by selected legend filters
                              let filteredAlerts = alerts;
                              if (driverBehaviourFilters.length > 0) {
                                filteredAlerts = alerts.filter((alert: any) => {
                                  const alertType =
                                    alert.alert_type || "Unknown";
                                  return driverBehaviourFilters.includes(
                                    alertType,
                                  );
                                });
                              }

                              // Count alert types for this vehicle
                              const alertTypeCounts = filteredAlerts.reduce(
                                (acc: any, alert: any) => {
                                  const alertType =
                                    alert.alert_type || "Unknown";
                                  acc[alertType] = (acc[alertType] || 0) + 1;
                                  return acc;
                                },
                                {},
                              );

                              return {
                                key: vehicleNo,
                                vehicleNo,
                                totalAlerts: filteredAlerts.length,
                                alertDistribution: alertTypeCounts,
                                alerts: filteredAlerts, // Store filtered alerts for expansion
                              };
                            })
                            .filter((vehicle) => vehicle.totalAlerts > 0);
                        } else {
                          // Other alert types (non-Driver Behaviour)
                          columns = [
                            {
                              title: "Vehicle Number",
                              dataIndex: "vehicleNo",
                              key: "vehicleNo",
                              width: 150,
                              render: (text: string) => (
                                <span className="font-semibold text-blue-600">
                                  {text}
                                </span>
                              ),
                            },
                            {
                              title: "Alert Type",
                              dataIndex: "alert_type",
                              key: "alertType",
                              width: 150,
                              render: (text: string) => (
                                <Tag color="orange" className="text-xs">
                                  {text}
                                </Tag>
                              ),
                            },
                            {
                              title: "Message",
                              dataIndex: "message",
                              key: "message",
                              ellipsis: true,
                              render: (text: string) => (
                                <span className="text-gray-600">{text}</span>
                              ),
                            },
                            {
                              title: "Date Time",
                              dataIndex: "datetime",
                              key: "datetime",
                              width: 180,
                              render: (text: string) => (
                                <span className="text-gray-500 text-sm">
                                  {text}
                                </span>
                              ),
                            },
                          ];

                          dataSource = filterVehiclesBySearch(
                            selectedItem.vehicles as any[],
                            searchTerm,
                          ).map((alert, index) => ({
                            key: index,
                            alertId: alert.alert_id || "N/A",
                            vehicleNo: alert.vehicleno || "Unknown Vehicle",
                            alert_type: alert.alert_type || "Unknown Alert",
                            message: alert.msg || "No message",
                            datetime: alert.datetime || "No time",
                          }));
                        }
                      }

                      return (
                        <Table
                          columns={columns}
                          dataSource={dataSource}
                          pagination={{
                            current: currentPage,
                            pageSize: 10,
                            showSizeChanger: false,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                              `${range[0]}-${range[1]} of ${total} items`,
                            onChange: (page) => {
                              setCurrentPage(page);
                              setTimeout(() => {
                                const modalBody =
                                  document.querySelector(".ant-modal-body");
                                if (modalBody) {
                                  modalBody.scrollTop = 0;
                                }
                              }, 100);
                            },
                          }}
                          size="small"
                          className="ant-table-striped"
                          rowClassName={(record, index) =>
                            index % 2 === 0
                              ? "table-row-light"
                              : "table-row-dark"
                          }
                          expandable={
                            selectedItem.title === "Driver Behaviour" ||
                            selectedItem.title === "Dash Cam Alerts" ||
                            selectedItem.title === "Vehicle Health Alerts"
                              ? {
                                  expandedRowKeys: expandedRows,
                                  onExpand: (expanded, record) => {
                                    const newExpandedRows = expanded
                                      ? [...expandedRows, record.key]
                                      : expandedRows.filter(
                                          (key) => key !== record.key,
                                        );
                                    setExpandedRows(newExpandedRows);
                                  },
                                  expandedRowRender: (record) => {
                                    const alerts = record.alerts || [];

                                    // Define columns based on alert type
                                    let expandedColumns: any[] = [];
                                    let expandedDataSource: any[] = [];

                                    if (
                                      selectedItem.title === "Driver Behaviour"
                                    ) {
                                      expandedColumns = [
                                        {
                                          title: "Vehicle Number",
                                          dataIndex: "vehNo",
                                          key: "vehNo",
                                          width: 150,
                                          render: (text: string) => (
                                            <span className="font-medium text-blue-600">
                                              {text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Alert Type",
                                          dataIndex: "alertType",
                                          key: "alertType",
                                          width: 150,
                                          render: (text: string) => (
                                            <Tag
                                              color="orange"
                                              className="text-xs"
                                            >
                                              {text}
                                            </Tag>
                                          ),
                                        },
                                        {
                                          title: "Message",
                                          dataIndex: "message",
                                          key: "message",
                                          ellipsis: true,
                                          render: (text: string) => (
                                            <span className="text-gray-600">
                                              {text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Date Time",
                                          dataIndex: "datetime",
                                          key: "datetime",
                                          width: 180,
                                          render: (text: string) => (
                                            <span className="text-gray-500 text-xs">
                                              {text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Remarks",
                                          key: "remarks",
                                          width: 250,
                                          render: (
                                            text: string,
                                            record: any,
                                          ) => {
                                            const commentKey = `${record.alertId}-${record.vehNo}`;
                                            return (
                                              <RemarkCell
                                                commentKey={commentKey}
                                                commentInputs={commentInputs}
                                                setCommentInputs={
                                                  setCommentInputs
                                                }
                                                activeCommentInput={
                                                  activeCommentInput
                                                }
                                                setActiveCommentInput={
                                                  setActiveCommentInput
                                                }
                                                isLoading={
                                                  commentLoading[commentKey]
                                                }
                                                onSubmit={() =>
                                                  handleCommentSubmit(
                                                    record.alertId,
                                                    record.vehNo,
                                                    "Driver Behaviour",
                                                    record.serviceId,
                                                    record.alertType,
                                                  )
                                                }
                                              />
                                            );
                                          },
                                        },
                                      ];

                                      expandedDataSource = alerts.map(
                                        (alert: any, index: number) => ({
                                          key: `${record.key}-${index}`,
                                          alertId: alert.alert_id || "N/A",
                                          vehNo:
                                            alert.vehicleno ||
                                            "Unknown Vehicle",
                                          alertType:
                                            alert.alert_type || "Alert",
                                          message: alert.msg || "No message",
                                          datetime: alert.datetime || "No Time",
                                          serviceId:
                                            alert.sys_service_id || "0",
                                        }),
                                      );
                                    } else if (
                                      selectedItem.title === "Dash Cam Alerts"
                                    ) {
                                      // Dashcam alerts from alert popup for all users
                                      expandedColumns = [
                                        {
                                          title: "Vehicle Number",
                                          dataIndex: "vehNo",
                                          key: "vehNo",
                                          width: 150,
                                          render: (text: string) => (
                                            <span className="font-medium text-blue-600">
                                              {text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Alert Type",
                                          dataIndex: "alertType",
                                          key: "alertType",
                                          width: 150,
                                          render: (text: string) => (
                                            <Tag
                                              color="green"
                                              className="text-xs"
                                            >
                                              {text}
                                            </Tag>
                                          ),
                                        },
                                        {
                                          title: "Message",
                                          dataIndex: "message",
                                          key: "message",
                                          ellipsis: true,
                                          render: (text: string) => (
                                            <span className="text-gray-600 text-xs">
                                              {text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Time",
                                          dataIndex: "time",
                                          key: "time",
                                          width: 180,
                                          render: (text: string) => (
                                            <span className="text-gray-500 text-xs">
                                              {formatTime(text)}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Remarks",
                                          key: "remarks",
                                          width: 250,
                                          render: (
                                            _: any,
                                            alertRecord: any,
                                          ) => {
                                            const commentKey = `dashcam-${alertRecord.alertId}-${alertRecord.vehNo}`;
                                            return (
                                              <RemarkCell
                                                commentKey={commentKey}
                                                commentInputs={commentInputs}
                                                setCommentInputs={
                                                  setCommentInputs
                                                }
                                                activeCommentInput={
                                                  activeCommentInput
                                                }
                                                setActiveCommentInput={
                                                  setActiveCommentInput
                                                }
                                                isLoading={
                                                  commentLoading[commentKey]
                                                }
                                                onSubmit={() =>
                                                  handleDashCamCommentSubmit(
                                                    alertRecord.alertId,
                                                    alertRecord.vehNo,
                                                    commentInputs[commentKey],
                                                    alertRecord.serviceId ||
                                                      "0",
                                                    alertRecord.alertType,
                                                  )
                                                }
                                              />
                                            );
                                          },
                                        },
                                      ];

                                      expandedDataSource = alerts.map(
                                        (alert: any, index: number) => ({
                                          key: `${record.key}-${index}`,
                                          alertId:
                                            alert.alert_id ||
                                            `${record.key}-${index}`,
                                          vehNo:
                                            alert.vehicleno ||
                                            "Unknown Vehicle",
                                          alertType:
                                            alert.alert_type || "Alert",
                                          message: alert.msg || "No message",
                                          time:
                                            alert.gps_time ||
                                            alert.datetime ||
                                            "No Time",
                                          serviceId:
                                            alert.sys_service_id || "0",
                                        }),
                                      );
                                    } else if (
                                      selectedItem.title ===
                                      "Vehicle Health Alerts"
                                    ) {
                                      expandedColumns = [
                                        {
                                          title: "Vehicle Number",
                                          dataIndex: "vehNo",
                                          key: "vehNo",
                                          width: 150,
                                          render: (text: string) => (
                                            <span className="font-medium text-blue-600">
                                              {text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "SPN Code",
                                          dataIndex: "spnCode",
                                          key: "spnCode",
                                          width: 100,
                                          render: (text: string) => (
                                            <span className="text-blue-600 font-bold text-xs">
                                              #{text}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Category",
                                          dataIndex: "category",
                                          key: "category",
                                          width: 120,
                                          render: (text: string) => (
                                            <Tag
                                              color="orange"
                                              className="text-xs"
                                            >
                                              {text}
                                            </Tag>
                                          ),
                                        },
                                        {
                                          title: "Description",
                                          dataIndex: "description",
                                          key: "description",
                                          ellipsis: true,
                                          render: (text: string) => (
                                            <AntTooltip
                                              title={text}
                                              placement="topLeft"
                                            >
                                              <span className="text-gray-600 text-xs">
                                                {text}
                                              </span>
                                            </AntTooltip>
                                          ),
                                        },
                                        {
                                          title: "Time",
                                          dataIndex: "time",
                                          key: "time",
                                          width: 150,
                                          render: (text: string) => (
                                            <span className="text-gray-500 text-xs">
                                              {formatTime(text)}
                                            </span>
                                          ),
                                        },
                                        {
                                          title: "Remarks",
                                          key: "remarks",
                                          width: 200,
                                          render: (
                                            text: string,
                                            record: any,
                                          ) => {
                                            const commentKey = `${record.key}-${record.vehNo}`;
                                            const isActive =
                                              activeCommentInput === commentKey;
                                            const isLoading =
                                              commentLoading[commentKey];

                                            const alertTimeString =
                                              record.gpsTime || record.time;
                                            const alertTime =
                                              moment(alertTimeString);
                                            const currentTime = moment();
                                            const minutesDiff =
                                              currentTime.diff(
                                                alertTime,
                                                "minutes",
                                              );
                                            const hoursDiff = Math.floor(
                                              minutesDiff / 60,
                                            );

                                            if (
                                              record.remarks &&
                                              record.remarks.trim()
                                            ) {
                                              return (
                                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                                  {record.remarks}
                                                </span>
                                              );
                                            }

                                            if (minutesDiff >= 60) {
                                              return (
                                                <div className="w-full flex justify-center">
                                                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm font-semibold">
                                                    Resolved
                                                  </span>
                                                </div>
                                              );
                                            }

                                            return (
                                              <RemarkCell
                                                commentKey={commentKey}
                                                commentInputs={commentInputs}
                                                setCommentInputs={
                                                  setCommentInputs
                                                }
                                                activeCommentInput={
                                                  activeCommentInput
                                                }
                                                setActiveCommentInput={
                                                  setActiveCommentInput
                                                }
                                                isLoading={
                                                  commentLoading[commentKey]
                                                }
                                                onSubmit={() =>
                                                  handleVehicleHealthCommentSubmit(
                                                    record.key,
                                                    record.vehNo,
                                                    commentInputs[commentKey],
                                                    record.vehId,
                                                    record.alertType,
                                                  )
                                                }
                                              />
                                            );
                                          },
                                        },
                                      ];

                                      expandedDataSource = alerts.map(
                                        (alert: any, index: number) => {
                                          // Parse the vehicle health message
                                          const parsedData =
                                            parseVehicleHealthMessage(
                                              alert.msg || "",
                                            );

                                          return {
                                            key: `${record.key}-${index}`,
                                            vehNo:
                                              alert.vehicleno ||
                                              "Unknown Vehicle",
                                            spnCode: parsedData.spnCode,
                                            category: parsedData.category,
                                            description: parsedData.description,
                                            time:
                                              alert.gps_time ||
                                              alert.datetime ||
                                              "No Time",
                                            gpsTime:
                                              alert.gps_time ||
                                              alert.datetime ||
                                              "No Time",
                                            vehId:
                                              alert.sys_service_id ||
                                              alert.vehicleId ||
                                              alert.service_id ||
                                              alert.vId,
                                            remarks: alert.remark || "",
                                            alertType:
                                              alert.alert_type ||
                                              "Vehicle Health Alert",
                                          };
                                        },
                                      );
                                    }

                                    return (
                                      <div className="px-1 py-1 bg-gray-50">
                                        <Table
                                          columns={expandedColumns}
                                          dataSource={expandedDataSource}
                                          pagination={false}
                                          size="small"
                                          className="-ml-10"
                                        />
                                      </div>
                                    );
                                  },
                                  showExpandColumn: false,
                                }
                              : undefined
                          }
                        />
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500">
                        No{" "}
                        {selectedItem.title === "Enroute Halt Alerts" ||
                        selectedItem.title === "Lesser KM / Day" ||
                        selectedItem.title === "Geofence Halt Alerts"
                          ? "vehicles"
                          : "alerts"}{" "}
                        found for this type.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <AiSummaryModal
        aiSummaryTrigger={aiSummaryTrigger}
        onSummaryLoadingChange={onSummaryLoadingChange}
        overviewSummaryPayload={overviewSummaryPayload}
        categoryColors={summaryCategoryColors}
      />

      <style jsx global>{`
        .ant-table-striped .table-row-light {
          background-color: #fafafa;
        }
        .ant-table-striped .table-row-dark {
          background-color: #ffffff;
        }
        .ant-table-striped .ant-table {
          border: 1px solid #e8e8e8;
          border-radius: 6px;
        }
        .ant-table-small .ant-table-tbody > tr > td {
          padding: 8px 12px;
          border-right: 1px solid #e8e8e8;
          border-bottom: 1px solid #e8e8e8;
        }
        .ant-table-small .ant-table-tbody > tr > td:last-child {
          border-right: none;
        }
        .ant-table-small .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
        .ant-table-striped .ant-table-thead > tr > th {
          background-color: #f1f6fe !important;
          border-bottom: 1px solid #e0e7ff;
          border-right: 1px solid #e8e8e8;
        }
        .ant-table-striped .ant-table-thead > tr > th:last-child {
          border-right: none;
        }
        .nested-table .ant-table {
          background-color: white;
          border: 1px solid #d9d9d9;
        }
        .nested-table .ant-table-thead > tr > th {
          background-color: #f0f0f0 !important;
          font-size: 12px;
          padding: 6px 8px;
        }
        .nested-table .ant-table-tbody > tr > td {
          padding: 6px 8px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ODBDetailsSection;
