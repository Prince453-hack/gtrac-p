"use client";

import { useGetAlarmInfoMutation } from "@/app/_globalRedux/services/gpstracktech";
import {
  useIndiaGetMettaxAlarmFileMutation,
  useIndiaGetMettaxAlarmsMutation,
} from "@/app/_globalRedux/services/indiaMettax";
import {
  useGetMettaxAlarmFileMutation,
  useGetMettaxAlarmsMutation,
} from "@/app/_globalRedux/services/mettax";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetAlertsByDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import {
  AlertByDateLorryData,
  AlertByDayEvents,
} from "@/app/_globalRedux/services/types/alerts";
import { VideoAlarmsRecord } from "@/app/_globalRedux/services/types/post/getVideoAlerts";
import { AlarmType } from "@/app/_globalRedux/services/types/post/videoAlerts";
import { useGetUserAlertsQuery } from "@/app/_globalRedux/services/yatayaat";
import { RootState } from "@/app/_globalRedux/store";
import { getAlertsWithVideoPlayback } from "@/app/helpers/getAlertsWithVideoPlayback";
import { getAlarmName, VideoAlarmType } from "@/app/helpers/getVideoAlertName";
import { isKmtAccount } from "@/app/helpers/isKmtAccount";
import {
  ClearOutlined,
  DownloadOutlined,
  FilterOutlined,
  PlusCircleFilled,
  SettingFilled,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Dropdown,
  Input,
  notification,
  Select,
  Tag,
  Tooltip,
} from "antd";
import { setHours, setMinutes } from "date-fns";
import moment from "moment";
import React, {
  Dispatch,
  SetStateAction,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { DownloadReportsModal } from "../common";
import { DownloadReportTs } from "../common/CustomTableN";
import CustomDatePicker from "../common/datePicker";
import { parseVehicleHealthMessage } from "../overview/utils/pieChartDataProcessors";
import { AlertsListView, AlertsManagement } from "./index";

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

export function isValidDTCAlert(value: any): value is DTCAlerts {
  return validDTCAlerts.includes(value);
}

export function getDTCTypeFromLabel(label: string): DTCAlerts | null {
  return isValidDTCAlert(label) ? label : null;
}

export function isDTCLabel(label: string): boolean {
  return isValidDTCAlert(label);
}

const normalizeDtcCategoryLabel = (rawCategory?: string): DTCAlerts => {
  const normalized = (rawCategory || "General").trim().toLowerCase();

  if (normalized === "acceleration") return "Acceleration";
  if (normalized === "battery") return "Battery";
  if (normalized === "brake") return "Brake";
  if (normalized === "engine") return "Engine";
  if (normalized === "sensor") return "Sensor";
  if (normalized === "safetysystems" || normalized === "safety systems") {
    return "SafetySystems";
  }

  return "General";
};

const extractDtcCategoryFromMessage = (message?: string): DTCAlerts => {
  const parsed = parseVehicleHealthMessage(message || "");
  return normalizeDtcCategoryLabel(parsed?.category || "General");
};

const dtcCategoryToCountKey = (
  category: DTCAlerts,
):
  | "engine"
  | "acceleration"
  | "brake"
  | "sensor"
  | "battery"
  | "safetySystems"
  | "general" => {
  if (category === "Engine") return "engine";
  if (category === "Acceleration") return "acceleration";
  if (category === "Brake") return "brake";
  if (category === "Sensor") return "sensor";
  if (category === "Battery") return "battery";
  if (category === "SafetySystems") return "safetySystems";
  return "general";
};

const getAlertTimestamp = (alert: any): number => {
  const alertTime =
    alert?.gps_time ||
    alert?.datetime ||
    alert?.starttime ||
    alert?.alert_time ||
    alert?.timestamp ||
    alert?.time ||
    alert?.date;

  if (!alertTime) return 0;

  const parsedTime = moment(alertTime);
  return parsedTime.isValid() ? parsedTime.valueOf() : 0;
};

const limitLatestAlertsPerVehicle = (
  alertsList: any[],
  maxAlertsPerVehicle = 3,
): any[] => {
  const groupedAlerts = new Map<string, any[]>();

  alertsList.forEach((alert) => {
    const vehicleNo = (
      alert?.vehicleno ||
      alert?.vehicle_no ||
      alert?.vehicleNumber ||
      alert?.vehReg ||
      "Unknown Vehicle"
    )
      .toString()
      .trim();

    if (!groupedAlerts.has(vehicleNo)) {
      groupedAlerts.set(vehicleNo, []);
    }

    groupedAlerts.get(vehicleNo)!.push(alert);
  });

  return Array.from(groupedAlerts.values()).flatMap((vehicleAlerts) =>
    vehicleAlerts
      .sort((a, b) => getAlertTimestamp(b) - getAlertTimestamp(a))
      .slice(0, maxAlertsPerVehicle),
  );
};

const getResponseFieldName = (apiParamName: string): string => {
  const fieldMapping: { [key: string]: string } = {
    harshAcceleration: "harshacc",
    harshBreaking: "harshBreak",
    ContinousDrive: "contineousDrive",
    Freewheeling: "freewheeling",
    freewheelingWrong: "freewheelingWrong",
    NightDrive: "nightdrive",
    padlock: "padlock",
    Internalpower: "internalPower",
    OverSpeed: "overspeed",
    MainpowerConnected: "MainpowerConnected",
    Mainpower: "mainpower",
    PoscoOverspeed: "PoscoOverspeed",
    alcohol: "alcohol",
  };

  return fieldMapping[apiParamName] || apiParamName;
};

const getAdjustedAlerts = ({
  data,
  setAdjustAlertsAsList,
  setAlertCount,
  isPolling,
  dtcAlerts,
  selectedAlertOption,
  isDTC,
  userId,
  allVehicles,
  setIsCountUpdating,
  countUpdateRef,
}: {
  data: AlertByDateLorryData[];
  setAdjustAlertsAsList: Dispatch<SetStateAction<AlertByDayEvents[]>>;
  setAlertCount: Dispatch<
    SetStateAction<
      {
        value:
          | "acceleration"
          | "battery"
          | "brake"
          | "engine"
          | "safetySystems"
          | "sensor"
          | "general"
          | "forwardCollisionWarning"
          | "fatigueAlarm"
          | "fatigueWarn"
          | "bothHandsOffSteeringWheel"
          | "handheldPhoneCall"
          | "longTimeWithoutLookingAhead"
          | "smoking"
          | "seatBelt"
          | "occlusion"
          | "speed"
          | "rapid"
          | "slow"
          | "wheel"
          | "contineousDrive"
          | "padlock"
          | "freewheeling"
          | "freewheelingWrong"
          | "harshAcceleration"
          | "harshBreak"
          | "internalPower"
          | "overspeedKMT"
          | "OverSpeed"
          | "MainpowerConnected"
          | "mainpower"
          | "NightDrive"
          | "PoscoOverspeed"
          | "alcohol"
          | "unlockOnMove"
          | "unlockOutsideGeofence"
          | "unhealth"
          | "fuelTheft"
          | "fuelPowerDisconnected"
          | "enrouteIdle"
          | "idleAtGeofence";
        title: string;
        count: number;
        type:
          | "DRIVER_BEHAVIOUR"
          | "OTHERS"
          | "DTC"
          | "VIDEO_TELEMATICS"
          | "E_LOCK"
          | "FUEL"
          | "GPS";
        label: string;
        isNewData: boolean;
      }[]
    >
  >;
  isPolling?: boolean;
  dtcAlerts?: AlertByDayEvents[] | null;
  selectedAlertOption: string | undefined;
  isDTC: boolean;
  userId?: string | number;
  allVehicles?: any[];
  setIsCountUpdating: Dispatch<SetStateAction<boolean>>;
  countUpdateRef: React.MutableRefObject<NodeJS.Timeout | null>;
}) => {
  if (!data || !data.length) {
    console.warn("No alert data available for counting");
    return;
  }

  const alert = data[0];
  if (!alert) {
    console.warn("Alert object is empty or undefined");
    return;
  }

  let tempAlerts: AlertByDayEvents[] = [
    ...(alert.contineousDrive ? alert.contineousDrive : []),
    ...(alert.padlock ? alert.padlock : []),
    ...(alert.freewheeling ? alert.freewheeling : []),
    ...(alert.freewheelingWrong ? alert.freewheelingWrong : []),
    ...(alert.harshBreak ? alert.harshBreak : []),
    ...(alert.harshacc ? alert.harshacc : []),
    ...(alert.highenginetemperature ? alert.highenginetemperature : []),
    ...(alert.idle
      ? alert.idle.map((idleAlert) => ({
          ...idleAlert,
          AlertStatus: idleAlert.remark ? "Closed" : "Open",
        }))
      : []),
    ...(alert.internalPower ? alert.internalPower : []),
    ...(alert.lowengineoilpressure ? alert.lowengineoilpressure : []),
    ...(alert.mainpower ? alert.mainpower : []),
    ...(alert.MainpowerConnected ? alert.MainpowerConnected : []),
    ...(alert.nightdrive ? alert.nightdrive : []),
    ...(alert.overspeed ? alert.overspeed : []),
    ...(alert.overspeedKMT ? alert.overspeedKMT : []),
    ...(alert.panic ? alert.panic : []),
    ...(alert.services ? alert.services : []),
    ...(alert.document ? alert.document : []),
    ...(alert.transitdelay ? alert.transitdelay : []),
    ...(alert.unlockonmove ? alert.unlockonmove : []),
    ...(alert.PoscoOverspeed ? alert.PoscoOverspeed : []),
    ...(alert.geofence ? alert.geofence : []),
    ...(alert.alcohol ? alert.alcohol : []),
    ...(alert.OverSpeed ? alert.OverSpeed : []),
  ];

  // Add panicraw alerts if they exist
  if ("panicraw" in alert && Array.isArray((alert as any).panicraw)) {
    tempAlerts.push(...(alert as any).panicraw);
  }

  const groupAlertsByTime = (alerts: any[]) => {
    if (String(userId) !== "3356") {
      return alerts;
    }

    const poscoAlerts = alerts.filter(
      (alert) =>
        alert.alerttype === "PoscoOverspeed" ||
        alert.alerttype === "Posco Overspeed",
    );
    const otherAlerts = alerts.filter(
      (alert) =>
        alert.alerttype !== "PoscoOverspeed" &&
        alert.alerttype !== "Posco Overspeed",
    );

    if (poscoAlerts.length === 0) return alerts;

    // Group Posco alerts by time (HH:MM format)
    const timeGroups = new Map();
    poscoAlerts.forEach((alert) => {
      const timeKey = moment(alert.starttime).format("HH:mm");

      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, alert);
      }
    });

    // Combine grouped Posco alerts with other alerts
    return [...otherAlerts, ...Array.from(timeGroups.values())];
  };

  // Apply time-based grouping
  tempAlerts = groupAlertsByTime(tempAlerts);

  tempAlerts.sort((a, b) => {
    if (a.endtime && b.endtime)
      moment(b.endtime).unix() - moment(a.endtime).unix();
    return moment(b.starttime).unix() - moment(a.starttime).unix();
  });

  if (isDTC) {
    if (
      dtcAlerts &&
      (selectedAlertOption === "All" ||
        selectedAlertOption === undefined ||
        selectedAlertOption === "")
    ) {
      tempAlerts.push(...dtcAlerts);
    } else if (
      selectedAlertOption &&
      isDTCLabel(selectedAlertOption) &&
      dtcAlerts
    ) {
      const dtcType = getDTCTypeFromLabel(selectedAlertOption);
      if (dtcType) {
        const filteredAlerts = dtcAlerts.filter(
          (alert) =>
            alert.exception_type &&
            String(alert.exception_type).toUpperCase() ===
              dtcType.toUpperCase(),
        );
        tempAlerts.push(...filteredAlerts);
      }
    }
  }

  // Filter alerts for user 833381 based on their vehicles
  let filteredAlerts = tempAlerts;
  if (Number(userId) === 833381 && allVehicles) {
    const userVehicleRegs = allVehicles.map((vehicle) =>
      String(vehicle.veh_reg),
    );
    filteredAlerts = tempAlerts.filter((alert) =>
      userVehicleRegs.includes(String(alert.vehicle_no)),
    );
  }

  if (Number(userId) === 3356) {
    const groupedAlerts = new Map<string, AlertByDayEvents>();

    filteredAlerts.forEach((alert) => {
      if (alert.starttime) {
        const timeKey = moment(alert.starttime).format("HH:mm");
        const alertKey = `${alert.exception_type}_${timeKey}_${alert.vehicle_no}`;
        if (!groupedAlerts.has(alertKey)) {
          groupedAlerts.set(alertKey, alert);
        }
      } else {
        const alertKey = `${
          alert.exception_type
        }_no_time_${Date.now()}_${Math.random()}`;
        groupedAlerts.set(alertKey, alert);
      }
    });

    filteredAlerts = Array.from(groupedAlerts.values());
  }

  if (Number(userId) === 4343) {
    const groupedAlerts = new Map<string, AlertByDayEvents>();

    filteredAlerts.forEach((alert) => {
      if (alert.starttime) {
        const timeKey = moment(alert.starttime).format("HH:mm");
        const alertKey = `${alert.exception_type}_${timeKey}_${alert.vehicle_no}`;
        if (!groupedAlerts.has(alertKey)) {
          groupedAlerts.set(alertKey, alert);
        }
      } else {
        const alertKey = `${
          alert.exception_type
        }_no_time_${Date.now()}_${Math.random()}`;
        groupedAlerts.set(alertKey, alert);
      }
    });

    filteredAlerts = Array.from(groupedAlerts.values());
  }

  setAdjustAlertsAsList(filteredAlerts);

  // Clear any existing timeout to prevent race conditions
  if (countUpdateRef.current) {
    clearTimeout(countUpdateRef.current);
  }

  setIsCountUpdating(true);

  // Debounce the count update to prevent race conditions
  countUpdateRef.current = setTimeout(() => {
    setAlertCount((prev) => {
      const updatedCounts = prev.map((alertType) => {
        const oldCount = alertType.count;
        let newCount = oldCount;
        let hasError = false;
        let shouldUpdate = false;

        try {
          // Skip updating counts for alerts managed by specificGetAlerts
          const specificGetAlertsTypes = [
            "freewheeling",
            "freewheelingWrong",
            "harshAcceleration",
            "harshBreak",
          ];

          if (
            (alertType.type === "DRIVER_BEHAVIOUR" ||
              alertType.type === "OTHERS") &&
            !isDTC &&
            !specificGetAlertsTypes.includes(alertType.value)
          ) {
            const responseFieldName = getResponseFieldName(alertType.value);

            // Enhanced safety checks
            if (!alert || typeof alert !== "object") {
              shouldUpdate = false;
            } else {
              // Try multiple approaches to get the data
              let alertsArray = null;
              let fieldExists = false;

              // First try: direct field access
              alertsArray = alert[responseFieldName as keyof typeof alert];
              fieldExists = responseFieldName in alert;

              if (!fieldExists) {
                const keys = Object.keys(alert);
                const matchingKey = keys.find(
                  (key) =>
                    key.toLowerCase() === responseFieldName.toLowerCase(),
                );
                if (matchingKey) {
                  alertsArray = alert[matchingKey as keyof typeof alert];
                  fieldExists = true;
                }
              }

              // Only update if the field actually exists in the response
              if (fieldExists) {
                shouldUpdate = true;
                // Ensure we have a valid array
                if (Array.isArray(alertsArray)) {
                  let arrayLength: number = alertsArray.length;

                  if (
                    String(userId) === "3356" &&
                    alertType.value === "PoscoOverspeed"
                  ) {
                    const timeGroups = new Map();
                    alertsArray.forEach((alert: any) => {
                      if (alert && alert.starttime) {
                        const timeKey = moment(alert.starttime).format("HH:mm");
                        if (!timeGroups.has(timeKey)) {
                          timeGroups.set(timeKey, alert);
                        }
                      }
                    });
                    arrayLength = timeGroups.size;
                  }

                  if (arrayLength > 0 || oldCount === 0) {
                    newCount = arrayLength;
                  } else {
                    shouldUpdate = false;
                    newCount = oldCount;
                  }
                } else {
                  newCount = 0;
                }
              } else {
                // Field doesn't exist in response - preserve existing count
                shouldUpdate = false;
                newCount = oldCount;
              }
            }
          } else {
            // For other types or mismatched update types, PRESERVE existing count
          }
        } catch (error) {
          newCount = oldCount; // PRESERVE existing count on error
          hasError = true;
        }

        return {
          ...alertType,
          count: newCount,
          isNewData:
            isPolling && shouldUpdate
              ? oldCount !== newCount
              : alertType?.isNewData,
        };
      });

      const totalFromCategories = updatedCounts.reduce(
        (sum, category) => sum + category.count,
        0,
      );

      // Clear updating flag
      setIsCountUpdating(false);

      return updatedCounts;
    });
  }, 100); // 100ms debounce delay
};

type AllColumnTypes = {
  ["Alert Type"]: boolean;
  ["Vehicle No"]: boolean;
  ["Start Time"]: boolean;
  ["End Time"]: boolean;
  ["Start Location"]: boolean;
  ["End Location"]: boolean;
  Distance: boolean;
  ["End Location"]: boolean;
  ["End Time"]: boolean;
  Duration: boolean;
  Speed: boolean;
  ["Running Hrs"]: boolean;
  ["Total Stoppages"]: boolean;
  ["Alert Receiving Time"]: boolean;
  ["Halting Hour"]: boolean;
  ["Invoice No"]: boolean;
  ["Invoice Date"]: boolean;
  ["Remarks"]: boolean;
  ["Alert Status"]: boolean;
  ["Deviate Route"]: boolean;
  Description: boolean;
  Alert: boolean;
  SetAt: boolean;
  Severity: boolean;
  Code: boolean;
};

const allColumnTypes: AllColumnTypes = {
  ["Alert Type"]: true,
  ["Vehicle No"]: true,
  ["Start Time"]: true,
  ["End Time"]: true,
  ["Start Location"]: true,
  ["End Location"]: true,
  ["Halting Hour"]: true,
  Distance: true,
  Duration: true,
  Speed: true,
  ["Running Hrs"]: true,
  ["Total Stoppages"]: true,
  ["Alert Receiving Time"]: true,
  ["Invoice No"]: true,
  ["Invoice Date"]: true,
  ["Remarks"]: true,
  ["Alert Status"]: true,
  ["Deviate Route"]: true,
  Description: true,
  Alert: true,
  SetAt: true,
  Severity: true,
  Code: true,
};

