"use client";

import React, { useState } from "react";
import { DownOutlined } from "@ant-design/icons";
import type { DropdownProps, MenuProps } from "antd";
import { Dropdown, Space } from "antd";
import Image from "next/image";
import nearbyProximity from "@/public/assets/svgs/common/nearby.svg";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";

export const PlacesDropdown = () => {
  const { groupId, userId, parentUser } = useSelector(
    (state: RootState) => state.auth
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );

  const [open, setOpen] = useState(false);

  const urlSuffix = `locationV=${selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll(
    "_",
    " "
  )}++(${selectedVehicle.gpsDtl.latLngDtl.lat},%20${
    selectedVehicle.gpsDtl.latLngDtl.lng
  })&latlong=${selectedVehicle.gpsDtl.latLngDtl.lat},${
    selectedVehicle.gpsDtl.latLngDtl.lng
  }`;

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "petrol_pump") {
      window.open(
        `https://gtrac.in/newtracking/nearespetrolpump.php?action=petrolpump&${urlSuffix}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (e.key === "hospital") {
      window.open(
        `https://gtrac.in/newtracking/nearestHosital.php?action=hospital&${urlSuffix}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (e.key === "atm") {
      window.open(
        `https://gtrac.in/newtracking/nearestATM.php?action=hospital&${urlSuffix}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleOpenChange: DropdownProps["onOpenChange"] = (nextOpen, info) => {
    setOpen(nextOpen);
  };

  const items: MenuProps["items"] = [
    {
      label: "Petrol Pump",
      key: "petrol_pump",
    },
    {
      label: "Hospital",
      key: "hospital",
    },
    {
      label: "ATM",
      key: "atm",
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
        onClick: handleMenuClick,
      }}
      onOpenChange={handleOpenChange}
      open={open}
      trigger={["click"]}
    >
      <Image
        src={nearbyProximity}
        alt="nearby proximity icon"
        width="23"
        height="23"
        className="mb-1 cursor-pointer hover:opacity-80 transition-opacity duration-300"
      />
    </Dropdown>
  );
};
