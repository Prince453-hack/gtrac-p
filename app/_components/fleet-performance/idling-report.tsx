"use client";

import React, { useState, useEffect } from "react";
import { useLazyGetVehicleReportQuery } from "@/app/_globalRedux/services/trackingDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import dayjs from "dayjs";

interface IdlingReportProps {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  limitedVehicles: any[];
  userId?: string;
  groupId?: string;
  vehicleReportDataMap?: Map<number, any>;
  loadingVehicleReport?: boolean;
}

interface VehicleIdlingData {
  vehicleNumber: string;
  idlingMinutes: number;
  stoppageTime: string;
  fuelIdleLitres: number;
  fuelLossRupees: number;
  hasValidData: boolean;
}

const IdlingReport: React.FC<IdlingReportProps> = React.memo(
  ({
    dateRange,
    limitedVehicles,
    userId,
    groupId,
    vehicleReportDataMap,
    loadingVehicleReport,
  }) => {
    const [vehicleData, setVehicleData] = useState<VehicleIdlingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [fuelPrice, setFuelPrice] = useState(95); // Dynamic fuel price state
    const [tempFuelPrice, setTempFuelPrice] = useState(95); // Temporary price for input

    const [getVehicleReport] = useLazyGetVehicleReportQuery();

    // Function to convert time string (HH:MM:SS format) to minutes
    const convertTimeToMinutes = (timeString: string): number => {
      if (!timeString) return 0;

      // Handle HH:MM:SS format from vehicle report API
      const parts = timeString.split(":");
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 60 + minutes + Math.round(seconds / 60);
      }

      // Fallback for other formats
      const hourMatch = timeString.match(/(\d+)\s*Hours?/i);
      const minMatch = timeString.match(/(\d+)\s*Mins?/i);

      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minMatch ? parseInt(minMatch[1]) : 0;

      return hours * 60 + minutes;
    };

    const fetchIdlingData = async () => {
      if (!limitedVehicles || limitedVehicles.length === 0) return;

      // If we have vehicle report data from props, use it instead of fetching
      if (vehicleReportDataMap && vehicleReportDataMap.size > 0) {
        const processedData: VehicleIdlingData[] = [];

        limitedVehicles.forEach((vehicle) => {
          const vehicleReportData = vehicleReportDataMap.get(vehicle.vId);

          if (vehicleReportData?.list?.[0]) {
            const reportData = vehicleReportData.list[0];

            // Get idle fuel consumed from vehicle report
            const fuelIdleLitres = parseFloat(
              reportData.idle_fuel_consumed || "0"
            );
            const fuelLossRupees = fuelIdleLitres * fuelPrice;

            // Get stoppage time in HH:MM:SS format
            const stoppageTime = reportData.total_stoppage_sec || "00:00:00";
            const idlingMinutes = convertTimeToMinutes(stoppageTime);

            const hasValidData =
              isFinite(fuelIdleLitres) &&
              fuelIdleLitres >= 0 &&
              isFinite(idlingMinutes) &&
              idlingMinutes >= 0;

            processedData.push({
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              idlingMinutes: hasValidData ? idlingMinutes : 0,
              stoppageTime: stoppageTime,
              fuelIdleLitres: hasValidData ? fuelIdleLitres : 0,
              fuelLossRupees: hasValidData ? fuelLossRupees : 0,
              hasValidData,
            });
          } else {
            // No data available for this vehicle
            processedData.push({
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              idlingMinutes: 0,
              stoppageTime: "00:00:00",
              fuelIdleLitres: 0,
              fuelLossRupees: 0,
              hasValidData: false,
            });
          }
        });

        setVehicleData(processedData);
        return;
      }

      // Fallback: fetch data if not provided via props
      setLoading(true);
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const processedData: VehicleIdlingData[] = [];

      try {
        for (const vehicle of limitedVehicles) {
          try {
            const vehicleReportResponse = await getVehicleReport({
              vId: vehicle.vId,
              startdate: startDate,
              enddate: endDate,
              requestfor: parseInt(groupId || "59872"),
              userid: parseInt(userId || "833105"),
            }).unwrap();

            if (vehicleReportResponse?.list?.[0]) {
              const reportData = vehicleReportResponse.list[0];

              // Get idle fuel consumed from vehicle report
              const fuelIdleLitres = parseFloat(
                reportData.idle_fuel_consumed || "0"
              );
              const fuelLossRupees = fuelIdleLitres * fuelPrice;

              // Get stoppage time in HH:MM:SS format
              const stoppageTime = reportData.total_stoppage_sec || "00:00:00";
              const idlingMinutes = convertTimeToMinutes(stoppageTime);

              const hasValidData =
                isFinite(fuelIdleLitres) &&
                fuelIdleLitres >= 0 &&
                isFinite(idlingMinutes) &&
                idlingMinutes >= 0;

              processedData.push({
                vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                idlingMinutes: hasValidData ? idlingMinutes : 0,
                stoppageTime: stoppageTime,
                fuelIdleLitres: hasValidData ? fuelIdleLitres : 0,
                fuelLossRupees: hasValidData ? fuelLossRupees : 0,
                hasValidData,
              });
            } else {
              // No data available for this vehicle
              processedData.push({
                vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                idlingMinutes: 0,
                stoppageTime: "00:00:00",
                fuelIdleLitres: 0,
                fuelLossRupees: 0,
                hasValidData: false,
              });
            }
          } catch (error) {
            console.error(
              `Error fetching data for vehicle ${vehicle.vId}:`,
              error
            );
            processedData.push({
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              idlingMinutes: 0,
              stoppageTime: "00:00:00",
              fuelIdleLitres: 0,
              fuelLossRupees: 0,
              hasValidData: false,
            });
          }
        }

        setVehicleData(processedData);
      } catch (error) {
        console.error("Error fetching idling data:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (limitedVehicles?.length) {
        fetchIdlingData();
      }
    }, [limitedVehicles, dateRange, fuelPrice, vehicleReportDataMap]); // Add vehicleReportDataMap dependency

    // Function to handle fuel price save
    const handleFuelPriceSave = () => {
      setFuelPrice(tempFuelPrice);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
            <p className="font-medium">{`Vehicle: ${label}`}</p>
            <p className="text-blue-600">{`Fuel Idle: ${data.fuelIdleLitres.toFixed(
              2
            )} L`}</p>
            <p className="text-red-600">{`Fuel Loss: ₹${data.fuelLossRupees.toFixed(
              2
            )}`}</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Fuel Consumed (Idle)
          </h2>
        </div>

        {/* Chart Content */}
        <div className="mt-6">
          {/* Legend */}
          <div className="flex justify-center items-center space-x-6 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Fuel Idle (Litres)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-red-500"></div>
              <span className="text-sm">Fuel Loss (Rupees)</span>
            </div>
          </div>

          {/* Interaction Note */}
          <div className="text-center text-gray-500 text-sm mb-6">
            Click On The Bars For More Info
          </div>

          {/* Chart */}
          <div className="h-[400px]">
            {loading || loadingVehicleReport ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={vehicleData} // Show all vehicles including those with zero data
                  margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="vehicleNumber"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, "dataMax"]}
                    type="number"
                    tickFormatter={(value) => value.toFixed(1)}
                    label={{
                      value: "Fuel Idle (Litres)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, "dataMax"]}
                    type="number"
                    tickFormatter={(value) => value.toFixed(0)}
                    label={{
                      value: "Fuel Loss (₹)",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "transparent" }}
                  />

                  {/* Fuel Idle Bars */}
                  <Bar
                    yAxisId="left"
                    dataKey="fuelIdleLitres"
                    name="Fuel Idle"
                    barSize={60}
                    fill="#9DDFC9"
                    style={{ cursor: "default" }}
                  >
                    {vehicleData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#9DDFC9"
                        style={{ cursor: "default" }}
                      />
                    ))}
                  </Bar>

                  {/* Fuel Loss Line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fuelLossRupees"
                    stroke="#F89191"
                    strokeWidth={3}
                    dot={{ fill: "#F89191", strokeWidth: 2, r: 4 }}
                    name="Fuel Loss"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Diesel Loss in Rupees */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Diesel Loss in Rupees
              </h3>
              <p className="text-xl font-bold text-gray-900">
                ₹{" "}
                {vehicleData
                  .reduce((sum, vehicle) => sum + vehicle.fuelLossRupees, 0)
                  .toFixed(2)}
              </p>
            </div>

            {/* Diesel consumed while idling */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Diesel consumed while idling
              </h3>
              <p className="text-xl font-bold text-gray-900">
                {vehicleData
                  .reduce((sum, vehicle) => sum + vehicle.fuelIdleLitres, 0)
                  .toFixed(2)}{" "}
                L
              </p>
            </div>

            {/* Fuel Prices */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                  <span className="text-white text-xs">i</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">
                  Fuel Prices
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Diesel:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">₹</span>
                    <input
                      type="number"
                      value={tempFuelPrice}
                      onChange={(e) => setTempFuelPrice(Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-500">/L</span>
                  </div>
                </div>
                <button
                  onClick={handleFuelPriceSave}
                  className="w-full bg-[#478c83] hover:bg-[#478c83be] text-white py-1.5 px-3 rounded-md transition-colors text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default IdlingReport;
IdlingReport.displayName = "IdlingReport";
