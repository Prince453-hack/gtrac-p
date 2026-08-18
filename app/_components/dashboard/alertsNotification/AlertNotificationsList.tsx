"use client";

import { useGetAllVehiclesQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { GetAlertsPopupsResponse } from "@/app/_globalRedux/services/types/alerts";
import { VideoAlarmsRecord } from "@/app/_globalRedux/services/types/post/getVideoAlerts";
import { useDeleteAllAlertNotificationsMutation } from "@/app/_globalRedux/services/yatayaat";
import { RootState } from "@/app/_globalRedux/store";
import {
  ExportOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ConfigProvider, Drawer, Input, Skeleton, Spin, Tooltip } from "antd";
import { createStyles, useTheme } from "antd-style";
import type {
  DrawerClassNames,
  DrawerStyles,
} from "antd/es/drawer/DrawerPanel";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { AlertNotificationCard } from "./AlertNotificationCard";
import { VideoNotificationCard } from "./VideoNotificationCard";

const useStyle = createStyles(({ token }) => ({
  "my-drawer-body": {
    background: "#F2F5F3",
  },
  "my-drawer-mask": {
    boxShadow: `inset 0 0 15px #fff`,
  },
  "my-drawer-header": {
    background: "#F2F5F3",
    fontSize: "30px !important",
  },
  "my-drawer-footer": {
    color: token.colorPrimary,
  },
  "my-drawer-content": {},
}));

export const AlertNotificationsList = ({
  open,
  setOpen,
  data,
  totalAlerts,
  onRefresh,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  data: {
    elockAlerts: ElockAlertsResponse[];
    temperatureAlerts: TemperatureAlertsResponse[];
    fuelAlerts: FuelAlertsResponse[];
    normalAlerts: GetAlertsPopupsResponse[];
    panicAlerts: PanicAlertResponse[];
    videoAlerts: VideoAlarmsRecord[];
  };
  totalAlerts: number;
  onRefresh?: () => void;
}) => {
  const { styles } = useStyle();
  const token = useTheme();
  const { groupId, accessLabel, userId } = useSelector(
    (state: RootState) => state.auth,
  );
  const isUser6461 = Number(userId) === 6461;

  const { data: allVehiclesData } = useGetAllVehiclesQuery(
    { token: "6364" },
    { skip: !isUser6461 },
  );

  const [deleteAlerts] = useDeleteAllAlertNotificationsMutation();

  const [visibleAlerts, setVisibleAlerts] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const allowedVehicleSet = useMemo(() => {
    if (!isUser6461 || !allVehiclesData?.list) return new Set<string>();
    const set = new Set<string>();
    allVehiclesData.list.forEach((v: any) => {
      if (v.veh_reg)
        set.add(v.veh_reg.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
      if (v.id != null) set.add(String(v.id));
    });
    return set;
  }, [isUser6461, allVehiclesData]);

  const getFilteredAlerts = () => {
    const currentData = isUser6461
      ? {
          ...data,
          normalAlerts: data.normalAlerts.filter((alert: any) => {
            if (alert.alert_type?.toLowerCase().includes("idle")) {
              const reg = alert.vehicleno
                ? alert.vehicleno.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
                : "";
              const id =
                alert.sys_service_id != null
                  ? String(alert.sys_service_id)
                  : "";
              return (
                (reg && allowedVehicleSet.has(reg)) ||
                (id && allowedVehicleSet.has(id))
              );
            }
            return true;
          }),
        }
      : data;

    if (!searchTerm.trim()) {
      return currentData;
    }

    const search = searchTerm.toLowerCase();
    return {
      videoAlerts: currentData.videoAlerts.filter(
        (alert: any) =>
          alert.type?.toLowerCase().includes(search) ||
          alert.msg?.toLowerCase().includes(search) ||
          alert.description?.toLowerCase().includes(search),
      ),
      panicAlerts: currentData.panicAlerts.filter(
        (alert: any) =>
          alert.msg?.toLowerCase().includes(search) ||
          alert.idle_vehicle?.toLowerCase().includes(search),
      ),
      elockAlerts: currentData.elockAlerts.filter(
        (alert: any) =>
          alert.title?.toLowerCase().includes(search) ||
          alert.description?.toLowerCase().includes(search) ||
          alert.vehicle_no?.toLowerCase().includes(search),
      ),
      temperatureAlerts: currentData.temperatureAlerts.filter(
        (alert: any) =>
          alert.msg?.toLowerCase().includes(search) ||
          alert.idle_vehicle?.toLowerCase().includes(search),
      ),
      fuelAlerts: currentData.fuelAlerts.filter(
        (alert: any) =>
          alert.msg?.toLowerCase().includes(search) ||
          alert.idle_vehicle?.toLowerCase().includes(search),
      ),
      normalAlerts: currentData.normalAlerts.filter(
        (alert: any) =>
          alert.alert_type?.toLowerCase().includes(search) ||
          alert.vehicleno?.toLowerCase().includes(search) ||
          alert.msg?.toLowerCase().includes(search),
      ),
    };
  };

  const filteredData = getFilteredAlerts();

  // Group similar Geofence alerts (same vehicle, alert type, and message)
  const groupGeofenceAlerts = (
    alerts: GetAlertsPopupsResponse[],
  ): GetAlertsPopupsResponse[] => {
    return alerts;
  };

  const groupedNormalAlerts = groupGeofenceAlerts(filteredData.normalAlerts);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing alerts:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const classNames: DrawerClassNames = {
    body: styles["my-drawer-body"],
    mask: styles["my-drawer-mask"],
    header: styles["my-drawer-header"],
    footer: styles["my-drawer-footer"],
    content: styles["my-drawer-content"],
  };

  const drawerStyles: DrawerStyles = {
    mask: {},
    content: {
      boxShadow: "-5px 0 10px #777",
    },
    header: {
      background: "#F2F5F3",
      fontSize: token.fontSizeXL,
      border: 0,
    },
    body: {
      padding: 0,
    },
    footer: {},
  };

  const getVisibleData = (alerts: any[]) => {
    return alerts.slice(0, visibleAlerts);
  };

  const [ref, inView] = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView) {
      setVisibleAlerts((prev) => prev + 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <ConfigProvider
      drawer={{
        classNames,
        styles: drawerStyles,
      }}
    >
      <Drawer
        title={
          <>
            <div className="flex justify-between items-center mb-1">
              <div className="flex justify-center items-center gap-2">
                <p className="text-xl">Alert Notifications</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Count - {totalAlerts}
                </p>
              </div>
              <div className="flex gap-2.5 items-center">
                <Tooltip
                  title={isRefreshing ? "Refreshing..." : "Refresh Alerts"}
                  className="text-lg cursor-pointer"
                  mouseEnterDelay={1}
                >
                  {isRefreshing ? (
                    <LoadingOutlined
                      className="text-primary-green animate-spin"
                      style={{ fontSize: "16px" }}
                    />
                  ) : (
                    <ReloadOutlined
                      onClick={handleRefresh}
                      className="hover:opacity-75 transition-all duration-300"
                    />
                  )}
                </Tooltip>
                <Tooltip
                  title="Go to Alert Management"
                  className="text-lg cursor-pointer"
                  mouseEnterDelay={1}
                >
                  <a
                    href={
                      Number(userId) === 6461
                        ? "/dashboard/alert-managements"
                        : accessLabel === 6 && Number(userId) !== 81707
                          ? "/dashboard/elock-alerts"
                          : "/dashboard/alert-management"
                    }
                    target="_blank"
                    referrerPolicy="no-referrer"
                  >
                    <ExportOutlined />
                  </a>
                </Tooltip>
              </div>
            </div>
            <div>
              <Input
                placeholder="Search alerts"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                className="mb-1 mt-1"
                size="middle"
              />
            </div>
          </>
        }
        placement="right"
        onClose={() => {
          setVisibleAlerts(20);
          setOpen(false);
        }}
        open={open}
        width={450}
        id="alert-notification-drawer"
      >
        <Spin spinning={isRefreshing} tip="Refreshing alerts..." size="large">
          {Number(userId) !== 81707 && (
            <div>
              {filteredData.videoAlerts.length ? (
                <div className="flex items-center">
                  <div className="h-[1px] bg-gray-300 w-full"></div>
                  <p className="py-3 font-semibold text-gray-600 text-sm min-w-[140px] text-center">
                    Video Alerts
                  </p>
                  <div className="h-[1px] bg-gray-300 w-full"></div>
                </div>
              ) : (
                ""
              )}
              {filteredData.videoAlerts.length
                ? getVisibleData(filteredData.videoAlerts).map(
                    (alert: VideoAlarmsRecord, index) => (
                      <div
                        key={alert.id + index}
                        className={`py-3 px-6 ${
                          index !== filteredData.videoAlerts.length - 1 &&
                          "border-b"
                        }`}
                      >
                        <VideoNotificationCard alarm={alert} />
                      </div>
                    ),
                  )
                : ""}
            </div>
          )}
          <div>
            {filteredData.panicAlerts.length ? (
              <div className="flex items-center">
                <div className="h-[1px] bg-gray-300 w-full"></div>
                <p className="py-3 font-semibold text-gray-600 text-sm min-w-[140px] text-center">
                  Panic Alerts
                </p>
                <div className="h-[1px] bg-gray-300 w-full"></div>
              </div>
            ) : (
              ""
            )}
            {filteredData.panicAlerts.length
              ? getVisibleData(filteredData.panicAlerts).map((alert, index) => (
                  <div
                    key={alert.id + index}
                    className={`py-3 px-6  ${
                      index !== filteredData.temperatureAlerts.length - 1 &&
                      "border-b"
                    }`}
                  >
                    <AlertNotificationCard
                      description={alert.msg}
                      alertId={alert.id}
                      type={"Panic"}
                      vehicleNumber={alert.idle_vehicle}
                      alertType={"Panic"}
                    />
                  </div>
                ))
              : ""}
          </div>
          <div>
            {filteredData.elockAlerts.length ? (
              <div className="flex items-center">
                <div className="h-[1px] bg-gray-300 w-full"></div>
                <p className="py-3 font-semibold text-gray-600 text-sm min-w-[140px] text-center">
                  Elock Alerts
                </p>
                <div className="h-[1px] bg-gray-300 w-full"></div>
              </div>
            ) : (
              ""
            )}
            {filteredData.elockAlerts.length
              ? getVisibleData(filteredData.elockAlerts).map((alert, index) => (
                  <div
                    key={alert.id + index}
                    className={`py-3 px-6  ${
                      index !== filteredData.temperatureAlerts.length - 1 &&
                      "border-b"
                    }`}
                  >
                    <AlertNotificationCard
                      title={alert.title}
                      description={alert.description}
                      alertId={alert.id}
                      type={"Elock"}
                      vehicleNumber={alert.vehicle_no}
                      vehicleId={alert.veh_id}
                      dateTime={alert.log_time}
                    />
                  </div>
                ))
              : ""}
          </div>
          <div>
            {filteredData.temperatureAlerts.length ? (
              <div className="flex items-center">
                <div className="h-[1px] bg-gray-300 w-full"></div>
                <p className="py-3 font-semibold text-gray-600 text-sm min-w-[140px] text-center">
                  Temperature Alerts
                </p>
                <div className="h-[1px] bg-gray-300 w-full"></div>
              </div>
            ) : (
              ""
            )}
            {filteredData.temperatureAlerts.length
              ? getVisibleData(filteredData.temperatureAlerts).map(
                  (alert, index) => (
                    <div
                      key={alert.id + index}
                      className={`py-3 px-6  ${
                        index !== filteredData.temperatureAlerts.length - 1 &&
                        "border-b"
                      }`}
                    >
                      <AlertNotificationCard
                        description={alert.msg}
                        alertId={alert.id}
                        type={"Temperature"}
                        vehicleNumber={alert.idle_vehicle}
                      />
                    </div>
                  ),
                )
              : ""}
          </div>

          <div>
            {filteredData.fuelAlerts.length ? (
              <div className="flex items-center">
                <div className="h-[1px] bg-gray-300 w-full"></div>
                <p className="py-3 font-semibold text-gray-600 text-sm min-w-[140px] text-center">
                  Fuel Alerts
                </p>
                <div className="h-[1px] bg-gray-300 w-full"></div>
              </div>
            ) : (
              ""
            )}
            {filteredData.fuelAlerts.length
              ? getVisibleData(filteredData.fuelAlerts).map((alert, index) => (
                  <div
                    key={alert.id + index}
                    className={`py-3 px-6  ${
                      index !== filteredData.fuelAlerts.length - 1 && "border-b"
                    }`}
                  >
                    <AlertNotificationCard
                      description={alert.msg}
                      alertId={alert.id}
                      type={"Fuel"}
                      vehicleNumber={alert.idle_vehicle}
                    />
                  </div>
                ))
              : ""}
          </div>

          <div>
            {groupedNormalAlerts.length ? (
              <div className="flex items-center">
                <div className="h-[1px] bg-gray-300 w-full"></div>
                <p className="py-1 font-semibold text-gray-600 text-sm min-w-[140px] text-center">
                  Alerts
                </p>
                <div className="h-[1px] bg-gray-300 w-full"></div>
              </div>
            ) : (
              ""
            )}
            {groupedNormalAlerts.length
              ? getVisibleData(groupedNormalAlerts).map((alert, index) => (
                  <div
                    key={alert.alert_id + index}
                    className={`py-3 px-6  ${
                      index !== groupedNormalAlerts.length - 1 && "border-b"
                    }`}
                  >
                    <AlertNotificationCard
                      description={alert.msg}
                      alertId={alert.alert_id}
                      type={"Normal"}
                      vehicleNumber={alert.vehicleno}
                      vehicleId={alert.sys_service_id}
                      alertType={alert.alert_type}
                      dateTime={alert.datetime}
                    />
                  </div>
                ))
              : ""}
          </div>

          {visibleAlerts <= groupedNormalAlerts.length ||
          visibleAlerts <= filteredData.panicAlerts.length ||
          visibleAlerts <= filteredData.temperatureAlerts.length ||
          visibleAlerts <= filteredData.fuelAlerts.length ||
          visibleAlerts <= filteredData.elockAlerts.length ? (
            <div className=" w-full px-9 my-4 mb-10" ref={ref}>
              <Skeleton className="pt-5" active />
            </div>
          ) : null}
        </Spin>
      </Drawer>
    </ConfigProvider>
  );
};
