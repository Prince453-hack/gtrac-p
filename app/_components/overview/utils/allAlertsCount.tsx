import moment from "moment";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { VideoAlarmsRecord } from "@/app/_globalRedux/services/types/post/getVideoAlerts";
import {
  useLazyGetAlertsByDateQuery,
  useLazyGetConsolidateKMQuery,
  useLazyGetDTCResultQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { useGetMettaxAlarmsMutation } from "@/app/_globalRedux/services/mettax";
import { useIndiaGetMettaxAlarmsMutation } from "@/app/_globalRedux/services/indiaMettax";
import { useLazyGetHaltingHoursInPoiQuery } from "@/app/_globalRedux/services/haltingHours";
import { getAlertsWithVideoPlayback } from "@/app/helpers/getAlertsWithVideoPlayback";

// Types for the alert count results
export interface AlertCountsResult {
  totalVehicles: number;
  fuelEnabledVehicles: number;
  lockEnabledVehicles: number;
  dashcamEnabledVehicles: number;
  enrouteHaltVehicles: VehicleData[];
  enrouteHaltCount: number;
  geofenceHaltVehicles: VehicleData[];
  vehicleHealthCount: number;
  driverBehaviourCount: number;
  lessKmCount: number;
  lockAlertsCount: number;
  geofenceHaltCount: number;
  dashcamVideoAlertsCount: number;
}

// Types for API parameters
export interface AlertFetchParams {
  userId: string | number;
  groupId: string | number;
  selectedDateRangeDateJs?: Date[];
  isVideoTelematics?: boolean;
}

// Types for fetched alert data
export interface FetchedAlertData {
  vehicleHealthAlerts: any[];
  driverBehaviourAlerts: any[];
  lessKmVehicles: any[];
  lessKmCount: number;
  lockAlerts: any[];
  lockAlertsCount: number;
  dashcamVideoAlerts: (VideoAlarmsRecord & {
    vehicleReg: string;
    deviceId: string;
  })[];
  dashcamVideoAlertsCount: number;
}

// Helper function to parse duration string to total minutes
export const parseDurationToMinutes = (modeTime: string): number => {
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

// Helper function to check if a vehicle is active
export const isVehicleActive = (vehicle: any): boolean => {
  const inactiveStatus = vehicle.gpsDtl?.inactiveStatus;
  // Vehicle is active if inactiveStatus is not 1 or "1"
  return inactiveStatus !== 1 && inactiveStatus !== "1";
};

// Helper function to filter alerts by active vehicles using vehicle registration
export const filterActiveVehicleAlerts = (
  alerts: any[],
  vehicleData: any
): any[] => {
  if (!vehicleData?.list || !Array.isArray(alerts)) {
    return alerts;
  }

  return alerts.filter((alert) => {
    // Get vehicle registration from alert (different fields possible)
    const vehReg =
      alert.vehicleno ||
      alert.vehicle_no ||
      alert.vehicleNum ||
      alert.vehReg ||
      alert.vehicleNumber;

    if (!vehReg) return true; // Keep alert if no vehicle registration found

    const cleanVehReg = vehReg
      .toString()
      .trim()
      .replace(/\s+[AB]\s*$/i, "")
      .trim();

    // Find matching vehicle in main vehicle data
    const matchedVehicle = vehicleData.list.find((vehicle: any) => {
      const vehicleReg = vehicle.vehReg?.toString().trim();
      return (
        vehicleReg === cleanVehReg || vehicleReg === vehReg.toString().trim()
      );
    });
    return !matchedVehicle || isVehicleActive(matchedVehicle);
  });
};

// Calculate all alert counts - copied from ODBDetailsSection.tsx
export const calculateAllAlertCounts = (
  vehicleCounts: any,
  vehicleData: any,
  vehicleHealthAlerts: any[],
  driverBehaviourAlerts: any[],
  lessKmCount: number,
  lockAlertsCount: number,
  dashcamVideoAlertsCount: number
): AlertCountsResult => {
  const totalVehicles =
    vehicleCounts?.list.find((e: any) => e.mode === "ALL")?.count || 0;

  let fuelEnabledVehicles = 0;
  let enrouteHaltVehicles: VehicleData[] = [];
  let geofenceHaltVehiclesList: VehicleData[] = [];
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
      return Boolean(model && /^\d+$/.test(model.toString().trim()));
    };

    // Helper function from View.tsx
    const isMoreThan48Hours = (modeTime: string): boolean => {
      if (!modeTime) return false;
      const timeStr = modeTime.toLowerCase();

      const daysMatch = timeStr.match(/(\d+)\s*days?/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        if (days >= 2) return true; // 2 or more days is definitely > 48 hours
      }

      // Extract hours
      const hoursMatch = timeStr.match(/(\d+)\s*hrs?/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

      // If we have days, add them to hours
      const totalHours = (daysMatch ? parseInt(daysMatch[1]) * 24 : 0) + hours;

      return totalHours >= 48;
    };

    const vehicles = vehicleData.list.filter(
      (vehicle: any) => vehicle.vId !== null
    );
    fuelEnabledVehicles = vehicles.filter(hasFuelData).length;

    // Calculate enroute halt vehicles using exact same logic as View.tsx
    enrouteHaltVehicles = vehicleData.list.filter((vehicle: any) => {
      const hasNoPoI = vehicle.gpsDtl?.latLngDtl?.poi === "No Nearest POI";
      const modeTime = vehicle.gpsDtl?.modeTime;
      const isMoreThan30Minutes = modeTime
        ? parseDurationToMinutes(modeTime) > 30
        : false;

      return hasNoPoI && isMoreThan30Minutes;
    });

    lockEnabledVehicles = vehicles.filter(hasController).length;
    dashcamEnabledVehicles = vehicles.filter(hasDashcam).length;

    geofenceHaltVehiclesList = vehicleData.list.filter((vehicle: any) => {
      const isStopped = vehicle.gpsDtl?.mode === "STOPPED";
      const hasValidTime = vehicle.gpsDtl?.modeTime;
      const isMoreThan48 = hasValidTime
        ? isMoreThan48Hours(vehicle.gpsDtl.modeTime)
        : false;
      const isInGeofence =
        vehicle.gpsDtl?.latLngDtl?.poi &&
        vehicle.gpsDtl.latLngDtl.poi !== "No Nearest POI";

      return isStopped && hasValidTime && isMoreThan48 && isInGeofence;
    });
  }

  // Calculate unique vehicles with health alerts
  const uniqueVehiclesWithHealthAlerts = new Set(
    vehicleHealthAlerts.map((alert) => alert.vehicle_no)
  ).size;

  return {
    totalVehicles,
    fuelEnabledVehicles,
    lockEnabledVehicles,
    dashcamEnabledVehicles,
    enrouteHaltVehicles,
    enrouteHaltCount: enrouteHaltVehicles.length,
    geofenceHaltVehicles: geofenceHaltVehiclesList,
    vehicleHealthCount: vehicleHealthAlerts.length,
    driverBehaviourCount: driverBehaviourAlerts.length,
    lessKmCount,
    lockAlertsCount,
    geofenceHaltCount: geofenceHaltVehiclesList?.length || 0,
    dashcamVideoAlertsCount,
  };
};

// Additional utility function for enroute halt calculation specifically
export const calculateEnrouteHaltVehicles = (vehicleList: any[]): any[] => {
  return vehicleList.filter((vehicle) => {
    const hasNoPoI = vehicle.gpsDtl?.latLngDtl?.poi === "No Nearest POI";
    const modeTime = vehicle.gpsDtl?.modeTime;
    const isMoreThan30Minutes = modeTime
      ? parseDurationToMinutes(modeTime) > 30
      : false;

    return hasNoPoI && isMoreThan30Minutes;
  });
};

// Additional utility function for geofence halt calculation
export const calculateGeofenceHaltVehicles = (vehicleList: any[]): any[] => {
  const isMoreThan48Hours = (modeTime: string): boolean => {
    if (!modeTime) return false;
    const timeStr = modeTime.toLowerCase();

    const daysMatch = timeStr.match(/(\d+)\s*days?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      if (days >= 2) return true; // 2 or more days is definitely > 48 hours
    }

    // Extract hours
    const hoursMatch = timeStr.match(/(\d+)\s*hrs?/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

    // If we have days, add them to hours
    const totalHours = (daysMatch ? parseInt(daysMatch[1]) * 24 : 0) + hours;

    return totalHours >= 48;
  };

  return vehicleList.filter((vehicle) => {
    const isStopped = vehicle.gpsDtl?.mode === "STOPPED";
    const hasValidTime = vehicle.gpsDtl?.modeTime;
    const isMoreThan48 = hasValidTime
      ? isMoreThan48Hours(vehicle.gpsDtl.modeTime)
      : false;
    const isInGeofence =
      vehicle.gpsDtl?.latLngDtl?.poi &&
      vehicle.gpsDtl.latLngDtl.poi !== "No Nearest POI";

    return isStopped && hasValidTime && isMoreThan48 && isInGeofence;
  });
};

// Vehicle classification utility functions
export const hasFuelData = (vehicle: VehicleData): boolean => {
  return Boolean(vehicle.gpsDtl?.fuel && vehicle.gpsDtl.fuel <= 100);
};

export const hasController = (vehicle: VehicleData): boolean => {
  return vehicle.gpsDtl?.controllernum === "CONTROLLER";
};

export const hasDashcam = (vehicle: VehicleData): boolean => {
  const model = vehicle.gpsDtl?.model;
  return Boolean(model && /^\d+$/.test(model.toString().trim()));
};

// Count enabled vehicles by type
export const countEnabledVehicles = (
  vehicleData: any
): {
  fuelEnabledCount: number;
  lockEnabledCount: number;
  dashcamEnabledCount: number;
} => {
  if (!vehicleData?.list) {
    return {
      fuelEnabledCount: 0,
      lockEnabledCount: 0,
      dashcamEnabledCount: 0,
    };
  }

  const vehicles = vehicleData.list.filter(
    (vehicle: any) => vehicle.vId !== null
  );

  return {
    fuelEnabledCount: vehicles.filter(hasFuelData).length,
    lockEnabledCount: vehicles.filter(hasController).length,
    dashcamEnabledCount: vehicles.filter(hasDashcam).length,
  };
};

// Fetch Vehicle Health Alerts with date filtering
export const fetchVehicleHealthAlertsWithDate = async (
  getDTCResult: any,
  params: AlertFetchParams,
  vehicleData: any
): Promise<any[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    const result = await getDTCResult({
      vehicleId: 0,
      token: params.groupId,
    });

    clearTimeout(timeoutId);

    const healthAlerts: any[] = [];

    // Process DTC data to extract vehicle health alerts
    if (result.data && result.data.list && Array.isArray(result.data.list)) {
      result.data.list.forEach((dtcRecord: any) => {
        // Check if this vehicle has any valid alerts first
        let hasValidAlerts = false;
        for (let i = 1; i <= 10; i++) {
          const spnCode = dtcRecord[`SPN${i}_Code`];
          const spnCategory = dtcRecord[`SPN${i}_Category`];
          if (
            spnCode &&
            spnCategory &&
            spnCode !== null &&
            spnCode !== undefined
          ) {
            hasValidAlerts = true;
            break;
          }
        }

        if (!hasValidAlerts) return;

        // Find corresponding vehicle from vehicleData
        let vehicleReg = "Unknown Vehicle";
        let matchedVehicle: any = null;
        if (vehicleData?.list) {
          matchedVehicle = vehicleData.list.find(
            (vehicle: any) =>
              vehicle.vehicleTrip?.sys_service_id === dtcRecord.sys_service_id
          );
          if (matchedVehicle) {
            vehicleReg = matchedVehicle.vehReg;
          }
          if (vehicleReg === "Unknown Vehicle") {
            const fallbackVehicle = vehicleData.list.find(
              (vehicle: any) => vehicle.vId === dtcRecord.sys_service_id
            );
            if (fallbackVehicle) {
              vehicleReg = fallbackVehicle.vehReg;
              matchedVehicle = fallbackVehicle;
            }
          }
        }

        // Skip non-active vehicles
        if (matchedVehicle && !isVehicleActive(matchedVehicle)) {
          return;
        }
        if (vehicleReg === "Unknown Vehicle") {
          return;
        }

        // Process valid SPN codes (1-10 codes per record)
        for (let i = 1; i <= 10; i++) {
          const spnCode = dtcRecord[`SPN${i}_Code`];
          const spnCategory = dtcRecord[`SPN${i}_Category`];
          const spnDescription = dtcRecord[`SPN${i}_Description`];
          const fmiCategory = dtcRecord[`FMI${i}_Category`];

          if (
            spnCode &&
            spnCategory &&
            spnCode !== null &&
            spnCode !== undefined
          ) {
            const alertTime = dtcRecord.gps_time || new Date().toISOString();

            // Filter by date range if provided
            if (
              params.selectedDateRangeDateJs &&
              params.selectedDateRangeDateJs.length === 2
            ) {
              const alertMoment = moment(alertTime);
              const startDate = moment(params.selectedDateRangeDateJs[0]);
              const endDate = moment(params.selectedDateRangeDateJs[1]);

              if (!alertMoment.isBetween(startDate, endDate, "day", "[]")) {
                continue;
              }
            }

            healthAlerts.push({
              vehicle_no: vehicleReg,
              exception_type: spnDescription || `SPN Code ${spnCode}`,
              startlocation: "Vehicle Health Alert",
              starttime: alertTime,
              KM: dtcRecord.tel_odometer || 0,
              speed: 0,
              spn_code: spnCode,
              spn_category: spnCategory,
              fmi_category: fmiCategory,
              severity:
                fmiCategory === "RED"
                  ? "Severe"
                  : fmiCategory === "YELLOW"
                  ? "Moderate"
                  : "Minor",
              sys_service_id: dtcRecord.sys_service_id,
              alert_type: "DTC",
            });
          }
        }
      });
    }

    // Add GPS Power Disconnected vehicles
    if (vehicleData?.list) {
      const gpsPowerDisconnectedVehicles = vehicleData.list.filter(
        (vehicle: any) => {
          const isPowerDisconnected =
            vehicle.gpsDtl?.ismainpoerconnected === "0";
          const isActive = isVehicleActive(vehicle);
          return isPowerDisconnected && isActive && vehicle.vehReg;
        }
      );

      gpsPowerDisconnectedVehicles.forEach((vehicle: any) => {
        const alertTime =
          vehicle.gpsDtl?.latLngDtl?.gpstime || new Date().toISOString();

        // Filter by date range if provided
        if (
          params.selectedDateRangeDateJs &&
          params.selectedDateRangeDateJs.length === 2
        ) {
          const alertMoment = moment(alertTime);
          const startDate = moment(params.selectedDateRangeDateJs[0]);
          const endDate = moment(params.selectedDateRangeDateJs[1]);

          if (!alertMoment.isBetween(startDate, endDate, "day", "[]")) {
            return;
          }
        }

        healthAlerts.push({
          vehicle_no: vehicle.vehReg,
          exception_type: "GPS Power Disconnected",
          startlocation: "GPS Power Alert",
          starttime: alertTime,
          KM: vehicle.gpsDtl?.latLngDtl?.km || 0,
          speed: vehicle.gpsDtl?.latLngDtl?.speed || 0,
          spn_code: "N/A",
          spn_category: "POWER",
          fmi_category: "RED",
          severity: "N/A",
          sys_service_id: vehicle.vId,
          alert_type: "GPS_POWER",
        });
      });
    }

    return healthAlerts;
  } catch (error: any) {
    console.warn("DTC API call failed:", error);
    return [];
  }
};

// Fetch Driver Behaviour Alerts with date filtering
export const fetchDriverBehaviourAlertsWithDate = async (
  params: AlertFetchParams,
  vehicleData: any
): Promise<any[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${params.groupId}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data)) {
      const driverBehaviourAlerts = data.filter(
        (alert: any) =>
          alert.alert_type !== "Unlock on move" &&
          alert.alert_type !== "Lock - Unlocked"
      );

      const alertsWithKnownVehicles = driverBehaviourAlerts.filter(
        (alert: any) => {
          const vehReg =
            alert.vehicleno ||
            alert.vehicle_no ||
            alert.vehicleNum ||
            alert.vehReg ||
            alert.vehicleNumber;
          return (
            vehReg &&
            vehReg.toString().trim() !== "" &&
            vehReg.toString().toLowerCase() !== "unknown vehicle" &&
            vehReg.toString().toLowerCase() !== "unknown"
          );
        }
      );

      let activeDriverBehaviourAlerts = filterActiveVehicleAlerts(
        alertsWithKnownVehicles,
        vehicleData
      );

      // Filter by date range if provided
      if (
        params.selectedDateRangeDateJs &&
        params.selectedDateRangeDateJs.length === 2
      ) {
        const startDate = moment(params.selectedDateRangeDateJs[0]);
        const endDate = moment(params.selectedDateRangeDateJs[1]);

        activeDriverBehaviourAlerts = activeDriverBehaviourAlerts.filter(
          (alert: any) => {
            const alertTime =
              alert.starttime || alert.alert_time || alert.datetime;
            if (!alertTime) return false;

            const alertMoment = moment(alertTime);
            return alertMoment.isBetween(startDate, endDate, "day", "[]");
          }
        );
      }

      return activeDriverBehaviourAlerts;
    }
    return [];
  } catch (error: any) {
    console.warn("Driver Behaviour Alerts API call failed:", error);
    return [];
  }
};

