"use client";

import ac from "@/app/_assets/mapsimg/alerts/ac.svg";
import document from "@/app/_assets/mapsimg/alerts/document.svg";
import freeWheelMap from "@/app/_assets/mapsimg/alerts/freeWheelMap.png";
import harshAccelerationMap from "@/app/_assets/mapsimg/alerts/harshAccelerationMap.png";
import harshBreakMap from "@/app/_assets/mapsimg/alerts/harshBreakMap.png";
import idleIcon from "@/app/_assets/mapsimg/alerts/idleIcon.png";
import internalBatteryMap from "@/app/_assets/mapsimg/alerts/internalBatteryMap.png";
import mainPowerMap from "@/app/_assets/mapsimg/alerts/mainPowerMap.png";
import poiAlert from "@/app/_assets/mapsimg/alerts/outOfRouteIcon.png";
import overspeedMap from "@/app/_assets/mapsimg/alerts/overspeedMap.png";
import panic from "@/app/_assets/mapsimg/alerts/panic.svg";
import services from "@/app/_assets/mapsimg/alerts/services.svg";
import unlockOnMove from "@/app/_assets/mapsimg/alerts/unlock-on-move.svg";
import {
  useAddElockAlertCommentMutation,
  useAddFuelAlertsMutation,
  useAddPanicAlertApprovalByControlRoomMutation,
  useAddTemperatureAlertCommentMutation,
  useLazyGetElockAlertsQuery,
  useLazyGetFuelAlertsQuery,
  useLazyGetPanicAlertsQuery,
  useLazyGetTemperatureAlertsQuery,
} from "@/app/_globalRedux/services/gtrac_newtracking";
import {
  useAddNormalAlertCommentMutation,
  useLazyGetNormalAlertsQuery,
} from "@/app/_globalRedux/services/reactApi";
import { RootState } from "@/app/_globalRedux/store";
import { Button, Input, Select } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";
import PopupModal from "./DialogAccept";

interface NormalAlerts {
  [key: string]: any;
}

const normalAlerts: NormalAlerts = {
  ["panic"]: panic,
  ["idle"]: idleIcon,
  ["unlockonmove"]: unlockOnMove,
  ["idling"]: idleIcon,
  ["overspeed"]: overspeedMap,
  ["mainpowerdisconnected"]: mainPowerMap,
  ["mainpowerdisconnect"]: mainPowerMap,
  ["mainpowerconnected"]: mainPowerMap,
  ["internalbatterydisconnected"]: internalBatteryMap,
  ["internalbatteryconnected"]: internalBatteryMap,
  ["poscooverspeed"]: overspeedMap,
  ["freewheeling"]: freeWheelMap,
  ["harshbreaking"]: harshBreakMap,
  ["harshaccleration"]: harshAccelerationMap,
  ["services"]: services,
  ["document"]: document,
  ["ac"]: ac,
  ["poialert"]: poiAlert,
  ["geofencealert"]: poiAlert,
};

// Helper function to get alert icon with fallback
const getAlertIcon = (alertType: string | undefined) => {
  if (!alertType) return services; // Default fallback icon

  const normalizedAlertType = alertType.replaceAll(" ", "").toLowerCase();
  return normalAlerts[normalizedAlertType] || services;
};

const formatAlertType = (alertType: string | undefined) => {
  if (!alertType) return "";

  if (alertType.toLowerCase() === "freewheeling") {
    return "Free Wheeling";
  }

  if (alertType.toLowerCase() === "night movement") {
    return "Night Movement";
  }

  return alertType;
};

const shouldAllowComments = (alertType: string | undefined) => {
  if (!alertType) return false;

  const normalizedAlertType = alertType.toLowerCase().trim();
  const allowedTypes = [
    "free wheeling",
    "freewheeling",
    "harsh acceleration",
    "harsh braking",
    "harshbraking",
    "lock - unlocked",
    "elock alert",
    "night movement",
    "overspeed",
    "unlock on move",
    "unhealthy:cabin gps not working",
    "lesser km/day",
    "geofence alert",
    "geofence halt alert",
    "vehicle health alert",
    "enroute halt alert",
    "tired",
    "smoking",
    "smoke",
    "handheldphonecall",
    "phone call",
    "fatigue warn",
    "fatiguewarn",
    "fasten seat belt",
  ];

  return allowedTypes.some((type) =>
    normalizedAlertType.includes(type.toLowerCase()),
  );
};

