"use client";

import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Dropdown, Tooltip } from "antd";
import React from "react";
import { useSelector } from "react-redux";

export const Elock = ({ data }: { data: VehicleData }) => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);

  const isElockVehicle = data.gpsDtl.controllernum === "CONTROLLER";

  const isDirectOldViewUser =
    Number(userId) === 87115 || Number(userId) === 78341;

  const url_link =
    Number(userId) !== 87115
      ? "load_search_data_with_reports_react.php"
      : "load_search_reactvrc.php";

  const oldViewUrl = `https://gtrac.in/newtracking/reports/${url_link}?action=search_with_reports&vehicle_Number=${data.vId}&CtrlId=${data.controllermergeId}&ParentId=1&UserName=htpl&sys_group_id_parent=1&sys_group_id=${groupId}&UserId=${userId}`;

  const newViewUrl = `/dashboard/elock/${data.vId}`;

  const dropdownItems = [
    {
      key: "old",
      label: "Old View",
    },
    {
      type: "divider" as const,
    },
    {
      key: "new",
      label: "New View",
    },
  ];

  const handleMenuClick = ({ key, domEvent }: any) => {
    if (domEvent) {
      domEvent.stopPropagation();
    }

    if (key === "old") {
      window.open(oldViewUrl, "_blank");
    } else if (key === "new") {
      window.open(newViewUrl, "_blank");
    }
  };

  return (
    <>
      {isElockVehicle && (
        <>
          {data.gpsDtl.acState === "Off" ? (
            <Tooltip title="E-Lock Locked" mouseEnterDelay={1}>
              {isDirectOldViewUser ? (
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    window.open(oldViewUrl, "_blank");
                  }}
                >
                  <LockOutlined
                    style={{ fontSize: "20px", color: "#478C83" }}
                  />
                </div>
              ) : (
                <Dropdown
                  menu={{ items: dropdownItems, onClick: handleMenuClick }}
                  trigger={["click"]}
                >
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <LockOutlined
                      style={{ fontSize: "20px", color: "#478C83" }}
                    />
                  </div>
                </Dropdown>
              )}
            </Tooltip>
          ) : data.gpsDtl.acState === "On" ? (
            <Tooltip title="E-Lock Unlocked" mouseEnterDelay={1}>
              {isDirectOldViewUser ? (
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    window.open(oldViewUrl, "_blank");
                  }}
                >
                  <UnlockOutlined
                    style={{ fontSize: "20px", color: "#BF2E39" }}
                  />
                </div>
              ) : (
                <Dropdown
                  menu={{ items: dropdownItems, onClick: handleMenuClick }}
                  trigger={["click"]}
                >
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <UnlockOutlined
                      style={{ fontSize: "20px", color: "#BF2E39" }}
                    />
                  </div>
                </Dropdown>
              )}
            </Tooltip>
          ) : null}
        </>
      )}
    </>
  );
};
