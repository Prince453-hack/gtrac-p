"use client";

import { Badge, ConfigProvider, notification, Tooltip } from "antd";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import alertsRed from "@/public/assets/svgs/nav/alertsRed.svg";
import Image from "next/image";
import { AlertNotificationsList } from "./AlertNotificationsList";
import {
  useGetElockAlertsQuery,
  useGetFuelAlertsQuery,
  useGetPanicAlertsQuery,
  useGetTemperatureAlertsQuery,
} from "@/app/_globalRedux/services/gtrac_newtracking";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  useGetNormalAlertsQuery,
  useGetEchoPuchAlertsQuery,
} from "@/app/_globalRedux/services/reactApi";
import { GetAlertsPopupsResponse } from "@/app/_globalRedux/services/types/alerts";
import ReactHowler from "react-howler";
import { AlertNotificationCard } from "./AlertNotificationCard";
import { NotificationInstance } from "antd/es/notification/interface";
import {
  AlertTwoTone,
  CloseCircleOutlined,
  setTwoToneColor,
} from "@ant-design/icons";
import { useGetUserAlertsQuery } from "@/app/_globalRedux/services/yatayaat";
import { VideoAlarmsRecord } from "@/app/_globalRedux/services/types/post/getVideoAlerts";
import { useGetMettaxAlarmsMutation } from "@/app/_globalRedux/services/mettax";
import moment from "moment";
import { getAlertsWithVideoPlayback } from "@/app/helpers/getAlertsWithVideoPlayback";
import { AlarmType } from "@/app/_globalRedux/services/types/post/videoAlerts";
import { trackingDashboard } from "@/app/_globalRedux/services/trackingDashboard";
import { useIndiaGetMettaxAlarmsMutation } from "@/app/_globalRedux/services/indiaMettax";
import {
  AlertToggleOff,
  AlertToggleOn,
} from "../../../../public/assets/svgs/nav";

const checkIfUserNeedsAlerts = (userId: number, parentUser: number) => {
  if (
    userId === 3097 ||
    userId === 3117 ||
    userId === 3165 ||
    userId === 3189 ||
    userId === 3212 ||
    userId === 3317 ||
    userId === 3358 ||
    userId === 3358 ||
    userId === 4071 ||
    userId === 4071 ||
    userId == 87305 ||
    userId === 5360 ||
    userId === 5459 ||
    userId === 6258 ||
    userId === 7351 ||
    userId === 7351 ||
    userId === 81023 ||
    userId === 81491 ||
    userId === 81544 ||
    userId === 81715 ||
    userId === 83199 ||
    userId === 83213 ||
    userId === 83636 ||
    userId === 84477 ||
    userId === 84550 ||
    userId === 84712 ||
    userId === 84712 ||
    userId === 85013 ||
    userId === 85013 ||
    userId === 85086 ||
    userId === 85097 ||
    userId === 85380 ||
    userId === 85682 ||
    userId === 86085 ||
    userId === 86736 ||
    userId === 86760 ||
    userId === 86760 ||
    userId === 86760 ||
    userId === 86764 ||
    userId === 86913 ||
    userId === 6347 ||
    userId === 3356 ||
    parentUser === 3356 ||
    userId === 87470 ||
    parentUser === 87470 ||
    userId === 83459 ||
    userId === 85182 ||
    userId === 84435 ||
    userId === 833193 ||
    userId === 5275
  ) {
    return true;
  } else {
    return false;
  }
};

