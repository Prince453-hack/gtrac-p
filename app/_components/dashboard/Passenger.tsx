import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { PeopleIcon } from "@/public/assets/svgs/nav";
import { Tooltip } from "antd";
import Image from "next/image";
import React from "react";

const Passenger = ({ data }: { data: VehicleData }) => {
  const passengerVehicles = [12447484, 12447611, 12447889, 12466517];
  const shouldShowPassengerIcon = passengerVehicles.includes(data.vId);

  const handlePassengerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `/dashboard/passenger-counting?serviceId=${data.vId}`,
      "_blank",
    );
  };

  return (
    <>
      {shouldShowPassengerIcon ? (
        <Tooltip title="Passenger Counting" mouseEnterDelay={1}>
          <div
            className="w-[20px] cursor-pointer"
            onClick={handlePassengerClick}
          >
            <Image
              src={PeopleIcon}
              alt="passenger vehicle icon"
              width={15}
              height={15}
            />
          </div>
        </Tooltip>
      ) : null}
    </>
  );
};

export default Passenger;