// Fetch Lock Alerts with date filtering
export const fetchLockAlertsWithDate = async (
  params: AlertFetchParams,
  vehicleData: any
): Promise<{ alerts: any[]; count: number }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${params.groupId}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data)) {
      const specificLockAlerts = data.filter(
        (alert: any) =>
          alert.alert_type === "Unlock on move" ||
          alert.alert_type === "Lock - Unlocked"
      );

      let activeLockAlerts = filterActiveVehicleAlerts(
        specificLockAlerts,
        vehicleData
      );

      // Filter by date range if provided
      if (
        params.selectedDateRangeDateJs &&
        params.selectedDateRangeDateJs.length === 2
      ) {
        const startDate = moment(params.selectedDateRangeDateJs[0]);
        const endDate = moment(params.selectedDateRangeDateJs[1]);

        activeLockAlerts = activeLockAlerts.filter((alert: any) => {
          const alertTime =
            alert.starttime || alert.alert_time || alert.datetime;
          if (!alertTime) return false;

          const alertMoment = moment(alertTime);
          return alertMoment.isBetween(startDate, endDate, "day", "[]");
        });
      }

      return {
        alerts: activeLockAlerts,
        count: activeLockAlerts.length,
      };
    }
    return { alerts: [], count: 0 };
  } catch (error: any) {
    console.warn("Lock Alerts API call failed:", error);
    return { alerts: [], count: 0 };
  }
};