export const openNotification = ({
  description,
  vehicleNumber,
  title,
  type,
  alertId,
  vehicleId,
  dateTime,
  alertType,
  key,
  api,
  setOpenNotificationIndex,
  openNotificationIndex,
  setIsAlertPopupActive,
  dataLength,
  from,
  fetchUpdatedAlerts,
}: {
  description: string;
  vehicleNumber: string;
  title?: string;
  type?:
    | "Panic"
    | "Elock"
    | "Temperature"
    | "Fuel"
    | "Idle"
    | "Normal"
    | "Geofence Alert";
  alertId?: string;
  vehicleId?: string;
  dateTime?: string;
  alertType?: string;
  key: string;
  api: NotificationInstance;
  setOpenNotificationIndex?: Dispatch<
    SetStateAction<{
      Elock: number;
      Temperature: number;
      Panic: number;
      Fuel: number;
      Idle: number;
      Normal: number;
    }>
  >;
  openNotificationIndex?: {
    Elock: number;
    Temperature: number;
    Panic: number;
    Fuel: number;
    Idle: number;
    Normal: number;
  };
  setIsAlertPopupActive?: Dispatch<SetStateAction<boolean>>;
  dataLength?: number;
  from?: string;
  fetchUpdatedAlerts?: () => void;
}) => {
  const changeOpenNotificationIndexState = () => {
    if (
      openNotificationIndex &&
      setOpenNotificationIndex &&
      setIsAlertPopupActive &&
      dataLength
    ) {
      if (type) {
        if (type === "Geofence Alert") {
          if (openNotificationIndex.Normal < dataLength - 1) {
            setOpenNotificationIndex((prev) => ({
              ...prev,
              Normal: prev.Normal + 1,
            }));
          } else {
            setOpenNotificationIndex((prev) => ({ ...prev, Normal: -1 }));
          }
        } else if (openNotificationIndex[type] < dataLength - 1) {
          setOpenNotificationIndex((prev) => ({
            ...prev,
            [type]: prev[type] + 1,
          }));
        } else {
          setOpenNotificationIndex((prev) => ({ ...prev, [type]: -1 }));
        }
      }

      const totalActivePopups =
        openNotificationIndex.Elock +
        openNotificationIndex.Temperature +
        openNotificationIndex.Panic +
        openNotificationIndex.Fuel +
        openNotificationIndex.Normal;
      if (totalActivePopups >= dataLength - 1) {
        setIsAlertPopupActive((prev) => !prev);
      }
    }
  };

  api.open({
    description: (
      <AlertNotificationCard
        description={description}
        vehicleNumber={vehicleNumber}
        alertId={alertId ? alertId : ""}
        type={type ? type : ""}
        vehicleId={vehicleId ? vehicleId : ""}
        dateTime={dateTime ? dateTime : ""}
        alertType={alertType ? alertType : ""}
        title={title ? title : ""}
        popup={true}
        api={api}
        notificationKey={key}
        changeOpenNotificationIndexState={changeOpenNotificationIndexState}
        from={from}
        fetchUpdatedAlerts={fetchUpdatedAlerts}
      />
    ),
    message: "",
    closeIcon: (
      <div
        className="text-xl mb-10 mt-4 w-full"
        onClick={() => changeOpenNotificationIndexState()}
      >
        <CloseCircleOutlined />
      </div>
    ),
    duration: 0,
    placement: "bottomRight",
    key,
    onClose: () => {
      api.destroy(key);
    },
  });
};

