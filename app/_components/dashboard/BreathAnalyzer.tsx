import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { BreathAnalyzerIcon } from "@/public/assets/svgs/nav";
import { Tooltip } from "antd";
import Image from "next/image";
import React from "react";

const BreathAnalyzer = ({ data }: { data: VehicleData }) => {
  const breathAnalyzerVehicles = [12466518, 12466517];
  const shouldShowBreathAnalyzerIcon = breathAnalyzerVehicles.includes(data.vId);

  const handleBreathAnalyzerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/dashboard/breath-analyzer`, "_blank");
  };

  if (!shouldShowBreathAnalyzerIcon) return null;

  return (
    <Tooltip title="Breath Analyzer" mouseEnterDelay={1}>
      <div className="w-[20px] cursor-pointer" onClick={handleBreathAnalyzerClick}>
        <Image src={BreathAnalyzerIcon} alt="breath analyzer icon" width={15} height={15} />
      </div>
    </Tooltip>
  );
};

export default BreathAnalyzer;