const allAlertOptions = [
  {
    label: "All",
    value: "All",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Speed: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },

  {
    label: "Harsh Acceleration",
    value: "harshAcceleration",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["Start Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Harsh Break",
    value: "harshBreaking",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Main Power Disconnect",
    value: "Mainpower",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Main power disconnected",
    value: "Mainpower",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Main Power Connected",
    value: "MainpowerConnected",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Internal Battery Disconnected",
    value: "Internalpower",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Speed: false,
      Distance: false,
      Duration: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Overspeed",
    value: "OverSpeed",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "OverSpeed",
    value: "OverSpeed",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Free Wheeling",
    value: "Freewheeling",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Diagnosed RPM",
    value: "freewheelingWrong",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Continuous Drive",
    value: "ContinousDrive",
    columns: {
      ...allColumnTypes,
      Distance: false,
      Speed: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },

  {
    label: "Padlock",
    value: "padlock",
    columns: {
      ...allColumnTypes,
      Distance: false,
      Speed: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },

  {
    label: "Posco Overspeed",
    value: "PoscoOverspeed",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "idle",
    value: "Idle",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Speed"]: false,
      Distance: false,
      Duration: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },

  {
    label: "Posco Overspeed",
    value: "PoscoOverspeed",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },

  {
    label: "Idle",
    value: "Idle",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Speed"]: false,
      Distance: false,
      Duration: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "GeoFence",
    value: "GeoFence",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Speed"]: false,
      Distance: false,
      Duration: false,
      ["Halting Hour"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Panic",
    value: "Panic",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "AC",
    value: "AC",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },

  {
    label: "GPS Disconnect",
    value: "GPS Disconnect",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "High Engine Temperature",
    value: "High Engine Temperature",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Idling",
    value: "Idling",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Speed"]: false,
      Distance: false,
      Duration: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Ignition",
    value: "Ignition",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Ignition Night",
    value: "Ignition Night",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Low Engine Oil Pressure",
    value: "Low Engine Oil Pressure",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Service",
    value: "Service",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Document",
    value: "Document",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Temperature",
    value: "Temperature",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Unlock on move",
    value: "UnlockOnMove",
    columns: {
      ...allColumnTypes,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Unlock On Move",
    value: "unlockonmove",
    columns: {
      ...allColumnTypes,
      ["End Location"]: false,
      ["End Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Acceleration",
    value: "Acceleration",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "Battery",
    value: "Battery",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "Brake",
    value: "Brake",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "Engine",
    value: "engine",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "Safety Systems",
    value: "safetySystems",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "Sensor",
    value: "sensor",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "General",
    value: "general",
    columns: {
      ...allColumnTypes,
      ["Start Time"]: false,
      ["End Time"]: false,
      ["End Location"]: false,
      ["Halting Hour"]: false,
      Duration: false,
      Remarks: false,
      Speed: false,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Invoice No"]: false,
      ["Alert Status"]: false,
    },
  },
  {
    label: "Alcohol",
    value: "Alcohol",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Enroute Idle",
    value: "enrouteIdle",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
  {
    label: "Idle at Geofence",
    value: "idleAtGeofence",
    columns: {
      ...allColumnTypes,
      ["Running Hrs"]: false,
      ["Total Stoppages"]: false,
      ["Alert Receiving Time"]: false,
      Distance: false,
      Duration: false,
      Speed: false,
      ["End Location"]: false,
      ["End Time"]: false,
      ["Halting Hour"]: false,
      ["Invoice No"]: false,
      ["Invoice Date"]: false,
      ["Remarks"]: false,
      ["Alert Status"]: false,
      ["Deviate Route"]: false,
      Description: false,
      Alert: false,
      SetAt: false,
      Severity: false,
      Code: false,
    },
  },
];

const SIDEBAR_USER_IDS: number[] = [
  3356, 82815, 87470, 833105, 81707, 87115, 4343, 833783,
];

const VIDEO_TELEMATICS_USER_IDS: number[] = [81707, 4343, 833783];

const FUEL_USER_IDS: number[] = [3356, 833193, 833105, 81707, 833783, 4343];

const GPS_USER_IDS: number[] = [
  3356, 833193, 833105, 81707, 87115, 833783, 4343,
];

export const View = () => {
  const [isAlertManagement, setIsAlertManagement] = useState(false);
  const [modalViewToggle, setModalViewToggle] = useState<
    "DETAILS" | "EDIT" | "CREATE"
  >("DETAILS");
  const [isModalActive, setIsModalActive] = useState(false);
  const [isDrawerActive, setIsDrawerActive] = useState(false);
  const [
    isServicesAndDocumentsDrawerActive,
    setIsServicesAndDocumentsDrawerActive,
  ] = useState(false);
  const [alertOptions, setAlertOptions] =
    useState<{ label: string; value: string; columns: AllColumnTypes }[]>();
  const allVehicles = useSelector((state: RootState) => state.allVehicles);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [selectedAlertOption, setSelectedAlertOption] = useState<{
    label: string;
    value: string;
    columns: AllColumnTypes;
  }>();
  const [adjustedAlertsAsList, setAdjustedAlertsAsList] = useState<
    AlertByDayEvents[]
  >([]);
  const { userId, groupId, parentUser, isVideoTelematics, accessLabel } =
    useSelector((state: RootState) => state.auth);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const [loading, setLoading] = useState(true);
  const [forceNoLoading, setForceNoLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingTimeouts, setLoadingTimeouts] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});
  const [hasTimedOut, setHasTimedOut] = useState<{
    [key: string]: boolean;
  }>({});

  // Add state to track count update operations
  const [isCountUpdating, setIsCountUpdating] = useState(false);
  const countUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Video Telematics state management
  const [videoAlerts, setVideoAlerts] = useState<VideoAlarmsRecord[]>([]);
  const [isVideoAlertsLoading, setIsVideoAlertsLoading] = useState(false);
  const [videoAlertsError, setVideoAlertsError] = useState<string | null>(null);
  const [videoAlarmFiles, setVideoAlarmFiles] = useState<{
    [key: string]: { images: string[]; videos: string[] };
  }>({});

  // Helper function to manage API timeouts
  const createTimeout = (key: string, callback: () => void, delay = 20000) => {
    // Clear existing timeout if any
    if (loadingTimeouts[key]) {
      clearTimeout(loadingTimeouts[key]);
    }

    const timeoutId = setTimeout(() => {
      callback();
      setHasTimedOut((prev) => ({ ...prev, [key]: true }));
      setLoadingTimeouts((prev) => {
        const newTimeouts = { ...prev };
        delete newTimeouts[key];
        return newTimeouts;
      });
    }, delay);

    setLoadingTimeouts((prev) => ({ ...prev, [key]: timeoutId }));

    return timeoutId;
  };

  const clearLoadingTimeout = (key: string) => {
    if (loadingTimeouts[key]) {
      clearTimeout(loadingTimeouts[key]);
      setLoadingTimeouts((prev) => {
        const newTimeouts = { ...prev };
        delete newTimeouts[key];
        return newTimeouts;
      });
    }
    setHasTimedOut((prev) => ({ ...prev, [key]: false }));
  };

  const fetchVideoTelematicsAlerts = async (startDate: Date, endDate: Date) => {
    if (
      !VIDEO_TELEMATICS_USER_IDS.includes(Number(userId)) ||
      !vehicleDataWithGps?.list?.length
    ) {
      setVideoAlerts([]);
      setIsVideoAlertsLoading(false);
      return;
    }

    setIsVideoAlertsLoading(true);
    setVideoAlertsError(null);

    try {
      const regularDashcamVehicles = vehicleDataWithGps.list.filter(
        (vehicle: any) => {
          const model = vehicle.gpsDtl?.model;
          return Boolean(
            model &&
            /^\d+$/.test(model.toString().trim()) &&
            !model.toString().includes("##BSJ"),
          );
        },
      );

      const bsjVehicles = vehicleDataWithGps.list.filter((vehicle: any) => {
        const model = vehicle.gpsDtl?.model;
        return Boolean(model && model.toString().includes("##BSJ"));
      });

      const allVideoAlerts: VideoAlarmsRecord[] = [];

      if (bsjVehicles.length > 0) {
        try {
          const bsjImeis = bsjVehicles
            .map((vehicle) => vehicle.gpsDtl?.model?.replace("##BSJ", "") || "")
            .filter((imei) => imei !== "");

          if (bsjImeis.length > 0) {
            const bsjResponse = await getGPSTrackTechAlarms({
              ids: [201, 38, 202, 213, 200],
              pageNumber: 1,
              pageSize: 1000,
              queryParams: bsjImeis,
              queryType: 1,
              startTime: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
              endTime: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
            }).unwrap();

            if (bsjResponse.code === 200 && bsjResponse.data) {
              const mapGPSTrackTechAlarmType = (
                alarmType: number,
              ): string | null => {
                const alarmTypeMap: { [key: number]: string } = {
                  201: "handheldPhoneCall", // Phone Call
                  38: "smoking", // Smoking
                  202: "smoking", // Smoke (was mapped to fatigueWarn)
                  213: "seatBelt", // Seatbelt
                  200: "fatigueWarn", // Fatigue/Tired
                };
                return alarmTypeMap[alarmType] || null;
              };

              const mappedBsjAlarms = bsjResponse.data
                .map((alarm) => {
                  const mappedAlarmType = mapGPSTrackTechAlarmType(
                    alarm.alarmType,
                  );
                  if (!mappedAlarmType) return null;

                  // Find corresponding vehicle to get registration
                  const matchingVehicle = bsjVehicles.find(
                    (v) =>
                      v.gpsDtl?.model?.replace("##BSJ", "") === alarm.deviceId,
                  );

                  const baseUrl = "https://y.gpstracktech.com";
                  const videoUrl = alarm.aviPath
                    ? `${baseUrl}${alarm.aviPath}`
                    : undefined;
                  const imageUrls = alarm.imagePath
                    ? alarm.imagePath
                        .split(",")
                        .map((path) => `${baseUrl}${path}`)
                    : undefined;

                  return {
                    id: alarm.alarmId,
                    deviceId: alarm.deviceId,
                    deviceName: alarm.deviceName,
                    alarmType: mappedAlarmType as AlarmType,
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
                  } as VideoAlarmsRecord;
                })
                .filter(Boolean);

              allVideoAlerts.push(...(mappedBsjAlarms as VideoAlarmsRecord[]));

              // Pre-populate videoAlarmFiles for BSJ alerts
              const bsjVideoAlarmFiles: {
                [key: string]: { images: string[]; videos: string[] };
              } = {};
              mappedBsjAlarms.forEach((bsjAlarm) => {
                if (bsjAlarm && bsjAlarm.id) {
                  bsjVideoAlarmFiles[bsjAlarm.id.toString()] = {
                    images: (bsjAlarm as any).imageUrls || [],
                    videos: (bsjAlarm as any).videoUrl
                      ? [(bsjAlarm as any).videoUrl]
                      : [],
                  };
                }
              });

              setVideoAlarmFiles((prev) => ({
                ...prev,
                ...bsjVideoAlarmFiles,
              }));
            }
          }
        } catch (bsjError: any) {
          console.warn("Failed to fetch BSJ video alerts:", bsjError);
        }
      }

      for (const vehicle of regularDashcamVehicles) {
        if (vehicle.gpsDtl?.model) {
          try {
            let response;

            if (Number(userId) === 5360) {
              // User 5360 uses India API only
              response = await getIndiaMettaxAlarmsTrigger({
                startTime: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
                endTime: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
                deviceIds: vehicle.gpsDtl.model as string,
                alarmType: null,
                pageSize: 1000,
                pageIndex: 1,
              }).unwrap();
            } else if (Number(userId) === 4343) {
              // User 4343 uses same logic as ODBDetailsSection.tsx
              response = await getMettaxAlarmsTrigger({
                startTime: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
                endTime: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
                deviceIds: vehicle.gpsDtl.model as string,
                alarmType: null,
                pageSize: 100,
                pageIndex: 1,
              }).unwrap();
            } else {
              // Other users use Singapore API
              response = await getMettaxAlarmsTrigger({
                startTime: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
                endTime: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
                deviceIds: vehicle.gpsDtl.model as string,
                alarmType: null,
                pageSize: 1000,
                pageIndex: 1,
              }).unwrap();
            }

            if (response.data && response.data.records) {
              let filteredAlerts;

              if (Number(userId) === 4343) {
                const allowedAlertTypes = [
                  "seatBelt", // Seatbelt Detection
                  "handheldPhoneCall", // Phone Calling
                  "smoking", // Smoking Detection
                  "fatigueWarn", // Fatigue Warning
                ];

                filteredAlerts = response.data.records
                  .filter((alert) => {
                    // Only include alerts that are in our allowed list
                    return allowedAlertTypes.includes(alert.alarmType);
                  })
                  .map(
                    (alarm) =>
                      ({
                        ...alarm,
                        vehicleReg: vehicle.vehReg,
                        deviceId:
                          (vehicle.gpsDtl.model as string) ||
                          alarm.deviceId ||
                          "",
                        alarmType: alarm.alarmType as AlarmType,
                      }) as VideoAlarmsRecord & { vehicleReg: string },
                  );
              } else {
                filteredAlerts = response.data.records
                  .filter((alarm) =>
                    getAlertsWithVideoPlayback({
                      alarmType: alarm.alarmType as AlarmType,
                    }),
                  )
                  .map(
                    (alarm) =>
                      ({
                        ...alarm,
                        vehicleReg: vehicle.vehReg,
                        deviceId:
                          (vehicle.gpsDtl.model as string) ||
                          alarm.deviceId ||
                          "",
                        alarmType: alarm.alarmType as AlarmType,
                      }) as VideoAlarmsRecord & { vehicleReg: string },
                  );
              }

              allVideoAlerts.push(...(filteredAlerts as VideoAlarmsRecord[]));
            }
          } catch (vehicleError: any) {
            continue; // Continue with next vehicle
          }
        }
      }

      setVideoAlerts(allVideoAlerts);
    } catch (error) {
      console.error("Error fetching video telematics alerts:", error);
      setVideoAlertsError("Failed to fetch video alerts");
      setVideoAlerts([]);
    } finally {
      setIsVideoAlertsLoading(false);
    }
  };

  const applySuppression = (
    alerts: VideoAlarmsRecord[],
  ): VideoAlarmsRecord[] => {
    const sortedAlerts = [...alerts].sort((a, b) => {
      const timeA = new Date(a.alarmTs).getTime();
      const timeB = new Date(b.alarmTs).getTime();
      return timeA - timeB;
    });

    const suppressedAlerts: VideoAlarmsRecord[] = [];
    const suppressionMap = new Map<string, Date>(); 

    for (const alert of sortedAlerts) {
      const vehicleReg =
        selectedVehicle.vehReg || alert.deviceName || (alert as any).vehicleReg;
      const alarmType =
        getAlarmName(alert.alarmType as VideoAlarmType) || alert.alarmType;
      const suppressionKey = `${vehicleReg}-${alarmType}`;
      const alertTime = new Date(alert.alarmTs);

      const lastAlertTime = suppressionMap.get(suppressionKey);

      if (!lastAlertTime) {
        suppressedAlerts.push(alert);
        suppressionMap.set(suppressionKey, alertTime);
      } else {
        const timeDifferenceMs = alertTime.getTime() - lastAlertTime.getTime();
        const tenMinutesMs = 10 * 60 * 1000; // 10 minutes in milliseconds

        if (timeDifferenceMs >= tenMinutesMs) {
          suppressedAlerts.push(alert);
          suppressionMap.set(suppressionKey, alertTime);
        }
      }
    }

    return suppressedAlerts;
  };

  const convertVideoAlertsToAlertsFormat = (
    videoAlerts: VideoAlarmsRecord[],
  ): AlertByDayEvents[] => {
    const suppressedAlerts = applySuppression(videoAlerts);

    return suppressedAlerts.map(
      (alert: VideoAlarmsRecord, index: number) =>
        ({
          starttime: alert.alarmTs,
          endtime: alert.alarmTsEnd || alert.alarmTs,
          vehicle_no: selectedVehicle.vehReg || alert.deviceName,
          exception_type:
            getAlarmName(alert.alarmType as VideoAlarmType) || alert.alarmType,
          KM: "0", 
          duration: "0", 
          startlocation: `${alert.lat}, ${alert.lon}`,
          startlat: alert.lat,
          startLong: alert.lon,
          endlocation: `${alert.lat}, ${alert.lon}`,
          endlat: alert.lat,
          endLong: alert.lon,
          speed: 0,
          journey_statusfinal: null,
          Halting: undefined,
          hour: undefined,
          InvoiceNo: undefined,
          InvoiceDate: undefined,
          remark: undefined,
          id:
            typeof alert.id === "string"
              ? parseInt(alert.id) || Date.now()
              : alert.id,
          service_id: alert.id,
          route_name: alert.deviceId || "",
          // Preserve BSJ media information
          videoUrl: (alert as any).videoUrl,
          imageUrls: (alert as any).imageUrls,
          vehicleReg: (alert as any).vehicleReg,
        }) as AlertByDayEvents,
    );
  };

  // Function to fetch alarm files for video alerts
  const fetchAlarmFiles = async (alertId: string) => {
    try {
      // Check if files are already cached
      if (videoAlarmFiles[alertId]) {
        return videoAlarmFiles[alertId];
      }

      // Check if this is a BSJ alert with pre-existing media URLs
      const alert = adjustedAlertsAsList.find((a) => a.service_id === alertId);
      if (alert && ((alert as any).videoUrl || (alert as any).imageUrls)) {
        const result = {
          images: (alert as any).imageUrls || [],
          videos: (alert as any).videoUrl ? [(alert as any).videoUrl] : [],
        };

        // Cache the BSJ results
        setVideoAlarmFiles((prev) => ({
          ...prev,
          [alertId]: result,
        }));

        return result;
      }

      // For regular Mettax alerts, use the API
      let response;
      if (Number(userId) === 5360) {
        response = await getIndiaMettaxAlarmFileTrigger({
          alarmId: alertId,
        }).unwrap();
      } else {
        response = await getMettaxAlarmFileTrigger({
          alarmId: alertId,
        }).unwrap();
      }

      const filesRaw = (response as any)?.data ?? response ?? [];
      const files: any[] = Array.isArray(filesRaw) ? filesRaw : [];

      // Separate images and videos
      const imageFiles = files.filter((file: any) => file.fileType === "00");
      const videoFiles = files.filter((file: any) => file.fileType === "02");

      const imageUrls = imageFiles
        .map((file: any) => file.fileUrl)
        .filter(Boolean);

      const videoUrls = videoFiles
        .map((file: any) => file.fileUrl)
        .filter(Boolean);

      const result = {
        images: imageUrls,
        videos: videoUrls,
      };

      // Cache the results
      setVideoAlarmFiles((prev) => ({
        ...prev,
        [alertId]: result,
      }));

      return result;
    } catch (error) {
      console.error("Error fetching alarm files:", error);

      const emptyResult = { images: [], videos: [] };
      setVideoAlarmFiles((prev) => ({
        ...prev,
        [alertId]: emptyResult,
      }));

      return emptyResult;
    }
  };

  useEffect(() => {
    if (loading && !forceNoLoading) {
      const globalTimeout = setTimeout(() => {
        setLoading(false);
        setForceNoLoading(true);
      }, 15000);

      return () => clearTimeout(globalTimeout);
    }
  }, [loading, forceNoLoading]);

  const [alertCount, setAlertCount] = useState<
    {
      value:
        | "acceleration"
        | "battery"
        | "brake"
        | "engine"
        | "safetySystems"
        | "sensor"
        | "general"
        | "forwardCollisionWarning"
        | "fatigueAlarm"
        | "fatigueWarn"
        | "bothHandsOffSteeringWheel"
        | "handheldPhoneCall"
        | "longTimeWithoutLookingAhead"
        | "smoking"
        | "seatBelt"
        | "occlusion"
        | "speed"
        | "rapid"
        | "slow"
        | "wheel"
        | "contineousDrive"
        | "padlock"
        | "freewheeling"
        | "freewheelingWrong"
        | "harshAcceleration"
        | "harshBreak"
        | "internalPower"
        | "overspeedKMT"
        | "OverSpeed"
        | "MainpowerConnected"
        | "mainpower"
        | "NightDrive"
        | "PoscoOverspeed"
        | "alcohol"
        | "unlockOnMove"
        | "unlockOutsideGeofence"
        | "unhealth"
        | "fuelTheft"
        | "fuelPowerDisconnected"
        | "enrouteIdle"
        | "idleAtGeofence";
      title: string;
      count: number;
      type:
        | "DRIVER_BEHAVIOUR"
        | "OTHERS"
        | "DTC"
        | "VIDEO_TELEMATICS"
        | "E_LOCK"
        | "FUEL"
        | "GPS";
      label: string;
      isNewData: boolean;
    }[]
  >(() => {
    const allAlertCounts = [
      {
        label: "Acceleration",
        title: "Acceleration",
        value: "acceleration" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Battery",
        title: "Battery",
        value: "battery" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Brake",
        title: "Brake",
        value: "brake" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Engine",
        title: "Engine",
        value: "engine" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "SafetySystems",
        title: "Safety Systems",
        value: "safetySystems" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Sensor",
        title: "Sensor",
        value: "sensor" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "General",
        title: "General",
        value: "general" as const,
        type: "DTC" as const,
        count: 0,
        isNewData: false,
      },

      {
        label: "Continuous Drive",
        title: "Continuous Drive",
        value: "contineousDrive" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Free Wheeling",
        title: "Free Wheeling",
        value: "freewheeling" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Diagnosed RPM",
        title: "Diagnosed RPM",
        value: "freewheelingWrong" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Harsh Acceleration",
        title: "Harsh Acceleration",
        value: "harshAcceleration" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Harsh Break",
        title: "Harsh Break",
        value: "harshBreak" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Night Drive",
        title: "Night Drive",
        value: "NightDrive" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },

      {
        label: "Padlock",
        title: "Padlock",
        value: "padlock" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Internal Battery Disconnected",
        title: "Internal Battery Disconnected",
        value: "internalPower" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Overspeed",
        title: "Overspeed",
        value: "overspeedKMT" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "OverSpeed",
        title: "OverSpeed",
        value: "OverSpeed" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Main Power Connected",
        title: "Main Power Connected",
        value: "MainpowerConnected" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Main Power Disconnected",
        title: "Main Power Disconnected",
        value: "mainpower" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Posco Overspeed",
        title: "Posco Overspeed",
        value: "PoscoOverspeed" as const,
        type: "OTHERS" as const,
        count: 0,
        isNewData: false,
      },
      {
        label: "Alcohol",
        title: "Alcohol",
        value: "alcohol" as const,
        type: "DRIVER_BEHAVIOUR" as const,
        count: 0,
        isNewData: false,
      },
    ];

    // Filter out specific categories for user ID 833105 and 81707
    if (Number(userId) === 833105) {
      return allAlertCounts.filter(
        (category) =>
          ![
            "Continuous Drive",
            "Night Drive",
            "Alcohol",
            "Padlock",
            "Overspeed",
            "Posco Overspeed",
          ].includes(category.label),
      );
    } else if (Number(userId) === 81707) {
      return allAlertCounts.filter(
        (category) =>
          ![
            "Internal Battery Disconnected",
            "Main Power Connected",
            "Main Power Disconnected",
            "Posco Overspeed",
          ].includes(category.label),
      );
    } else if (Number(userId) !== 3356) {
      return allAlertCounts.filter(
        (category) => category.label !== "Posco Overspeed",
      );
    }
    return allAlertCounts;
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const [pollingInterval, setPollingInterval] = useState(1);

  const [getAlertsByDateTrigger, { isUninitialized }] =
    useLazyGetAlertsByDateQuery();

  // Video Telematics API hooks
  const [getMettaxAlarmsTrigger] = useGetMettaxAlarmsMutation();
  const [getIndiaMettaxAlarmsTrigger] = useIndiaGetMettaxAlarmsMutation();
  const [getMettaxAlarmFileTrigger] = useGetMettaxAlarmFileMutation();
  const [getIndiaMettaxAlarmFileTrigger] = useIndiaGetMettaxAlarmFileMutation();
  const [getGPSTrackTechAlarms] = useGetAlarmInfoMutation();

  // Get vehicles with GPS details for video telematics
  const { data: vehicleDataWithGps } = useGetVehiclesByStatusQuery(
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

  const { data: alertsByUserData, isLoading: isGetAlertByUserDataLoading } =
    useGetUserAlertsQuery(
      { token: groupId, userId: userId },
      { skip: !groupId || !userId },
    );

  const isGetAlertsByDateLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getAlertsByDate" &&
        query.status === "pending",
    ),
  );

  const [api, notificationContextHolder] = notification.useNotification({
    duration: 0,
    placement: "bottomRight",
    maxCount: 1,
  });

  const [customDateRange, setCustomDateRange] = useState([
    setHours(setMinutes(new Date(), 0), 0),
    new Date(),
  ]);
  const [customDateRangeChanged, setCustomDateRangeChanged] = useState(false);

  const checkIfKmtOrKmtSubUser = () => {
    return (
      Number(userId) === 3356 ||
      Number(parentUser) === 3356 ||
      Number(userId) === 82815 ||
      Number(parentUser) === 82815 ||
      Number(userId) === 84245 ||
      Number(userId) === 83567 ||
      Number(userId) === 84343 ||
      Number(userId) === 78069 ||
      Number(userId) === 81858 ||
      Number(userId) === 81841 ||
      Number(userId) === 5982 ||
      Number(userId) === 79918 ||
      Number(userId) === 81357 ||
      Number(userId) === 81358 ||
      Number(userId) === 85939 ||
      Number(userId) === 82600 ||
      Number(userId) === 84278 ||
      Number(userId) === 85048 ||
      Number(userId) === 87470 ||
      Number(parentUser) === 87470 ||
      Number(userId) === 833105 ||
      Number(userId) === 81707 ||
      Number(userId) === 87115 ||
      Number(userId) === 833783 ||
      Number(userId) === 4343
    );
  };

  useEffect(() => {
    if (!isGetAlertByUserDataLoading) {
      if (checkIfKmtOrKmtSubUser()) {
        let kmtAlertOptions = [
          {
            label: "Harsh Acceleration",
            value: "harshAcceleration",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["Start Location"]: false,
              ["End Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Harsh Break",
            value: "harshBreaking",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Main Power Disconnected",
            value: "Mainpower",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Main Power Connected",
            value: "MainpowerConnected",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Internal Battery Disconnected",
            value: "Internalpower",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Speed: false,
              Distance: false,
              Duration: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Overspeed",
            value: "OverSpeed",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Free Wheeling",
            value: "Freewheeling",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Diagnosed RPM",
            value: "freewheelingWrong",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "Continuous Drive",
            value: "ContinousDrive",
            columns: {
              ...allColumnTypes,
              Distance: false,
              Speed: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Night Drive",
            value: "NightDrive",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Posco Overspeed",
            value: "PoscoOverspeed",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Acceleration",
            value: "Acceleration",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "Battery",
            value: "Battery",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "Brake",
            value: "Brake",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "Engine",
            value: "Engine",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "SafetySystems",
            value: "SafetySystems",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "Sensor",
            value: "Sensor",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "General",
            value: "General",
            columns: {
              ...allColumnTypes,
              ["Start Time"]: false,
              ["End Time"]: false,
              ["End Location"]: false,
              ["Halting Hour"]: false,
              Duration: false,
              Remarks: false,
              Speed: false,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Invoice No"]: false,
              ["Alert Status"]: false,
            },
          },
          {
            label: "Alcohol",
            value: "Alcohol",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              ["Remarks"]: false,
              ["Invoice Date"]: false,
              ["Invoice No"]: false,
              ["Halting Hour"]: false,
              ["Alert Status"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          // Video Telematics Alerts
          {
            label: "Forward Collision Warning",
            value: "forwardCollisionWarning",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Fatigue Alarm",
            value: "fatigueAlarm",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Fatigue Warning",
            value: "fatigueWarn",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Both Hands Off Steering Wheel",
            value: "bothHandsOffSteeringWheel",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Handheld Phone Call",
            value: "handheldPhoneCall",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Long Time Without Looking Ahead",
            value: "longTimeWithoutLookingAhead",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Smoking",
            value: "smoking",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Occlusion",
            value: "occlusion",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Speed",
            value: "speed",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Rapid",
            value: "rapid",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Slow",
            value: "slow",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Wheel",
            value: "wheel",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Forward collision",
            value: "forwardCollisionWarning",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Fatigue alarm",
            value: "fatigueAlarm",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Fatigue warning",
            value: "fatigueWarn",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Hand Off detection (HOD)",
            value: "bothHandsOffSteeringWheel",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Phone Calling",
            value: "handheldPhoneCall",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Distracted driving",
            value: "longTimeWithoutLookingAhead",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Smoking",
            value: "smoking",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
          {
            label: "Camera Blocked",
            value: "occlusion",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Distance: false,
              Duration: false,
              Speed: false,
              ["End Location"]: false,
              ["End Time"]: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
        ];

        if (
          Number(userId) === 81707 ||
          Number(userId) === 87115 ||
          Number(userId) === 833783
        ) {
          kmtAlertOptions = kmtAlertOptions.filter(
            (option) =>
              ![
                "Internal Battery Disconnected",
                "Main Power Connected",
                "Main Power Disconnected",
                "Night Drive",
              ].includes(option.label),
          );
        }

        // Filter out empty alert categories if they have no data
        if (alertsByUserData && alertsByUserData.length) {
          kmtAlertOptions = kmtAlertOptions.filter((option) => {
            if (option.label === "All") return true;
            const hasAlerts = alertsByUserData?.some(
              (alert: string | { status: string }) =>
                typeof alert === "string" && alert === option.label,
            );
            return hasAlerts;
          });
        }

        setAlertOptions(kmtAlertOptions);
      } else if (
        Number(userId) === 5275 ||
        Number(userId) === 833381 ||
        Number(userId) === 83558
      ) {
        setAlertOptions([
          {
            label: "All",
            value: "All",
            columns: {
              ...allColumnTypes,
              ["Running Hrs"]: false,
              ["Total Stoppages"]: false,
              ["Alert Receiving Time"]: false,
              Speed: false,
              ["Halting Hour"]: false,
              ["Invoice No"]: false,
              ["Invoice Date"]: false,
              ["Remarks"]: false,
              ["Alert Status"]: false,
              ["Deviate Route"]: false,
              Description: false,
              Alert: false,
              SetAt: false,
              Severity: false,
              Code: false,
            },
          },
        ]);
      } else {
        if (
          !isGetAlertByUserDataLoading &&
          alertsByUserData &&
          alertsByUserData.length
        ) {
          const alertOptionFilteredByUser = allAlertOptions.filter((option) =>
            alertsByUserData?.some(
              (alert: string | { status: string }) =>
                (typeof alert === "string" && alert === option.label) ||
                option.label === "All",
            ),
          );

          let finalFilteredOptions = alertOptionFilteredByUser;
          if (Number(userId) === 833105) {
            finalFilteredOptions = alertOptionFilteredByUser.filter(
              (option) =>
                ![
                  "Continuous Drive",
                  "Night Drive",
                  "Alcohol",
                  "Padlock",
                  "Overspeed",
                  "Posco Overspeed",
                ].includes(option.label),
            );
          } else if (
            Number(userId) === 81707 ||
            Number(userId) === 87115 ||
            Number(userId) === 833783
          ) {
            finalFilteredOptions = alertOptionFilteredByUser.filter(
              (option) =>
                ![
                  "Internal Battery Disconnected",
                  "Main Power Connected",
                  "Main Power Disconnected",
                  "Night Drive",
                ].includes(option.label),
            );
          }

          finalFilteredOptions = finalFilteredOptions.filter((option) => {
            if (option.label === "All") return true;

            const othersAlertTypes = [
              "Padlock",
              "Alcohol",
              "Overspeed",
              "Posco Overspeed",
            ];
            if (othersAlertTypes.includes(option.label)) {
              // Check if this alert type has any count in alertsByUserData
              const hasAlerts = alertsByUserData?.some(
                (alert: string | { status: string }) =>
                  typeof alert === "string" && alert === option.label,
              );
              return hasAlerts;
            }

            return true;
          });

          setAlertOptions(finalFilteredOptions);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGetAlertByUserDataLoading]);

  useEffect(() => {
    if (alertOptions !== undefined && alertOptions.length === 0) {
      setLoading(false);
    }
  }, [alertOptions]);

  const videoTelematicsAlerts = useMemo(() => {
    const getVideoAlertCount = (alarmType: string) => {
      const matchingAlerts = videoAlerts.filter(
        (alert) => alert.alarmType === alarmType,
      );
      // Apply suppression logic to get accurate count
      const suppressedAlerts = applySuppression(matchingAlerts);
      const count = suppressedAlerts.length;
      return count;
    };

    return [
      {
        label: "Seatbelt Detection",
        title: "Seatbelt Detection",
        value: "seatBelt" as const,
        type: "VIDEO_TELEMATICS" as const,
        count: getVideoAlertCount("seatBelt"),
        isNewData: false,
      },
      {
        label: "Phone Calling",
        title: "Phone Calling",
        value: "handheldPhoneCall" as const,
        type: "VIDEO_TELEMATICS" as const,
        count: getVideoAlertCount("handheldPhoneCall"),
        isNewData: false,
      },
      {
        label: "Smoking",
        title: "Smoking",
        value: "smoking" as const,
        type: "VIDEO_TELEMATICS" as const,
        count: getVideoAlertCount("smoking"),
        isNewData: false,
      },
      {
        label: "Fatigue warning",
        title: "Fatigue warning",
        value: "fatigueWarn" as const,
        type: "VIDEO_TELEMATICS" as const,
        count: getVideoAlertCount("fatigueWarn"),
        isNewData: false,
      },
    ];
  }, [videoAlerts, selectedVehicle]);

  // E-Lock alerts state and API integration
  const [eLockAlertCounts, setELockAlertCounts] = useState({
    unlockOnMove: 0,
    unlockOutsideGeofence: 0,
    unhealth: 0,
  });

  const [eLockAlertsData, setELockAlertsData] = useState<any[]>([]);

  const [unhealthyElockAlertsData, setUnhealthyElockAlertsData] = useState<
    any[]
  >([]);

  const [overSpeedAlertsData, setOverSpeedAlertsData] = useState<any[]>([]);
  const [enrouteHaltAlertsData, setEnrouteHaltAlertsData] = useState<any[]>([]);
  const [geofenceHaltAlertsData, setGeofenceHaltAlertsData] = useState<any[]>(
    [],
  );
  const [vehicleHealthAlertsData, setVehicleHealthAlertsData] = useState<any[]>(
    [],
  );
  const [harshAccelerationAlertsData, setHarshAccelerationAlertsData] =
    useState<any[]>([]);
  const [harshBreakAlertsData, setHarshBreakAlertsData] = useState<any[]>([]);
  const [freewheelingAlertsData, setFreewheelingAlertsData] = useState<any[]>(
    [],
  );

  const fetchELockAlerts = async () => {
    let data: any = false;
    let retryCount = 0;

    while (data === false && retryCount < 10) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_REACT_API}/alerts_popups.php?token=${groupId}`,
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        data = await response.json();
        if (data === false || data === "false" || !Array.isArray(data)) {
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= 10) {
          setELockAlertsData([]);
          setUnhealthyElockAlertsData([]);
          setOverSpeedAlertsData([]);
          setEnrouteHaltAlertsData([]);
          setGeofenceHaltAlertsData([]);
          setVehicleHealthAlertsData([]);
          setHarshAccelerationAlertsData([]);
          setHarshBreakAlertsData([]);
          setFreewheelingAlertsData([]);
          setELockAlertCounts({
            unlockOnMove: 0,
            unlockOutsideGeofence: 0,
            unhealth: 0,
          });

          // Reset DTC alert counts to 0 on fetch failure
          setAlertCount((prev) =>
            prev.map((category) => {
              if (
                [
                  "engine",
                  "acceleration",
                  "brake",
                  "sensor",
                  "battery",
                  "safetySystems",
                  "general",
                ].includes(category.value)
              ) {
                return {
                  ...category,
                  count: 0,
                  isNewData: false,
                };
              }
              return category;
            }),
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (data === false || data === "false" || !Array.isArray(data)) {
      setELockAlertsData([]);
      setUnhealthyElockAlertsData([]);
      setOverSpeedAlertsData([]);
      setEnrouteHaltAlertsData([]);
      setGeofenceHaltAlertsData([]);
      setVehicleHealthAlertsData([]);
      setHarshAccelerationAlertsData([]);
      setHarshBreakAlertsData([]);
      setFreewheelingAlertsData([]);
      setELockAlertCounts({
        unlockOnMove: 0,
        unlockOutsideGeofence: 0,
        unhealth: 0,
      });

      setAlertCount((prev) =>
        prev.map((category) => {
          if (
            [
              "engine",
              "acceleration",
              "brake",
              "sensor",
              "battery",
              "safetySystems",
              "general",
            ].includes(category.value)
          ) {
            return {
              ...category,
              count: 0,
              isNewData: false,
            };
          }
          return category;
        }),
      );
      return;
    }

    try {
      const isVehicleActive = (vehicle: any): boolean => {
        const inactiveStatus = vehicle.gpsDtl?.inactiveStatus;
        return inactiveStatus !== 1 && inactiveStatus !== "1";
      };

      const filterActiveVehicleAlerts = (alerts: any[]): any[] => {
        if (!Array.isArray(alerts)) {
          return [];
        }
        if (!vehicleDataWithGps?.list) {
          return alerts;
        }

        return alerts.filter((alert) => {
          try {
            if (alert.remark && alert.remark.trim() !== "") {
              return false;
            }

            const vehReg =
              alert.vehicleno ||
              alert.vehicle_no ||
              alert.vehicleNum ||
              alert.vehReg ||
              alert.vehicleNumber;

            if (!vehReg) return true;

            const vehRegStr = vehReg.toString().trim();
            if (
              vehRegStr === "" ||
              vehRegStr.toLowerCase() === "unknown vehicle" ||
              vehRegStr.toLowerCase() === "unknown"
            ) {
              return false;
            }

            const cleanVehReg = vehRegStr.replace(/\s+[AB]\s*$/i, "").trim();

            const matchedVehicle = vehicleDataWithGps.list.find(
              (vehicle: any) => {
                const vehicleReg = vehicle.vehReg?.toString().trim();
                return vehicleReg === cleanVehReg || vehicleReg === vehRegStr;
              },
            );
            return !matchedVehicle || isVehicleActive(matchedVehicle);
          } catch (error) {
            console.error("Error filtering alert:", error, alert);
            return true;
          }
        });
      };

      if (Array.isArray(data) && data.length > 0) {
        try {
          const specificLockAlerts = data.filter((alert: any) => {
            const type = String(alert.alert_type || "").toLowerCase();
            return (
              type === "unlock on move" ||
              type === "unlock outside geofence" ||
              type === "door open in non-geofence"
            );
          });
          const unhealthyAlerts = data.filter(
            (alert: any) =>
              alert.alert_type?.toLowerCase() === "unhealthy elock alert",
          );
          const overSpeedAlerts = data.filter(
            (alert: any) =>
              alert.alert_type === "OverSpeed" ||
              alert.alert_type === "Overspeed" ||
              alert.alert_type === "Over Speed",
          );
          const enrouteHaltAlerts = data.filter(
            (alert: any) => alert.alert_type === "Enroute Halt Alert",
          );
          const geofenceHaltAlerts = data.filter(
            (alert: any) => alert.alert_type === "Geofence Halt Alert",
          );
          const vehicleHealthAlerts = data.filter(
            (alert: any) => alert.alert_type === "Vehicle Health Alert",
          );
          const harshAccelerationAlerts = data.filter(
            (alert: any) =>
              alert.alert_type === "Harsh Acceleration" ||
              alert.alert_type === "harsh acceleration",
          );
          const harshBreakAlerts = data.filter(
            (alert: any) =>
              alert.alert_type === "Harsh Break" ||
              alert.alert_type === "Harsh Brake" ||
              alert.alert_type === "harsh break" ||
              alert.alert_type === "harsh brake" ||
              alert.alert_type === "Harsh Braking",
          );
          const freewheelingAlerts = data.filter(
            (alert: any) =>
              alert.alert_type === "Freewheeling" ||
              alert.alert_type === "Free Wheeling" ||
              alert.alert_type === "freewheeling",
          );

          const activeLockAlerts =
            filterActiveVehicleAlerts(specificLockAlerts);
          const activeUnhealthyAlerts =
            filterActiveVehicleAlerts(unhealthyAlerts);
          const activeOverSpeedAlerts =
            filterActiveVehicleAlerts(overSpeedAlerts);
          const activeEnrouteHaltAlerts =
            filterActiveVehicleAlerts(enrouteHaltAlerts);
          const activeGeofenceHaltAlerts =
            filterActiveVehicleAlerts(geofenceHaltAlerts);
          const activeVehicleHealthAlerts =
            filterActiveVehicleAlerts(vehicleHealthAlerts);
          const activeHarshAccelerationAlerts = filterActiveVehicleAlerts(
            harshAccelerationAlerts,
          );
          const activeHarshBreakAlerts =
            filterActiveVehicleAlerts(harshBreakAlerts);
          const activeFreewheelingAlerts =
            filterActiveVehicleAlerts(freewheelingAlerts);

          setELockAlertsData(activeLockAlerts);

          const convertedUnhealthyAlerts = activeUnhealthyAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.alert_time,
              endtime: alert.datetime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: alert.alert_type,
              message: alert.msg,
              location: alert.location || alert.msg,
              endlocation: "",
              duration: "",
            }),
          );

          const deduplicateUnhealthyAlerts = (alerts: any[]) => {
            const latestByVehicle = new Map<string, any>();

            alerts.forEach((alert) => {
              const vehicleNo = (alert.vehicleno || alert.vehicle_no || "")
                .toString()
                .trim();

              if (!vehicleNo) {
                return;
              }

              const alertTime = moment(
                alert.datetime || alert.starttime || alert.alert_time || "",
              );
              const existingAlert = latestByVehicle.get(vehicleNo);
              const existingTime = moment(
                existingAlert?.datetime ||
                  existingAlert?.starttime ||
                  existingAlert?.alert_time ||
                  "",
              );

              if (
                !existingAlert ||
                (alertTime.isValid() &&
                  (!existingTime.isValid() || alertTime.isAfter(existingTime)))
              ) {
                latestByVehicle.set(vehicleNo, alert);
              }
            });

            return Array.from(latestByVehicle.values());
          };

          // Filter data by current date range for counting
          let filteredLockAlerts = activeLockAlerts;
          let filteredUnhealthyAlerts = convertedUnhealthyAlerts;
          let filteredOverSpeedAlerts = activeOverSpeedAlerts;
          let filteredEnrouteHaltAlerts = activeEnrouteHaltAlerts;
          let filteredGeofenceHaltAlerts = activeGeofenceHaltAlerts;
          let filteredVehicleHealthAlerts = activeVehicleHealthAlerts;
          let filteredHarshAccelerationAlerts = activeHarshAccelerationAlerts;
          let filteredHarshBreakAlerts = activeHarshBreakAlerts;
          let filteredFreewheelingAlerts = activeFreewheelingAlerts;

          if (customDateRange.length === 2) {
            try {
              const startDate = moment(customDateRange[0]);
              const endDate = moment(customDateRange[1]);

              if (!startDate.isValid() || !endDate.isValid()) {
                console.warn("Invalid date range provided");
              } else {
                filteredLockAlerts = activeLockAlerts.filter((alert: any) => {
                  const alertTime =
                    alert.datetime || alert.starttime || alert.alert_time;
                  if (!alertTime || alertTime === "0000-00-00 00:00:00")
                    return false;

                  const alertMoment = moment(alertTime);
                  if (!alertMoment.isValid()) return false;
                  return alertMoment.isBetween(startDate, endDate, "day", "[]");
                });

                filteredUnhealthyAlerts = convertedUnhealthyAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );

                filteredOverSpeedAlerts = activeOverSpeedAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );

                filteredEnrouteHaltAlerts = activeEnrouteHaltAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );

                filteredGeofenceHaltAlerts = activeGeofenceHaltAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );

                filteredVehicleHealthAlerts = activeVehicleHealthAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.gps_time ||
                      alert.datetime ||
                      alert.starttime ||
                      alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );

                filteredHarshAccelerationAlerts =
                  activeHarshAccelerationAlerts.filter((alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  });

                filteredHarshBreakAlerts = activeHarshBreakAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );

                filteredFreewheelingAlerts = activeFreewheelingAlerts.filter(
                  (alert: any) => {
                    const alertTime =
                      alert.datetime || alert.starttime || alert.alert_time;
                    if (!alertTime || alertTime === "0000-00-00 00:00:00")
                      return false;

                    const alertMoment = moment(alertTime);
                    if (!alertMoment.isValid()) return false;
                    return alertMoment.isBetween(
                      startDate,
                      endDate,
                      "day",
                      "[]",
                    );
                  },
                );
              }
            } catch (error) {
              console.error("Error filtering by date range:", error);
            }
          }

          const deduplicatedUnhealthyAlerts = deduplicateUnhealthyAlerts(
            filteredUnhealthyAlerts,
          );

          setUnhealthyElockAlertsData(deduplicatedUnhealthyAlerts);

          const unlockOnMoveCount = filteredLockAlerts.filter(
            (alert: any) =>
              String(alert.alert_type || "").toLowerCase() === "unlock on move",
          ).length;

          const unlockOutsideGeofenceCount = filteredLockAlerts.filter(
            (alert: any) => {
              const type = String(alert.alert_type || "").toLowerCase();
              return (
                type === "unlock outside geofence" ||
                type === "door open in non-geofence"
              );
            },
          ).length;

          const unhealthCount = deduplicatedUnhealthyAlerts.length;
          setELockAlertCounts({
            unlockOnMove: unlockOnMoveCount,
            unlockOutsideGeofence: unlockOutsideGeofenceCount,
            unhealth: unhealthCount,
          });

          const deduplicateDriverBehaviourAlerts = (alerts: any[]) => {
            const uniqueMap = new Map<string, any>();
            alerts.forEach((alert) => {
              const vehNo = alert.vehicleno || alert.vehicle_no || "";
              const dateTime =
                alert.datetime || alert.starttime || alert.alert_time || "";
              const roundedTime = moment(dateTime).format("YYYY-MM-DD HH:mm");
              const uniqueKey = `${vehNo.toString().trim()}_${roundedTime}`;
              if (!uniqueMap.has(uniqueKey)) {
                uniqueMap.set(uniqueKey, alert);
              }
            });
            return Array.from(uniqueMap.values());
          };

          const convertedOverSpeedAlerts = filteredOverSpeedAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.starttime || alert.alert_time,
              endtime: alert.datetime || alert.endtime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "OverSpeed",
              alerttype: "OverSpeed",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.duration || "",
            }),
          );
          // Deduplicate overspeed alerts
          const deduplicatedOverSpeedAlerts = deduplicateDriverBehaviourAlerts(
            convertedOverSpeedAlerts,
          );
          setOverSpeedAlertsData(deduplicatedOverSpeedAlerts);

          const convertedEnrouteHaltAlerts = filteredEnrouteHaltAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.starttime || alert.alert_time,
              endtime: alert.datetime || alert.endtime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "Enroute Halt Alert",
              alerttype: "Enroute Halt Alert",
              exception_type: "Enroute Halt Alert",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.issue || "",
            }),
          );
          const deduplicatedEnrouteHaltAlerts =
            deduplicateDriverBehaviourAlerts(convertedEnrouteHaltAlerts);
          setEnrouteHaltAlertsData(deduplicatedEnrouteHaltAlerts);

          const convertedGeofenceHaltAlerts = filteredGeofenceHaltAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.starttime || alert.alert_time,
              endtime: alert.datetime || alert.endtime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "Geofence Halt Alert",
              alerttype: "Geofence Halt Alert",
              exception_type: "Geofence Halt Alert",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.issue || "",
            }),
          );
          const deduplicatedGeofenceHaltAlerts =
            deduplicateDriverBehaviourAlerts(convertedGeofenceHaltAlerts);
          setGeofenceHaltAlertsData(deduplicatedGeofenceHaltAlerts);

          // Store and process Vehicle Health Alerts data
          filteredVehicleHealthAlerts = limitLatestAlertsPerVehicle(
            filteredVehicleHealthAlerts,
          );

          const convertedVehicleHealthAlerts = filteredVehicleHealthAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime:
                alert.gps_time ||
                alert.datetime ||
                alert.starttime ||
                alert.alert_time,
              endtime:
                alert.gps_time ||
                alert.datetime ||
                alert.endtime ||
                alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "Vehicle Health Alert",
              alerttype: "Vehicle Health Alert",
              exception_type: "Vehicle Health Alert",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.issue || "",
              remark: alert.msg || "Vehicle Health Alert",
            }),
          );
          setVehicleHealthAlertsData(convertedVehicleHealthAlerts);

          // Store and process Harsh Acceleration Alerts data
          const convertedHarshAccelerationAlerts =
            filteredHarshAccelerationAlerts.map((alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.starttime || alert.alert_time,
              endtime: alert.datetime || alert.endtime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "Harsh Acceleration",
              alerttype: "Harsh Acceleration",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.duration || "",
            }));

          // Store and process Harsh Break Alerts data
          const convertedHarshBreakAlerts = filteredHarshBreakAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.starttime || alert.alert_time,
              endtime: alert.datetime || alert.endtime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "Harsh Break",
              alerttype: "Harsh Break",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.duration || "",
            }),
          );

          // Store and process Freewheeling Alerts data
          const convertedFreewheelingAlerts = filteredFreewheelingAlerts.map(
            (alert: any) => ({
              ...alert,
              starttime: alert.datetime || alert.starttime || alert.alert_time,
              endtime: alert.datetime || alert.endtime || alert.alert_time,
              vehicleno: alert.vehicleno || alert.vehicle_no,
              AlertType: "Freewheeling",
              alerttype: "Freewheeling",
              message: alert.msg || alert.message,
              location: alert.location || alert.msg,
              endlocation: alert.endlocation || "",
              duration: alert.duration || "",
            }),
          );

          const allDriverBehaviourConverted = [
            ...convertedHarshAccelerationAlerts.map((a: any) => ({
              ...a,
              _dbType: "harshAcceleration",
            })),
            ...convertedHarshBreakAlerts.map((a: any) => ({
              ...a,
              _dbType: "harshBreak",
            })),
            ...convertedFreewheelingAlerts.map((a: any) => ({
              ...a,
              _dbType: "freewheeling",
            })),
          ];
          const crossTypeDeduplicated = (() => {
            const uniqueMap = new Map<string, any>();
            allDriverBehaviourConverted.forEach((alert: any) => {
              const vehNo = alert.vehicleno || alert.vehicle_no || "";
              const dateTime =
                alert.datetime || alert.starttime || alert.alert_time || "";
              const roundedTime = moment(dateTime).format("YYYY-MM-DD HH:mm");
              const uniqueKey = `${vehNo.toString().trim()}_${roundedTime}`;
              if (!uniqueMap.has(uniqueKey)) {
                uniqueMap.set(uniqueKey, alert);
              }
            });
            return Array.from(uniqueMap.values());
          })();
          const crossTypeCapped = limitLatestAlertsPerVehicle(
            crossTypeDeduplicated,
          );

          const deduplicatedHarshAccelerationAlerts = crossTypeCapped.filter(
            (a: any) => a._dbType === "harshAcceleration",
          );
          const deduplicatedHarshBreakAlerts = crossTypeCapped.filter(
            (a: any) => a._dbType === "harshBreak",
          );
          const deduplicatedFreewheelingAlerts = crossTypeCapped.filter(
            (a: any) => a._dbType === "freewheeling",
          );

          setHarshAccelerationAlertsData(deduplicatedHarshAccelerationAlerts);
          setHarshBreakAlertsData(deduplicatedHarshBreakAlerts);
          setFreewheelingAlertsData(deduplicatedFreewheelingAlerts);

          const dtcCounts = {
            engine: 0,
            acceleration: 0,
            brake: 0,
            sensor: 0,
            battery: 0,
            safetySystems: 0,
            general: 0,
          };

          convertedVehicleHealthAlerts.forEach((alert: any) => {
            const alertMsg = alert.remark || alert.msg || "";
            const dtcCategory = extractDtcCategoryFromMessage(alertMsg);
            dtcCounts[dtcCategoryToCountKey(dtcCategory)]++;
          });
          setAlertCount((prev) =>
            prev.map((category) => {
              if (
                category.value === "OverSpeed" ||
                category.value === "overspeedKMT"
              ) {
                return {
                  ...category,
                  count: deduplicatedOverSpeedAlerts.length,
                  isNewData: deduplicatedOverSpeedAlerts.length > 0,
                };
              }
              if (category.value === "enrouteIdle") {
                return {
                  ...category,
                  count: deduplicatedEnrouteHaltAlerts.length,
                  isNewData: deduplicatedEnrouteHaltAlerts.length > 0,
                };
              }
              if (category.value === "idleAtGeofence") {
                return {
                  ...category,
                  count: deduplicatedGeofenceHaltAlerts.length,
                  isNewData: deduplicatedGeofenceHaltAlerts.length > 0,
                };
              }
              // Update DTC category counts
              if (category.value === "engine") {
                return {
                  ...category,
                  count: dtcCounts.engine,
                  isNewData: dtcCounts.engine > 0,
                };
              }
              if (category.value === "acceleration") {
                return {
                  ...category,
                  count: dtcCounts.acceleration,
                  isNewData: dtcCounts.acceleration > 0,
                };
              }
              if (category.value === "brake") {
                return {
                  ...category,
                  count: dtcCounts.brake,
                  isNewData: dtcCounts.brake > 0,
                };
              }
              if (category.value === "sensor") {
                return {
                  ...category,
                  count: dtcCounts.sensor,
                  isNewData: dtcCounts.sensor > 0,
                };
              }
              if (category.value === "battery") {
                return {
                  ...category,
                  count: dtcCounts.battery,
                  isNewData: dtcCounts.battery > 0,
                };
              }
              if (category.value === "safetySystems") {
                return {
                  ...category,
                  count: dtcCounts.safetySystems,
                  isNewData: dtcCounts.safetySystems > 0,
                };
              }
              if (category.value === "general") {
                return {
                  ...category,
                  count: dtcCounts.general,
                  isNewData: dtcCounts.general > 0,
                };
              }
              if (category.value === "harshAcceleration") {
                return {
                  ...category,
                  count: deduplicatedHarshAccelerationAlerts.length,
                  isNewData: deduplicatedHarshAccelerationAlerts.length > 0,
                };
              }
              if (category.value === "harshBreak") {
                return {
                  ...category,
                  count: deduplicatedHarshBreakAlerts.length,
                  isNewData: deduplicatedHarshBreakAlerts.length > 0,
                };
              }
              if (category.value === "freewheeling") {
                return {
                  ...category,
                  count: deduplicatedFreewheelingAlerts.length,
                  isNewData: deduplicatedFreewheelingAlerts.length > 0,
                };
              }
              return category;
            }),
          );
        } catch (error) {
          console.error("Error processing E-Lock alerts:", error);
          setELockAlertsData([]);
          setUnhealthyElockAlertsData([]);
          setOverSpeedAlertsData([]);
          setEnrouteHaltAlertsData([]);
          setGeofenceHaltAlertsData([]);
          setHarshAccelerationAlertsData([]);
          setHarshBreakAlertsData([]);
          setFreewheelingAlertsData([]);
          setELockAlertCounts({
            unlockOnMove: 0,
            unlockOutsideGeofence: 0,
            unhealth: 0,
          });
        }
      } else {
        setELockAlertsData([]);
        setUnhealthyElockAlertsData([]);
        setOverSpeedAlertsData([]);
        setEnrouteHaltAlertsData([]);
        setGeofenceHaltAlertsData([]);
        setVehicleHealthAlertsData([]);
        setHarshAccelerationAlertsData([]);
        setHarshBreakAlertsData([]);
        setFreewheelingAlertsData([]);
        setELockAlertCounts({
          unlockOnMove: 0,
          unlockOutsideGeofence: 0,
          unhealth: 0,
        });

        // Reset DTC alert counts to 0
        setAlertCount((prev) =>
          prev.map((category) => {
            if (
              [
                "engine",
                "acceleration",
                "brake",
                "sensor",
                "battery",
                "safetySystems",
                "general",
              ].includes(category.value)
            ) {
              return {
                ...category,
                count: 0,
                isNewData: false,
              };
            }
            return category;
          }),
        );
      }
    } catch (error) {
      setELockAlertsData([]);
      setUnhealthyElockAlertsData([]);
      setOverSpeedAlertsData([]);
      setEnrouteHaltAlertsData([]);
      setGeofenceHaltAlertsData([]);
      setVehicleHealthAlertsData([]);
      setHarshAccelerationAlertsData([]);
      setHarshBreakAlertsData([]);
      setFreewheelingAlertsData([]);
      setELockAlertCounts({
        unlockOnMove: 0,
        unlockOutsideGeofence: 0,
        unhealth: 0,
      });

      // Reset DTC alert counts to 0 on error
      setAlertCount((prev) =>
        prev.map((category) => {
          if (
            [
              "engine",
              "acceleration",
              "brake",
              "sensor",
              "battery",
              "safetySystems",
              "general",
            ].includes(category.value)
          ) {
            return {
              ...category,
              count: 0,
              isNewData: false,
            };
          }
          return category;
        }),
      );
    }
  };

  // E-Lock alerts computation with real API data
  const eLockAlerts = useMemo(() => {
    if (Number(accessLabel) !== 6) {
      return [];
    }

    return [
      {
        label: "Unlock on Move",
        title: "Unlock on Move",
        value: "unlockOnMove" as const,
        type: "E_LOCK" as const,
        count: eLockAlertCounts.unlockOnMove,
        isNewData: eLockAlertCounts.unlockOnMove > 0,
      },
      {
        label: "Unlock outside Geofence",
        title: "Unlock outside Geofence",
        value: "unlockOutsideGeofence" as const,
        type: "E_LOCK" as const,
        count: eLockAlertCounts.unlockOutsideGeofence,
        isNewData: eLockAlertCounts.unlockOutsideGeofence > 0,
      },
      {
        label: "Unhealthy",
        title: "Unhealthy",
        value: "unhealth" as const,
        type: "E_LOCK" as const,
        count: unhealthyElockAlertsData.length,
        isNewData: unhealthyElockAlertsData.length > 0,
      },
    ];
  }, [accessLabel, eLockAlertCounts, unhealthyElockAlertsData.length]);

  // Fuel alerts computation - for specific users
  const fuelAlerts = useMemo(() => {
    if (!FUEL_USER_IDS.includes(Number(userId))) {
      return [];
    }

    return [
      {
        label: "Fuel Theft",
        title: "Fuel Theft",
        value: "fuelTheft" as const,
        type: "FUEL" as const,
        count: 0, // This would come from an actual API call
        isNewData: false,
      },
      {
        label: "Fuel Power Disconnected",
        title: "Fuel Power Disconnected",
        value: "fuelPowerDisconnected" as const,
        type: "FUEL" as const,
        count: 0, // This would come from an actual API call
        isNewData: false,
      },
    ];
  }, [userId]);

  // GPS alerts computation - for specific users
  const gpsAlerts = useMemo(() => {
    if (!GPS_USER_IDS.includes(Number(userId))) {
      return [];
    }

    // Helper function to parse duration string to total minutes
    const parseDurationToMinutes = (modeTime: string): number => {
      if (!modeTime || modeTime === "N/A") return 0;

      const timeStr = modeTime.toLowerCase();
      let totalMinutes = 0;

      // Extract days and convert to minutes
      const daysMatch = timeStr.match(/(\d+)\s*days?/);
      if (daysMatch) {
        totalMinutes += parseInt(daysMatch[1]) * 24 * 60;
      }

      // Extract hours and convert to minutes
      const hoursMatch = timeStr.match(/(\d+)\s*hrs?/);
      if (hoursMatch) {
        totalMinutes += parseInt(hoursMatch[1]) * 60;
      }

      // Extract minutes
      const minutesMatch = timeStr.match(/(\d+)\s*min/);
      if (minutesMatch) {
        totalMinutes += parseInt(minutesMatch[1]);
      }

      return totalMinutes;
    };

    const enrouteIdleCount =
      vehicleDataWithGps?.list?.filter((vehicle) => {
        const hasNoPoI = vehicle.gpsDtl?.latLngDtl?.poi === "No Nearest POI";
        const modeTime = vehicle.gpsDtl?.modeTime;
        const isNonActive = vehicle.gpsDtl.inactiveStatus === 1;
        const isMoreThan30Minutes = modeTime
          ? parseDurationToMinutes(modeTime) > 30
          : false;
        // Filter by today's date
        const today = moment().startOf("day");
        const gpsTime = vehicle.gpsDtl?.latLngDtl?.gpstime;
        const isToday = gpsTime ? moment(gpsTime).isSame(today, "day") : false;

        return hasNoPoI && isMoreThan30Minutes && !isNonActive && isToday;
      }).length || 0;

    const isMoreThan48Hours = (modeTime: string): boolean => {
      if (!modeTime) return false;
      const timeStr = modeTime.toLowerCase();

      const daysMatch = timeStr.match(/(\d+)\s*days?/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        if (days >= 2) return true;
      }

      const hoursMatch = timeStr.match(/(\d+)\s*hrs?/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

      const totalHours = (daysMatch ? parseInt(daysMatch[1]) * 24 : 0) + hours;

      return totalHours >= 48;
    };

    const idleAtGeofenceCount =
      vehicleDataWithGps?.list?.filter((vehicle) => {
        const isStopped = vehicle.gpsDtl?.mode === "STOPPED";
        const hasValidTime = vehicle.gpsDtl?.modeTime;
        const isNonActive = vehicle.gpsDtl.inactiveStatus === 1;
        const isMoreThan48 = hasValidTime
          ? isMoreThan48Hours(vehicle.gpsDtl.modeTime)
          : false;
        const isInGeofence =
          vehicle.gpsDtl?.latLngDtl?.poi &&
          vehicle.gpsDtl.latLngDtl.poi !== "No Nearest POI";
        const today = moment().startOf("day");
        const gpsTime = vehicle.gpsDtl?.latLngDtl?.gpstime;
        const isToday = gpsTime ? moment(gpsTime).isSame(today, "day") : false;

        return (
          isStopped &&
          hasValidTime &&
          isMoreThan48 &&
          isInGeofence &&
          !isNonActive &&
          isToday
        );
      }).length || 0;
    return [
      {
        label: "Enroute Idle",
        title: "Enroute Idle",
        value: "enrouteIdle" as const,
        type: "GPS" as const,
        count: enrouteIdleCount,
        isNewData: false,
      },
      {
        label: "Idle at Geofence",
        title: "Idle at Geofence",
        value: "idleAtGeofence" as const,
        type: "GPS" as const,
        count: idleAtGeofenceCount,
        isNewData: false,
      },
    ];
  }, [userId, vehicleDataWithGps, customDateRange]);

  useEffect(() => {
    if (userId) {
      const allAlertCounts = [
        {
          label: "Acceleration",
          title: "Acceleration",
          value: "acceleration" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Battery",
          title: "Battery",
          value: "battery" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Brake",
          title: "Brake",
          value: "brake" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Engine",
          title: "Engine",
          value: "engine" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "SafetySystems",
          title: "Safety Systems",
          value: "safetySystems" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Sensor",
          title: "Sensor",
          value: "sensor" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "General",
          title: "General",
          value: "general" as const,
          type: "DTC" as const,
          count: 0,
          isNewData: false,
        },
      ];

      const remainingAlerts = [
        {
          label: "Continuous Drive",
          title: "Continuous Drive",
          value: "contineousDrive" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Free Wheeling",
          title: "Free Wheeling",
          value: "freewheeling" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
        // Only include Diagnosed RPM for user 3356
        ...(Number(userId) === 3356
          ? [
              {
                label: "Diagnosed RPM",
                title: "Diagnosed RPM",
                value: "freewheelingWrong" as const,
                type: "DRIVER_BEHAVIOUR" as const,
                count: 0,
                isNewData: false,
              },
            ]
          : []),
        {
          label: "Harsh Acceleration",
          title: "Harsh Acceleration",
          value: "harshAcceleration" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Harsh Break",
          title: "Harsh Break",
          value: "harshBreak" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Night Drive",
          title: "Night Drive",
          value: "NightDrive" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Padlock",
          title: "Padlock",
          value: "padlock" as const,
          type: "OTHERS" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Internal Battery Disconnected",
          title: "Internal Battery Disconnected",
          value: "internalPower" as const,
          type: "OTHERS" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Overspeed",
          title: "Overspeed",
          value: "overspeedKMT" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Main Power Connected",
          title: "Main Power Connected",
          value: "MainpowerConnected" as const,
          type: "OTHERS" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Main Power Disconnected",
          title: "Main Power Disconnected",
          value: "mainpower" as const,
          type: "OTHERS" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Posco Overspeed",
          title: "Posco Overspeed",
          value: "PoscoOverspeed" as const,
          type: "OTHERS" as const,
          count: 0,
          isNewData: false,
        },
        {
          label: "Alcohol",
          title: "Alcohol",
          value: "alcohol" as const,
          type: "DRIVER_BEHAVIOUR" as const,
          count: 0,
          isNewData: false,
        },
      ];

      let finalAlertCounts = [...allAlertCounts, ...remainingAlerts];

      let filteredAlertCount = finalAlertCounts;
      if (Number(userId) === 833105) {
        filteredAlertCount = finalAlertCounts.filter(
          (category) =>
            ![
              "Continuous Drive",
              "Night Drive",
              "Alcohol",
              "Padlock",
              "Overspeed",
              "Posco Overspeed",
            ].includes(category.label),
        );
      } else if (Number(userId) === 81707) {
        filteredAlertCount = finalAlertCounts.filter(
          (category) =>
            ![
              "Internal Battery Disconnected",
              "Main Power Connected",
              "Main Power Disconnected",
              "Posco Overspeed",
              "Alcohol",
              "Padlock",
            ].includes(category.label),
        );
      } else if (Number(userId) !== 3356) {
        filteredAlertCount = finalAlertCounts.filter(
          (category) => !["Posco Overspeed"].includes(category.label),
        );
      }

      setAlertCount(filteredAlertCount);
    }
  }, [userId]);
  useEffect(() => {
    if (
      VIDEO_TELEMATICS_USER_IDS.includes(Number(userId)) &&
      videoTelematicsAlerts
    ) {
      setAlertCount((prevAlertCount) => {
        const nonVideoAlerts = prevAlertCount.filter(
          (alert) => alert.type !== "VIDEO_TELEMATICS",
        );
        return [...nonVideoAlerts, ...videoTelematicsAlerts];
      });
    }
  }, [videoTelematicsAlerts, userId]);

  useEffect(() => {
    if (groupId) {
      fetchELockAlerts();
    }
  }, [groupId, vehicleDataWithGps, customDateRange]);

  useEffect(() => {
    if (Number(accessLabel) === 6) {
      setAlertCount((prevAlertCount) => {
        const nonELockAlerts = prevAlertCount.filter(
          (alert) => alert.type !== "E_LOCK",
        );
        return [...nonELockAlerts, ...eLockAlerts];
      });
    }
  }, [eLockAlerts, accessLabel]);

  useEffect(() => {
    if (FUEL_USER_IDS.includes(Number(userId))) {
      setAlertCount((prevAlertCount) => {
        const nonFuelAlerts = prevAlertCount.filter(
          (alert) => alert.type !== "FUEL",
        );
        return [...nonFuelAlerts, ...fuelAlerts];
      });
    }
  }, [fuelAlerts, userId]);

  // Update GPS alerts for specific users
  useEffect(() => {
    if (GPS_USER_IDS.includes(Number(userId))) {
      setAlertCount((prevAlertCount) => {
        const nonGpsAlerts = prevAlertCount.filter(
          (alert) => alert.type !== "GPS",
        );
        return [...nonGpsAlerts, ...gpsAlerts];
      });
    }
  }, [gpsAlerts, userId]);

  useEffect(() => {
    if (isPollingEnabled) {
      const intervalId = setInterval(() => {
        setPollingInterval((prevCount) => {
          return prevCount + 1;
        });
        setCurrentTime(new Date());
      }, 900000);

      return () => {
        clearInterval(intervalId);
      };
    } else {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPollingEnabled]);

  useEffect(() => {
    if (userId) {
      if (alertOptions && alertOptions.length > 0 && !selectedAlertOption) {
        setSelectedAlertOption(alertOptions[0]);
      }

      const isKMTAccount = isKmtAccount(Number(userId), Number(parentUser));
      const allCategoriesToLoad = [
        {
          label: "Continuous Drive",
          apiType: "ContinousDrive",
          type: "DRIVER_BEHAVIOUR",
        },
        {
          label: "Free Wheeling",
          apiType: "Freewheeling",
          type: "DRIVER_BEHAVIOUR",
        },
        // Only include Diagnosed RPM for user 3356
        ...(Number(userId) === 3356
          ? [
              {
                label: "Diagnosed RPM",
                apiType: "freewheelingWrong",
                type: "DRIVER_BEHAVIOUR",
              },
            ]
          : []),
        {
          label: "Harsh Acceleration",
          apiType: "harshAcceleration",
          type: "DRIVER_BEHAVIOUR",
        },
        {
          label: "Harsh Break",
          apiType: "harshBreaking",
          type: "DRIVER_BEHAVIOUR",
        },
        {
          label: "Night Drive",
          apiType: "NightDrive",
          type: "DRIVER_BEHAVIOUR",
        },
        { label: "Padlock", apiType: "padlock", type: "OTHERS" },
        {
          label: "Internal Battery Disconnected",
          apiType: "Internalpower",
          type: "OTHERS",
        },
        { label: "Overspeed", apiType: "OverSpeed", type: "DRIVER_BEHAVIOUR" },
        {
          label: "Main Power Connected",
          apiType: "MainpowerConnected",
          type: "OTHERS",
        },
        {
          label: "Main Power Disconnected",
          apiType: "Mainpower",
          type: "OTHERS",
        },
        { label: "Posco Overspeed", apiType: "PoscoOverspeed", type: "OTHERS" },
        { label: "Alcohol", apiType: "alcohol", type: "DRIVER_BEHAVIOUR" },
      ];

      let categoriesToLoad = allCategoriesToLoad;
      if (Number(userId) === 833105) {
        categoriesToLoad = allCategoriesToLoad.filter(
          (category) =>
            ![
              "Continuous Drive",
              "Night Drive",
              "Alcohol",
              "Padlock",
              "Overspeed",
              "Posco Overspeed",
            ].includes(category.label),
        );
      } else if (Number(userId) === 81707) {
        categoriesToLoad = allCategoriesToLoad.filter(
          (category) =>
            ![
              "Internal Battery Disconnected",
              "Main Power Connected",
              "Main Power Disconnected",
              "Posco Overspeed",
              "Alcohol",
              "Padlock",
            ].includes(category.label),
        );
      } else if (Number(userId) !== 3356) {
        categoriesToLoad = allCategoriesToLoad.filter(
          (category) => !["Posco Overspeed"].includes(category.label),
        );
      }

      categoriesToLoad.forEach((category) => {
        fetchCategoryAlerts({
          alertType: category.apiType,
          categoryLabel: category.label,
          isPolling: false,
          isDTC: false,
        });
      });

      if (
        (alertOptions && alertOptions[0]?.value !== "All") ||
        Number(userId) === 5275 ||
        Number(userId) === 833381 ||
        Number(userId) === 83558
      ) {
        getAlertsByDateTrigger({
          userId: Number(userId) === 833381 ? "5275" : userId,
          startDateTime: moment(new Date())
            .startOf("day")
            .format("YYYY-MM-DD HH:mm:ss"),
          endDateTime: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
          alertType:
            Number(userId) === 5275 ||
            Number(userId) === 833381 ||
            Number(userId) === 83558
              ? "All"
              : alertOptions?.[0]?.value || "All",
          token: Number(userId) === 833381 ? "5267" : groupId,
          vehReg:
            isKMTAccount || Number(userId) === 81707
              ? selectedVehicle.vehReg
              : 0,
          vehId:
            isKMTAccount || Number(userId) === 81707 ? selectedVehicle.vId : 0,
        }).then(({ data }) => {
          if (data && data.list.length > 0) {
            getAdjustedAlerts({
              data: data.list,
              setAdjustAlertsAsList: setAdjustedAlertsAsList,
              setAlertCount,
              selectedAlertOption: "All",
              isDTC: false,
              userId: userId,
              allVehicles: allVehicles,
              setIsCountUpdating,
              countUpdateRef,
            });
          }
          setLoading(false);
        });
      }
    } else if (userId && alertOptions !== undefined) {
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, alertOptions]);

  useEffect(() => {
    if (
      VIDEO_TELEMATICS_USER_IDS.includes(Number(userId)) &&
      vehicleDataWithGps?.list?.length &&
      customDateRange.length === 2
    ) {
      fetchVideoTelematicsAlerts(customDateRange[0], customDateRange[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, vehicleDataWithGps?.list?.length, customDateRange]);

  const fetchCategoryAlerts = ({
    alertType,
    categoryLabel,
    isPolling,
    isDTC,
    useCustomDateRange = false,
  }: {
    alertType: string;
    categoryLabel: string;
    isPolling?: boolean;
    isDTC: boolean;
    useCustomDateRange?: boolean;
  }) => {
    if (alertType === "OverSpeed") {
      setAlertCount((prev) =>
        prev.map((category) => {
          if (
            category.value === "OverSpeed" ||
            category.value === "overspeedKMT"
          ) {
            return { ...category, count: overSpeedAlertsData.length };
          }
          return category;
        }),
      );
      setCategoryLoading((prev) => ({ ...prev, [categoryLabel]: false }));
      return;
    }

    setCategoryLoading((prev) => ({ ...prev, [categoryLabel]: true }));

    // Create timeout for this category
    const timeoutKey = `category-${categoryLabel}`;
    createTimeout(timeoutKey, () => {
      setCategoryLoading((prev) => ({ ...prev, [categoryLabel]: false }));
    });

    const startDateTime =
      useCustomDateRange && customDateRange.length && customDateRange[0]
        ? moment(customDateRange[0]).format("YYYY-MM-DD HH:mm:ss")
        : moment(new Date()).startOf("day").format("YYYY-MM-DD HH:mm:ss");

    const endDateTime =
      useCustomDateRange && customDateRange.length && customDateRange[1]
        ? moment(customDateRange[1]).format("YYYY-MM-DD HH:mm:ss")
        : moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

    getAlertsByDateTrigger({
      userId: userId,
      startDateTime,
      endDateTime,
      alertType: alertType,
      token: groupId,
      vehReg:
        isKmtAccount(Number(userId), Number(parentUser)) ||
        Number(userId) === 81707
          ? selectedVehicle.vehReg
          : 0,
      vehId:
        isKmtAccount(Number(userId), Number(parentUser)) ||
        Number(userId) === 81707
          ? selectedVehicle.vId
          : 0,
    })
      .then(({ data }) => {
        clearLoadingTimeout(timeoutKey);

        if (data && data.list.length > 0) {
          const alert = data.list[0];
          setAlertCount((prev) =>
            prev.map((category) => {
              if (category.label === categoryLabel && category.type !== "DTC") {
                const responseFieldName = getResponseFieldName(alertType);
                const alertsArray =
                  (alert[responseFieldName as keyof typeof alert] as any[]) ||
                  [];
                let regularAlertsCount: number = alertsArray.length;
                if (
                  String(userId) === "3356" &&
                  alertType === "PoscoOverspeed"
                ) {
                  const timeGroups = new Map();
                  alertsArray.forEach((alertItem: any) => {
                    if (alertItem && alertItem.starttime) {
                      const timeKey = moment(alertItem.starttime).format(
                        "HH:mm",
                      );
                      if (!timeGroups.has(timeKey)) {
                        timeGroups.set(timeKey, alertItem);
                      }
                    }
                  });
                  regularAlertsCount = timeGroups.size;
                }

                return {
                  ...category,
                  count: regularAlertsCount,
                  isNewData: isPolling
                    ? category.count !== regularAlertsCount
                    : category.isNewData,
                };
              }
              return category;
            }),
          );
        }
        setCategoryLoading((prev) => ({ ...prev, [categoryLabel]: false }));
      })
      .catch((error) => {
        clearLoadingTimeout(timeoutKey);
        setCategoryLoading((prev) => ({ ...prev, [categoryLabel]: false }));
        console.error(`API error for category ${categoryLabel}:`, error);
      });
  };

  const fetchAllAlerts = (useCustomDate = false) => {
    if (userId && isPollingEnabled && pollingInterval > 0) {
      const allCategoriesToPoll = [
        {
          label: "Continuous Drive",
          apiType: "ContinousDrive",
          type: "DRIVER_BEHAVIOUR",
        },
        // Free Wheeling, Diagnosed RPM, Harsh Acceleration, and Harsh Break are handled by specificGetAlerts
        {
          label: "Night Drive",
          apiType: "NightDrive",
          type: "DRIVER_BEHAVIOUR",
        },
        { label: "Padlock", apiType: "padlock", type: "OTHERS" },
        {
          label: "Internal Battery Disconnected",
          apiType: "Internalpower",
          type: "OTHERS",
        },
        { label: "Overspeed", apiType: "OverSpeed", type: "DRIVER_BEHAVIOUR" },
        {
          label: "Main Power Connected",
          apiType: "MainpowerConnected",
          type: "OTHERS",
        },
        {
          label: "Main Power Disconnected",
          apiType: "Mainpower",
          type: "OTHERS",
        },
        { label: "Posco Overspeed", apiType: "PoscoOverspeed", type: "OTHERS" },
        { label: "Alcohol", apiType: "alcohol", type: "DRIVER_BEHAVIOUR" },
      ];

      // Filter out specific categories for user ID 833105 and 81707
      let categoriesToPoll = allCategoriesToPoll;
      if (Number(userId) === 833105) {
        categoriesToPoll = allCategoriesToPoll.filter(
          (category) =>
            ![
              "Continuous Drive",
              "Night Drive",
              "Alcohol",
              "Padlock",
              "Overspeed",
              "Posco Overspeed",
            ].includes(category.label),
        );
      } else if (Number(userId) === 81707) {
        categoriesToPoll = allCategoriesToPoll.filter(
          (category) =>
            ![
              "Internal Battery Disconnected",
              "Main Power Connected",
              "Main Power Disconnected",
              "Posco Overspeed",
              "Night Drive",
            ].includes(category.label),
        );
      } else if (Number(userId) !== 3356) {
        categoriesToPoll = allCategoriesToPoll.filter(
          (category) => category.label !== "Posco Overspeed",
        );
      }

      categoriesToPoll.forEach((category) => {
        fetchCategoryAlerts({
          alertType: category.apiType,
          categoryLabel: category.label,
          isPolling: !useCustomDate,
          isDTC: category.type === "DTC",
          useCustomDateRange: useCustomDate,
        });
      });

      if (Number(accessLabel) === 6) {
        fetchELockAlerts();
      }

      // DTC counts are updated via popup API in fetchELockAlerts to match ODBDetailsSection logic.
    }
  };

  useEffect(() => {
    fetchAllAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingInterval, userId, isPollingEnabled]);

  const fetchUpdatedAlertsListOnly = ({
    alertType,
    endTime,
    startTime,
    isDTC,
    selectedAlertOptionValue,
    useCustomDate = false,
  }: {
    alertType?: string;
    startTime?: Date;
    endTime?: Date;
    isDTC: boolean;
    selectedAlertOptionValue?: string;
    useCustomDate?: boolean;
  }) => {
    // Check if this is a GPS alert
    const gpsAlertTypes = ["enrouteIdle", "idleAtGeofence"];

    const isGpsAlert = alertType && gpsAlertTypes.includes(alertType);

    const isOverSpeedAlert = alertType === "OverSpeed";

    // Check if this is an E-Lock alert
    const eLockAlertTypes = [
      "unlockOnMove",
      "unlockOutsideGeofence",
      "unhealth",
    ];

    const isELockAlert = alertType && eLockAlertTypes.includes(alertType);

    // Check if this is a driver behaviour alert from popup API
    const isHarshAccelerationAlert = alertType === "harshAcceleration";
    const isHarshBreakAlert =
      alertType === "harshBreaking" || alertType === "harshBreak";
    const isFreewheelingAlert =
      alertType === "Freewheeling" || alertType === "freewheeling";

    if (isHarshAccelerationAlert) {
      setLoading(true);

      let filteredAlerts = harshAccelerationAlertsData;

      // Match the E-Lock count path: always respect the active date range.
      if (customDateRange.length === 2) {
        const startDate = moment(customDateRange[0]);
        const endDate = moment(customDateRange[1]);

        filteredAlerts = filteredAlerts.filter((alert: any) => {
          const alertTime =
            alert.datetime || alert.starttime || alert.alert_time;
          if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

          const alertMoment = moment(alertTime);
          return alertMoment.isBetween(startDate, endDate, "day", "[]");
        });
      }

      // Convert Harsh Acceleration alerts to AlertByDayEvents format
      const convertedAlerts: AlertByDayEvents[] = filteredAlerts.map(
        (alert: any, index: number) => {
          return {
            id: parseInt(alert.alert_id || alert.id) || Date.now() + index,
            service_id:
              alert.sys_service_id || alert.service_id || alert.alert_id,
            vehicle_no: alert.vehicleno || alert.vehicle_no,
            exception_type: "Harsh Acceleration",
            starttime:
              alert.starttime && alert.starttime !== "0000-00-00 00:00:00"
                ? alert.starttime
                : alert.datetime || new Date().toISOString(),
            endtime:
              alert.endtime && alert.endtime !== "0000-00-00 00:00:00"
                ? alert.endtime
                : alert.datetime || new Date().toISOString(),
            startlocation:
              alert.location || alert.msg || "Harsh Acceleration Location",
            endlocation: alert.endlocation || alert.location || alert.msg || "",
            startlat: alert.startlat || 0,
            startLong: alert.startLong || 0,
            endlat: alert.endlat || 0,
            endLong: alert.endLong || 0,
            KM: alert.KM || "0",
            duration: alert.duration || "0",
            speed: alert.speed || 0,
            journey_statusfinal: "Harsh Acceleration",
            AlertType: "Harsh Acceleration",
            alerttype: "Harsh Acceleration",
            message: alert.message || alert.msg || "",
            alert_type: "Harsh Acceleration",
            vehicleno: alert.vehicleno || alert.vehicle_no,
            alert_id: alert.alert_id || alert.id,
            route_name: "",
            Halting: null,
            hour: undefined,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark: alert.message || alert.msg || "",
          } as AlertByDayEvents;
        },
      );

      setAdjustedAlertsAsList(convertedAlerts);
      setLoading(false);
      return;
    }

    if (isHarshBreakAlert) {
      setLoading(true);

      let filteredAlerts = harshBreakAlertsData;

      // Match E-Lock count logic: always use the active date range.
      if (customDateRange.length === 2) {
        const startDate = moment(customDateRange[0]);
        const endDate = moment(customDateRange[1]);

        filteredAlerts = filteredAlerts.filter((alert: any) => {
          const alertTime =
            alert.datetime || alert.starttime || alert.alert_time;
          if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

          const alertMoment = moment(alertTime);
          return alertMoment.isBetween(startDate, endDate, "day", "[]");
        });
      }

      // Convert Harsh Break alerts to AlertByDayEvents format
      const convertedAlerts: AlertByDayEvents[] = filteredAlerts.map(
        (alert: any, index: number) => {
          return {
            id: parseInt(alert.alert_id || alert.id) || Date.now() + index,
            service_id:
              alert.sys_service_id || alert.service_id || alert.alert_id,
            vehicle_no: alert.vehicleno || alert.vehicle_no,
            exception_type: "Harsh Break",
            starttime:
              alert.starttime && alert.starttime !== "0000-00-00 00:00:00"
                ? alert.starttime
                : alert.datetime || new Date().toISOString(),
            endtime:
              alert.endtime && alert.endtime !== "0000-00-00 00:00:00"
                ? alert.endtime
                : alert.datetime || new Date().toISOString(),
            startlocation:
              alert.location || alert.msg || "Harsh Break Location",
            endlocation: alert.endlocation || alert.location || alert.msg || "",
            startlat: alert.startlat || 0,
            startLong: alert.startLong || 0,
            endlat: alert.endlat || 0,
            endLong: alert.endLong || 0,
            KM: alert.KM || "0",
            duration: alert.duration || "0",
            speed: alert.speed || 0,
            journey_statusfinal: "Harsh Break",
            AlertType: "Harsh Break",
            alerttype: "Harsh Break",
            message: alert.message || alert.msg || "",
            alert_type: "Harsh Break",
            vehicleno: alert.vehicleno || alert.vehicle_no,
            alert_id: alert.alert_id || alert.id,
            route_name: "",
            Halting: null,
            hour: undefined,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark: alert.message || alert.msg || "",
          } as AlertByDayEvents;
        },
      );

      setAdjustedAlertsAsList(convertedAlerts);
      setLoading(false);
      return;
    }

    if (isFreewheelingAlert) {
      setLoading(true);

      let filteredAlerts = freewheelingAlertsData;

      // Always respect the active date range so the list matches the stored
      // filtered E-Lock dataset and sidebar count.
      if (customDateRange.length === 2) {
        const startDate = moment(customDateRange[0]);
        const endDate = moment(customDateRange[1]);

        filteredAlerts = filteredAlerts.filter((alert: any) => {
          const alertTime =
            alert.datetime || alert.starttime || alert.alert_time;
          if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

          const alertMoment = moment(alertTime);
          return alertMoment.isBetween(startDate, endDate, "day", "[]");
        });
      }

      // Convert Freewheeling alerts to AlertByDayEvents format
      const convertedAlerts: AlertByDayEvents[] = filteredAlerts.map(
        (alert: any, index: number) => {
          return {
            id: parseInt(alert.alert_id || alert.id) || Date.now() + index,
            service_id:
              alert.sys_service_id || alert.service_id || alert.alert_id,
            vehicle_no: alert.vehicleno || alert.vehicle_no,
            exception_type: "Freewheeling",
            starttime:
              alert.starttime && alert.starttime !== "0000-00-00 00:00:00"
                ? alert.starttime
                : alert.datetime || new Date().toISOString(),
            endtime:
              alert.endtime && alert.endtime !== "0000-00-00 00:00:00"
                ? alert.endtime
                : alert.datetime || new Date().toISOString(),
            startlocation:
              alert.location || alert.msg || "Freewheeling Location",
            endlocation: alert.endlocation || alert.location || alert.msg || "",
            startlat: alert.startlat || 0,
            startLong: alert.startLong || 0,
            endlat: alert.endlat || 0,
            endLong: alert.endLong || 0,
            KM: alert.KM || "0",
            duration: alert.duration || "0",
            speed: alert.speed || 0,
            journey_statusfinal: "Freewheeling",
            AlertType: "Freewheeling",
            alerttype: "Freewheeling",
            message: alert.message || alert.msg || "",
            alert_type: "Freewheeling",
            vehicleno: alert.vehicleno || alert.vehicle_no,
            alert_id: alert.alert_id || alert.id,
            route_name: "",
            Halting: null,
            hour: undefined,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark: alert.message || alert.msg || "",
          } as AlertByDayEvents;
        },
      );

      setAdjustedAlertsAsList(convertedAlerts);
      setLoading(false);
      return;
    }

    if (isOverSpeedAlert) {
      setLoading(true);

      // Use the stored OverSpeed alerts data from popup API
      let filteredAlerts = overSpeedAlertsData;

      // Filter by date if custom date range is provided
      if (useCustomDate && customDateRange.length === 2) {
        const startDate = moment(customDateRange[0]);
        const endDate = moment(customDateRange[1]);

        filteredAlerts = filteredAlerts.filter((alert: any) => {
          const alertTime =
            alert.datetime || alert.starttime || alert.alert_time;
          if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

          const alertMoment = moment(alertTime);
          return alertMoment.isBetween(startDate, endDate, "day", "[]");
        });
      }

      // Convert OverSpeed alerts to AlertByDayEvents format
      const convertedOverSpeedAlerts: AlertByDayEvents[] = filteredAlerts.map(
        (alert: any, index: number) => {
          return {
            id: parseInt(alert.alert_id || alert.id) || Date.now() + index,
            service_id:
              alert.sys_service_id || alert.service_id || alert.alert_id,
            vehicle_no: alert.vehicleno || alert.vehicle_no,
            exception_type: "OverSpeed",
            starttime:
              alert.starttime && alert.starttime !== "0000-00-00 00:00:00"
                ? alert.starttime
                : alert.datetime || new Date().toISOString(),
            endtime:
              alert.endtime && alert.endtime !== "0000-00-00 00:00:00"
                ? alert.endtime
                : alert.datetime || new Date().toISOString(),
            startlocation: alert.location || alert.msg || "OverSpeed Location",
            endlocation: alert.endlocation || alert.location || alert.msg || "",
            startlat: alert.startlat || 0,
            startLong: alert.startLong || 0,
            endlat: alert.endlat || 0,
            endLong: alert.endLong || 0,
            KM: alert.KM || "0",
            duration: alert.duration || "0",
            speed: alert.speed || alert.max_speed || 0,
            journey_statusfinal: "OverSpeed",
            AlertType: "OverSpeed",
            alerttype: "OverSpeed",
            message: alert.message || alert.msg || "",
            alert_type: "OverSpeed",
            max_speed: alert.speed || alert.max_speed || 0,
            overspeedVelocity: alert.speed || alert.max_speed || 0,
            vehicleno: alert.vehicleno || alert.vehicle_no,
            alert_id: alert.alert_id || alert.id,
            route_name: "",
            Halting: null,
            hour: undefined,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark: alert.message || alert.msg || "",
          } as AlertByDayEvents;
        },
      );

      setAdjustedAlertsAsList(convertedOverSpeedAlerts);
      setLoading(false);
      return;
    }

    if (isELockAlert) {
      setLoading(true);

      // Use the stored E-Lock alerts data
      let filteredAlerts = [];

      if (alertType === "unlockOnMove") {
        filteredAlerts = eLockAlertsData.filter((alert: any) => {
          const type = String(alert.alert_type || "").toLowerCase();
          return type === "unlock on move";
        });
      } else if (alertType === "unlockOutsideGeofence") {
        filteredAlerts = eLockAlertsData.filter((alert: any) => {
          const type = String(alert.alert_type || "").toLowerCase();
          return (
            type === "unlock outside geofence" ||
            type === "door open in non-geofence"
          );
        });
      } else if (alertType === "unhealth") {
        filteredAlerts = unhealthyElockAlertsData;
      }

      // Filter by date if custom date range is provided
      if (useCustomDate && customDateRange.length === 2) {
        const startDate = moment(customDateRange[0]);
        const endDate = moment(customDateRange[1]);

        filteredAlerts = filteredAlerts.filter((alert: any) => {
          const alertTime =
            alert.datetime || alert.starttime || alert.alert_time;
          if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

          const alertMoment = moment(alertTime);
          return alertMoment.isBetween(startDate, endDate, "day", "[]");
        });
      }

      // Convert E-Lock alerts to AlertByDayEvents format
      const convertedELockAlerts: AlertByDayEvents[] = filteredAlerts.map(
        (alert: any, index: number) => {
          const isUnhealthyAlert = alertType === "unhealth";

          return {
            id: parseInt(alert.alert_id) || Date.now() + index,
            service_id: alert.sys_service_id || alert.alert_id,
            vehicle_no: alert.vehicleno,
            exception_type: alert.alert_type,
            starttime:
              alert.datetime && alert.datetime !== "0000-00-00 00:00:00"
                ? alert.datetime
                : new Date().toISOString(),
            endtime:
              alert.datetime && alert.datetime !== "0000-00-00 00:00:00"
                ? alert.datetime
                : new Date().toISOString(),
            startlocation: alert.msg || "E-Lock Alert Location",
            endlocation: isUnhealthyAlert
              ? ""
              : alert.msg || "E-Lock Alert Location",
            startlat: 0, // Would need to parse from location if available
            startLong: 0,
            endlat: 0,
            endLong: 0,
            KM: "0",
            duration: isUnhealthyAlert ? "" : "0",
            speed: 0,
            journey_statusfinal: alert.alert_type,
            Halting: null,
            hour: undefined,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark: alert.msg,
            route_name: "",
          };
        },
      );

      setAdjustedAlertsAsList(convertedELockAlerts);
      setLoading(false);
      return;
    }

    if (isGpsAlert) {
      setLoading(true);

      if (alertType === "enrouteIdle") {
        setLoading(true);

        let filteredAlerts = enrouteHaltAlertsData;

        // Filter by date if custom date range is provided
        if (useCustomDate && customDateRange.length === 2) {
          const startDate = moment(customDateRange[0]);
          const endDate = moment(customDateRange[1]);

          filteredAlerts = filteredAlerts.filter((alert: any) => {
            const alertTime =
              alert.datetime || alert.starttime || alert.alert_time;
            if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

            const alertMoment = moment(alertTime);
            return alertMoment.isBetween(startDate, endDate, "day", "[]");
          });
        }

        // Convert to AlertByDayEvents format
        const convertedAlerts: AlertByDayEvents[] = filteredAlerts.map(
          (alert: any, index: number) => ({
            id: parseInt(alert.alert_id) || Date.now() + index,
            service_id: alert.sys_service_id || alert.alert_id,
            vehicle_no: alert.vehicleno || alert.vehicle_no,
            exception_type: "Enroute Halt Alert",
            alerttype: "Enroute Halt Alert",
            starttime: alert.starttime || alert.datetime || alert.gps_time,
            endtime: alert.endtime || alert.datetime || alert.gps_time,
            startlocation: alert.location || alert.msg || "Unknown Location",
            endlocation: alert.endlocation || alert.location || alert.msg || "",
            startlat: alert.startlat || 0,
            startLong: alert.startLong || 0,
            endlat: alert.endlat || 0,
            endLong: alert.endLong || 0,
            KM: "0",
            duration: alert.issue || alert.duration || "0",
            speed: alert.speed || 0,
            journey_statusfinal: "Enroute Halt Alert",
            Halting: null,
            hour: alert.issue || alert.duration,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark:
              alert.msg ||
              `Enroute Halt Alert for ${alert.issue || "unknown duration"}`,
            route_name: "",
          }),
        );

        setAdjustedAlertsAsList(convertedAlerts);
        setLoading(false);
        return;
      } else if (alertType === "idleAtGeofence") {
        setLoading(true);

        let filteredAlerts = geofenceHaltAlertsData;

        if (useCustomDate && customDateRange.length === 2) {
          const startDate = moment(customDateRange[0]);
          const endDate = moment(customDateRange[1]);

          filteredAlerts = filteredAlerts.filter((alert: any) => {
            const alertTime =
              alert.datetime || alert.starttime || alert.alert_time;
            if (!alertTime || alertTime === "0000-00-00 00:00:00") return false;

            const alertMoment = moment(alertTime);
            return alertMoment.isBetween(startDate, endDate, "day", "[]");
          });
        }

        const convertedAlerts: AlertByDayEvents[] = filteredAlerts.map(
          (alert: any, index: number) => ({
            id: parseInt(alert.alert_id) || Date.now() + index,
            service_id: alert.sys_service_id || alert.alert_id,
            vehicle_no: alert.vehicleno || alert.vehicle_no,
            exception_type: "Geofence Halt Alert",
            alerttype: "Geofence Halt Alert",
            starttime: alert.starttime || alert.datetime || alert.gps_time,
            endtime: alert.endtime || alert.datetime || alert.gps_time,
            startlocation: alert.location || alert.msg || "Unknown Location",
            endlocation: alert.endlocation || alert.location || alert.msg || "",
            startlat: alert.startlat || 0,
            startLong: alert.startLong || 0,
            endlat: alert.endlat || 0,
            endLong: alert.endLong || 0,
            KM: "0",
            duration: alert.issue || alert.duration || "0",
            speed: alert.speed || 0,
            journey_statusfinal: "Geofence Halt Alert",
            Halting: null,
            hour: alert.issue || alert.duration,
            InvoiceNo: undefined,
            InvoiceDate: undefined,
            remark:
              alert.msg ||
              `Geofence Halt Alert for ${alert.issue || "unknown duration"}`,
            route_name: "",
          }),
        );

        setAdjustedAlertsAsList(convertedAlerts);
        setLoading(false);
        return;
      } else {
        setAdjustedAlertsAsList([]);
        setLoading(false);
        return;
      }
    }

    // Check if this is a video telematics alert
    const videoAlertTypes = [
      "seatBelt",
      "handheldPhoneCall",
      "smoking",
      "fatigueWarn",
    ];

    const isVideoAlert = alertType && videoAlertTypes.includes(alertType);

    if (
      isVideoAlert &&
      (Number(userId) === 81707 ||
        Number(userId) === 4343 ||
        Number(userId) === 833783)
    ) {
      setLoading(true);

      const filteredVideoAlerts = videoAlerts.filter(
        (alert) => alert.alarmType === alertType,
      );
      const convertedAlerts =
        convertVideoAlertsToAlertsFormat(filteredVideoAlerts);

      setAdjustedAlertsAsList(convertedAlerts);
      setLoading(false);
      return;
    }

    // Original logic for non-video alerts
    setLoading(true);
    const mainTimeoutKey = `main-alerts-${Date.now()}`;
    createTimeout(mainTimeoutKey, () => {
      setLoading(false);
    });

    getAlertsByDateTrigger({
      userId: Number(userId) === 833381 ? "5275" : userId,
      startDateTime: startTime
        ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
        : customDateRange.length && customDateRange[0]
          ? moment(customDateRange[0]?.toISOString()).format("YYYY-MM-DD HH:mm")
          : moment(new Date()).startOf("day").format("YYYY-MM-DD HH:mm:ss"),
      endDateTime: endTime
        ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
        : customDateRange.length && customDateRange[1]
          ? moment(customDateRange[1]?.toISOString()).format("YYYY-MM-DD HH:mm")
          : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      alertType: customDateRangeChanged
        ? alertType ||
          (selectedAlertOption && selectedAlertOption.value !== "All"
            ? selectedAlertOption.value
            : Number(userId) === 5275 ||
                Number(userId) === 833381 ||
                Number(userId) === 83558
              ? "All"
              : "ContinousDrive")
        : alertType ||
          (selectedAlertOption
            ? (Number(userId) === 5275 ||
                Number(userId) === 833381 ||
                Number(userId) === 83558) &&
              selectedAlertOption.value === "All"
              ? "All"
              : selectedAlertOption.value
            : ""),
      token: Number(userId) === 833381 ? "5267" : groupId, // Use parent token for child user 833381
      vehReg:
        isKmtAccount(Number(userId), Number(parentUser)) ||
        Number(userId) === 81707
          ? selectedVehicle.vehReg
          : 0,
      vehId:
        isKmtAccount(Number(userId), Number(parentUser)) ||
        Number(userId) === 81707
          ? selectedVehicle.vId
          : 0,
    })
      .then(({ data }) => {
        // Clear main timeout on response
        clearLoadingTimeout(mainTimeoutKey);

        const isKMTAccount = isKmtAccount(Number(userId), Number(parentUser));

        if ((isKMTAccount || Number(userId) === 81707) && isDTC) {
          // Create timeout for DTC API call
          const dtcTimeoutKey = `dtc-alerts-${Date.now()}`;
          createTimeout(dtcTimeoutKey, () => {
            setLoading(false);
          });

          fetch(
            `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${groupId}`,
          )
            .then((response) => {
              clearLoadingTimeout(dtcTimeoutKey);
              if (response.ok) {
                return response.json();
              }
              throw new Error("Failed to fetch DTC popup alerts");
            })
            .then((alertsData) => {
              let vehicleHealthAlerts: any[] = [];

              if (alertsData && Array.isArray(alertsData)) {
                vehicleHealthAlerts = alertsData.filter(
                  (alert: any) => alert.alert_type === "Vehicle Health Alert",
                );

                vehicleHealthAlerts = vehicleHealthAlerts.filter(
                  (alert: any) => {
                    if (alert.remark && alert.remark.trim() !== "") {
                      return false;
                    }

                    const vehReg =
                      alert.vehicleno ||
                      alert.vehicle_no ||
                      alert.vehicleNumber;
                    if (!vehReg) return true;

                    const vehRegStr = vehReg.toString().trim();
                    if (
                      vehRegStr === "" ||
                      vehRegStr.toLowerCase() === "unknown vehicle" ||
                      vehRegStr.toLowerCase() === "unknown"
                    ) {
                      return false;
                    }

                    if (vehicleDataWithGps?.list) {
                      const cleanVehReg = vehRegStr
                        .replace(/\s+[AB]\s*$/i, "")
                        .trim();
                      const matchedVehicle = vehicleDataWithGps.list.find(
                        (vehicle: any) => {
                          const vehicleReg = vehicle.vehReg?.toString().trim();
                          return (
                            vehicleReg === cleanVehReg ||
                            vehicleReg === vehRegStr
                          );
                        },
                      );

                      if (matchedVehicle) {
                        const inactiveStatus =
                          matchedVehicle.gpsDtl?.inactiveStatus;
                        return inactiveStatus !== 1 && inactiveStatus !== "1";
                      }
                    }

                    return true;
                  },
                );
              }

              vehicleHealthAlerts =
                limitLatestAlertsPerVehicle(vehicleHealthAlerts);

              let convertedDTCAlerts: AlertByDayEvents[] =
                vehicleHealthAlerts.map((alert: any) => {
                  const dtcCategory = extractDtcCategoryFromMessage(alert.msg);
                  return {
                    id: parseInt(alert.alert_id) || Date.now(),
                    service_id: alert.sys_service_id || alert.alert_id,
                    vehicle_no: alert.vehicleno || alert.vehicle_no,
                    exception_type: dtcCategory,
                    alerttype: "Vehicle Health Alert",
                    starttime:
                      alert.gps_time || alert.datetime || alert.starttime,
                    endtime: alert.gps_time || alert.datetime || alert.endtime,
                    startlocation:
                      alert.location || alert.msg || "Unknown Location",
                    endlocation:
                      alert.endlocation || alert.location || alert.msg || "",
                    startlat: alert.startlat || 0,
                    startLong: alert.startLong || 0,
                    endlat: alert.endlat || 0,
                    endLong: alert.endLong || 0,
                    KM: "0",
                    duration: alert.issue || alert.duration || "0",
                    speed: alert.speed || 0,
                    journey_statusfinal: "Vehicle Health Alert",
                    Halting: null,
                    hour: alert.issue || alert.duration,
                    InvoiceNo: undefined,
                    InvoiceDate: undefined,
                    remark: alert.msg || "Vehicle Health Alert",
                    route_name: "",
                  };
                });

              if (customDateRange.length === 2) {
                const startDate = moment(customDateRange[0]);
                const endDate = moment(customDateRange[1]);

                convertedDTCAlerts = convertedDTCAlerts.filter((alert) => {
                  const alertTime = alert.starttime;
                  if (!alertTime) return false;

                  const alertMoment = moment(alertTime);
                  return alertMoment.isBetween(startDate, endDate, "day", "[]");
                });
              }

              if (
                selectedAlertOptionValue &&
                isDTCLabel(selectedAlertOptionValue)
              ) {
                const dtcType = getDTCTypeFromLabel(selectedAlertOptionValue);
                if (dtcType) {
                  setAdjustedAlertsAsList(
                    convertedDTCAlerts.filter(
                      (alert) =>
                        String(alert.exception_type || "").toLowerCase() ===
                        dtcType.toLowerCase(),
                    ),
                  );
                } else {
                  setAdjustedAlertsAsList(convertedDTCAlerts);
                }
              } else {
                setAdjustedAlertsAsList(convertedDTCAlerts);
              }

              setLoading(false);
              setCustomDateRangeChanged(false);
              endTime ? setCurrentTime(endTime) : setCurrentTime(new Date());
            })
            .catch((error) => {
              clearLoadingTimeout(dtcTimeoutKey);
              setLoading(false);
              setCustomDateRangeChanged(false);
              console.error("DTC popup alerts API error:", error);
            });
        } else if (data && data.list.length > 0) {
          const alert = data.list[0];
          let tempAlerts: AlertByDayEvents[] = [
            ...(alert.contineousDrive ? alert.contineousDrive : []),
            ...(alert.padlock ? alert.padlock : []),
            ...(alert.freewheeling ? alert.freewheeling : []),
            ...(alert.freewheelingWrong ? alert.freewheelingWrong : []),
            ...(alert.harshBreak ? alert.harshBreak : []),
            ...(alert.harshacc ? alert.harshacc : []),
            ...(alert.highenginetemperature ? alert.highenginetemperature : []),
            ...(alert.idle
              ? alert.idle.map((idleAlert) => ({
                  ...idleAlert,
                  AlertStatus: idleAlert.remark ? "Closed" : "Open",
                }))
              : []),
            ...(alert.internalPower ? alert.internalPower : []),
            ...(alert.lowengineoilpressure ? alert.lowengineoilpressure : []),
            ...(alert.mainpower ? alert.mainpower : []),
            ...(alert.MainpowerConnected ? alert.MainpowerConnected : []),
            ...(alert.nightdrive ? alert.nightdrive : []),
            ...(alert.overspeed ? alert.overspeed : []),
            ...(alert.overspeedKMT ? alert.overspeedKMT : []),
            ...(alert.panic ? alert.panic : []),
            ...(alert.services ? alert.services : []),
            ...(alert.document ? alert.document : []),
            ...(alert.transitdelay ? alert.transitdelay : []),
            ...(alert.unlockonmove ? alert.unlockonmove : []),
            ...(alert.PoscoOverspeed ? alert.PoscoOverspeed : []),
            ...(alert.geofence ? alert.geofence : []),
            ...(alert.alcohol ? alert.alcohol : []),
          ];

          // Add panicraw alerts if they exist
          if ("panicraw" in alert && Array.isArray((alert as any).panicraw)) {
            tempAlerts.push(...(alert as any).panicraw);
          }

          const groupAlertsByTime = (alerts: any[]) => {
            if (String(userId) !== "3356") {
              return alerts;
            }

            // Match for 'Posco Overspeed' using exception_type (case-insensitive)
            const poscoAlerts = alerts.filter((alert) => {
              const type = (alert.exception_type || "").toLowerCase().trim();
              return type === "posco overspeed";
            });
            const otherAlerts = alerts.filter((alert) => {
              const type = (alert.exception_type || "").toLowerCase().trim();
              return type !== "posco overspeed";
            });

            if (poscoAlerts.length === 0) return alerts;

            // Group Posco alerts by vehicle and time (YYYY-MM-DD HH:MM format)
            const timeGroups = new Map();
            poscoAlerts.forEach((alert) => {
              const groupKey = `${alert.vehicle_no}_${moment(
                alert.starttime,
              ).format("YYYY-MM-DD HH:mm")}`;

              if (!timeGroups.has(groupKey)) {
                timeGroups.set(groupKey, []);
              }
              timeGroups.get(groupKey).push(alert);
            });

            // Create grouped alerts with calculated duration
            const groupedPoscoAlerts: AlertByDayEvents[] = [];
            timeGroups.forEach((alertsInGroup) => {
              if (alertsInGroup.length === 1) {
                // Single alert, keep as is
                groupedPoscoAlerts.push(alertsInGroup[0]);
              } else {
                // Multiple alerts in same minute, calculate duration
                const sortedAlerts = alertsInGroup.sort(
                  (a: AlertByDayEvents, b: AlertByDayEvents) =>
                    moment(a.starttime).diff(moment(b.starttime)),
                );

                const firstAlert = sortedAlerts[0];
                const lastAlert = sortedAlerts[sortedAlerts.length - 1];

                // Calculate duration between first and last alert
                const firstTime = moment(firstAlert.starttime);
                const lastTime = moment(lastAlert.starttime);
                const durationInSeconds = lastTime.diff(firstTime, "seconds");

                // Format duration as HH:mm:ss
                const hours = Math.floor(durationInSeconds / 3600);
                const minutes = Math.floor((durationInSeconds % 3600) / 60);
                const seconds = durationInSeconds % 60;

                const formattedDuration = `${hours
                  .toString()
                  .padStart(2, "0")}:${minutes
                  .toString()
                  .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

                // Use first alert as base and update duration and end time
                const groupedAlert: AlertByDayEvents = {
                  ...firstAlert,
                  duration: formattedDuration,
                  endtime: lastAlert.endtime || lastAlert.starttime,
                  // Optionally store the count of alerts in this group
                  alertCount: alertsInGroup.length,
                };

                groupedPoscoAlerts.push(groupedAlert);
              }
            });

            // Combine grouped Posco alerts with other alerts
            return [...otherAlerts, ...groupedPoscoAlerts];
          };

          // Apply time-based grouping
          tempAlerts = groupAlertsByTime(tempAlerts);

          tempAlerts.sort((a, b) => {
            if (a.endtime && b.endtime)
              return moment(b.endtime).unix() - moment(a.endtime).unix();
            return moment(b.starttime).unix() - moment(a.starttime).unix();
          });

          setAdjustedAlertsAsList(tempAlerts);
          setLoading(false);
          setCustomDateRangeChanged(false);
          endTime ? setCurrentTime(endTime) : setCurrentTime(new Date());
        } else {
          setAdjustedAlertsAsList([]);
          setLoading(false);
          setCustomDateRangeChanged(false);
        }
      })
      .catch((error) => {
        // Clear timeout on error
        clearLoadingTimeout(mainTimeoutKey);
        setLoading(false);
        setCustomDateRangeChanged(false);
        console.error("Main alerts API error:", error);
      });
  };

  const fetchUpdatedAlertsNotificationCard = (alertType?: string) => {
    setLoading(true);

    // Create timeout for notification alerts fetch
    const notificationTimeoutKey = `notification-alerts-${Date.now()}`;
    createTimeout(notificationTimeoutKey, () => {
      setLoading(false);
    });

    getAlertsByDateTrigger({
      userId: Number(userId) === 833381 ? "5275" : userId,
      startDateTime:
        customDateRange.length && customDateRange[0]
          ? moment(customDateRange[0]?.toISOString()).format("YYYY-MM-DD HH:mm")
          : moment(new Date()).startOf("day").format("YYYY-MM-DD HH:mm:ss"),
      endDateTime:
        customDateRange.length && customDateRange[1]
          ? moment(customDateRange[1]?.toISOString()).format("YYYY-MM-DD HH:mm")
          : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      alertType: customDateRangeChanged
        ? alertType ||
          (selectedAlertOption && selectedAlertOption.value !== "All"
            ? selectedAlertOption.value
            : Number(userId) === 5275 ||
                Number(userId) === 833381 ||
                Number(userId) === 83558
              ? "All"
              : "ContinousDrive")
        : alertType ||
          (selectedAlertOption
            ? (Number(userId) === 5275 ||
                Number(userId) === 833381 ||
                Number(userId) === 83558) &&
              selectedAlertOption.value === "All"
              ? "All"
              : selectedAlertOption.value
            : ""),
      token: Number(userId) === 833381 ? "5267" : groupId, // Use parent token for child user 833381
      vehReg:
        isKmtAccount(Number(userId), Number(parentUser)) ||
        Number(userId) === 81707
          ? selectedVehicle.vehReg
          : 0,
      vehId:
        isKmtAccount(Number(userId), Number(parentUser)) ||
        Number(userId) === 81707
          ? selectedVehicle.vId
          : 0,
    })
      .then(({ data }) => {
        // Clear timeout on response
        clearLoadingTimeout(notificationTimeoutKey);

        const isKMTAccount = isKmtAccount(Number(userId), Number(parentUser));
        let convertedDTCAlerts: AlertByDayEvents[] | null = null;
        if (isKMTAccount || Number(userId) === 81707) {
          // Get fresh Vehicle Health Alert data for display - same as counting logic
          fetch(
            `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${groupId}`,
          )
            .then((response) => {
              if (response.ok) {
                return response.json();
              }
              throw new Error("Failed to fetch alerts");
            })
            .then((alertsData) => {
              let vehicleHealthAlerts: any[] = [];

              if (alertsData && Array.isArray(alertsData)) {
                vehicleHealthAlerts = alertsData.filter(
                  (alert: any) => alert.alert_type === "Vehicle Health Alert",
                );

                // Apply same filtering logic as in fetchELockAlerts
                vehicleHealthAlerts = vehicleHealthAlerts.filter((alert) => {
                  // Skip alerts with remarks (already resolved)
                  if (alert.remark && alert.remark.trim() !== "") {
                    return false;
                  }

                  const vehReg =
                    alert.vehicleno || alert.vehicle_no || alert.vehicleNumber;
                  if (!vehReg) return true;

                  // Filter out unknown vehicles
                  const vehRegStr = vehReg.toString().trim();
                  if (
                    vehRegStr === "" ||
                    vehRegStr.toLowerCase() === "unknown vehicle" ||
                    vehRegStr.toLowerCase() === "unknown"
                  ) {
                    return false;
                  }

                  // Filter active vehicles only
                  if (vehicleDataWithGps?.list) {
                    const cleanVehReg = vehRegStr
                      .replace(/\s+[AB]\s*$/i, "")
                      .trim();
                    const matchedVehicle = vehicleDataWithGps.list.find(
                      (vehicle: any) => {
                        const vehicleReg = vehicle.vehReg?.toString().trim();
                        return (
                          vehicleReg === cleanVehReg || vehicleReg === vehRegStr
                        );
                      },
                    );

                    if (matchedVehicle) {
                      const inactiveStatus =
                        matchedVehicle.gpsDtl?.inactiveStatus;
                      const isActive =
                        inactiveStatus !== 1 && inactiveStatus !== "1";
                      return isActive;
                    }
                  }

                  return true;
                });
              }

              vehicleHealthAlerts =
                limitLatestAlertsPerVehicle(vehicleHealthAlerts);

              // Convert Vehicle Health Alert data to proper format
              convertedDTCAlerts = vehicleHealthAlerts.map((alert: any) => {
                const dtcCategory = extractDtcCategoryFromMessage(alert.msg);

                return {
                  id: parseInt(alert.alert_id) || Date.now(),
                  service_id: alert.sys_service_id || alert.alert_id,
                  vehicle_no: alert.vehicleno || alert.vehicle_no,
                  exception_type: dtcCategory,
                  alerttype: "Vehicle Health Alert",
                  starttime:
                    alert.gps_time || alert.datetime || alert.starttime,
                  endtime: alert.gps_time || alert.datetime || alert.endtime,
                  startlocation:
                    alert.location || alert.msg || "Unknown Location",
                  endlocation:
                    alert.endlocation || alert.location || alert.msg || "",
                  startlat: alert.startlat || 0,
                  startLong: alert.startLong || 0,
                  endlat: alert.endlat || 0,
                  endLong: alert.endLong || 0,
                  KM: "0",
                  duration: alert.issue || alert.duration || "0",
                  speed: alert.speed || 0,
                  journey_statusfinal: "Vehicle Health Alert",
                  Halting: null,
                  hour: alert.issue || alert.duration,
                  InvoiceNo: undefined,
                  InvoiceDate: undefined,
                  remark: alert.msg || `Vehicle Health Alert`,
                  route_name: "",
                };
              });

              // Filter by current date range for display
              if (customDateRange.length === 2) {
                const startDate = moment(customDateRange[0]);
                const endDate = moment(customDateRange[1]);

                convertedDTCAlerts = convertedDTCAlerts.filter((alert) => {
                  const alertTime = alert.starttime;
                  if (!alertTime) return false;

                  const alertMoment = moment(alertTime);
                  return alertMoment.isBetween(startDate, endDate, "day", "[]");
                });
              }

              // Filter by specific DTC category if selected
              if (alertType && isDTCLabel(alertType)) {
                const dtcType = getDTCTypeFromLabel(alertType);
                if (dtcType) {
                  const filteredDTCAlerts = convertedDTCAlerts.filter(
                    (alert) => {
                      return (
                        String(alert.exception_type || "").toLowerCase() ===
                        dtcType.toLowerCase()
                      );
                    },
                  );
                  setAdjustedAlertsAsList(filteredDTCAlerts);
                } else {
                  setAdjustedAlertsAsList(convertedDTCAlerts);
                }
              } else {
                setAdjustedAlertsAsList(convertedDTCAlerts);
              }

              setLoading(false);
              setCurrentTime(new Date());
              setCustomDateRangeChanged(false);
            })
            .catch((error) => {
              console.error("Error fetching alerts for display:", error);
              setLoading(false);
              setCustomDateRangeChanged(false);
            });
        } else if (data) {
          getAdjustedAlerts({
            data: data.list,
            setAdjustAlertsAsList: setAdjustedAlertsAsList,
            setAlertCount,
            selectedAlertOption: alertType,
            isDTC: false,
            userId: userId,
            allVehicles: allVehicles,
            setIsCountUpdating,
            countUpdateRef,
          });
          setLoading(false);

          setCurrentTime(new Date());
          setCustomDateRangeChanged(false);
        }
      })
      .catch((error) => {
        clearLoadingTimeout(notificationTimeoutKey);
        setLoading(false);
        setCustomDateRangeChanged(false);
        console.error("Notification alerts API error:", error);
      });
  };

  const [filters, setFilters] = useState<{
    vehicleNo: string;
    alertType: string;
    location: string;
    status: string;
  }>({
    vehicleNo: "",
    alertType: "",
    location: "",
    status: "",
  });
  const filtersDeffered = useDeferredValue(filters);
  const [downloadReport, setDownloadReport] = useState<
    DownloadReportTs | undefined
  >();
  const isFiltersLoading =
    filtersDeffered.alertType !== filters.alertType ||
    filtersDeffered.location !== filters.location ||
    filtersDeffered.status !== filters.status ||
    filtersDeffered.vehicleNo !== filters.vehicleNo;

  const filteredAlerts = useMemo(() => {
    if (!adjustedAlertsAsList) return [];

    return adjustedAlertsAsList.filter((alert) => {
      const matchesVehicle =
        !filtersDeffered.vehicleNo ||
        alert.vehicle_no
          .toString()
          .toLowerCase()
          .includes(filtersDeffered.vehicleNo.toLowerCase());

      const matchesAlertType =
        !filtersDeffered.alertType ||
        alert.exception_type
          .toLowerCase()
          .includes(filtersDeffered.alertType.toLowerCase());

      const matchesLocation =
        !filtersDeffered.location ||
        (alert.startlocation &&
          alert.startlocation
            .toLowerCase()
            .includes(filtersDeffered.location.toLowerCase())) ||
        (alert.endlocation &&
          alert.endlocation
            .toLowerCase()
            .includes(filtersDeffered.location.toLowerCase()));

      const alertStatus = alert.remark ? "closed" : "open";
      const matchesStatus =
        !filtersDeffered.status ||
        alertStatus === filtersDeffered.status.toLowerCase();

      return (
        matchesVehicle && matchesAlertType && matchesLocation && matchesStatus
      );
    });
  }, [adjustedAlertsAsList, filtersDeffered]);

  const clearFilters = () => {
    setFilters({
      vehicleNo: "",
      alertType: "",
      location: "",
      status: "",
    });
  };

  const getFilterDropdown = () => {
    const isIDLE =
      (selectedAlertOption && selectedAlertOption.label === "idle") ||
      (selectedAlertOption && selectedAlertOption.label === "Idle");
    const isDTC = isValidDTCAlert(
      selectedAlertOption && selectedAlertOption.label,
    );

    return (
      <div className="p-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <Input
              placeholder="Filter by vehicle number"
              value={filters.vehicleNo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, vehicleNo: e.target.value }))
              }
              className="w-full"
              size="small"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Type
            </label>
            <Input
              placeholder="Filter by alert type"
              value={filters.alertType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, alertType: e.target.value }))
              }
              className="w-full"
              size="small"
            />
          </div>

          {!isDTC ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                placeholder="Filter by location"
                value={filters.location}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full"
                size="small"
              />
            </div>
          ) : null}

          {isIDLE ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                placeholder="Filter by status"
                value={filters.status || undefined}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value || "" }))
                }
                className="w-full"
                size="small"
                allowClear
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
              />
            </div>
          ) : null}

          <div className="flex justify-between pt-2">
            <Button
              onClick={clearFilters}
              icon={<ClearOutlined />}
              size="small"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleDownload = () => {
    const validDTCAlert = isValidDTCAlert(
      selectedAlertOption && selectedAlertOption.label,
    );
    const alerts = filteredAlerts;

    if (validDTCAlert) {
      const rows = alerts.map((vehicle: AlertByDayEvents) => ({
        ["Vehicle No"]: vehicle.vehicle_no,
        ["Alert Type"]: vehicle.exception_type,
        ["Description"]: vehicle.startlocation,
        ["Code"]: vehicle.route_name,
        ["Severity"]: vehicle.InvoiceDate,
      }));

      const head = Object.keys(rows[0] || {});
      const body = rows.map((row) => Object.values(row));

      setDownloadReport({
        title: `${
          selectedAlertOption && selectedAlertOption.label
        } Alert Report`,
        excel: {
          title: `${selectedAlertOption && selectedAlertOption.label}`,
          rows,
          footer: [],
        },
        pdf: {
          head: [head],
          body: body,
          title: `${
            selectedAlertOption && selectedAlertOption.label
          } Alert Report`,
          pageSize: "a3",
        },
      });
    } else {
      const rows = alerts.map((vehicle: AlertByDayEvents) => ({
        ["Alert Type"]: vehicle.exception_type,
        ["Vehicle No"]: vehicle.vehicle_no,
        ["Start Time"]: vehicle.starttime
          ? moment(new Date(vehicle.starttime)).format("DD-MM-yyyy HH:mm:ss")
          : "",
        ["Start Location"]: vehicle.startlocation
          ? vehicle.startlocation?.replaceAll("_", " ")
          : "",
        ["End Time"]:
          vehicle.endtime && vehicle.journey_statusfinal !== "Ongoing"
            ? moment(new Date(vehicle.endtime)).format("DD-MM-yyyy HH:mm:ss")
            : vehicle.journey_statusfinal === "Ongoing"
              ? "Ongoing"
              : "",
        ["End Location"]: vehicle.endlocation
          ? vehicle.endlocation?.replaceAll("_", " ")
          : "",
        Distance:
          vehicle.KM && vehicle.KM !== "NA"
            ? Number(vehicle.KM).toFixed(2)
            : "",
        Duration: vehicle.duration || "",
        Speed: vehicle.speed || "",
        ["Halting Hour"]: vehicle.hour || "",
        ["Remarks"]: vehicle.remark || "",
        ["Alert Status"]: vehicle.remark ? "Closed" : "Open",
      }));

      const head = Object.keys(rows[0] || {});
      const body = rows.map((row) => Object.values(row));

      setDownloadReport({
        title: `${
          selectedAlertOption && selectedAlertOption.label
        } Alert Report`,
        excel: {
          title: `${selectedAlertOption && selectedAlertOption.label}`,
          rows,
          footer: [],
        },
        pdf: {
          head: [head],
          body: body,
          title: `${
            selectedAlertOption && selectedAlertOption.label
          } Alert Report`,
          pageSize: "a3",
        },
      });
    }
  };

  // Monitor API loading states and reset main loading when appropriate
  useEffect(() => {
    const anyCategoryLoading = Object.values(categoryLoading).some(Boolean);
    const mainApiLoading = isGetAlertsByDateLoading;

    if (!anyCategoryLoading && !mainApiLoading && loading) {
      const resetTimer = setTimeout(() => {
        setLoading(false);
      }, 500);

      return () => clearTimeout(resetTimer);
    }
  }, [categoryLoading, isGetAlertsByDateLoading, loading]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      Object.values(loadingTimeouts).forEach((timeoutId) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, [loadingTimeouts]);

  return (
    <div>
      <Card
        styles={{
          body: {
            padding: 0,
            background: "transparent",
            borderRadius: "0px",
            border: 0,
          },
        }}
        style={{
          borderRadius: "0px",
          background: "transparent",
          border: 0,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="w-full flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isAlertManagement ? (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  <span
                    className="text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                    onClick={() => setIsAlertManagement(false)}
                  >
                    Alerts
                  </span>
                  <span className="text-gray-400 mx-2">/</span>
                  <span>Alerts Management</span>
                </h1>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-800">
                Vehicle Alerts
              </h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAlertManagement ? (
              <div className="flex items-center gap-3">
                <Tooltip title="Create Alert" mouseEnterDelay={1}>
                  <Button
                    type="primary"
                    icon={<PlusCircleFilled />}
                    className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                    onClick={() => {
                      setIsModalActive(true);
                      setModalViewToggle("CREATE");
                    }}
                  >
                    Create Alert
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex gap-3 items-center">
                <div className="w-[350px]">
                  <CustomDatePicker
                    dateRange={customDateRange}
                    setDateRange={(e) => {
                      setCustomDateRange(e);
                      setCustomDateRangeChanged(true);
                    }}
                    datePickerStyles="h-[30px] rounded-lg border-gray-300"
                    disabled={
                      isGetAlertsByDateLoading ||
                      loading ||
                      Object.values(categoryLoading).some(Boolean)
                    }
                  />
                </div>

                <Button
                  type="primary"
                  size="middle"
                  className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 px-6"
                  disabled={
                    isGetAlertsByDateLoading ||
                    loading ||
                    Object.values(categoryLoading).some(Boolean)
                  }
                  onClick={() => {
                    // If custom date range is set, use it for fetching alerts
                    if (customDateRangeChanged) {
                      fetchAllAlerts(true);
                      // Also fetch the list view data with custom date range
                      fetchUpdatedAlertsNotificationCard();
                    } else {
                      fetchAllAlerts();
                    }
                  }}
                >
                  Submit
                </Button>
              </div>
            )}

            <Tooltip
              title={isAlertManagement ? "View Alerts" : "Alerts Management"}
              mouseEnterDelay={1}
            >
              <Button
                type="text"
                icon={<SettingFilled />}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setIsAlertManagement((prev) => !prev)}
              />
            </Tooltip>
          </div>
        </div>
        {notificationContextHolder}
        {isAlertManagement ? (
          <AlertsManagement
            modalViewToggle={modalViewToggle}
            setModalViewToggle={setModalViewToggle}
            isModalActive={isModalActive}
            setIsModalActive={setIsModalActive}
            isDrawerActive={isDrawerActive}
            setIsDrawerActive={setIsDrawerActive}
            isServicesAndDocumentsDrawerActive={
              isServicesAndDocumentsDrawerActive
            }
            setIsServicesAndDocumentsDrawerActive={
              setIsServicesAndDocumentsDrawerActive
            }
          />
        ) : (
          <>
            {SIDEBAR_USER_IDS.includes(Number(userId)) ||
            Number(parentUser) === 3356 ||
            Number(parentUser) === 87470 ||
            (Number(parentUser) === 82815 &&
              alertOptions &&
              alertOptions.length > 0) ? (
              <div className="flex">
                <div className="w-72 bg-white  shadow-sm max-h-[calc(100vh-125px)] overflow-y-auto">
                  <div className="">
                    <div className="bg-blue-50 px-3 py-2 sticky top-0 z-10">
                      <h3 className="font-medium text-blue-800 text-xs uppercase tracking-wide">
                        Driver Behaviour (
                        {alertCount
                          .filter(
                            (option) => option.type === "DRIVER_BEHAVIOUR",
                          )
                          .reduce((sum, option) => sum + option.count, 0)}
                        )
                      </h3>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {alertCount
                        .filter((option) => option.type === "DRIVER_BEHAVIOUR")
                        .map((option) => (
                          <div
                            key={option.value}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                              selectedAlertOption &&
                              selectedAlertOption.label === option.label
                                ? "bg-blue-100 border-l-3 border-blue-500"
                                : "hover:bg-blue-25 hover:bg-opacity-50"
                            }`}
                            onClick={() => {
                              let matchingAlert = alertOptions?.find(
                                (alert) => alert.label === option.label,
                              );

                              if (!matchingAlert) {
                                // Fallback: find from allAlertOptions
                                matchingAlert = allAlertOptions.find(
                                  (alert) => alert.label === option.label,
                                );
                              }

                              // If still no matching alert, create a default one
                              if (!matchingAlert) {
                                matchingAlert = {
                                  label: option.label,
                                  value: option.value,
                                  columns: allAlertOptions[0]?.columns || {},
                                };
                              }

                              // Always set the selected option and fetch data
                              setSelectedAlertOption(matchingAlert);
                              setAlertCount((prev) =>
                                prev.map((prevOption) => {
                                  if (prevOption.value === option.value) {
                                    return {
                                      ...prevOption,
                                      isNewData: false,
                                    };
                                  }
                                  return prevOption;
                                }),
                              );
                              fetchUpdatedAlertsListOnly({
                                alertType: matchingAlert.value,
                                isDTC: false,
                                useCustomDate: customDateRangeChanged,
                              });
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-700 text-xs truncate">
                                {option.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {option.count}
                              </span>
                              {categoryLoading[option.label] && (
                                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Only show OTHERS section if there are alerts in this category */}
                  {alertCount
                    .filter((option) => option.type === "OTHERS")
                    .reduce((sum, option) => sum + option.count, 0) > 0 && (
                    <div className="">
                      <div className="bg-orange-50 px-3 py-2 sticky top-0 z-10">
                        <h3 className="font-medium text-orange-800 text-xs uppercase tracking-wide">
                          Others (
                          {alertCount
                            .filter((option) => option.type === "OTHERS")
                            .reduce((sum, option) => sum + option.count, 0)}
                          )
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {alertCount
                          .filter((option) => option.type === "OTHERS")
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                                selectedAlertOption &&
                                selectedAlertOption.label === option.label
                                  ? "bg-orange-100 border-l-3 border-orange-500"
                                  : "hover:bg-orange-25 hover:bg-opacity-50"
                              }`}
                              onClick={() => {
                                let matchingAlert = alertOptions?.find(
                                  (alert) => alert.label === option.label,
                                );

                                if (!matchingAlert) {
                                  matchingAlert = allAlertOptions.find(
                                    (alert) => alert.label === option.label,
                                  );
                                }

                                if (!matchingAlert) {
                                  matchingAlert = {
                                    label: option.label,
                                    value: option.value,
                                    columns: allAlertOptions[0]?.columns || {},
                                  };
                                }

                                // Always set the selected option and fetch data
                                setSelectedAlertOption(matchingAlert);
                                setAlertCount((prev) =>
                                  prev.map((prevOption) => {
                                    if (prevOption.value === option.value) {
                                      return {
                                        ...prevOption,
                                        isNewData: false,
                                      };
                                    }
                                    return prevOption;
                                  }),
                                );
                                fetchUpdatedAlertsListOnly({
                                  alertType: matchingAlert.value,
                                  isDTC: false,
                                  useCustomDate: customDateRangeChanged,
                                });
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-700 text-xs truncate">
                                  {option.title}
                                </h4>
                              </div>
                              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded ml-2">
                                {option.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="bg-red-50 px-3 py-2 sticky top-0 z-10">
                      <h3 className="font-medium text-red-800 text-xs uppercase tracking-wide">
                        DTC (
                        {alertCount
                          .filter((option) => option.type === "DTC")
                          .reduce((sum, option) => sum + option.count, 0)}
                        )
                      </h3>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {alertCount
                        .filter((option) => option.type === "DTC")
                        .map((option) => (
                          <div
                            key={option.value}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                              selectedAlertOption &&
                              selectedAlertOption.label === option.label
                                ? "bg-red-100 border-l-3 border-red-500"
                                : "hover:bg-red-25 hover:bg-opacity-50"
                            }`}
                            onClick={() => {
                              let matchingAlert = alertOptions?.find(
                                (alert) => alert.label === option.label,
                              );

                              if (!matchingAlert) {
                                matchingAlert = allAlertOptions.find(
                                  (alert) => alert.label === option.label,
                                );
                              }

                              // If still no matching alert, create a default one
                              if (!matchingAlert) {
                                matchingAlert = {
                                  label: option.label,
                                  value: option.value,
                                  columns: allAlertOptions[0]?.columns || {},
                                };
                              }

                              // Always set the selected option and fetch data
                              setSelectedAlertOption(matchingAlert);
                              setAlertCount((prev) =>
                                prev.map((prevOption) => {
                                  if (prevOption.value === option.value) {
                                    return {
                                      ...prevOption,
                                      isNewData: false,
                                    };
                                  }
                                  return prevOption;
                                }),
                              );
                              fetchUpdatedAlertsListOnly({
                                alertType: option.label,
                                selectedAlertOptionValue: option.label,
                                isDTC: true,
                                useCustomDate: customDateRangeChanged,
                              });
                            }}
                          >
                            {option.isNewData && <div className="" />}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-700 text-xs truncate">
                                {option.title}
                              </h4>
                            </div>
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded ml-2">
                              {option.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Video Telematics Alerts Section */}
                  {VIDEO_TELEMATICS_USER_IDS.includes(Number(userId)) ? (
                    <div>
                      <div className="bg-purple-50 px-3 py-2 sticky top-0 z-10">
                        <h3 className="font-medium text-purple-800 text-xs uppercase tracking-wide">
                          Video Telematics (
                          {alertCount
                            .filter(
                              (option) => option.type === "VIDEO_TELEMATICS",
                            )
                            .reduce((sum, option) => sum + option.count, 0)}
                          )
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {alertCount
                          .filter(
                            (option) => option.type === "VIDEO_TELEMATICS",
                          )
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                                selectedAlertOption &&
                                selectedAlertOption.label === option.label
                                  ? "bg-purple-100 border-l-3 border-purple-500"
                                  : "hover:bg-purple-25 hover:bg-opacity-50"
                              }`}
                              onClick={() => {
                                let matchingAlert = alertOptions?.find(
                                  (alert) => alert.label === option.label,
                                );

                                if (!matchingAlert) {
                                  // Fallback: find from allAlertOptions
                                  matchingAlert = allAlertOptions.find(
                                    (alert) => alert.label === option.label,
                                  );
                                }

                                // If still no matching alert, create a default one
                                if (!matchingAlert) {
                                  matchingAlert = {
                                    label: option.label,
                                    value: option.value,
                                    columns: allAlertOptions[0]?.columns || {},
                                  };
                                }

                                // Always set the selected option and fetch data
                                setSelectedAlertOption(matchingAlert);
                                setAlertCount((prev) =>
                                  prev.map((prevOption) => {
                                    if (prevOption.value === option.value) {
                                      return {
                                        ...prevOption,
                                        isNewData: false,
                                      };
                                    }
                                    return prevOption;
                                  }),
                                );
                                fetchUpdatedAlertsListOnly({
                                  alertType: option.value,
                                  isDTC: false,
                                });
                              }}
                            >
                              {option.isNewData && <div />}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-700 text-xs truncate">
                                  {option.title}
                                </h4>
                              </div>
                              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded ml-2">
                                {option.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  {Number(accessLabel) === 6 && (
                    <div>
                      <div className="bg-orange-50 px-3 py-2 sticky top-0 z-10">
                        <h3 className="font-medium text-orange-800 text-xs uppercase tracking-wide">
                          E-Lock (
                          {alertCount
                            .filter((option) => option.type === "E_LOCK")
                            .reduce((sum, option) => sum + option.count, 0)}
                          )
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {alertCount
                          .filter((option) => option.type === "E_LOCK")
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                                selectedAlertOption &&
                                selectedAlertOption.label === option.label
                                  ? "bg-orange-100 border-l-3 border-orange-500"
                                  : "hover:bg-orange-25 hover:bg-opacity-50"
                              }`}
                              onClick={() => {
                                let matchingAlert = alertOptions?.find(
                                  (alert) => alert.label === option.label,
                                );

                                if (!matchingAlert) {
                                  matchingAlert = allAlertOptions.find(
                                    (alert) => alert.label === option.label,
                                  );
                                }

                                // If still no matching alert, create a default one
                                if (!matchingAlert) {
                                  matchingAlert = {
                                    label: option.label,
                                    value: option.value,
                                    columns: allAlertOptions[0]?.columns || {},
                                  };
                                }

                                // Always set the selected option and fetch data
                                setSelectedAlertOption(matchingAlert);
                                setAlertCount((prev) =>
                                  prev.map((prevOption) => {
                                    if (prevOption.value === option.value) {
                                      return {
                                        ...prevOption,
                                        isNewData: false,
                                      };
                                    }
                                    return prevOption;
                                  }),
                                );
                                fetchUpdatedAlertsListOnly({
                                  alertType: option.value,
                                  isDTC: false,
                                });
                              }}
                            >
                              {option.isNewData && <div className="" />}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-700 text-xs truncate">
                                  {option.title}
                                </h4>
                              </div>
                              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded ml-2">
                                {option.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {FUEL_USER_IDS.includes(Number(userId)) && (
                    <div>
                      <div className="bg-blue-50 px-3 py-2 sticky top-0 z-10">
                        <h3 className="font-medium text-blue-800 text-xs uppercase tracking-wide">
                          Fuel (
                          {alertCount
                            .filter((option) => option.type === "FUEL")
                            .reduce((sum, option) => sum + option.count, 0)}
                          )
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {alertCount
                          .filter((option) => option.type === "FUEL")
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                                selectedAlertOption &&
                                selectedAlertOption.label === option.label
                                  ? "bg-blue-100 border-l-3 border-blue-500"
                                  : "hover:bg-blue-25 hover:bg-opacity-50"
                              }`}
                              onClick={() => {
                                let matchingAlert = alertOptions?.find(
                                  (alert) => alert.label === option.label,
                                );

                                if (!matchingAlert) {
                                  matchingAlert = allAlertOptions.find(
                                    (alert) => alert.label === option.label,
                                  );
                                }

                                // If still no matching alert, create a default one
                                if (!matchingAlert) {
                                  matchingAlert = {
                                    label: option.label,
                                    value: option.value,
                                    columns: allAlertOptions[0]?.columns || {},
                                  };
                                }

                                // Always set the selected option and fetch data
                                setSelectedAlertOption(matchingAlert);
                                setAlertCount((prev) =>
                                  prev.map((prevOption) => {
                                    if (prevOption.value === option.value) {
                                      return {
                                        ...prevOption,
                                        isNewData: false,
                                      };
                                    }
                                    return prevOption;
                                  }),
                                );
                                fetchUpdatedAlertsListOnly({
                                  alertType: option.value,
                                  isDTC: false,
                                });
                              }}
                            >
                              <span className="text-sm text-gray-700 truncate">
                                {option.label}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  option.count > 0
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-500"
                                } ${
                                  option.isNewData
                                    ? "bg-green-100 text-green-600"
                                    : ""
                                }`}
                              >
                                {option.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* GPS Section */}
                  {GPS_USER_IDS.includes(Number(userId)) && (
                    <div>
                      <div className="bg-green-50 px-3 py-2 sticky top-0 z-10">
                        <h3 className="font-medium text-green-800 text-xs uppercase tracking-wide">
                          GPS (
                          {alertCount
                            .filter((option) => option.type === "GPS")
                            .reduce((sum, option) => sum + option.count, 0)}
                          )
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {alertCount
                          .filter((option) => option.type === "GPS")
                          .map((option) => (
                            <div
                              key={option.value}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 relative ${
                                selectedAlertOption &&
                                selectedAlertOption.label === option.label
                                  ? "bg-green-100 border-l-3 border-green-500"
                                  : "hover:bg-green-25 hover:bg-opacity-50"
                              }`}
                              onClick={() => {
                                let matchingAlert = alertOptions?.find(
                                  (alert) => alert.label === option.label,
                                );

                                if (!matchingAlert) {
                                  matchingAlert = allAlertOptions.find(
                                    (alert) => alert.label === option.label,
                                  );
                                }

                                // If still no matching alert, create a default one
                                if (!matchingAlert) {
                                  matchingAlert = {
                                    label: option.label,
                                    value: option.value,
                                    columns: allAlertOptions[0]?.columns || {},
                                  };
                                }

                                // Always set the selected option and fetch data
                                setSelectedAlertOption(matchingAlert);
                                setAlertCount((prev) =>
                                  prev.map((prevOption) => {
                                    if (prevOption.value === option.value) {
                                      return {
                                        ...prevOption,
                                        isNewData: false,
                                      };
                                    }
                                    return prevOption;
                                  }),
                                );
                                fetchUpdatedAlertsListOnly({
                                  alertType: option.value,
                                  isDTC: false,
                                });
                              }}
                            >
                              <span className="text-sm text-gray-700 truncate">
                                {option.label}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  option.count > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                } ${
                                  option.isNewData
                                    ? "bg-green-100 text-green-600"
                                    : ""
                                }`}
                              >
                                {option.count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-white shadow-sm border-l border-gray-200">
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50 drop-shadow-sm">
                    <div className="flex items-center justify-between gap-6 w-full">
                      <div className="flex items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">
                            {filteredAlerts.length !==
                              adjustedAlertsAsList.length &&
                              `(of ${adjustedAlertsAsList.length})`}
                          </span>
                          {(filters.vehicleNo ||
                            filters.alertType ||
                            filters.location ||
                            filters.status) && (
                            <Tag color="blue" className="text-xs">
                              Filtered
                            </Tag>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            Auto Refresh:
                          </span>
                          <button
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                              isPollingEnabled
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                            onClick={() => setIsPollingEnabled((prev) => !prev)}
                          >
                            {isPollingEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dropdown
                          trigger={["click"]}
                          dropdownRender={() => getFilterDropdown()}
                          placement="bottomRight"
                        >
                          <Button
                            icon={<FilterOutlined />}
                            size="small"
                            className={`${
                              filters.vehicleNo ||
                              filters.alertType ||
                              filters.location ||
                              filters.status
                                ? "border-blue-500 text-blue-600"
                                : ""
                            }`}
                          >
                            Filter
                          </Button>
                        </Dropdown>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleDownload}
                          size="small"
                          disabled={filteredAlerts.length === 0}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 pt-2 pb-2 mb-2 pl-6 text-sm bg-gray-100">
                      <span className="text-sm text-gray-600">
                        Last Updated:
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {currentTime.toLocaleString("en-US", { hour12: true })}
                      </span>
                    </div>
                    <AlertsListView
                      adjustedAlertsAsList={adjustedAlertsAsList}
                      filteredAlerts={filteredAlerts}
                      loading={
                        forceNoLoading
                          ? false
                          : loading ||
                            alertCount.length === 0 ||
                            alertOptions === undefined ||
                            alertOptions.length === 0 ||
                            isFiltersLoading
                      }
                      selectedAlert={
                        selectedAlertOption && selectedAlertOption.label
                      }
                      fetchUpdatedAlertsNotificationCard={
                        fetchUpdatedAlertsNotificationCard
                      }
                      api={api}
                      getFilterDropdown={getFilterDropdown}
                      filters={filters}
                      videoAlarmFiles={videoAlarmFiles}
                      fetchAlarmFiles={fetchAlarmFiles}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="">
                <div className="bg-white shadow-sm b">
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50 drop-shadow-sm">
                    <div className="flex items-center justify-between gap-6 w-full">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">
                            Total Alerts: {filteredAlerts.length}{" "}
                            {filteredAlerts.length !==
                              adjustedAlertsAsList.length &&
                              `(of ${adjustedAlertsAsList.length})`}
                          </span>
                          {(filters.vehicleNo ||
                            filters.alertType ||
                            filters.location ||
                            filters.status) && (
                            <Tag color="blue" className="text-xs">
                              Filtered
                            </Tag>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            Auto Refresh:
                          </span>
                          <button
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                              isPollingEnabled
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                            onClick={() => setIsPollingEnabled((prev) => !prev)}
                          >
                            {isPollingEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dropdown
                          trigger={["click"]}
                          dropdownRender={() => getFilterDropdown()}
                          placement="bottomRight"
                        >
                          <Button
                            icon={<FilterOutlined />}
                            size="small"
                            className={`${
                              filters.vehicleNo ||
                              filters.alertType ||
                              filters.location ||
                              filters.status
                                ? "border-blue-500 text-blue-600"
                                : ""
                            }`}
                          >
                            Filter
                          </Button>
                        </Dropdown>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleDownload}
                          size="small"
                          disabled={filteredAlerts.length === 0}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <AlertsListView
                      adjustedAlertsAsList={adjustedAlertsAsList}
                      filteredAlerts={filteredAlerts}
                      loading={false}
                      selectedAlert={selectedAlertOption?.label}
                      fetchUpdatedAlertsNotificationCard={
                        fetchUpdatedAlertsNotificationCard
                      }
                      api={api}
                      getFilterDropdown={getFilterDropdown}
                      filters={filters}
                      videoAlarmFiles={videoAlarmFiles}
                      fetchAlarmFiles={fetchAlarmFiles}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      <DownloadReportsModal
        downloadReport={downloadReport}
        setDownloadReport={setDownloadReport}
      />
    </div>
  );
};

export default View;