const AlertNotifications = ({
  userId,
  parentUser,
}: {
  userId: string;
  parentUser: string;
}) => {
  const {
    accessLabel,
    parentUser: pUserId,
    isVideoTelematics,
  } = useSelector((state: RootState) => state.auth);
  const markers = useSelector((state: RootState) => state.markers);
  const auth = JSON.parse(
    localStorage.getItem("auth-session") || `{ "userId": "", "groupId": "" }`,
  );

  const [open, setOpen] = useState(false);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [openNotificationIndex, setOpenNotificationIndex] = useState({
    Elock: -1,
    Temperature: -1,
    Panic: -1,
    Fuel: -1,
    Normal: -1,
    Idle: -1,
  });

  const [isAlertPopupActive, setIsAlertPopupActive] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alertPopupActive");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const isUser3356Or82815 = Number(userId) === 3356 || Number(userId) === 82815;
  const isParentUser3356Or82815 =
    Number(parentUser) === 3356 || Number(parentUser) === 82815;

  const [api, notificationContextHolder] = notification.useNotification({
    duration: 0,
    placement: "bottomRight",
    maxCount: 1,
  });

  const [data, setData] = useState<{
    elockAlerts: ElockAlertsResponse[];
    temperatureAlerts: TemperatureAlertsResponse[];
    fuelAlerts: FuelAlertsResponse[];
    panicAlerts: PanicAlertResponse[];
    normalAlerts: GetAlertsPopupsResponse[];
    videoAlerts: VideoAlarmsRecord[];
  }>({
    elockAlerts: [],
    temperatureAlerts: [],
    fuelAlerts: [],
    panicAlerts: [],
    normalAlerts: [],
    videoAlerts: [],
  });

  const {
    data: alertsByUserData,
    isLoading: isGetAlertByUserDataLoading,
    isUninitialized: isAlertsByUserDataUninitialized,
    refetch: refetchAlertsByUser,
  } = useGetUserAlertsQuery(
    { token: auth.groupId, userId: userId },
    { skip: !auth.groupId || !userId },
  );

  const elockLoading = useSelector((state: RootState) =>
    Object.values(state["gtrac-newtracking"].queries).some(
      (query) =>
        query &&
        query.endpointName === "getElockAlerts" &&
        query.status === "pending",
    ),
  );

  const {
    data: alertsElockRes,
    isFetching: isElockLoading,
    refetch: refetchElockAlerts,
  } = useGetElockAlertsQuery(
    {
      token: auth.groupId,
      userId: userId,
      puserId: parentUser,
    },
    {
      pollingInterval: Number(userId) === 87305 ? 30000 : 120000,
      skip:
        !auth.groupId ||
        !userId ||
        !parentUser ||
        accessLabel !== 6 ||
        !checkIfUserNeedsAlerts(Number(userId), Number(parentUser)) ||
        elockLoading,
    },
  );

  const { data: alertsTempRes, refetch: refetchTempAlerts } =
    useGetTemperatureAlertsQuery(
      {
        token: auth.groupId,
        userId: userId,
        puserId: parentUser,
      },
      {
        pollingInterval: 120000,
        skip:
          !auth.groupId ||
          !userId ||
          !parentUser ||
          Number(auth.groupId) !== 6255 ||
          !checkIfUserNeedsAlerts(Number(userId), Number(parentUser)),
      },
    );

  const { data: alertsPanicRes, refetch: refetchPanicAlerts } =
    useGetPanicAlertsQuery(
      {
        token: auth.groupId,
        userId: userId,
        puserId: parentUser,
      },
      {
        pollingInterval: 120000,
        skip:
          !auth.groupId ||
          !userId ||
          !parentUser ||
          !checkIfUserNeedsAlerts(Number(userId), Number(parentUser)),
      },
    );

  const { data: alertsFuelRes, refetch: refetchFuelAlerts } =
    useGetFuelAlertsQuery(
      {
        token: auth.groupId,
        userId: userId,
        puserId: parentUser,
      },
      {
        pollingInterval: 120000,
        skip:
          !auth.groupId ||
          !userId ||
          !parentUser ||
          Number(auth.groupId) !== 6255,
      },
    );

  const { data: alertsNormalRes, refetch: refetchNormalAlerts } =
    useGetNormalAlertsQuery(
      {
        token:
          Number(userId) === 833406 || Number(userId) === 833407
            ? 59961
            : Number(auth.groupId) === 5267 || Number(userId) === 5275
              ? 6364
              : Number(auth.groupId),
      },
      {
        pollingInterval: 120000,
        skipPollingIfUnfocused: true,
        skip:
          !auth.groupId ||
          isAlertsByUserDataUninitialized ||
          isGetAlertByUserDataLoading ||
          alertsByUserData?.length === 0,
      },
    );

  // Special polling for user 6258 with 30-second interval
  const { data: alertsUser6258Res, refetch: refetchUser6258Alerts } =
    useGetNormalAlertsQuery(
      {
        token: Number(auth.groupId),
      },
      {
        pollingInterval: 30000, // 30 seconds
        skipPollingIfUnfocused: true,
        skip: Number(userId) !== 6258 || !auth.groupId,
      },
    );

  // EchoPuch alerts polling for user 6258 only
  const { data: echoPuchAlertsRes, refetch: refetchEchoPuchAlerts } =
    useGetEchoPuchAlertsQuery(
      {
        token: Number(auth.groupId),
      },
      {
        pollingInterval: 30000, // 30 seconds
        skipPollingIfUnfocused: true,
        skip: Number(userId) !== 6258 || !auth.groupId,
      },
    );

  const [allVideoAlertsLoaded, setAllVideoAlertsLoaded] = useState(false);
  const [videoAlertsState, setVideoAlertsState] = useState<VideoAlarmsRecord[]>(
    [],
  );
  const [pageIndex, setPageIndex] = useState(1);

  const [videoAlertsTrigger, { data: videoAlerts }] =
    useGetMettaxAlarmsMutation();
  const [indiaVideoAlertsTrigger, { data: indiaVideoAlert }] =
    useIndiaGetMettaxAlarmsMutation();

  const selector = trackingDashboard.endpoints.getVehiclesByStatus.select({
    userId,
    token: auth.groupId,
    pUserId: auth.parentUser,
    mode: "",
  });
  const { data: vehicleData } = useSelector(selector);

  // Reset state when isVideoTelematics or markers change
  useEffect(() => {
    setPageIndex(1);
    setVideoAlertsState([]);
    setAllVideoAlertsLoaded(false);
  }, [isVideoTelematics, markers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "alertPopupActive",
        JSON.stringify(isAlertPopupActive),
      );
    }
  }, [isAlertPopupActive]);

  // Refresh function to refetch all alerts
  const handleRefreshAlerts = async () => {
    try {
      // Refetch all alert types that are applicable for the user
      const promises = [];

      if (refetchAlertsByUser) {
        promises.push(refetchAlertsByUser());
      }

      if (
        refetchElockAlerts &&
        accessLabel === 6 &&
        checkIfUserNeedsAlerts(Number(userId), Number(parentUser))
      ) {
        promises.push(refetchElockAlerts());
      }

      if (
        refetchTempAlerts &&
        Number(auth.groupId) === 6255 &&
        checkIfUserNeedsAlerts(Number(userId), Number(parentUser))
      ) {
        promises.push(refetchTempAlerts());
      }

      if (
        refetchPanicAlerts &&
        checkIfUserNeedsAlerts(Number(userId), Number(parentUser))
      ) {
        promises.push(refetchPanicAlerts());
      }

      if (refetchFuelAlerts && Number(auth.groupId) === 6255) {
        promises.push(refetchFuelAlerts());
      }

      if (
        refetchNormalAlerts &&
        auth.groupId &&
        !isAlertsByUserDataUninitialized &&
        !isGetAlertByUserDataLoading &&
        alertsByUserData?.length !== 0
      ) {
        promises.push(refetchNormalAlerts());
      }

      if (refetchUser6258Alerts && Number(userId) === 6258 && auth.groupId) {
        promises.push(refetchUser6258Alerts());
      }

      // Refetch video alerts if applicable
      if (isVideoTelematics && markers && markers.length > 0) {
        setPageIndex(1);
        setVideoAlertsState([]);
        setAllVideoAlertsLoaded(false);

        const deviceIds = markers
          .map((marker) => marker.gpsDtl.model)
          .filter((model) => model!!)
          .join(",");

        if (Number(userId) === 5360) {
          promises.push(
            indiaVideoAlertsTrigger({
              startTime: moment().startOf("day").format("YYYY-MM-DD HH:mm:ss"),
              endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
              deviceIds,
              alarmType: null,
              pageIndex: 1,
            }),
          );
        } else {
          promises.push(
            videoAlertsTrigger({
              startTime: moment().startOf("day").format("YYYY-MM-DD HH:mm:ss"),
              endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
              deviceIds,
              alarmType: null,
              pageIndex: 1,
            }),
          );
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error refreshing alerts:", error);
    }
  };

  // Trigger API call for fetching video alerts
  useEffect(
    () => {
      if (
        isVideoTelematics &&
        markers &&
        markers.length > 0 &&
        !allVideoAlertsLoaded
      ) {
        const deviceIds = markers
          .map((marker) => marker.gpsDtl.model)
          .filter((model) => model!!)
          .join(",");
        Number(userId) === 5360
          ? indiaVideoAlertsTrigger({
              startTime: moment().startOf("day").format("YYYY-MM-DD HH:mm:ss"),
              endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
              deviceIds,
              alarmType: null,
              pageIndex,
            })
          : videoAlertsTrigger({
              startTime: moment().startOf("day").format("YYYY-MM-DD HH:mm:ss"),
              endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
              deviceIds,
              alarmType: null,
              pageIndex,
            });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markers],
  );

  // Process fetched video alerts and handle pagination
  useEffect(() => {
    if (Number(userId) === 5360) {
      if (indiaVideoAlert && indiaVideoAlert.data) {
        setVideoAlertsState((prev) => [
          ...prev,
          ...indiaVideoAlert.data.records,
        ]);
        const { total, size, current } = indiaVideoAlert.data;
        if ((current + 1) * size < total) {
          setPageIndex(current + 1);
        } else {
          setAllVideoAlertsLoaded(true);
        }
      }
    } else {
      if (videoAlerts && videoAlerts.data) {
        setVideoAlertsState((prev) => [...prev, ...videoAlerts.data.records]);
        const { total, size, current } = videoAlerts.data;
        if ((current + 1) * size < total) {
          setPageIndex(current + 1);
        } else {
          setAllVideoAlertsLoaded(true);
        }
      }
    }
  }, [videoAlerts, indiaVideoAlert]);

  const openNotificationFn = (
    isOpenNotificationIndexStateChanged?: boolean,
  ) => {
    let tempTotalAlerts;
    if (
      Number(userId) === 833193 ||
      Number(userId) === 833406 ||
      Number(userId) === 833407
    ) {
      const filteredElockAlerts =
        alertsElockRes && !alertsElockRes[0]?.status
          ? filterAlertsForUser833193(alertsElockRes, "Elock")
          : [];
      const filteredTempAlerts =
        alertsTempRes && !alertsTempRes[0]?.status
          ? filterAlertsForUser833193(alertsTempRes, "Temperature")
          : [];
      const filteredPanicAlerts =
        alertsPanicRes && !alertsPanicRes[0]?.status
          ? filterAlertsForUser833193(alertsPanicRes, "Panic")
          : [];
      const filteredFuelAlerts =
        alertsFuelRes && !alertsFuelRes[0]?.status
          ? filterAlertsForUser833193(alertsFuelRes, "Fuel")
          : [];
      const filteredNormalAlerts =
        alertsNormalRes && !alertsNormalRes[0]?.status
          ? checkIfIsWithinThirtyMinutesFor833193(
              checkIfIsWhithinFifteenMinutesForGatewayrail(alertsNormalRes),
            )
          : [];

      const filteredVideoAlerts =
        videoAlertsState && allVideoAlertsLoaded
          ? filterAlertsForUser833193(
              videoAlertsState.filter((videoAlert) =>
                getAlertsWithVideoPlayback({
                  alarmType: videoAlert.alarmType as AlarmType,
                }),
              ),
              "Video",
            )
          : [];

      tempTotalAlerts =
        filteredElockAlerts.length +
        filteredTempAlerts.length +
        filteredPanicAlerts.length +
        filteredFuelAlerts.length +
        filteredNormalAlerts.length +
        filteredVideoAlerts.length;
    } else {
      tempTotalAlerts =
        (alertsElockRes && !alertsElockRes[0]?.status
          ? alertsElockRes.length
          : 0) +
        (alertsTempRes && !alertsTempRes[0]?.status
          ? alertsTempRes.length
          : 0) +
        (alertsPanicRes && !alertsPanicRes[0]?.status
          ? alertsPanicRes.length
          : 0) +
        (alertsNormalRes && !alertsNormalRes[0]?.status
          ? checkIfIsWhithinFifteenMinutesForGatewayrail(alertsNormalRes).length
          : 0) +
        (alertsFuelRes && !alertsFuelRes[0]?.status ? alertsFuelRes.length : 0);
    }

    if (
      Array.isArray(data.elockAlerts) ||
      Array.isArray(data.temperatureAlerts) ||
      Array.isArray(data.panicAlerts) ||
      Array.isArray(data.normalAlerts) ||
      Array.isArray(data.fuelAlerts)
    ) {
      if (
        totalAlerts !== tempTotalAlerts ||
        isOpenNotificationIndexStateChanged
      ) {
        setTimeout(() => {
          if (
            data.normalAlerts.length > 0 &&
            openNotificationIndex.Normal !== -1
          ) {
            const normalData = data.normalAlerts[openNotificationIndex.Normal];
            if (normalData.alert_type === "Geofence Alert") {
              openNotification({
                description: normalData.msg,
                vehicleNumber: normalData.vehicleno,
                title: "Geofence Alert",
                type: "Geofence Alert",
                alertId: normalData.alert_id,
                vehicleId: normalData.sys_service_id,
                dateTime: normalData.datetime,
                api: api,
                setOpenNotificationIndex: setOpenNotificationIndex,
                openNotificationIndex: openNotificationIndex,
                setIsAlertPopupActive: setIsAlertPopupActive,
                key: normalData.alert_id + openNotificationIndex.Normal,
                dataLength: data.normalAlerts.length,
              });
            } else {
              // Show popup for other normal alert types too
              openNotification({
                description: normalData.msg,
                vehicleNumber: normalData.vehicleno,
                title: normalData.alert_type || "Alert",
                type: "Normal",
                alertId: normalData.alert_id,
                vehicleId: normalData.sys_service_id,
                dateTime: normalData.datetime,
                alertType: normalData.alert_type,
                api: api,
                setOpenNotificationIndex: setOpenNotificationIndex,
                openNotificationIndex: openNotificationIndex,
                setIsAlertPopupActive: setIsAlertPopupActive,
                key: normalData.alert_id + openNotificationIndex.Normal,
                dataLength: data.normalAlerts.length,
              });
            }
          }

          if (
            data.normalAlerts.length > 0 &&
            openNotificationIndex.Idle !== -1
          ) {
            const normalData = data.normalAlerts[openNotificationIndex.Idle];
            if (
              normalData.alert_type === "idle" ||
              normalData.alert_type === "Idle"
            ) {
              openNotification({
                description: normalData.msg,
                vehicleNumber: normalData.vehicleno,
                title: "Idle",
                type: "Idle",
                alertId: normalData.alert_id,
                vehicleId: normalData.sys_service_id,
                dateTime: normalData.datetime,
                api: api,
                setOpenNotificationIndex: setOpenNotificationIndex,
                openNotificationIndex: openNotificationIndex,
                setIsAlertPopupActive: setIsAlertPopupActive,
                key: normalData.alert_id + openNotificationIndex.Idle,
                dataLength: data.normalAlerts.length,
              });
            } else if (normalData.alert_type === "POI Alert") {
              openNotification({
                description: normalData.msg,
                vehicleNumber: normalData.vehicleno,
                title: "POI Alert",
                type: "Normal",
                alertId: normalData.alert_id,
                vehicleId: normalData.sys_service_id,
                dateTime: normalData.datetime,
                api: api,
                setOpenNotificationIndex: setOpenNotificationIndex,
                openNotificationIndex: openNotificationIndex,
                setIsAlertPopupActive: setIsAlertPopupActive,
                key: normalData.alert_id + openNotificationIndex.Idle,
                dataLength: data.normalAlerts.length,
              });
            }
          }

          if (
            data.elockAlerts.length > 0 &&
            openNotificationIndex.Elock !== -1
          ) {
            const elockData = data.elockAlerts[openNotificationIndex.Elock];
            openNotification({
              description: elockData.description,
              vehicleNumber: elockData.vehicle_no,
              title: elockData.title,
              type: "Elock",
              alertId: elockData.id,
              vehicleId: elockData.veh_id,
              dateTime: elockData.log_time,
              api: api,
              setOpenNotificationIndex: setOpenNotificationIndex,
              openNotificationIndex: openNotificationIndex,
              setIsAlertPopupActive: setIsAlertPopupActive,
              key: elockData.id + openNotificationIndex.Elock,
              dataLength: data.elockAlerts.length,
            });
          }

          if (
            data.temperatureAlerts.length > 0 &&
            openNotificationIndex.Temperature !== -1
          ) {
            const temperatureData =
              data.temperatureAlerts[openNotificationIndex.Temperature];
            openNotification({
              description: temperatureData.msg,
              vehicleNumber: temperatureData.idle_vehicle,
              type: "Temperature",
              alertId: temperatureData.id,
              api: api,
              setOpenNotificationIndex: setOpenNotificationIndex,
              openNotificationIndex: openNotificationIndex,
              setIsAlertPopupActive: setIsAlertPopupActive,
              key: temperatureData.id + openNotificationIndex.Temperature,
              dataLength: data.temperatureAlerts.length,
            });
          }

          if (
            data.panicAlerts.length > 0 &&
            openNotificationIndex.Panic !== -1
          ) {
            const panicData = data.panicAlerts[openNotificationIndex.Panic];
            openNotification({
              description: panicData.msg,
              vehicleNumber: panicData.idle_vehicle,
              type: "Panic",
              alertId: panicData.id,
              alertType: "Panic",
              api: api,
              setOpenNotificationIndex: setOpenNotificationIndex,
              openNotificationIndex: openNotificationIndex,
              setIsAlertPopupActive: setIsAlertPopupActive,
              key: panicData.id + openNotificationIndex.Panic,
              dataLength: data.panicAlerts.length,
            });
          }
          if (data.fuelAlerts.length > 0 && openNotificationIndex.Fuel !== -1) {
            const fuelData = data.fuelAlerts[openNotificationIndex.Fuel];
            openNotification({
              description: fuelData.msg,
              vehicleNumber: fuelData.idle_vehicle,
              type: "Fuel",
              alertId: fuelData.id,
              alertType: "Fuel",
              api: api,
              setOpenNotificationIndex: setOpenNotificationIndex,
              openNotificationIndex: openNotificationIndex,
              setIsAlertPopupActive: setIsAlertPopupActive,
              key: fuelData.id + openNotificationIndex.Fuel,
              dataLength: data.fuelAlerts.length,
            });
          }

          if (!isOpenNotificationIndexStateChanged) {
            setIsAudioPlaying(true);

            setTimeout(() => {
              setIsAudioPlaying(false);
            }, 15000);

            setTotalAlerts(tempTotalAlerts);
          }
        }, 500);
      }
    }
  };

  const checkIfIsWhithinFifteenMinutesForGatewayrail = (
    alert: GetAlertsPopupsResponse[],
  ) => {
    return alert;
  };

  const filterAlertsForUser833193 = <T extends any>(
    alerts: T[],
    alertType: string = "Unknown",
  ): T[] => {
    if (
      Number(userId) !== 833193 &&
      Number(userId) !== 833406 &&
      Number(userId) !== 833407
    )
      return alerts;

    const filteredAlerts = alerts.filter((alertItem: any) => {
      // Check for different datetime field names based on alert type
      let dateTimeField: string | undefined;

      if (alertItem.datetime) {
        dateTimeField = alertItem.datetime;
      } else if (alertItem.log_time) {
        dateTimeField = alertItem.log_time;
      } else if (alertItem.alarmTs) {
        dateTimeField = alertItem.alarmTs; // For video alerts
      }

      if (dateTimeField) {
        const dataDate = moment(dateTimeField, "YYYY-MM-DD HH:mm:ss");
        const isWithin30Min = dataDate.isAfter(
          moment().subtract(30, "minutes"),
        );

        return isWithin30Min;
      }
      return false; // Exclude alerts without datetime
    });

    return filteredAlerts;
  };

  // Wrapper for normal alerts to maintain backward compatibility
  const checkIfIsWithinThirtyMinutesFor833193 = (
    alert: GetAlertsPopupsResponse[],
  ) => {
    return filterAlertsForUser833193(alert, "Normal");
  };

  useEffect(() => {
    if (
      alertsElockRes ||
      alertsTempRes ||
      alertsNormalRes ||
      alertsUser6258Res ||
      (videoAlertsState && allVideoAlertsLoaded)
    ) {
      const currentNormalAlerts =
        Number(userId) === 6258 ? alertsUser6258Res : alertsNormalRes;

      // For users 833193, 833406, and 833407, apply 30-minute filter to ALL alert types
      if (
        Number(userId) === 833193 ||
        Number(userId) === 833406 ||
        Number(userId) === 833407
      ) {
        setData({
          elockAlerts:
            alertsElockRes && !alertsElockRes[0]?.status
              ? filterAlertsForUser833193(alertsElockRes, "Elock")
              : [],
          temperatureAlerts:
            alertsTempRes && !alertsTempRes[0]?.status
              ? filterAlertsForUser833193(alertsTempRes, "Temperature")
              : [],
          fuelAlerts:
            alertsFuelRes && !alertsFuelRes[0]?.status
              ? filterAlertsForUser833193(alertsFuelRes, "Fuel")
              : [],
          panicAlerts:
            alertsPanicRes && !alertsPanicRes[0]?.status
              ? filterAlertsForUser833193(alertsPanicRes, "Panic")
              : [],
          normalAlerts:
            currentNormalAlerts && !currentNormalAlerts[0]?.status
              ? checkIfIsWithinThirtyMinutesFor833193(
                  checkIfIsWhithinFifteenMinutesForGatewayrail(
                    currentNormalAlerts,
                  ),
                )
              : [],
          videoAlerts:
            videoAlertsState && allVideoAlertsLoaded
              ? filterAlertsForUser833193(
                  videoAlertsState.filter((videoAlert) =>
                    getAlertsWithVideoPlayback({
                      alarmType: videoAlert.alarmType as AlarmType,
                    }),
                  ),
                  "Video",
                )
              : [],
        });
      } else {
        setData({
          elockAlerts:
            alertsElockRes && !alertsElockRes[0]?.status ? alertsElockRes : [],
          temperatureAlerts:
            alertsTempRes && !alertsTempRes[0]?.status ? alertsTempRes : [],
          fuelAlerts:
            alertsFuelRes && !alertsFuelRes[0]?.status ? alertsFuelRes : [],
          panicAlerts:
            alertsPanicRes && !alertsPanicRes[0]?.status ? alertsPanicRes : [],
          normalAlerts:
            currentNormalAlerts && !currentNormalAlerts[0]?.status
              ? checkIfIsWhithinFifteenMinutesForGatewayrail(
                  currentNormalAlerts,
                )
              : [],
          videoAlerts:
            videoAlertsState && allVideoAlertsLoaded
              ? videoAlertsState.filter((videoAlert) =>
                  getAlertsWithVideoPlayback({
                    alarmType: videoAlert.alarmType as AlarmType,
                  }),
                )
              : [],
        });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    alertsElockRes,
    alertsTempRes,
    alertsNormalRes,
    alertsUser6258Res,
    alertsPanicRes,
    isElockLoading,
    videoAlertsState,
  ]);

  useEffect(() => {
    setOpenNotificationIndex({
      Elock: 0,
      Temperature: 0,
      Panic: 0,
      Fuel: 0,
      Idle: 0,
      Normal: 0,
    });
    openNotificationFn();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    openNotificationFn(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNotificationIndex]);

  setTwoToneColor(isAlertPopupActive ? "#000" : "#468B83");

  return (
    <ConfigProvider
      theme={{
        components: {
          Notification: {
            width: 500,
            zIndexPopup: 9999,
          },
        },
      }}
    >
      <div
        className={`selection:text-xl absolute top-[6px] ${
          (!isUser3356Or82815 && !isParentUser3356Or82815) ||
          Number(userId) === 87470
            ? "right-[170px]"
            : "right-[120px]"
        }  ${isAlertPopupActive ? "" : ""} py-2 px-1 cursor-pointer`}
        onClick={() => {
          const newState = !isAlertPopupActive;
          setIsAlertPopupActive(newState);
          if (newState) {
            setOpenNotificationIndex({
              Elock: 0,
              Temperature: 0,
              Panic: 0,
              Fuel: 0,
              Idle: 0,
              Normal: 0,
            });
            openNotificationFn();
          }
        }}
      >
        {isAlertPopupActive ? (
          <Tooltip title="Alerts On" placement="bottom">
            <Image
              src={AlertToggleOn}
              width={32}
              height={32}
              alt="alerts icon"
              className="object-contain"
              draggable={false}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Alerts Off" placement="bottom">
            <Image
              src={AlertToggleOff}
              width={32}
              height={32}
              alt="alerts icon"
              className="object-contain"
              draggable={false}
            />
          </Tooltip>
        )}
      </div>
      {isAlertPopupActive && !open ? notificationContextHolder : null}

      {(!isUser3356Or82815 && !isParentUser3356Or82815) ||
      Number(userId) === 87470 ||
      Number(userId) === 833193 ||
      Number(userId) === 833406 ||
      Number(userId) === 833407 ||
      Number(userId) === 7300 ||
      Number(userId) === 5275 ? ( // Add user 5275 (gatewayrail) and 7300
        <>
          <div
            className="rounded-full border-primary-red border-2 relative z-20"
            onClick={() => setOpen((prev) => !prev)}
          >
            {isAlertPopupActive ? (
              <ReactHowler
                src="https://gtrac.in/newtracking/images/red_alert.mp3"
                playing={isAudioPlaying}
              />
            ) : null}
            <div className="rounded-full border-white border-2 cursor-pointer h-[28px]">
              <Badge
                count={totalAlerts}
                overflowCount={90}
                offset={
                  totalAlerts > 0 && totalAlerts > 10
                    ? ["-29", "0"]
                    : ["-29", "0"]
                }
                showZero={false}
                className="z-20"
              >
                <Image
                  src={alertsRed}
                  width={24}
                  height={24}
                  alt="alerts icon"
                  className="-mb-[6px]"
                />
              </Badge>
            </div>
          </div>

          <AlertNotificationsList
            open={open}
            setOpen={setOpen}
            data={data}
            totalAlerts={totalAlerts}
            onRefresh={handleRefreshAlerts}
          />
        </>
      ) : null}
    </ConfigProvider>
  );
};

export default AlertNotifications;