// Fetch Dashcam Video Alerts with date filtering
export const fetchDashcamVideoAlertsWithDate = async (
  videoAlertsTrigger: any,
  getIndiaMettaxAlarmsTrigger: any,
  params: AlertFetchParams,
  vehicleData: any
): Promise<{
  alerts: (VideoAlarmsRecord & { vehicleReg: string; deviceId: string })[];
  count: number;
}> => {
  // Only fetch for users with video telematics enabled and specific user IDs
  if (
    !params.isVideoTelematics ||
    (Number(params.userId) !== 81707 && Number(params.userId) !== 4343)
  ) {
    return { alerts: [], count: 0 };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    // Use selected date range if provided, otherwise default to today
    let startDate: string;
    let endDate: string;

    if (
      params.selectedDateRangeDateJs &&
      params.selectedDateRangeDateJs.length === 2
    ) {
      startDate = moment(params.selectedDateRangeDateJs[0])
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      endDate = moment(params.selectedDateRangeDateJs[1])
        .endOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
    } else {
      const today = moment();
      startDate = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
      endDate = today.format("YYYY-MM-DD HH:mm:ss");
    }

    const dashcamVehicles =
      vehicleData?.list?.filter((vehicle: any) => {
        const model = vehicle.gpsDtl?.model;
        const hasValidModel = Boolean(
          model && /^\d+$/.test(model.toString().trim())
        );
        const isActive = isVehicleActive(vehicle);
        return hasValidModel && isActive;
      }) || [];

    const allVideoAlerts: (VideoAlarmsRecord & {
      vehicleReg: string;
      deviceId: string;
    })[] = [];

    // Fetch alerts for each dashcam vehicle
    for (const vehicle of dashcamVehicles) {
      if (vehicle.gpsDtl?.model) {
        try {
          let response;

          if (Number(params.userId) === 5360) {
            // User 5360 uses India API only
            response = await getIndiaMettaxAlarmsTrigger({
              startTime: startDate,
              endTime: endDate,
              deviceIds: vehicle.gpsDtl.model as string,
              alarmType: null,
              pageSize: 1000,
              pageIndex: 1,
            }).unwrap();
          } else if (Number(params.userId) === 4343) {
            // User 4343 uses same logic as View.tsx
            response = await videoAlertsTrigger({
              startTime: startDate,
              endTime: endDate,
              deviceIds: vehicle.gpsDtl.model as string,
              alarmType: null,
              pageSize: 100,
              pageIndex: 1,
            }).unwrap();
          } else {
            // Other users use Singapore API
            response = await videoAlertsTrigger({
              startTime: startDate,
              endTime: endDate,
              deviceIds: vehicle.gpsDtl.model as string,
              alarmType: null,
              pageSize: 1000,
              pageIndex: 1,
            }).unwrap();
          }

          clearTimeout(timeoutId);

          if (response.data && response.data.records) {
            let filteredAlerts;

            if (Number(params.userId) === 4343) {
              const allowedAlertTypes = [
                "seatBelt",
                "handheldPhoneCall",
                "smoking",
                "fatigueWarn",
              ];

              filteredAlerts = response.data.records
                .filter((alert: any) =>
                  allowedAlertTypes.includes(alert.alarmType)
                )
                .map((alert: any) => ({
                  ...alert,
                  vehicleReg: vehicle.vehReg,
                  deviceId: vehicle.gpsDtl.model,
                })) as (VideoAlarmsRecord & {
                vehicleReg: string;
                deviceId: string;
              })[];
            } else {
              // For other users, include alerts with video playback capability
              filteredAlerts = response.data.records
                .filter((alert: any) =>
                  getAlertsWithVideoPlayback({
                    alarmType: alert.alarmType as any,
                  })
                )
                .map((alert: any) => ({
                  ...alert,
                  vehicleReg: vehicle.vehReg,
                  deviceId: vehicle.gpsDtl.model,
                })) as (VideoAlarmsRecord & {
                vehicleReg: string;
                deviceId: string;
              })[];
            }

            allVideoAlerts.push(...filteredAlerts);
          }
        } catch (vehicleError: any) {
          console.warn(
            `Failed to fetch video alerts for vehicle ${vehicle.vehReg}:`,
            vehicleError
          );
        }
      }
    }

    return {
      alerts: allVideoAlerts,
      count: allVideoAlerts.length,
    };
  } catch (error: any) {
    console.warn("Dashcam Video Alerts API call failed:", error);
    return { alerts: [], count: 0 };
  }
};

