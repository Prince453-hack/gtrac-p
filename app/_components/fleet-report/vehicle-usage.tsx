"use client";

import React from "react";

interface VehicleUsageProps {
  firstFourVehicles: any[];
  fleetData: any[];
  loadingFleetData: boolean;
  loadingDiagnostic: boolean;
  isLoading: boolean;
}

const VehicleUsage: React.FC<VehicleUsageProps> = ({
  firstFourVehicles,
  fleetData,
  loadingFleetData,
  loadingDiagnostic,
  isLoading,
}) => {
  return (
    <div className="mt-6">
      <div
        className="border rounded-sm bg-white"
        style={{
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Vehicle Usage Row - White background (like Summary row) */}
        <div
          className="flex border-b bg-white"
          style={{ borderBottom: "1px solid #e9ecef" }}
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
              <span className="text-gray-600">🚛</span>
              <span className="text-gray-700 font-medium">Vehicle Usage</span>
            </div>
          </div>
        </div>

        {/* Running Hours Row - Gray background */}
        <div
          className="flex border-b bg-gray-50"
          style={{ borderBottom: "1px solid #e9ecef" }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Running Hours</span>
          </div>
          {firstFourVehicles.map((vehicle, index) => (
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
                  fleetData[index]?.runningTime || "0h 0m"
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Distance Row - White background */}
        <div
          className="flex border-b bg-white"
          style={{ borderBottom: "1px solid #e9ecef" }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Total Distance</span>
          </div>
          {firstFourVehicles.map((vehicle, index) => (
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
                  fleetData[index]?.totalDistance || "0 KM"
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Fuel Consumed Row - Gray background */}
        <div
          className="flex border-b bg-gray-50"
          style={{ borderBottom: "1px solid #e9ecef" }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Fuel Consumed</span>
          </div>
          {firstFourVehicles.map((vehicle, index) => (
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
                  fleetData[index]?.totalFuelConsumedT?.toString() + " L" ||
                  "0 L"
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AdBlue Consumed Row - White background */}
        <div
          className="flex border-b bg-white"
          style={{ borderBottom: "1px solid #e9ecef" }}
        >
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">AdBlue Consumed</span>
          </div>
          {firstFourVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium text-blue-500">NA</div>
            </div>
          ))}
        </div>

        {/* <div className="flex bg-gray-50">
          <div
            className="flex items-center justify-start"
            style={{
              width: "150px",
              padding: "16px 8px",
              fontWeight: "500",
            }}
          >
            <span className="text-gray-700 font-medium">Average Speed</span>
          </div>
          {firstFourVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center"
              style={{
                padding: "16px 8px",
              }}
            >
              <div className="text-center font-medium">
                {isLoading || !vehicle?.gpsDtl?.speed ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                  </div>
                ) : (
                  vehicle.gpsDtl.speed.toFixed(2) + " km/h"
                )}
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default VehicleUsage;
