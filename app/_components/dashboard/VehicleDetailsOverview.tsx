"use client";

import React, { useState } from "react";
import { Tabs, TabsProps } from "antd";
import { VehicleItnaryWithPath } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { VehicleHistoryCardListDiagnostic } from "./VehicleHistoryCardListDiagnostic";
import { VehicleHistoryTabs } from "./VehicleHistoryTabs";
import VehicleHealthTabs from "./VehicleHealthTabs";
import { useAlertCount } from "@/app/hooks/useAlertCount";

interface VehicleDetailsOverviewProps {
  data: VehicleItnaryWithPath;
  view: "VehicleDetails" | "ExpandedReportsModal";
}

export const VehicleDetailsOverview: React.FC<VehicleDetailsOverviewProps> = ({
  view,
  data,
}) => {
  const [tabsLabelStyling, setTabsLabelStyling] = useState({
    key: "movement",
    style: "bg-white text-neutral-700",
  });

  const alertCount = useAlertCount();

  const onChange = (key: string) => {
    setTabsLabelStyling((prev) => ({ ...prev, key }));
  };

  const items: TabsProps["items"] = [
    {
      key: "movement",
      label: (
        <div
          className={`${
            tabsLabelStyling.key === "movement"
              ? tabsLabelStyling.style
              : "text-neutral-500"
          }  px-2 py-1.5 text-sm font-bold text-nowrap w-full rounded-sm text-center`}
        >
          Movement
        </div>
      ),
      children: (
        <div className="px-5">
          <VehicleHistoryTabs data={data} view={view} />
        </div>
      ),
    },
    {
      key: "health",
      label: (
        <div
          className={`${
            tabsLabelStyling.key === "health"
              ? tabsLabelStyling.style
              : "text-neutral-500"
          }  px-2 py-1.5 text-sm font-bold text-nowrap w-full rounded-sm text-center`}
        >
          Health
        </div>
      ),
      children: (
        <div className="px-5">
          <VehicleHealthTabs />
        </div>
      ),
    },

    {
      key: "alerts",
      label: (
        <div
          className={`${
            tabsLabelStyling.key === "alerts"
              ? tabsLabelStyling.style
              : "text-neutral-500"
          }  px-2 py-1.5 text-sm font-bold text-nowrap w-full rounded-sm text-center`}
        >
          {alertCount > 0 && <span className="animate-pulse">⚠️</span>} Alerts
        </div>
      ),
      children: (
        <div className="px-5">
          <VehicleHistoryCardListDiagnostic
            type="Alerts"
            data={data}
            view={view}
          />
        </div>
      ),
    },
  ];

  return (
    <Tabs
      items={items}
      activeKey={tabsLabelStyling.key}
      renderTabBar={(e) => {
        return (
          <div className="flex mx-auto justify-between max-w-[420px] p-0.5 gap-2 mt-2 rounded-sm w-full bg-[rgb(238,238,238)]">
            {items.length ? (
              items.map((item) => (
                <div
                  key={item.key}
                  className="cursor-pointer w-1/3"
                  onClick={(event) => e.onTabClick(item.key, event)}
                >
                  <div>{item.label}</div>
                </div>
              ))
            ) : (
              <></>
            )}
          </div>
        );
      }}
      tabBarStyle={{
        padding: "0px 0px 0px 0px",
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
      }}
      indicator={{ size: () => 0, align: "center" }}
      onChange={onChange}
    />
  );
};