// Fetch Less KM Vehicles with date filtering
export const fetchLessKmVehiclesWithDate = async (
  getConsolidateKM: any,
  getHaltingHours: any,
  params: AlertFetchParams,
  vehicleData: any
): Promise<{ vehicles: any[]; count: number }> => {
  try {
    const previousDay = moment().subtract(1, "days");
    const startDate = previousDay.format("YYYY-MM-DD 00:00:00");
    const endDate = previousDay.format("YYYY-MM-DD 23:59:59");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    // Fetch both consolidate KM data and halting hours data
    const [consolidateResult, haltingHoursResult] = await Promise.all([
      getConsolidateKM({
        token: params.groupId,
        startdate: startDate,
        enddate: endDate,
      }),
      getHaltingHours({
        token: params.groupId,
      }),
    ]);

    clearTimeout(timeoutId);

    if (
      consolidateResult.data &&
      consolidateResult.data.list &&
      Array.isArray(consolidateResult.data.list) &&
      haltingHoursResult.data &&
      haltingHoursResult.data.list &&
      Array.isArray(haltingHoursResult.data.list)
    ) {
      const consolidateData = consolidateResult.data.list;
      const haltingHoursData = haltingHoursResult.data.list;

      const haltingHoursMap = new Map();
      haltingHoursData.forEach((vehicle: any) => {
        haltingHoursMap.set(vehicle.vehicleNum.toString(), vehicle);
      });

      // Filter vehicles based on new logic
      const filteredVehicles = consolidateData.filter((vehicle: any) => {
        const vehId = vehicle.veh_id;
        if (!vehId) return false;

        const haltingData = haltingHoursMap.get(vehId.toString());
        if (!haltingData) return false;

        const totalHaltingTimeMin = parseInt(haltingData.total_halting_timeMin);

        // Skip if halting time is greater than 1080 minutes (18 hours)
        if (totalHaltingTimeMin > 1080) return false;

        // Calculate expected KM
        const workingTimeMin = 1080 - totalHaltingTimeMin;
        const workingHours = workingTimeMin / 60;
        const expectedKM = workingHours * 30;

        // Get actual KM from consolidate data
        const actualKM = parseFloat(vehicle.kmshow || 0);

        // Consider as lesser KM if actual < expected
        return actualKM < expectedKM;
      });

      // Merge the data to include both consolidate and halting hours info
      const mergedVehicles = filteredVehicles.map((vehicle: any) => {
        const vehId = vehicle.veh_id;
        const haltingData = haltingHoursMap.get(vehId.toString());

        const totalHaltingTimeMin = parseInt(
          haltingData?.total_halting_timeMin || 0
        );
        const workingTimeMin = 1080 - totalHaltingTimeMin;
        const workingHours = workingTimeMin / 60;
        const expectedKM = workingHours * 30;
        const actualKM = parseFloat(vehicle.kmshow || 0);

        return {
          ...vehicle,
          haltingHours: haltingData?.total_halting_time || "N/A",
          haltingMinutes: totalHaltingTimeMin,
          workingHours: workingHours.toFixed(2),
          expectedKM: expectedKM.toFixed(2),
          actualKM: actualKM.toFixed(2),
          difference: (expectedKM - actualKM).toFixed(2),
        };
      });

      const activeFilteredVehicles = filterActiveVehicleAlerts(
        mergedVehicles,
        vehicleData
      );

      return {
        vehicles: activeFilteredVehicles,
        count: activeFilteredVehicles.length,
      };
    }

    return { vehicles: [], count: 0 };
  } catch (error: any) {
    console.warn("KM API call failed:", error);
    return { vehicles: [], count: 0 };
  }
};