// Helper function to get API alert type for comment submission
const getApiAlertType = (alertType: string | undefined): string => {
  if (!alertType) return "other";

  const normalizedAlertType = alertType.toLowerCase().trim();
  const alertTypeMap: { [key: string]: string } = {
    "lesser km/day": "lesser_km",
    "enroute halt alert": "Enroute halt alert",
    "geofence halt alert": "Geofence Halt alerts",
    "geofence alert": "Geofence Exit alerts",
    "vehicle health alert": "health alerts",
    "unlock on move": "unlock on move",
    "lock - unlocked": "unlock on move",
    "elock alert": "Elock Alert",
    "free wheeling": "free_wheeling",
    freewheeling: "free_wheeling",
    "harsh acceleration": "harsh_acceleration",
    "harsh braking": "harsh_braking",
    harshbraking: "harsh_braking",
    "night movement": "night_movement",
    overspeed: "overspeed",
    "phone call": "handheldphonecall",
    handheldphonecall: "handheldPhoneCall",
    smoke: "smoking",
    smoking: "smoking",
    tired: "tired",
    "fatigue warn": "fatigue warn",
    "fatigue warning": "fatigue warn",
    fatiguewarn: "fatigue warn",
    "fasten seat belt": "fasten seat belt",
  };

  for (const [key, value] of Object.entries(alertTypeMap)) {
    if (normalizedAlertType === key) {
      return value;
    }
  }

  return alertType
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

const temperatureSelectOptions = [
  { value: "Refer Issue", label: "Refer Issue" },
  { value: "Sensor Issue", label: "Sensor Issue" },
  { value: "Lack of fuel", label: "Lack of fuel" },
  { value: "Driver is not maintaining", label: "Driver is not maintaining" },
  {
    value: "Multiple Unloading/ Loading",
    label: "Multiple Unloading/ Loading",
  },
  { value: "Trip completed", label: "Trip completed" },
  { value: "Trip didnot start", label: "Trip didnot start" },
  { value: "Accident", label: "Accident" },
  { value: "Temperature Maintained", label: "Temperature Maintained" },
  { value: "Reefer Defrost", label: "Reefer Defrost" },
  { value: "Dry Load", label: "Dry Load" },
  { value: "GPS issue", label: "GPS issue" },
  { value: "Other", label: "Other" },
];

const fuelSelectOptions = [
  { value: "Fueling OK", label: "Fueling OK" },
  { value: "Driver Negligence", label: "Driver Negligence" },
  { value: "Route Issue", label: "Route Issue" },
  { value: "Outside Route", label: "Outside Route" },
  { value: "No Entry", label: "No Entry" },
  { value: "Pump Closed", label: "Pump Closed" },
  { value: "GPS issue", label: "GPS issue" },
  { value: "Others", label: "Others" },
];
export const AlertNotificationCard = ({
  alertId,
  vehicleNumber,
  title,
  description,
  vehicleId,
  alertType,
  dateTime,
  type,
  popup,
  api,
  notificationKey,
  changeOpenNotificationIndexState,
  from,
  fetchUpdatedAlerts,
}: {
  alertId: string;
  vehicleNumber: string;
  title?: string;
  description: string;
  vehicleId?: string;
  alertType?: string;
  dateTime?: string;
  type: string;
  popup?: boolean;
  api?: NotificationInstance;
  notificationKey?: string;
  changeOpenNotificationIndexState?: () => void;
  from?: string;
  fetchUpdatedAlerts?: () => void;
}) => {
  const { userId, groupId, parentUser, accessLabel, userName } = useSelector(
    (state: RootState) => state.auth,
  );

  const [expandState, setExpandState] = useState(popup ? true : false);
  const [commentInputActive, setCommentInputActive] = useState(
    popup &&
      ((type !== "Normal" && type !== "Geofence Alert") ||
        shouldAllowComments(alertType)),
  );
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const [commentInputValue, setCommentInputValue] = useState("");
  const [temperatureAlertSelectValue, setTemperatureAlertSelectValue] =
    useState("");

  const [getElockAlerts] = useLazyGetElockAlertsQuery();
  const [getTempAlerts] = useLazyGetTemperatureAlertsQuery();
  const [getPanicAlerts] = useLazyGetPanicAlertsQuery();
  const [getFuelAlerts] = useLazyGetFuelAlertsQuery();
  const [getNormalAlerts] = useLazyGetNormalAlertsQuery();

  const [addElockAlertComment] = useAddElockAlertCommentMutation();
  const [addTempAlertCommnet] = useAddTemperatureAlertCommentMutation();
  const [addPanicAlertApprovalByControlRoom] =
    useAddPanicAlertApprovalByControlRoomMutation();
  const [addFuelAlert] = useAddFuelAlertsMutation();
  const [addNormalAlertComment] = useAddNormalAlertCommentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const parseAmbulanceFuelingAlert = (description: string) => {
    try {
      const vehicleMatch = description.match(/Ambulance\s+([A-Z0-9]+)/i);
      const extractedVehicle = vehicleMatch ? vehicleMatch[1] : "";

      const locationMatch = description.match(
        /at\s+(.+?)\s+with\s+[\d.]+L\s+fuel/i,
      );
      const extractedLocation = locationMatch ? locationMatch[1].trim() : "";

      const fuelMatch = description.match(/with\s+([\d.]+)L\s+fuel/i);
      const extractedFuel = fuelMatch
        ? parseFloat(fuelMatch[1]).toFixed(2)
        : "";

      return {
        vehicleNumber: extractedVehicle,
        location: extractedLocation,
        currentFuel: extractedFuel,
      };
    } catch (error) {
      console.error("Error parsing ambulance fueling alert:", error);
      return {
        vehicleNumber: "",
        location: "",
        currentFuel: "",
      };
    }
  };

  const shouldShowViewButton = () => {
    return (
      Number(userId) === 833193 &&
      (alertType === "Ambulance Fueling" ||
        alertType === "Repair and Maintenance")
    );
  };

  const handleViewClick = () => {
    if (alertType === "Ambulance Fueling") {
      window.open("https://yatayaat.in:8080/dashboard/CC-5544993022", "_blank");
    } else if (alertType === "Repair and Maintenance") {
      window.open("https://yatayaat.in:8080/dashboard/CC-5544993011", "_blank");
    }
  };

  // Helper function to handle normal alert comment submission
  const handleNormalAlertComment = async (alertTypeForApi: string) => {
    await addNormalAlertComment({
      token: Number(groupId),
      remark: commentInputValue,
      issue: "",
      service_id: Number(vehicleId),
      alert_type: alertTypeForApi as any,
    }).then(() => {
      if (changeOpenNotificationIndexState && api && notificationKey) {
        api.destroy(notificationKey);
        changeOpenNotificationIndexState();
      }
      if (from === "ALERTS_TABLE" && fetchUpdatedAlerts) {
        fetchUpdatedAlerts();
      } else {
        getNormalAlerts({
          token:
            Number(userId) === 833406 || Number(userId) === 833407
              ? 59961
              : Number(groupId) === 5267
                ? 6364
                : Number(groupId),
        });
      }
    });
  };

  const handleCommentSubmit = async () => {
    setIsCommentLoading(true);
    if (type === "Temperature") {
      await addTempAlertCommnet({
        token: groupId,
        userId: userId,
        puserId: parentUser,
        body: {
          veh_no: vehicleNumber,
          comment: temperatureAlertSelectValue,
          username: userId,
          close_time_msg: commentInputValue,
          alert_id: Number(alertId),
        },
      }).then(() => {
        if (changeOpenNotificationIndexState && api && notificationKey) {
          api.destroy(notificationKey);
          changeOpenNotificationIndexState();
        }
        getTempAlerts({ token: groupId, userId: userId, puserId: parentUser });
      });
    } else if (type === "Elock") {
      if (accessLabel === 6 && title) {
        await addElockAlertComment({
          token: groupId,
          userId: userId,
          puserId: parentUser,
          body: {
            id: Number(alertId),
            remarks: commentInputValue,
            title: title,
            veh_id: Number(vehicleId),
          },
        }).then(() => {
          if (changeOpenNotificationIndexState && api && notificationKey) {
            api.destroy(notificationKey);
            changeOpenNotificationIndexState();
          }
          getElockAlerts({
            token: groupId,
            userId: userId,
            puserId: parentUser,
          });
        });
      }
    } else if (type === "Panic") {
      await addPanicAlertApprovalByControlRoom({
        token: groupId,
        userId: userId,
        puserId: parentUser,
        body: {
          comment: "Approved by Control Room",
          username: userName,
          veh_no: vehicleNumber,
        },
      }).then(() => {
        if (changeOpenNotificationIndexState && api && notificationKey) {
          api.destroy(notificationKey);
          changeOpenNotificationIndexState();
        }
        getPanicAlerts({ token: groupId, userId: userId, puserId: parentUser });
      });
    } else if (type === "Fuel") {
      await addFuelAlert({
        token: groupId,
        userId: userId,
        puserId: parentUser,
        body: {
          veh_no: vehicleNumber,
          comment: commentInputValue,
          username: userId,
        },
      }).then(() => {
        if (changeOpenNotificationIndexState && api && notificationKey) {
          api.destroy(notificationKey);
          changeOpenNotificationIndexState();
        }
        getFuelAlerts({ token: groupId, userId: userId, puserId: parentUser });
      });
    } else if (type === "Idle") {
      await handleNormalAlertComment("idle");
    } else if (type === "Geofence Alert") {
      await handleNormalAlertComment("Geofence_Exit_alerts");
    } else if (type === "Normal" && shouldAllowComments(alertType)) {
      // Handle all normal alert types with comments
      await handleNormalAlertComment(getApiAlertType(alertType));
    }

    setCommentInputValue("");
    setTemperatureAlertSelectValue("");
    setIsCommentLoading(false);
    setCommentInputActive(false);
  };

  return (
    <div className={`${type !== "Normal" ? "min-h-[90px]" : ""} relative`}>
      <div className={`${type !== "Normal" ? "flex items-start gap-2" : ""}`}>
        {type !== "Normal" ? (
          <div
            className={`${
              type === "Temperature"
                ? "bg-blue-500"
                : type === "Panic"
                  ? "bg-red-700"
                  : "bg-yellow-500"
            } mt-1 rounded-full min-w-10 max-w-10 min-h-10 max-h-10 flex justify-center items-center text-white font-medium text-lg`}
          >
            <div>{type[0]}</div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <div className="mt-2">
                <i>
                  {alertType ? (
                    alertType === "alcohol" ? (
                      <div
                        className="
												bg-red-700
												 mt-1 rounded-full min-w-10 max-w-10 min-h-10 max-h-10 flex justify-center items-center text-white font-semibold text-lg"
                      >
                        A
                      </div>
                    ) : (
                      <Image
                        width={40}
                        height={40}
                        src={getAlertIcon(alertType)}
                        alt={`${alertType || "Alert"} icon`}
                        className="min-w-10 max-w-10 max-h-10 min-h-10"
                        draggable={false}
                      />
                    )
                  ) : null}
                </i>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-base font-bold ">
                    {alertType === "alcohol"
                      ? "Alcohol"
                      : formatAlertType(alertType)}
                  </p>
                  {(popup && type !== "Normal") || popup === false ? (
                    <div>
                      <p className="text-base font-semibold text-nowrap">
                        {vehicleNumber}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div
                  className={`mt-1 text-neutral-600 break-all overflow-hidden ${
                    type !== "Normal" ? "w-[calc(100%-60px)]" : ""
                  }`}
                >
                  {description.split("_").join(" ")}
                </div>
              </div>
            </div>
            {/* <p className="text-xs text-gray-500 text-right font-bold mt-3">
              {dateTime}
            </p> */}
          </>
        )}
        <div className="w-full">
          {title && !popup ? (
            <div className="flex justify-between items-center w-full">
              <div dangerouslySetInnerHTML={{ __html: title }} />
              <div className="font-bold text-base">{vehicleNumber}</div>
            </div>
          ) : null}
          {type === "Temperature" ? (
            <div className="mt-1 text-neutral-600 w-[calc(100%-60px)]">
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          ) : type !== "Normal" ? (
            <div className={`mt-1 text-neutral-600 w-[calc(100%-60px)]`}>
              {/* {type === "Elock" ? (
                <p className="font-semibold text-neutral-500">{dateTime}</p>
              ) : (
                ""
              )} */}
              {expandState ? description : description.slice(0, 50)}
              <span
                onClick={() => setExpandState(!expandState)}
                className="font-medium text-primary-green"
              >
                {description.length > 50 && !expandState ? "..." : ""}
              </span>
              <span
                onClick={() => setExpandState(!expandState)}
                className="font-medium text-primary-green cursor-pointer "
              >
                {description.length > 50 && !expandState
                  ? "show more"
                  : description.length > 50 && expandState && !popup
                    ? " show less"
                    : ""}
              </span>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
      {commentInputActive ? (
        <div className="ml-10 mt-2">
          {type === "Temperature" || type === "Fuel" ? (
            <div className="mt-5">
              <Select
                defaultValue={"Refer Issue"}
                onChange={(value) => setTemperatureAlertSelectValue(value)}
                placeholder="Select Reason"
                className="w-full"
                options={
                  type === "Temperature"
                    ? temperatureSelectOptions
                    : fuelSelectOptions
                }
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              ></Select>
            </div>
          ) : null}
          <div className="mt-2">
            <Input
              type="text"
              variant="borderless"
              placeholder="Add Comment"
              value={commentInputValue}
              onChange={(e) => setCommentInputValue(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {(type === "Normal" && !shouldAllowComments(alertType)) ||
      type === "Panic" ? null : (
        <>
          <div className="h-[40px] w-full"></div>
          <div
            className={`absolute bottom-0 w-full flex justify-end items-center gap-4 text-sm font-medium`}
          >
            {commentInputActive ? (
              <>
                {popup ? null : (
                  <Button
                    type="default"
                    onClick={() => setCommentInputActive((prev) => !prev)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={async () => await handleCommentSubmit()}
                  loading={isCommentLoading}
                >
                  Submit
                </Button>
              </>
            ) : type === "Normal" || type === "Geofence Alert" ? (
              shouldAllowComments(alertType) ? (
                <Button
                  type="default"
                  onClick={() => setCommentInputActive((prev) => !prev)}
                >
                  Comment
                </Button>
              ) : null
            ) : (
              <Button
                type="default"
                onClick={() => setCommentInputActive((prev) => !prev)}
              >
                Comment
              </Button>
            )}
          </div>
        </>
      )}
      {type === "Panic" ? (
        <div className="w-full flex justify-end gap-2 mt-8">
          <Button
            type="primary"
            onClick={async () => await handleCommentSubmit()}
            loading={isCommentLoading}
          >
            Accepted By Control Room
          </Button>
        </div>
      ) : null}

      {shouldShowViewButton() ? (
        <div className="w-full flex justify-end gap-2 mt-4">
          <Button
            type="primary"
            className="bg-primary-green border-primary-green"
            onClick={handleViewClick}
          >
            View
          </Button>
        </div>
      ) : null}

      {/* Fuel Audit Modal */}
      <PopupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        {...(alertType === "Ambulance Fueling"
          ? parseAmbulanceFuelingAlert(description)
          : {})}
      />
    </div>
  );
};

export default AlertNotificationCard;
