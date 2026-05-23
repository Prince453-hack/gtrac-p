"use client";

import { useState, useRef } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import AlertReportsTable, { AlertReportsTableRef } from "./AlertReportsTable";
import UnlockLockReportsTable, {
  UnlockLockReportsTableRef,
} from "./UnlockLockReportsTable";

interface ReportTabsProps {
  systemId: string;
  vehId?: number;
  fallbackVehId?: number;
  vehicleReg?: string;
}

export default function ReportTabs({
  systemId,
  vehId,
  fallbackVehId,
  vehicleReg,
}: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState("alert");
  const alertTableRef = useRef<AlertReportsTableRef>(null);
  const unlockTableRef = useRef<UnlockLockReportsTableRef>(null);

  const handleExport = () => {
    if (activeTab === "alert") {
      alertTableRef.current?.exportData();
    } else {
      unlockTableRef.current?.exportData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-200 rounded-lg p-1 w-fit relative">
          <div
            className="absolute bg-[#2875DE] rounded-md shadow-sm transition-transform duration-300 ease-in-out"
            style={{
              width: "calc(50% - 10px)",
              height: "calc(100% - 8px)",
              top: "4px",
              left: "4px",
              transform:
                activeTab === "unlock" ? "translateX(100%)" : "translateX(0)",
            }}
          />

          <button
            onClick={() => setActiveTab("alert")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-0 cursor-pointer relative z-10 ${
              activeTab === "alert"
                ? "bg-[#2875DE] text-white shadow-sm"
                : "text-gray-600"
            }`}
          >
            Alert Report
          </button>
          <button
            onClick={() => setActiveTab("unlock")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer focus:ring-0 relative z-10 ${
              activeTab === "unlock"
                ? "bg-[#2875DE] text-white shadow-sm"
                : "text-gray-600"
            }`}
          >
            Un-Lock Report
          </button>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          className="bg-[#2875DE]"
        >
          Export
        </Button>
      </div>
      <div className="mt-4">
        {activeTab === "alert" ? (
          <AlertReportsTable
            ref={alertTableRef}
            systemId={systemId}
            vehId={vehId}
            fallbackVehId={fallbackVehId}
            vehicleReg={vehicleReg}
          />
        ) : (
          <UnlockLockReportsTable
            ref={unlockTableRef}
            systemId={systemId}
            vehId={vehId}
            fallbackVehId={fallbackVehId}
            vehicleReg={vehicleReg}
          />
        )}
      </div>
    </div>
  );
}