// Main function to fetch all alerts with date filtering - use today's date by default
export const fetchAllAlertsWithDate = async (
  apiHooks: {
    getDTCResult: any;
    videoAlertsTrigger: any;
    getIndiaMettaxAlarmsTrigger: any;
    getConsolidateKM: any;
    getHaltingHours: any;
  },
  params: AlertFetchParams,
  vehicleData: any
): Promise<FetchedAlertData> => {
  // Use today's date if no date range provided
  const dateParams = {
    ...params,
    selectedDateRangeDateJs: params.selectedDateRangeDateJs || [
      moment().startOf("day").toDate(),
      moment().endOf("day").toDate(),
    ],
  };

  try {
    // Fetch all alerts in parallel
    const [
      vehicleHealthAlerts,
      driverBehaviourAlerts,
      lessKmData,
      lockData,
      dashcamData,
    ] = await Promise.all([
      fetchVehicleHealthAlertsWithDate(
        apiHooks.getDTCResult,
        dateParams,
        vehicleData
      ),
      fetchDriverBehaviourAlertsWithDate(dateParams, vehicleData),
      fetchLessKmVehiclesWithDate(
        apiHooks.getConsolidateKM,
        apiHooks.getHaltingHours,
        dateParams,
        vehicleData
      ),
      fetchLockAlertsWithDate(dateParams, vehicleData),
      fetchDashcamVideoAlertsWithDate(
        apiHooks.videoAlertsTrigger,
        apiHooks.getIndiaMettaxAlarmsTrigger,
        dateParams,
        vehicleData
      ),
    ]);

    return {
      vehicleHealthAlerts,
      driverBehaviourAlerts,
      lessKmVehicles: lessKmData.vehicles,
      lessKmCount: lessKmData.count,
      lockAlerts: lockData.alerts,
      lockAlertsCount: lockData.count,
      dashcamVideoAlerts: dashcamData.alerts,
      dashcamVideoAlertsCount: dashcamData.count,
    };
  } catch (error) {
    console.error("Error fetching all alerts:", error);
    return {
      vehicleHealthAlerts: [],
      driverBehaviourAlerts: [],
      lessKmVehicles: [],
      lessKmCount: 0,
      lockAlerts: [],
      lockAlertsCount: 0,
      dashcamVideoAlerts: [],
      dashcamVideoAlertsCount: 0,
    };
  }
};
