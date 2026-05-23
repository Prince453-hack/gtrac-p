"use client";

import React, { useState, useEffect } from "react";
import { Radio, Spin } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Image from "next/image";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";

interface GearEngineSpeedProps {
  allVehicles: VehicleData[];
  gearData: any[];
  loadingGear: boolean;
  onVehicleChange: (vehicle: VehicleData) => void;
}

interface GearChartData {
  gear: string;
  speed: number;
  percentage: number;
}

const GearEngineSpeed: React.FC<GearEngineSpeedProps> = ({
  allVehicles,
  gearData,
  loadingGear,
  onVehicleChange,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(
    null
  );

  // Initialize with first vehicle
  useEffect(() => {
    if (allVehicles.length > 0 && !selectedVehicle) {
      const firstVehicle = allVehicles[0];
      setSelectedVehicle(firstVehicle);
      onVehicleChange(firstVehicle);
    }
  }, [allVehicles]);

  const handleVehicleChange = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    onVehicleChange(vehicle);
  };

  // Calculate gear distribution and engine speed data
  const calculateGearEngineSpeedData = (): GearChartData[] => {
    if (!gearData[0] || !gearData[0].rawdata) {
      // Return gears 1-7 with 0 data when no data available
      return Array.from({ length: 7 }, (_, i) => ({
        gear: getGearName(i + 1),
        speed: 0,
        percentage: 0,
      }));
    }

    const rawData = gearData[0].rawdata;
    // Filter out gear 0 from the data
    const validGearData = rawData.filter((item: any) => item.gear !== 0);
    const totalRecords = validGearData.length;

    if (totalRecords === 0) {
      // Return gears 1-7 with 0 data when no records
      return Array.from({ length: 7 }, (_, i) => ({
        gear: getGearName(i + 1),
        speed: 0,
        percentage: 0,
      }));
    }

    // Initialize gear data for gears 1-7 only
    const gearStats: { [key: number]: { speeds: number[]; count: number } } = {
      1: { speeds: [], count: 0 },
      2: { speeds: [], count: 0 },
      3: { speeds: [], count: 0 },
      4: { speeds: [], count: 0 },
      5: { speeds: [], count: 0 },
      6: { speeds: [], count: 0 },
      7: { speeds: [], count: 0 },
    };

    // Process raw data (excluding gear 0)
    validGearData.forEach((item: any) => {
      const gear = item.gear;
      const speed = item.gps_speed || 0;

      if (gear >= 1 && gear <= 7) {
        gearStats[gear].speeds.push(speed);
        gearStats[gear].count++;
      }
    });

    // Calculate average speeds and categorize for gears 1-7
    const chartData: GearChartData[] = [];

    for (let gear = 1; gear <= 7; gear++) {
      const gearDataItem = gearStats[gear];

      if (gearDataItem.count > 0) {
        const avgSpeed =
          gearDataItem.speeds.reduce((sum, speed) => sum + speed, 0) /
          gearDataItem.count;
        let percentage = Math.round((gearDataItem.count / totalRecords) * 100);

        chartData.push({
          gear: getGearName(gear),
          speed: Math.round(avgSpeed),
          percentage,
        });
      } else {
        // Include gear with 0 data
        chartData.push({
          gear: getGearName(gear),
          speed: 0,
          percentage: 0,
        });
      }
    }

    // Apply gear percentage adjustment logic
    const gearPercentages: { [key: number]: number } = {};
    chartData.forEach((data, index) => {
      gearPercentages[index + 1] = data.percentage;
    });

    // Determine which gear has higher percentage between 6th and 7th
    const maxGear = gearPercentages[6] >= gearPercentages[7] ? 6 : 7;
    const maxGearValue = gearPercentages[maxGear];

    // Adjust first gear if ≤ 2%
    if (gearPercentages[1] <= 2 && maxGearValue > 0) {
      const addAmount = Math.round((3 / 100) * maxGearValue);
      if (gearPercentages[maxGear] >= addAmount) {
        gearPercentages[maxGear] -= addAmount;
        gearPercentages[1] = addAmount;
      }
    }

    // Adjust second gear if ≤ 2%
    if (gearPercentages[2] <= 2 && maxGearValue > 0) {
      const addAmount = Math.round((5 / 100) * maxGearValue);
      if (gearPercentages[maxGear] >= addAmount) {
        gearPercentages[maxGear] -= addAmount;
        gearPercentages[2] = addAmount;
      }
    }

    // Adjust third gear if ≤ 2%
    if (gearPercentages[3] <= 2 && maxGearValue > 0) {
      const addAmount = Math.round((7 / 100) * maxGearValue);
      if (gearPercentages[maxGear] >= addAmount) {
        gearPercentages[maxGear] -= addAmount;
        gearPercentages[3] = addAmount;
      }
    }

    // Update chartData with adjusted percentages
    chartData.forEach((data, index) => {
      data.percentage = gearPercentages[index + 1];
    });

    return chartData;
  };

  const getGearName = (gear: number): string => {
    const gearNames = {
      0: "ZERO",
      1: "FIRST",
      2: "SECOND",
      3: "THIRD",
      4: "FOURTH",
      5: "FIFTH",
      6: "SIXTH",
      7: "SEVENTH",
    };
    return gearNames[gear as keyof typeof gearNames] || `GEAR ${gear}`;
  };

  const chartData = calculateGearEngineSpeedData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg mb-20">
          <p className="font-medium">{`${label} Gear`}</p>
          <p className="text-sm text-gray-600">{`Average Speed: ${data.speed} km/h`}</p>
          <p className="text-sm text-gray-600">{`Usage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 mb-20">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Gear Specific Engine Speed Distribution
        </h2>

        {/* Vehicle Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Selected Vehicle
          </h3>
          <div className="flex flex-wrap gap-4">
            <Radio.Group
              value={selectedVehicle?.vId}
              onChange={(e) => {
                const vehicle = allVehicles.find(
                  (v) => v.vId === e.target.value
                );
                if (vehicle) {
                  handleVehicleChange(vehicle);
                }
              }}
            >
              {allVehicles.map((vehicle) => (
                <Radio
                  key={vehicle.vId}
                  value={vehicle.vId}
                  className="#478c83"
                >
                  <span
                    className={
                      selectedVehicle?.vId === vehicle.vId
                        ? "#478c83 font-medium"
                        : "text-gray-700"
                    }
                  >
                    {vehicle.vehReg || `Vehicle ${vehicle.vId}`}
                  </span>
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>

        {/* Chart */}
        <div
          className="border rounded-sm bg-gray-50"
          style={{ height: "400px" }}
        >
          {loadingGear ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Spin size="large" />
                <p className="mt-2 text-gray-500">Loading...</p>
              </div>
            </div>
          ) : !gearData[0] || !gearData[0].rawdata ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Image
                  src="/assets/svgs/fleet/no-data.png"
                  alt="No Data Available"
                  width={120}
                  height={120}
                  className="mx-auto mb-4"
                />
                <p className="text-gray-500">No Data Available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 40,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
                maxBarSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="gear"
                  angle={0}
                  textAnchor="middle"
                  height={40}
                  interval={0}
                  fontSize={12}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  allowDataOverflow={false}
                  label={{
                    value: "Percent Of Time",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" fill="#5DD090" name="Gear Usage" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Additional Info */}
        {selectedVehicle && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing gear utilization data for{" "}
              <span className="font-medium text-blue-600">
                {selectedVehicle?.vehReg || `Vehicle ${selectedVehicle?.vId}`}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GearEngineSpeed;
