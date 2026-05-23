"use client";

import { RootState } from "@/app/_globalRedux/store";
import { FolderOpenOutlined } from "@ant-design/icons";
import { Tabs, TabsProps } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { VehicleAlertCards } from "./VehicleAlertCards";
import VehicleHealthCards from "./VehicleHealthCards";

export const VehicleAlertsTabs = () => {
  const [tabsLabelStyling, setTabsLabelStyling] = useState({
    key: "health",
    style: "bg-white text-neutral-700",
  });
  const { userId, parentUser } = useSelector((state: RootState) => state.auth);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const onChange = (key: string) => {
    setTabsLabelStyling((prev) => ({ ...prev, key }));
  };

  const items: TabsProps["items"] = [
    ...(selectedVehicle.gpsDtl.immoblizeStatus === 1
      ? [
          {
            key: "health",
            label: "Health",
            children: (
              <div className="h-[250px]">
                <VehicleHealthCards />
              </div>
            ),
          },
        ]
      : []),
    {
      key: "vehicle",
      label: "Vehicle",
      children: (
        <div>
          <VehicleAlertCards />
        </div>
      ),
    },
    {
      key: "reminders",
      label: "Reminders",
      children: (
        <div className="text-4xl text-neutral-400 w-full h-[200px] flex gap-2 justify-center items-center">
          <div>
            <div className="flex items-center justify-center w-full">
              <FolderOpenOutlined />
            </div>
            <p className="text-base text-neutral-500 font-semibold">
              No Data Found
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Tabs items={items} activeKey={tabsLabelStyling.key} onChange={onChange} />
  );
};
