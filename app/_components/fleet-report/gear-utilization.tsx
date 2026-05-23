"use client";

import React from "react";
import Image from "next/image";

interface GearUtilizationProps {
  selectedVehicles: any[];
  gearData: any[];
  loadingGear: boolean;
  ratioFromStandstill?: boolean;
}

const GearUtilization: React.FC<GearUtilizationProps> = ({
  selectedVehicles,
  gearData,
  loadingGear,
  ratioFromStandstill = false,
}) => {
  // Calculate ratio from standstill (first 3 gears only)
  const calculateRatioFromStandstill = (vehicleIndex: number) => {
    // First get the regular gear distribution
    const regularGearPercentages = calculateGearDistribution(vehicleIndex);
    if (!regularGearPercentages) return null;

    const first3GearsSum =
      regularGearPercentages[1] +
      regularGearPercentages[2] +
      regularGearPercentages[3];

    if (first3GearsSum === 0) return null;

    let ratioPercentages = {
      1: Math.round((regularGearPercentages[1] / first3GearsSum) * 100),
      2: Math.round((regularGearPercentages[2] / first3GearsSum) * 100),
      3: Math.round((regularGearPercentages[3] / first3GearsSum) * 100),
    };

    if (ratioPercentages[3] >= 5) {
      const onePercent = ratioPercentages[3] / 5;

      const twoAndHalfPercent = Math.round(2.5 * onePercent);

      ratioPercentages[1] += twoAndHalfPercent;
      ratioPercentages[3] -= twoAndHalfPercent;
    }

    // Ensure total stays at 100%
    const total = Object.values(ratioPercentages).reduce(
      (sum, val) => sum + val,
      0
    );
    if (total !== 100) {
      const diff = 100 - total;
      // Add difference to the gear with highest percentage
      let maxGear: keyof typeof ratioPercentages = 1;
      let maxValue = ratioPercentages[1];

      if (ratioPercentages[2] > maxValue) {
        maxGear = 2;
        maxValue = ratioPercentages[2];
      }
      if (ratioPercentages[3] > maxValue) {
        maxGear = 3;
      }

      ratioPercentages[maxGear] += diff;
    }

    return ratioPercentages;
  };

  // Calculate gear distribution for a vehicle
  const calculateGearDistribution = (vehicleIndex: number) => {
    if (!gearData[vehicleIndex] || !gearData[vehicleIndex].rawdata) {
      return null;
    }

    const rawData = gearData[vehicleIndex].rawdata;
    const validGearData = rawData.filter((item: any) => item.gear !== 0);
    const totalRecords = validGearData.length;

    if (totalRecords === 0) return null;

    const gearCounts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
    };

    validGearData.forEach((item: any) => {
      const gear = item.gear;
      if (gear >= 1 && gear <= 7) {
        gearCounts[gear as keyof typeof gearCounts]++;
      }
    });

    // Calculate percentages
    const gearPercentages = {
      1: Math.round((gearCounts[1] / totalRecords) * 100),
      2: Math.round((gearCounts[2] / totalRecords) * 100),
      3: Math.round((gearCounts[3] / totalRecords) * 100),
      4: Math.round((gearCounts[4] / totalRecords) * 100),
      5: Math.round((gearCounts[5] / totalRecords) * 100),
      6: Math.round((gearCounts[6] / totalRecords) * 100),
      7: Math.round((gearCounts[7] / totalRecords) * 100),
    };

    const adjustedPercentages = { ...gearPercentages };

    // Determine which gear has higher percentage between 6th and 7th
    const maxGear = adjustedPercentages[6] >= adjustedPercentages[7] ? 6 : 7;
    const maxGearValue = adjustedPercentages[maxGear];

    // Adjust first gear if ≤ 2%
    if (adjustedPercentages[1] <= 2 && maxGearValue > 0) {
      const addAmount = Math.round((3 / 100) * maxGearValue);
      if (adjustedPercentages[maxGear] >= addAmount) {
        adjustedPercentages[maxGear] -= addAmount;
        adjustedPercentages[1] = addAmount;
      }
    }

    // Adjust second gear if ≤ 2%
    if (adjustedPercentages[2] <= 2 && maxGearValue > 0) {
      const addAmount = Math.round((5 / 100) * maxGearValue);
      if (adjustedPercentages[maxGear] >= addAmount) {
        adjustedPercentages[maxGear] -= addAmount;
        adjustedPercentages[2] = addAmount;
      }
    }

    // Adjust third gear if ≤ 2%
    if (adjustedPercentages[3] <= 2 && maxGearValue > 0) {
      const addAmount = Math.round((7 / 100) * maxGearValue);
      if (adjustedPercentages[maxGear] >= addAmount) {
        adjustedPercentages[maxGear] -= addAmount;
        adjustedPercentages[3] = addAmount;
      }
    }

    // Ensure total stays at 100% by normalizing
    const total = Object.values(adjustedPercentages).reduce(
      (sum, val) => sum + val,
      0
    );
    if (total !== 100) {
      const factor = 100 / total;
      for (let gear = 1; gear <= 7; gear++) {
        adjustedPercentages[gear as keyof typeof adjustedPercentages] =
          Math.round(
            adjustedPercentages[gear as keyof typeof adjustedPercentages] *
              factor
          );
      }
    }

    return adjustedPercentages;
  };

  // Generate SVG pie chart for ratio from standstill (first 3 gears only)
  const generateRatioPieChart = (ratioPercentages: any) => {
    if (!ratioPercentages) return null;

    const colors = {
      1: "#FF6B6B", // Red
      2: "#FFE66D", // Yellow
      3: "#FF9F43", // Orange
    };

    let currentAngle = 0;
    const radius = 60;
    const centerX = 80;
    const centerY = 80;

    const paths = [];

    for (let gear = 1; gear <= 3; gear++) {
      const percentage = ratioPercentages[gear];
      if (percentage > 0) {
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        // Convert to radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Calculate path coordinates
        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          "Z",
        ].join(" ");

        paths.push(
          <path
            key={gear}
            d={pathData}
            fill={colors[gear as keyof typeof colors]}
            stroke="#fff"
            strokeWidth="2"
          />
        );

        currentAngle += angle;
      }
    }

    return (
      <svg width="160" height="160" viewBox="0 0 160 160">
        {paths}
        {/* Inner circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="35"
          fill="white"
          stroke="#e9ecef"
          strokeWidth="2"
        />
      </svg>
    );
  };

  // Generate SVG pie chart
  const generatePieChart = (gearPercentages: any) => {
    if (!gearPercentages) return null;

    const colors = {
      1: "#FF6B6B", // Red
      2: "#FFE66D", // Yellow
      3: "#FF9F43", // Orange
      4: "#26DE81", // Green
      5: "#4ECDC4", // Teal
      6: "#A8E6CF", // Light green
      7: "#DDA0DD", // Plum
    };

    let currentAngle = 0;
    const radius = 60;
    const centerX = 80;
    const centerY = 80;

    const paths = [];

    for (let gear = 1; gear <= 7; gear++) {
      const percentage = gearPercentages[gear];
      if (percentage > 0) {
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        // Convert to radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Calculate path coordinates
        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          "Z",
        ].join(" ");

        paths.push(
          <path
            key={gear}
            d={pathData}
            fill={colors[gear as keyof typeof colors]}
            stroke="#fff"
            strokeWidth="2"
          />
        );

        currentAngle += angle;
      }
    }

    return (
      <svg width="160" height="160" viewBox="0 0 160 160">
        {paths}
        {/* Inner circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="35"
          fill="white"
          stroke="#e9ecef"
          strokeWidth="2"
        />
      </svg>
    );
  };

  // Generate legend for ratio from standstill
  const generateRatioLegend = (ratioPercentages: any) => {
    if (!ratioPercentages) return null;

    const colors = {
      1: "#FF6B6B", // Red
      2: "#FFE66D", // Yellow
      3: "#FF9F43", // Orange
    };

    const gearNames = {
      1: "First",
      2: "Second",
      3: "Third",
    };

    return (
      <div className="flex flex-col items-center gap-y-1 text-xs">
        {[1, 2, 3].map((gear) => (
          <div key={gear} className="flex items-center space-x-1">
            <div
              className="w-2 h-2 rounded-full border flex-shrink-0"
              style={{
                backgroundColor: colors[gear as keyof typeof colors],
              }}
            />
            <span className="text-gray-600 text-xs truncate">
              {gearNames[gear as keyof typeof gearNames]}:{" "}
              <span className="font-medium">{ratioPercentages[gear]}%</span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Generate legend
  const generateLegend = (gearPercentages: any) => {
    if (!gearPercentages) return null;

    const colors = {
      1: "#FF6B6B", // Red
      2: "#FFE66D", // Yellow
      3: "#FF9F43", // Orange
      4: "#26DE81", // Green
      5: "#4ECDC4", // Teal
      6: "#A8E6CF", // Light green
      7: "#DDA0DD", // Plum
    };

    const gearNames = {
      1: "First",
      2: "Second",
      3: "Third",
      4: "Fourth",
      5: "Fifth",
      6: "Sixth",
      7: "Seventh",
    };

    return (
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        {[
          [1, 5], // First, Fifth
          [2, 6], // Second, Sixth
          [3, 7], // Third, Seventh
          [4], // Fourth (single item)
        ].map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((gear) => (
              <div key={gear} className="flex items-center space-x-1">
                <div
                  className="w-2 h-2 rounded-full border flex-shrink-0"
                  style={{
                    backgroundColor: colors[gear as keyof typeof colors],
                  }}
                />
                <span className="text-gray-600 text-xs truncate">
                  {gearNames[gear as keyof typeof gearNames]}:{" "}
                  <span className="font-medium">{gearPercentages[gear]}%</span>
                </span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
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
        <div
          className="flex bg-gray-50"
          style={{
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
            <div className="flex items-center -rotate-30">
              <span className="text-gray-600 mb-2">⚙️</span>
              <span className="text-gray-700 font-medium">
                Gear Utilization
              </span>
            </div>
          </div>
          {selectedVehicles.map((vehicle, index) => {
            const gearPercentages = calculateGearDistribution(index);
            // Show loading if global loading is true AND no data exists for this vehicle
            const isLoading = loadingGear && !gearData[index];

            const ratioPercentages = ratioFromStandstill
              ? calculateRatioFromStandstill(index)
              : null;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center"
                style={{
                  padding: "12px 8px",
                  minWidth: "200px",
                }}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#478c83] mb-2"></div>
                    <span className="text-gray-500 text-sm">Loading...</span>
                  </div>
                ) : ratioFromStandstill ? (
                  !ratioPercentages || !gearPercentages ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Image
                          src="/assets/svgs/fleet/no-data.png"
                          alt="No Data Available"
                          width={100}
                          height={100}
                          className="mb-2"
                          draggable={false}
                        />
                        <span className="text-sm">No Data Available</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex justify-between items-center px-4">
                      {/* Regular Gear Utilization - Full width section */}
                      <div className="flex items-center justify-center flex-1">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center">
                            {generatePieChart(gearPercentages)}
                          </div>
                          <div className="flex flex-col justify-center">
                            {generateLegend(gearPercentages)}
                          </div>
                        </div>
                      </div>

                      {/* Vertical Divider Line */}
                      <div className="h-48 w-px bg-gray-200 mx-6"></div>

                      {/* Ratio from Standstill - Full width section */}
                      <div className="flex items-center justify-center flex-1">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center">
                            {generateRatioPieChart(ratioPercentages)}
                          </div>
                          <div className="flex flex-col justify-center">
                            {generateRatioLegend(ratioPercentages)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : !gearPercentages ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Image
                        src="/assets/svgs/fleet/no-data.png"
                        alt="No Data Available"
                        width={100}
                        height={100}
                        className="mb-2"
                        draggable={false}
                      />
                      <span className="text-sm">No Data Available</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* Pie Chart */}
                    <div className="mb-1">
                      {generatePieChart(gearPercentages)}
                    </div>

                    {/* Legend */}
                    <div className="w-full max-w-sm px-1">
                      {generateLegend(gearPercentages)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GearUtilization;
