"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button, DatePicker, Select, Table } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetVehicleReportQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface VehicleIdleTimeData {
  vehicleNumber: string;
  idleTimeHours: number;
  runningTimeHours: number;
  stoppageTimeHours: number;
  idlePercentage: number;
  fuelLoss: number;
}

const View = () => {
  const yesterday = dayjs().subtract(1, "day");
  const sevenDaysAgo = dayjs().subtract(8, "days");

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    sevenDaysAgo.startOf("day"),
    yesterday.endOf("day"),
  ]);
  const [committedDateRange, setCommittedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs]
  >([sevenDaysAgo.startOf("day"), yesterday.endOf("day")]);
  const [selectedVehicles, setSelectedVehicles] = useState<any[]>([]);
  const [vehicleData, setVehicleData] = useState<VehicleIdleTimeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fuelPrice, setFuelPrice] = useState<number>(90);

  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth
  ) || {
    userId: "833105",
    groupId: "59872",
    parentUser: "1",
  };

  // Fetch vehicles
  const { data: vehiclesData } = useGetVehiclesByStatusQuery({
    token: groupId?.toString() || "59872",
    userId: userId?.toString() || "833105",
    pUserId: parentUser?.toString() || "1",
    mode: "",
  });

  const allVehicles = vehiclesData?.list || [];

  // Filter OBD vehicles (with fuel data <= 100)
  const allowedVehicles = useMemo(() => {
    return allVehicles.filter((vehicle: any) => {
      return vehicle.gpsDtl?.fuel && vehicle.gpsDtl.fuel <= 100;
    });
  }, [allVehicles]);

  // Initialize with first 5 vehicles
  useEffect(() => {
    if (allowedVehicles.length > 0 && selectedVehicles.length === 0) {
      const initialSelected = allowedVehicles.slice(0, 10);
      setSelectedVehicles(initialSelected);
    }
  }, [allowedVehicles, selectedVehicles.length]);

  const [getVehicleReport] = useLazyGetVehicleReportQuery();

  // Convert time string to hours
  const convertTimeToHours = (timeString: string): number => {
    if (!timeString) return 0;
    const parts = timeString.split(":");
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours + minutes / 60 + seconds / 3600;
    }
    return 0;
  };

  // Calculate total hours in selected date range
  const calculateTotalHours = () => {
    const diffInDays =
      committedDateRange[1].diff(committedDateRange[0], "day") + 1;
    return diffInDays * 24;
  };

  // Fetch idle time data
  const fetchIdleTimeData = async () => {
    if (selectedVehicles.length === 0) return;

    setLoading(true);
    const startDate = committedDateRange[0].format("YYYY-MM-DD");
    const endDate = committedDateRange[1].format("YYYY-MM-DD");
    const totalHours = calculateTotalHours();
    const processedData: VehicleIdleTimeData[] = [];

    try {
      for (const vehicle of selectedVehicles) {
        try {
          const response = await getVehicleReport({
            vId: vehicle.vId,
            startdate: startDate,
            enddate: endDate,
            requestfor: parseInt(groupId?.toString() || "59872"),
            userid: parseInt(userId?.toString() || "833105"),
          }).unwrap();

          if (response?.list?.[0]) {
            const reportData = response.list[0] as any;
            const runningTime = reportData.total_running_sec || "00:00:00";
            const stoppageTime = reportData.total_stoppage_sec || "00:00:00";
            const fuelLossData = reportData.idle_fuel_consumed || 0;

            const runningTimeHours = convertTimeToHours(runningTime);
            const stoppageTimeHours = convertTimeToHours(stoppageTime);
            const idleTimeHours = stoppageTimeHours;
            const idlePercentage =
              totalHours > 0 ? (idleTimeHours / totalHours) * 100 : 0;

            processedData.push({
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              idleTimeHours: Math.max(0, idleTimeHours),
              runningTimeHours,
              stoppageTimeHours,
              idlePercentage: Math.max(0, idlePercentage),
              fuelLoss: Number(fuelLossData) || 0,
            });
          } else {
            processedData.push({
              vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
              idleTimeHours: 0,
              runningTimeHours: 0,
              stoppageTimeHours: 0,
              idlePercentage: 0,
              fuelLoss: 0,
            });
          }
        } catch (error) {
          console.error(
            `Error fetching data for vehicle ${vehicle.vId}:`,
            error
          );
          // Add vehicle with no data on error
          processedData.push({
            vehicleNumber: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
            idleTimeHours: 0,
            runningTimeHours: 0,
            stoppageTimeHours: 0,
            idlePercentage: 0,
            fuelLoss: 0,
          });
        }
      }
      setVehicleData(processedData);
    } catch (error) {
      console.error("Error fetching idle time data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSet = () => {
    setCommittedDateRange(dateRange);
  };

  useEffect(() => {
    fetchIdleTimeData();
  }, [committedDateRange, selectedVehicles]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{`Vehicle: ${label}`}</p>
          <p className="text-blue-600">{`Idle Time: ${data.idleTimeHours.toFixed(
            2
          )} hrs`}</p>
          <p className="text-red-600">{`Idle Fuel Consumed: ${data.fuelLoss.toFixed(
            2
          )} Lts`}</p>
        </div>
      );
    }
    return null;
  };

  const totalIdleTime = vehicleData.reduce(
    (sum, v) => sum + v.idleTimeHours,
    0
  );
  const totalFuelLoss = vehicleData.reduce((sum, v) => sum + v.fuelLoss, 0);
  const avgIdlePercentage =
    vehicleData.length > 0
      ? vehicleData.reduce((sum, v) => sum + v.idlePercentage, 0) /
        vehicleData.length
      : 0;

  return (
    <div className="p-5 bg-white min-h-full overflow-y-auto mb-10">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Vehicle Idle Time Trends
        </h1>
      </div>

      {/* Date Picker Section */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center space-x-4 flex-wrap gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600 mb-1">From</span>
            <DatePicker
              value={dateRange[0]}
              onChange={(date) => {
                if (date) setDateRange([date, dateRange[1]]);
              }}
              format="DD MMM, YYYY"
              style={{ width: 140 }}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600 mb-1">To</span>
            <DatePicker
              value={dateRange[1]}
              onChange={(date) => {
                if (date) setDateRange([dateRange[0], date]);
              }}
              format="DD MMM, YYYY"
              style={{ width: 140 }}
            />
          </div>

          <div className="flex flex-col justify-end">
            <Button
              type="primary"
              onClick={handleSet}
              className="bg-green-600 hover:bg-green-700 border-green-600 mt-6"
            >
              Set
            </Button>
          </div>
        </div>
      </div>

      {/* Vehicle Selection Section */}
      <div className="mb-6 bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Select Vehicles
        </h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {selectedVehicles.map((vehicle) => (
            <div
              key={vehicle.vId}
              className="flex items-center text-[#478c83] p-2 rounded-lg border border-[#478c83]"
            >
              <span className="font-semibold mr-2">
                {vehicle.vehReg || `Vehicle ${vehicle.vId}`}
              </span>
              <button
                onClick={() => {
                  setSelectedVehicles(
                    selectedVehicles.filter((v) => v.vId !== vehicle.vId)
                  );
                }}
                className="text-rose-600 hover:text-white hover:bg-[#478c8369] rounded-full p-1 transition-colors"
                title="Remove vehicle"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {selectedVehicles.length < allowedVehicles.length && (
          <div className="mb-4">
            <Select
              placeholder="Select a vehicle to add"
              style={{ width: 200 }}
              value={null}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(vehicleId: string) => {
                const vehicle = allowedVehicles.find(
                  (v: any) => v.vId === parseInt(vehicleId)
                );
                if (
                  vehicle &&
                  !selectedVehicles.some((v) => v.vId === vehicle.vId)
                ) {
                  setSelectedVehicles([...selectedVehicles, vehicle]);
                }
              }}
              options={allowedVehicles
                .filter(
                  (vehicle: any) =>
                    !selectedVehicles.some((v) => v.vId === vehicle.vId)
                )
                .map((vehicle: any) => ({
                  value: vehicle.vId.toString(),
                  label: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                }))}
            />
          </div>
        )}

        <p className="text-sm text-gray-600">
          Showing {selectedVehicles.length} of {allowedVehicles.length}{" "}
          available vehicles
        </p>
      </div>

      {/* Chart Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Idle Time Chart
        </h2>

        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#478c83] rounded"></div>
            <span className="text-sm">Idle Time (Hours)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#f5576c] rounded"></div>
            <span className="text-sm">Idle Fuel Consumed (Lts)</span>
          </div>
        </div>

        <div className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : vehicleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vehicleData}
                margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                barCategoryGap="30%"
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
                  domain={[0, "dataMax"]}
                  tickFormatter={(value) => value.toFixed(1)}
                  label={{
                    value: "Idle Time (Hours) / Fuel (Lts)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                />
                <Bar dataKey="idleTimeHours" name="Idle Time" fill="#478c83" />
                <Bar dataKey="fuelLoss" name="Idle Fuel" fill="#f5576c" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Fuel Loss and Fuel Price Section */}
        <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          {/* Left side - Statistics */}
          <div className="flex gap-8 flex-wrap flex-1">
            {/* Total Idling Duration */}
            <div className="bg-gray-50 rounded-lg p-6 flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-2">
                Total Idling Duration
              </p>
              <p className="text-3xl font-semibold text-gray-900">
                {Math.round(totalIdleTime * 60)} min
              </p>
            </div>

            {/* Fuel Loss in Rupees */}
            <div className="bg-gray-50 rounded-lg p-6 flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-2">
                Fuel Loss in Rupees ({fuelPrice} Rs/L)
              </p>
              <p className="text-3xl font-semibold text-gray-900">
                ₹ {(totalFuelLoss * fuelPrice).toFixed(2)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-2">
                Fuel consumed while idling
              </p>
              <p className="text-3xl font-semibold text-gray-900">
                {totalFuelLoss.toFixed(2)} L
              </p>
            </div>
          </div>

          <div className="rounded-lg p-6 min-w-[280px]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Fuel Prices
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20">
                  Fuel
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">₹</span>
                  <input
                    type="number"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">/ L</span>
                </div>
              </div>
              <button
                onClick={() => {
                  // Save functionality - you can add localStorage or API call here
                  localStorage.setItem("fuelPrice", fuelPrice.toString());
                }}
                className="w-full bg-primary-green text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Data Table */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Vehicle Details
          </h2>
          <Table
            dataSource={vehicleData}
            rowKey="vehicleNumber"
            pagination={false}
            columns={[
              {
                title: "Vehicle Number",
                dataIndex: "vehicleNumber",
                key: "vehicleNumber",
                render: (text) => <span className="font-medium">{text}</span>,
              },
              {
                title: "Idle Fuel Consumed (Lts)",
                dataIndex: "fuelLoss",
                key: "fuelLoss",
                render: (value) => <span>{value.toFixed(2)}</span>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default View;
