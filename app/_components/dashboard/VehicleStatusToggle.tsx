"use client";

import { Tabs } from "antd";
import { TabsProps } from "antd";
import { VehiclesList } from "./VehiclesList";
import { useEffect, useState } from "react";
import { DoubleLeftOutlined, DoubleRightOutlined } from "@ant-design/icons";
import { RootState } from "@/app/_globalRedux/store";
import { useDispatch, useSelector } from "react-redux";
import { setCollapseVehicleStatusToggle } from "@/app/_globalRedux/dashboard/collapseVehicleStatusToggleSlice";
import { setContainerStyle } from "@/app/_globalRedux/dashboard/mapSlice";
import {
  initialSelectedVehicleState,
  setPrevVehicleSelected,
  setSelectedVehicleStatus,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { stopHistoryReplayInterval } from "@/app/_globalRedux/dashboard/historyReplaySlice";
import { setSelectedVehicleListTab } from "@/app/_globalRedux/dashboard/selectedVehicleListTab";
import {
  trackingDashboard,
  useGetCountDetailsQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { setDashboardSelectedVehicleStatus } from "@/app/_globalRedux/dashboard/dashboardVehicleDetailsSelect";
import { setClusterActive } from "@/app/_globalRedux/common/clusterSlice";
import React from "react";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { ActiveInActiveList } from "./ActiveInActiveList";

export const VehicleStatusToggle = () => {
  const { accessLabel, groupId, userId, parentUser } = useSelector(
    (state: RootState) => state.auth
  );

  const [tabsLabelStyling, setTabsLabelStyling] = useState({
    key: "all",
    style: "bg-light-glow-green  border-dark-glow-green",
  });
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseVehicleStatusToggle
  );
  const { containerStyle } = useSelector((state: RootState) => state.map);
  const markers = useSelector((state: RootState) => state.markers);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const isVehicleStatusToggleFetching = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getVehiclesByStatus" &&
        query.status === "pending"
    )
  );
  const dispatch = useDispatch();

  const { data: vehicleCounts } = useGetCountDetailsQuery(
    {
      userid: userId,
      groupid: groupId,
      puserid: parentUser,
    },
    {
      skip:
        !groupId ||
        !userId ||
        !parentUser ||
        (Number(userId) !== 3356 &&
          Number(userId) !== 82815 &&
          Number(parentUser) !== 3356 &&
          Number(parentUser) !== 82815),
      pollingInterval: 10000,
    }
  );

  const onChange = (key: string) => {
    if (markers.length > 0) {
      dispatch(
        trackingDashboard.util.invalidateTags(["Vehicles-List-By-Status"])
      );
      if (key !== "collapse") {
        setTabsLabelStyling((prev) => ({ ...prev, key }));
        dispatch(setSelectedVehicleListTab(key));
      }
    }
  };

  useEffect(() => {
    if (collapseVehicleStatusToggle && selectedVehicle.vId === 0) {
      dispatch(
        setContainerStyle({ ...containerStyle, width: "calc(100% - 20px)" })
      );
      dispatch(stopHistoryReplayInterval());
    } else if (selectedVehicle.vId === 0 && !collapseVehicleStatusToggle) {
      dispatch(
        setContainerStyle({ ...containerStyle, width: "calc(100% - 450px)" })
      );
    } else if (selectedVehicle.vId !== 0 && collapseVehicleStatusToggle) {
      dispatch(
        setContainerStyle({ ...containerStyle, width: "calc(100% - 480px)" })
      );
    } else if (!collapseVehicleStatusToggle && selectedVehicle.vId !== 0) {
      dispatch(
        setContainerStyle({ ...containerStyle, width: "calc(100% - 900px)" })
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collapseVehicleStatusToggle,
    selectedVehicle,
    isVehicleStatusToggleFetching,
  ]);

  const getCount = (type: string) => {
    return vehicleCounts?.list.find((item) => item.mode.toLowerCase() === type)
      ?.count;
  };

  const items: TabsProps["items"] = [
    ...(isCheckInAccount(Number(userId))
      ? [
          {
            key: "all",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "all"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                All{" "}
                {getCount("all") || getCount("all") === 0
                  ? `(${getCount("all")})`
                  : ""}
              </span>
            ),
            children: <ActiveInActiveList />,
          },

          {
            key: "active",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "active"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Active{" "}
                {getCount("all") || getCount("all") === 0
                  ? `(${getCount("all")})`
                  : ""}
              </span>
            ),
            children: <ActiveInActiveList />,
          },

          {
            key: "inactive",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "inactive"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Inactive{" "}
                {getCount("all") || getCount("all") === 0
                  ? `(${getCount("all")})`
                  : ""}
              </span>
            ),
            children: <ActiveInActiveList />,
          },
        ]
      : [
          {
            key: "all",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "all"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                All{" "}
                {getCount("all") || getCount("all") === 0
                  ? `(${getCount("all")})`
                  : ""}
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },

          {
            key: "running",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "running"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Running{" "}
                {getCount("running") || getCount("running") === 0
                  ? `(${getCount("running")})`
                  : ""}
              </span>
            ),

            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },
          ...(accessLabel === 6
            ? [
                {
                  key: "Unhealthy",
                  label: (
                    <span
                      className={`${
                        tabsLabelStyling.key === "unhealthy"
                          ? tabsLabelStyling.style
                          : "border-gray-300 text-gray-600"
                      } ${
                        markers.length === 0 ? "cursor-not-allowed" : ""
                      } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                      onClick={() => {
                        if (markers.length > 0) {
                          dispatch(
                            setSelectedVehicleStatus(
                              initialSelectedVehicleState
                            )
                          );
                          dispatch(setDashboardSelectedVehicleStatus([]));
                        }
                      }}
                    >
                      Unhealthy{" "}
                      {getCount("unhealthy") || getCount("unhealthy") === 0
                        ? `(${getCount("unhealthy")})`
                        : ""}
                    </span>
                  ),
                  children: (
                    <VehiclesList
                      selectedVehicleStatus={tabsLabelStyling.key}
                    />
                  ),
                },
              ]
            : []),
          {
            key: "idle",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "idle"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Idle{" "}
                {getCount("idle") || getCount("idle") === 0
                  ? `(${getCount("idle")})`
                  : ""}
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },
          {
            key: "stopped",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "stopped"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap `}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Stopped{" "}
                {getCount("stoppage") || getCount("stoppage") === 0
                  ? `(${getCount("stoppage")})`
                  : ""}
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },
          {
            key: "inpoi",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "inpoi"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                {Number(userId) === 87364 || Number(parentUser) === 87364
                  ? "Geofence"
                  : "POI"}
                {getCount("poi") || getCount("poi") === 0
                  ? `(${getCount("poi")})`
                  : ""}
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },
          {
            key: "alerts",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "alerts"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Alerts{" "}
                {getCount("alerts") || getCount("alerts") === 0
                  ? `(${getCount("alerts")})`
                  : ""}
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },

          {
            key: "not working",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "not working"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Not Working{" "}
                {getCount("not working") || getCount("not working") === 0
                  ? `(${getCount("not working")})`
                  : ""}
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },
          {
            key: "non active",
            label: (
              <span
                className={`${
                  tabsLabelStyling.key === "non active"
                    ? tabsLabelStyling.style
                    : "border-gray-300 text-gray-600"
                } ${
                  markers.length === 0 ? "cursor-not-allowed" : ""
                } px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
                onClick={() => {
                  if (markers.length > 0) {
                    dispatch(
                      setSelectedVehicleStatus(initialSelectedVehicleState)
                    );
                    dispatch(setDashboardSelectedVehicleStatus([]));
                  }
                }}
              >
                Non Active
              </span>
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },

          {
            key: "collapse",
            label: collapseVehicleStatusToggle ? (
              <DoubleRightOutlined
                className="absolute z-10 top-6 right-[5px] cursor-pointer text-lg hover:text-primary-green text-gray-800 transition-colors duration-300"
                onClick={() => dispatch(setCollapseVehicleStatusToggle(false))}
              />
            ) : (
              <DoubleLeftOutlined
                className="absolute z-10 top-6 right-[5px] cursor-pointer text-lg hover:text-primary-green text-gray-800 transition-colors duration-300"
                onClick={() => dispatch(setCollapseVehicleStatusToggle(true))}
              />
            ),
            children: (
              <VehiclesList selectedVehicleStatus={tabsLabelStyling.key} />
            ),
          },
        ]),
  ];

  return (
    <span className="relative">
      <Tabs
        defaultActiveKey="all"
        items={items}
        onChange={onChange}
        onClick={() => {
          dispatch(setPrevVehicleSelected(0));
          dispatch(setClusterActive());
        }}
        activeKey={tabsLabelStyling.key}
        className={`z-30 absolute bg-white ${
          collapseVehicleStatusToggle ? "-translate-x-[425px]" : "translate-x-0"
        } min-w-[450px] w-[450px] max-w-[450px]  transition duration-300`}
        renderTabBar={(e) => {
          return (
            <span className="flex ml-6 mt-2 mb-4 max-w-[400px] overflow-x-scroll scrollbar   scrollbar-thumb-thumb-green scrollbar-h-1 scrollbar-thumb-rounded-md">
              {items.length ? (
                items.map((item) => (
                  <div
                    key={item.key}
                    className="cursor-pointer"
                    onClick={(event) => e.onTabClick(item.key, event)}
                  >
                    <div
                      className={
                        isCheckInAccount(Number(userId))
                          ? "mt-4 mb-3"
                          : "mt-5 mb-6"
                      }
                    >
                      {item.label}
                    </div>
                  </div>
                ))
              ) : (
                <></>
              )}
            </span>
          );
        }}
        tabBarStyle={{
          padding: "14px 0 14px 18px",
          margin: 0,
        }}
        indicator={{ size: () => 0, align: "center" }}
      />
    </span>
  );
};
