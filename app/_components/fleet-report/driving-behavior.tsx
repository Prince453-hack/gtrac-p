"use client";

import React from "react";

interface DrivingBehaviorProps {
  selectedVehicles: any[];
  fleetData: any[];
  loadingFleetData: boolean;
  loadingDiagnostic: boolean;
}

const DrivingBehavior: React.FC<DrivingBehaviorProps> = ({
  selectedVehicles,
  fleetData,
  loadingFleetData,
  loadingDiagnostic,
}) => {
  const hasAlert = (vehicleIndex: number, alertType: string): string => {
    if (loadingFleetData || loadingDiagnostic || !fleetData[vehicleIndex]) {
      return "loading";
    }

    const vehicleData = fleetData[vehicleIndex];
    if (!vehicleData || !vehicleData.success) {
      return "No";
    }

    switch (alertType) {
      case "freewheeling":
        const freewheeling = vehicleData.freewheeling;
        return freewheeling && freewheeling > 0
          ? freewheeling.toString()
          : "No";
      case "overspeed":
        const overspeeding = vehicleData.overspeeding;
        return overspeeding && overspeeding > 0
          ? overspeeding.toString()
          : "No";
      case "harshBehavior":
        const harshbraking = vehicleData.harshbraking;
        return harshbraking && harshbraking > 0
          ? harshbraking.toString()
          : "No";
      case "harshAcceleration":
        const harshacceleration = vehicleData.harshacceleration;
        return harshacceleration && harshacceleration > 0
          ? harshacceleration.toString()
          : "No";
      default:
        return "No";
    }
  };

  return (
    <div className="mt-6">
      <div
        className="border rounded-sm bg-white overflow-x-auto"
        style={{
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          overflow: "hidden auto",
        }}
      >
        {/* Header Row */}
        <div
          className="flex border-b bg-white"
          style={{
            borderBottom: "1px solid #e9ecef",
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">🚗</span>
              <span className="text-gray-700 font-medium">
                Driving Behavior
              </span>
            </div>
          </div>
        </div>

        {/* Stoppages Row */}
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
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Stoppages</span>
          </div>
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium">
                {loadingFleetData || loadingDiagnostic || !fleetData[index] ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                  </div>
                ) : (
                  fleetData[index]?.stoppageTime || "NA"
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Free Wheeling Row */}
        <div
          className="flex border-b bg-white"
          style={{
            borderBottom: "1px solid #e9ecef",
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Free Wheeling</span>
          </div>
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium">
                {hasAlert(index, "freewheeling") === "loading" ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                  </div>
                ) : (
                  <span
                    className={`text-center font-medium ${
                      hasAlert(index, "freewheeling") === "No"
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    {hasAlert(index, "freewheeling")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Over Speeding Row */}
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
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Over Speeding</span>
          </div>
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium">
                {hasAlert(index, "overspeed") === "loading" ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                  </div>
                ) : (
                  <span
                    className={`text-center font-medium ${
                      hasAlert(index, "overspeed") === "No"
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    {hasAlert(index, "overspeed")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Harsh Breaking Row */}
        <div
          className="flex border-b bg-white"
          style={{
            borderBottom: "1px solid #e9ecef",
            minWidth: `${150 + selectedVehicles.length * 200}px`,
          }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Harsh Braking</span>
          </div>
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium">
                {hasAlert(index, "harshBehavior") === "loading" ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                  </div>
                ) : (
                  <span
                    className={`text-center font-medium ${
                      hasAlert(index, "harshBehavior") === "No"
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    {hasAlert(index, "harshBehavior")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Harsh Acceleration Row */}
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
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">
              Harsh Acceleration
            </span>
          </div>
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium">
                {hasAlert(index, "harshAcceleration") === "loading" ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                  </div>
                ) : (
                  <span
                    className={`text-center font-medium ${
                      hasAlert(index, "harshAcceleration") === "No"
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    {hasAlert(index, "harshAcceleration")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrivingBehavior;
