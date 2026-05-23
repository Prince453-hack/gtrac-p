import { PieChartData } from "../components/ReusableAlertPieChart";
import { getAlarmName, VideoAlarmType } from "@/app/helpers/getVideoAlertName";

export const processGeofenceHaltData = (vehicles: any[]): PieChartData[] => {
  if (!vehicles || vehicles.length === 0) return [];

  const locationGroups: { [key: string]: number } = {};
  const lightColors = [
    "#B3D9FF",
    "#C7E9C7",
    "#FFE5B3",
    "#FFB3B3",
    "#D9B3FF",
    "#B3F0F0",
    "#FFD4B3",
    "#F5B3E5",
  ];

  vehicles.forEach((vehicle) => {
    const poi = vehicle.gpsDtl?.latLngDtl?.poi || "Unknown Location";
    const formattedLocation = poi.replace(/_/g, " ");
    const shortLocation =
      formattedLocation.length > 15
        ? formattedLocation.substring(0, 15) + "..."
        : formattedLocation;
    locationGroups[shortLocation] = (locationGroups[shortLocation] || 0) + 1;
  });

  const totalCount = Object.values(locationGroups).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Object.entries(locationGroups)
    .map(([location, count], index) => ({
      name: location,
      value: count,
      color: lightColors[index % lightColors.length],
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

export const processVehicleHealthData = (alerts: any[]): PieChartData[] => {
  if (!alerts || alerts.length === 0) return [];

  const categoryGroups: { [key: string]: number } = {};

  alerts.forEach((alert) => {
    const parsedData = parseVehicleHealthMessage(alert.msg || "");
    const category = parsedData.category.toUpperCase();
    categoryGroups[category] = (categoryGroups[category] || 0) + 1;
  });

  const totalCount = Object.values(categoryGroups).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Object.entries(categoryGroups)
    .map(([category, count]) => ({
      name: category,
      value: count,
      color: getConsistentVehicleHealthAlertTypeColor(category),
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

export const parseVehicleHealthMessage = (msg: string) => {
  const defaultReturn = {
    spnCode: "N/A",
    category: "General",
    description: msg || "Vehicle Health Alert",
    time: "N/A",
  };

  if (!msg) return defaultReturn;

  try {
    const pipeSpnMatch = msg.match(/SPN\d*\|(\d+)\|([^|]+)\|([^|.;]+)/i);
    const bracketSpnCodeMatch = msg.match(/SPN\s*:\s*(\d+)/i);
    const bracketSpnDescriptionMatch = msg.match(/SPN\s*:\s*\d+\s*\(([^)]+)\)/i);
    const categoryMatch = msg.match(/Category\s*:\s*([^|.]+)/i);
    const severityMatch = msg.match(/Severity\s*:?\s*([^|.]+)/i);

    const spnCode =
      pipeSpnMatch?.[1]?.trim() || bracketSpnCodeMatch?.[1]?.trim() || "N/A";
    const spnDescription =
      pipeSpnMatch?.[2]?.trim() ||
      bracketSpnDescriptionMatch?.[1]?.trim() ||
      "Vehicle Health Alert";
    const category =
      categoryMatch?.[1]?.trim() || pipeSpnMatch?.[3]?.trim() || "General";
    const severity = severityMatch?.[1]?.trim();

    const description = severity
      ? `${spnDescription} | Error Code : ${spnCode} | Severity : ${severity}`
      : `${spnDescription} | Error Code : ${spnCode}`;

    const timeMatch = msg.match(
      /(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d{3}Z)?)/,
    );
    const time = timeMatch ? timeMatch[1] : "N/A";

    return {
      spnCode,
      category,
      description,
      time,
    };
  } catch (error) {
    console.error("Error parsing vehicle health message:", error);
    return defaultReturn;
  }
};

export const getConsistentDriverBehaviourAlertTypeColor = (
  alertType: string,
): string => {
  const colorMap: { [key: string]: string } = {
    "Fasten Seat Belt": "#A1DCF8",
    freewheeling: "#FFCDC9",
    "Harsh Braking": "#FFB3B3",
    OverSpeed: "#F5B3E5",
    "Night Movement": "#D9B3FF",
    "Harsh Acceleration": "#FFB88C",
  };

  if (colorMap[alertType]) {
    return colorMap[alertType];
  }

  const colors = [
    "#B3D9FF",
    "#C7E9C7",
    "#FFE5B3",
    "#FFB3B3",
    "#D9B3FF",
    "#B3F0F0",
    "#FFD4B3",
    "#F5B3E5",
  ];

  let hash = 0;
  for (let i = 0; i < alertType.length; i++) {
    const char = alertType.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const getConsistentVehicleHealthAlertTypeColor = (
  alertType: string,
): string => {
  const colorMap: { [key: string]: string } = {
    "MAIN POWER REMOVED": "#A8E6CF",
    "Main power Removed": "#A8E6CF",
    MAINPOWER: "#A8E6CF",
  };

  if (colorMap[alertType]) {
    return colorMap[alertType];
  }

  const colors = [
    "#FFF7D4",
    "#FFE67C",
    "#FFE5B3",
    "#FFD4B3",
    "#FFE0B3",
    "#FFB3B3",
    "#F5B3E5",
    "#D9B3FF",
  ];

  let hash = 0;
  for (let i = 0; i < alertType.length; i++) {
    const char = alertType.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const processDriverBehaviourData = (alerts: any[]): PieChartData[] => {
  if (!alerts || alerts.length === 0) return [];

  const alertTypeGroups: { [key: string]: number } = {};

  alerts.forEach((alert) => {
    const alertType = alert.alert_type || "Unknown";
    alertTypeGroups[alertType] = (alertTypeGroups[alertType] || 0) + 1;
  });

  const totalCount = Object.values(alertTypeGroups).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Object.entries(alertTypeGroups)
    .map(([alertType, count]) => ({
      name: alertType,
      value: count,
      color: getConsistentDriverBehaviourAlertTypeColor(alertType),
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

export const processELockAlertsData = (alerts: any[]): PieChartData[] => {
  if (!alerts || alerts.length === 0) return [];

  const alertTypeGroups: { [key: string]: number } = {};
  const lightColors = [
    "#F4DFFF",
    "#DEAFF6",
    "#C084FC",
    "#A855F7",
    "#9333EA",
    "#7C3AED",
    "#6D28D9",
    "#5B21B6",
  ];

  alerts.forEach((alert) => {
    const alertType = alert.alert_type || alert.message || "Lock Alert";
    alertTypeGroups[alertType] = (alertTypeGroups[alertType] || 0) + 1;
  });

  const totalCount = Object.values(alertTypeGroups).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Object.entries(alertTypeGroups)
    .map(([alertType, count], index) => ({
      name: alertType,
      value: count,
      color: lightColors[index % lightColors.length],
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

export const getConsistentVideoAlertTypeColor = (alertType: string): string => {
  const colors = [
    "#B3D9FF",
    "#C7E9C7",
    "#FFE5B3",
    "#FFB3B3",
    "#D9B3FF",
    "#B3F0F0",
    "#FFD4B3",
    "#F5B3E5",
  ];

  let hash = 0;
  const typeStr = alertType.toLowerCase();
  for (let i = 0; i < typeStr.length; i++) {
    const char = typeStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const processDashCamAlertsData = (alerts: any[]): PieChartData[] => {
  if (!alerts || alerts.length === 0) return [];

  const alarmTypeGroups: { [key: string]: number } = {};

  alerts.forEach((alert) => {
    const alarmType = alert.alarmType || "Other";
    const displayName = getAlarmName(alarmType as VideoAlarmType) || alarmType;
    alarmTypeGroups[displayName] = (alarmTypeGroups[displayName] || 0) + 1;
  });

  const totalCount = Object.values(alarmTypeGroups).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Object.entries(alarmTypeGroups)
    .map(([alarmType, count]) => ({
      name: alarmType,
      value: count,
      color: getConsistentVideoAlertTypeColor(alarmType),
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};
