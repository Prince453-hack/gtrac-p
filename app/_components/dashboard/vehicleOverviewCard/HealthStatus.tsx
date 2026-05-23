"use client";

import { Modal } from "antd";
import React from "react";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";

interface HealthStatusProps {
  open: boolean;
  onClose: () => void;
  vehicleData: VehicleData;
}

export const HealthStatus: React.FC<HealthStatusProps> = ({
  open,
  onClose,
  vehicleData,
}) => {
  const healthStatusData = [
    {
      label: "Last Status",
      value: "Closed",
      labelRight: "Last lock Open Time",
      valueRight: "18-12-2025 04-24-17 PM",
    },
    {
      label: "Door Status",
      value: "Closed",
      labelRight: "Last Door Open Time",
      valueRight: "18-12-2025 04-24-17 PM",
    },
    {
      label: "Last Data Received Time",
      value: "18-12-2025 04-24-17 PM",
      labelRight: "Last lock close time",
      valueRight: "18-12-2025 04-24-17 PM",
    },
    {
      label: "Last Lock Repaired Time",
      value: "N/A",
      labelRight: "Last Door Close Time",
      valueRight: "18-12-2025 04-24-17 PM",
    },
    {
      label: "Unhealthy Reason",
      value: "N/A",
      labelRight: "",
      valueRight: "",
    },
  ];

  return (
    <Modal
      title={`Health Status`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      className="p-3"
      centered
    >
      <div className="space-y-4">
        {/* Vehicle Name and Status Bars */}
        <div>
          <h1 className="text-xl font-semibold mb-3">{vehicleData.vehReg}</h1>
          <div className="flex items-center space-x-3">
            <div className="bg-[#FF9D9D] h-3 w-56 rounded-[2px]" />
            <div className="bg-[#95FFBC] h-3 w-56 rounded-[2px]" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="size-3 bg-[#FF9D9D] rounded-full" />
            <p className="text-sm text-gray-600">Open</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="size-3 bg-[#95FFBC] rounded-full" />
            <p className="text-sm text-gray-600">Close</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-4" />

        {/* Health Status Data Grid */}
        <div className="space-y-0">
          {healthStatusData.map((item, index) => (
            <div key={index}>
              <div className="flex border-b border-gray-200">
                {/* Left Column */}
                <div className="flex-1 flex justify-between items-center py-3 pr-4">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span
                    className={`font-bold text-sm ${
                      item.value === "Closed" ? "text-[#31694E]" : "font-medium"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>

                {/* Vertical Divider */}
                {item.labelRight && (
                  <div className="border-l border-gray-300 mx-0" />
                )}

                {/* Right Column */}
                {item.labelRight && (
                  <div className="flex-1 flex justify-between items-center py-3 pl-4">
                    <span className="text-sm text-gray-500">
                      {item.labelRight}
                    </span>
                    <span className="font-medium text-sm">
                      {item.valueRight}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
