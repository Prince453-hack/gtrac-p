"use client";

import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { Padlocked, PadUnlocked } from "@/public/assets/svgs/nav";
import { Tooltip } from "antd";
import Image from "next/image";
import { useSelector } from "react-redux";

export const Padlock = ({ data }: { data: VehicleData }) => {
  const { accessLabel, groupId, userId } = useSelector(
    (state: RootState) => state.auth,
  );

  const isPadlockVehicle = accessLabel === 4;

  const handlePadlockClick = () => {
    const url = `https://gtrac.in/newtracking/reports/load_search_data_with_reports_react.php?action=search_with_reports&vehicle_Number=${data.vId}&CtrlId=${data.controllermergeId}&ParentId=1&UserName=htpl&sys_group_id_parent=1&sys_group_id=${groupId}&UserId=${userId}`;
    window.open(url);
  };

  return (
    <>
      {isPadlockVehicle && (
        <>
          {data.gpsDtl.acState === "Off" ? (
            <Tooltip title="Padlock Locked" mouseEnterDelay={1}>
              <div onClick={handlePadlockClick}>
                <Image src={Padlocked} alt="padlocked" width={20} height={10} />
              </div>
            </Tooltip>
          ) : data.gpsDtl.acState === "On" ? (
            <Tooltip title="Padlock Unlocked" mouseEnterDelay={1}>
              <div onClick={handlePadlockClick}>
                <Image
                  src={PadUnlocked}
                  alt="padunlocked"
                  width={1}
                  height={1}
                />
              </div>
            </Tooltip>
          ) : null}
        </>
      )}
    </>
  );
};
