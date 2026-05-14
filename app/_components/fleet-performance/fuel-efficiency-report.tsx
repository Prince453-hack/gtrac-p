"use client";

import { useLazyGetVehicleReportQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { Tabs } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FuelEfficiencyReportProps {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  limitedVehicles: any[];
  userId: string;
  groupId: string;
  vehicleReportDataMap?: Map<number, any>;
  loadingVehicleReport?: boolean;
}

const FuelEfficiencyReport: React.FC<FuelEfficiencyReportProps> = React.memo(
  ({
    dateRange,
    limitedVehicles,
    userId,
    groupId,
    vehicleReportDataMap,
    loadingVehicleReport,
  }) => {
    const [activeTab, setActiveTab] = useState("chart");
    const [vehicleData, setVehicleData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [getVehicleReport] = useLazyGetVehicleReportQuery();

    // Fetch fuel efficiency data for all vehicles
    const fetchFuelEfficiencyData = async () => {
      if (!limitedVehicles || limitedVehicles.length === 0) return;

      // If we have vehicle report data from props, use it instead of fetching
      if (vehicleReportDataMap && vehicleReportDataMap.size > 0) {
        const processedData = limitedVehicles.map((vehicle: any) => {
          const vehicleReportData = vehicleReportDataMap.get(vehicle.vId);

          if (vehicleReportData?.list?.[0]) {
            const reportData = vehicleReportData.list[0];

            const fuelEfficiency = reportData.avg_mileage
              ? parseFloat(reportData.avg_mileage.toString())
              : 0;

            const totalKm = reportData.total_km
              ? parseFloat(reportData.total_km.toString())
              : 0;

            const fuelConsumed = reportData.total_fuel_consumed
              ? parseFloat(reportData.total_fuel_consumed.toString())
              : 0;

            // Filter out invalid values like Infinity, NaN, or negative values
            const validFuelEfficiency =
              isFinite(fuelEfficiency) && fuelEfficiency >= 0
                ? fuelEfficiency
                : 0;

            const averageEfficiency = 2.73;

            return {
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              fuelEfficiency: validFuelEfficiency,
              distance: `${totalKm} KM`,
              fuelConsumed: fuelConsumed,
              isAboveAverage: validFuelEfficiency >= averageEfficiency,
              distanceKm: totalKm,
              hasValidData:
                validFuelEfficiency > 0 && isFinite(validFuelEfficiency),
            };
          } else {
            // No data available for this vehicle
            return {
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              fuelEfficiency: 0,
              distance: "0 KM",
              fuelConsumed: 0,
              isAboveAverage: false,
              distanceKm: 0,
              hasValidData: false,
            };
          }
        });

        setVehicleData(processedData);
        return;
      }

      // Fallback: fetch data if not provided via props
      setLoading(true);
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      try {
        const promises = limitedVehicles.map(async (vehicle: any) => {
          try {
            const response = await getVehicleReport({
              vId: vehicle.vId,
              startdate: startDate,
              enddate: endDate,
              requestfor: parseInt(groupId || "59872"),
              userid: parseInt(userId || "833105"),
            }).unwrap();

            if (response?.list?.[0]) {
              const reportData = response.list[0];

              const fuelEfficiency = reportData.avg_mileage
                ? parseFloat(reportData.avg_mileage.toString())
                : 0;

              const totalKm = reportData.total_km
                ? parseFloat(reportData.total_km.toString())
                : 0;

              const fuelConsumed = reportData.total_fuel_consumed
                ? parseFloat(reportData.total_fuel_consumed.toString())
                : 0;

              // Filter out invalid values like Infinity, NaN, or negative values
              const validFuelEfficiency =
                isFinite(fuelEfficiency) && fuelEfficiency >= 0
                  ? fuelEfficiency
                  : 0;

              const averageEfficiency = 2.73; // Based on your chart

              return {
                vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                fuelEfficiency: validFuelEfficiency,
                distance: `${totalKm} KM`,
                fuelConsumed: fuelConsumed,
                isAboveAverage: validFuelEfficiency >= averageEfficiency,
                distanceKm: totalKm,
                hasValidData:
                  validFuelEfficiency > 0 && isFinite(validFuelEfficiency),
              };
            } else {
              // No data in response
              return {
                vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                fuelEfficiency: 0,
                distance: "0 KM",
                fuelConsumed: 0,
                isAboveAverage: false,
                distanceKm: 0,
                hasValidData: false,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching data for vehicle ${vehicle.vId}:`,
              error
            );
            return {
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              fuelEfficiency: 0,
              distance: "0 KM",
              fuelConsumed: 0,
              isAboveAverage: false,
              distanceKm: 0,
              hasValidData: false,
            };
          }
        });

        const results = await Promise.all(promises);
        setVehicleData(results);
      } catch (error) {
        console.error("Error fetching fuel efficiency data:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (limitedVehicles.length > 0) {
        fetchFuelEfficiencyData();
      }
    }, [limitedVehicles, dateRange, vehicleReportDataMap]);

    // Custom bar component for dynamic colors
    const CustomBar = (props: any) => {
      const { payload, ...rest } = props;
      const color = payload.isAboveAverage ? "#9DDFC9" : "#F89191";
      return <Bar {...rest} fill={color} />;
    };
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
            <p className="font-medium">{`Vehicle: ${label}`}</p>
            <p className="text-[#6fd1b0]">{`Fuel Efficiency: ${data.fuelEfficiency} km/L`}</p>
            <p className="text-[#e3893b]">{`Distance: ${data.distanceKm} km`}</p>
            <p className="text-[#dc6161]">{`Fuel Consumed: ${data.fuelConsumed}L`}</p>
          </div>
        );
      }
      return null;
    };

    const tabItems = [
      {
        key: "chart",
        label: "Chart",
        children: (
          <div className="mt-6">
            {/* Date Range Display */}
            <div className="text-right text-sm text-gray-500 mb-4">
              {dateRange[0].format("MMM Do YYYY, h:mm:ss A")} To{" "}
              {dateRange[1].format("MMM Do YYYY, h:mm:ss A")}
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span className="text-sm">Fuel Efficiency (Above Avg.)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span className="text-sm">Fuel Efficiency (Below Avg.)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-orange-400"></div>
                <span className="text-sm">Distance</span>
              </div>
            </div>

            {/* Interaction Note */}
            <div className="text-center text-gray-500 text-sm mb-6">
              Click On The Bars For More Info
            </div>

            {/* Chart */}
            <div className="h-[500px]">
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
                      domain={[0, 7]}
                      type="number"
                      tickCount={8}
                      label={{
                        value: "Fuel Efficiency (km/L)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 3500]}
                      type="number"
                      tickCount={8}
                      label={{
                        value: "Distance (km)",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* Reference line for average efficiency */}
                    <ReferenceLine
                      yAxisId="left"
                      y={2.73}
                      stroke="#666"
                      strokeDasharray="5 5"
                      label={{ value: "2.73", position: "topLeft" as any }}
                    />

                    {/* Fuel Efficiency Bars */}
                    <Bar
                      yAxisId="left"
                      dataKey="fuelEfficiency"
                      name="Fuel Efficiency"
                      barSize={60}
                      fill="#9DDFC9"
                    >
                      {vehicleData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isAboveAverage ? "#9DDFC9" : "#FC8181"}
                        />
                      ))}
                    </Bar>

                    {/* Distance Line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="distanceKm"
                      stroke="#FFA14E  "
                      strokeWidth={3}
                      dot={{ fill: "#FFA14E  ", strokeWidth: 2, r: 4 }}
                      name="Distance"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "table",
        label: "Table",
        children: (
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">
                      Vehicle Number
                    </th>
                    <th className="border border-gray-300 p-3 text-left">
                      Fuel Efficiency (km/L)
                    </th>
                    <th className="border border-gray-300 p-3 text-left">
                      Total Distance
                    </th>
                    <th className="border border-gray-300 p-3 text-left">
                      Fuel Consumed (L)
                    </th>
                    <th className="border border-gray-300 p-3 text-left">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading || loadingVehicleReport ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : (
                    vehicleData.map((vehicle, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3">
                          {vehicle.vehicleNumber}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {vehicle.fuelEfficiency.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {vehicle.distance}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {vehicle.fuelConsumed}
                        </td>
                        <td className="border border-gray-300 p-3">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              vehicle.isAboveAverage
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vehicle.isAboveAverage
                              ? "Above Average"
                              : "Below Average"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
    ];

    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-medium text-gray-900">
            Fuel Efficiency Report
          </h2>
        </div>

        {/* Tabs */}
        <div className="p-4">
          <Tabs
            defaultActiveKey="chart"
            items={tabItems}
            onChange={setActiveTab}
            className="fuel-efficiency-tabs"
          />
        </div>

        <style jsx>{`
          .fuel-efficiency-tabs .ant-tabs-tab {
            padding: 8px 16px;
            margin-right: 8px;
          }
          .fuel-efficiency-tabs .ant-tabs-tab-active {
            background-color: #f3f4f6;
            border-radius: 6px 6px 0 0;
          }
        `}</style>
      </div>
    );
  }
);

export default FuelEfficiencyReport;
FuelEfficiencyReport.displayName = "FuelEfficiencyReport";
