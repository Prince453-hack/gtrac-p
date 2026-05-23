import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useMemo } from "react";
import { useGetDTCResultQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useGetReminderNotificationsQuery } from "@/app/_globalRedux/services/alertManagement";

const kmtAlertsDataTypes = [
  "overspeed",
  "overspeedKMT",
  "harshBreak",
  "harshacc",
  "freewheeling",
  "contineousDrive",
  "mainpower",
  "internalPower",
  "nightdrive",
  "idle",
  "panic",
  "lowengineoilpressure",
  "highenginetemperature",
  "services",
  "document",
  "transitdelay",
  "unlockonmove",
] as const;

export const useAlertCount = () => {
  const mapAlertIcons = useSelector((state: RootState) => state.mapAlertsIcons);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const { userId, groupId } = useSelector((state: RootState) => state.auth);

  // Check if Health tab is available for this vehicle
  const hasHealthTab = selectedVehicle?.gpsDtl?.immoblizeStatus === 1;

  // Get Health alerts (DTC data) - only if Health tab is available
  const { data: dtcData } = useGetDTCResultQuery(
    {
      vehicleId: 0,
      token: groupId,
    },
    { skip: !groupId || !hasHealthTab }
  );

  // Get Reminder notifications - with vehicle-specific filtering
  const { data: reminderData } = useGetReminderNotificationsQuery(
    {
      userId: userId?.toString() || "",
      startDate: "",
      endDate: "",
    },
    { skip: !userId }
  );

  const totalAlertCount = useMemo(() => {
    let vehicleAlertCount = 0;
    let healthAlertCount = 0;
    let reminderAlertCount = 0;

    // Count Vehicle alerts (existing logic)
    if (mapAlertIcons && mapAlertIcons.length > 0 && mapAlertIcons[0]) {
      const alertData = mapAlertIcons[0];
      kmtAlertsDataTypes.forEach((alertType) => {
        if (alertData[alertType as keyof typeof alertData]) {
          vehicleAlertCount +=
            (alertData[alertType as keyof typeof alertData] as any[]).length ||
            0;
        }
      });
    }

    // Count Health alerts (DTC data) - only if Health tab is available
    if (hasHealthTab && dtcData && dtcData.success && dtcData.list) {
      healthAlertCount = dtcData.list.length;
    }

    // Count Reminder alerts (active reminders) - filter by current vehicle
    if (reminderData && selectedVehicle?.vId) {
      reminderAlertCount = reminderData.filter(
        (reminder) =>
          (reminder.status === "pending" ||
            reminder.status === "alerted" ||
            reminder.status === "snoozed") &&
          // Only count reminders for the current vehicle
          (reminder.service?.vehicle_id === selectedVehicle.vId.toString() ||
            reminder.document?.vehicle_id === selectedVehicle.vId.toString())
      ).length;
    }

    return vehicleAlertCount + healthAlertCount + reminderAlertCount;
  }, [
    mapAlertIcons,
    dtcData,
    reminderData,
    hasHealthTab,
    selectedVehicle?.vId,
  ]);

  return totalAlertCount;
};
