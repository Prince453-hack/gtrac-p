"use client";

import React from "react";

interface CurrentStateProps {
  selectedVehicles: any[];
  vehiclesData: any[];
  loadingVehicles: boolean;
}

const CurrentState: React.FC<CurrentStateProps> = ({
  selectedVehicles,
  vehiclesData,
  loadingVehicles,
}) => {
  // Get device status based on isMainPowerConnected
  const getDeviceStatus = (vehicleIndex: number) => {
    if (!vehiclesData[vehicleIndex] || !vehiclesData[vehicleIndex].gpsDtl) {
      return null;
    }

    const isConnected =
      vehiclesData[vehicleIndex].gpsDtl.ismainpoerconnected === "1";
    return isConnected ? "Connected" : "Disconnected";
  };

  // Get movement status from mode
  const getMovementStatus = (vehicleIndex: number) => {
    if (!vehiclesData[vehicleIndex] || !vehiclesData[vehicleIndex].gpsDtl) {
      return null;
    }

    const mode = vehiclesData[vehicleIndex].gpsDtl.mode;
    return mode || "Unknown";
  };

  // Get odometer value
  const getOdometerValue = (vehicleIndex: number) => {
    if (!vehiclesData[vehicleIndex] || !vehiclesData[vehicleIndex].gpsDtl) {
      return null;
    }

    const odometer = vehiclesData[vehicleIndex].gpsDtl.tel_odometer;
    return odometer ? `${Number(odometer).toLocaleString()} km` : "N/A";
  };

  // Get status color and style
  const getStatusStyle = (status: string, type: "device" | "movement") => {
    if (type === "device") {
      return status === "Connected"
        ? { backgroundColor: "", color: "black" } // Gray for connected
        : { backgroundColor: "", color: "red" }; // Red for disconnected
    } else {
      // Movement status colors
      switch (status?.toUpperCase()) {
        case "RUNNING":
          return { backgroundColor: "#10B981", color: "white" }; // Green
        case "IDLE":
          return { backgroundColor: "#F59E0B", color: "white" }; // Orange
        case "STOPPED":
          return { backgroundColor: "#EF4444", color: "white" }; // Red
        default:
          return { backgroundColor: "#6B7280", color: "white" }; // Gray for unknown
      }
    }
  };

  return (
    <div className="mt-6 mb-20">
      <div
        className="border rounded-sm bg-white overflow-x-auto"
        style={{
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Device Status Row */}
        <div
          className="flex border-b bg-white"
          style={{
            borderBottom: "1px solid #e9ecef",
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: "150px",
              padding: "12px 8px",
              fontWeight: "500",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            <div
              className="flex items-center"
              style={{ writingMode: "horizontal-tb" }}
            >
              <span className="text-gray-600 mr-2">🎯</span>
              <span className="text-gray-700 font-medium">Current State</span>
            </div>
          </div>
        </div>

        {/* Device Row */}
        <div
          className="flex border-b bg-gray-50"
          style={{
            borderBottom: "1px solid #e9ecef",
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "12px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Device</span>
          </div>
          {selectedVehicles.map((vehicle, index) => {
            const deviceStatus = getDeviceStatus(index);

            return (
              <div
                key={`device-status-${index}`}
                className="flex-1 flex items-center justify-center"
                style={{
                  padding: "12px 8px",
                  minWidth: "200px",
                }}
              >
                {loadingVehicles || !deviceStatus ? (
                  <div className="flex items-center justify-center">
                    {loadingVehicles ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Data</span>
                    )}
                  </div>
                ) : (
                  <span
                    className="px-3 py-1 rounded-md text-sm font-medium"
                    style={getStatusStyle(deviceStatus, "device")}
                  >
                    {deviceStatus}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Movement Row */}
        <div
          className="flex bg-gray-50"
          style={{
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "12px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Movement</span>
          </div>
          {selectedVehicles.map((vehicle, index) => {
            const movementStatus = getMovementStatus(index);

            return (
              <div
                key={`movement-status-${index}`}
                className="flex-1 flex items-center justify-center"
                style={{
                  padding: "12px 8px",
                  minWidth: "200px",
                }}
              >
                {loadingVehicles || !movementStatus ? (
                  <div className="flex items-center justify-center">
                    {loadingVehicles ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Data</span>
                    )}
                  </div>
                ) : (
                  <span
                    className="px-3 py-1 rounded-md text-sm font-medium capitalize"
                    style={getStatusStyle(movementStatus, "movement")}
                  >
                    {movementStatus.toLowerCase()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Odometer Row */}
        <div
          className="flex bg-gray-50"
          style={{
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "12px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Odometer</span>
          </div>
          {selectedVehicles.map((vehicle, index) => {
            const odometerValue = getOdometerValue(index);

            return (
              <div
                key={`odometer-${index}`}
                className="flex-1 flex items-center justify-center"
                style={{
                  padding: "12px 8px",
                  minWidth: "200px",
                }}
              >
                {loadingVehicles || !odometerValue ? (
                  <div className="flex items-center justify-center">
                    {loadingVehicles ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Data</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {odometerValue}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrentState;
