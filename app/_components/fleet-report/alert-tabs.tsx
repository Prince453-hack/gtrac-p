"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, Card, Spin, Alert, Badge } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useLazyGetAlertsByDateQuery } from "@/app/_globalRedux/services/trackingDashboard";
import IdlingReport from "../fleet-performance/idling-report";

const { TabPane } = Tabs;

interface AlertTabsProps {
  selectedVehicles: any[];
  dateRange: [string, string];
  vehicleReportDataMap: Map<number, any>;
}

interface ChartData {
  vehicleNumber: string;
  count: number;
}

interface AlertCounts {
  idling: number;
  overspeed: number;
  harshBreaking: number;
  harshAcceleration: number;
  freeRunning: number;
}

interface AlertDataState {
  data: any[];
  loading: boolean;
  error: string | null;
}

const AlertTabs: React.FC<AlertTabsProps> = ({
  selectedVehicles,
  dateRange,
  vehicleReportDataMap,
}) => {
  const [activeTab, setActiveTab] = useState("idling");

  // Alert data state management
  const [overspeedData, setOverspeedData] = useState<AlertDataState>({
    data: [],
    loading: false,
    error: null,
  });
  const [harshBrakingData, setHarshBrakingData] = useState<AlertDataState>({
    data: [],
    loading: false,
    error: null,
  });
  const [harshAccelerationData, setHarshAccelerationData] =
    useState<AlertDataState>({
      data: [],
      loading: false,
      error: null,
    });
  const [freewheelingData, setFreewheelingData] = useState<AlertDataState>({
    data: [],
    loading: false,
    error: null,
  });

  // Get auth data from Redux
  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  ) || {
    userId: "833105",
    groupId: "59872",
    parentUser: "1",
  };

  // Lazy query hook for fetching alerts
  const [fetchAlerts] = useLazyGetAlertsByDateQuery();

  // Function to fetch alert data for a specific alert type
  const fetchAlertData = async (
    alertType: string,
    setState: React.Dispatch<React.SetStateAction<AlertDataState>>,
  ) => {
    if (selectedVehicles.length === 0) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Get all vehicles data (vehId: 0) - this approach works and gives us the data
      const result = await fetchAlerts({
        userId: userId?.toString() || "833105",
        token: groupId?.toString() || "59872",
        alertType: alertType,
        startDateTime: dateRange[0],
        endDateTime: dateRange[1],
        vehReg: "",
        vehId: 0,
      }).unwrap();

      setState({ data: result.list || [], loading: false, error: null });
    } catch (error: any) {
      console.error(`Error fetching ${alertType} alerts:`, error);
      setState({
        data: [],
        loading: false,
        error: error.message || "Failed to fetch data",
      });
    }
  };

  // Fetch all alert types when dependencies change
  useEffect(() => {
    if (selectedVehicles.length > 0 && dateRange[0] && dateRange[1]) {
      fetchAlertData("OverSpeed", setOverspeedData);
      fetchAlertData("harshBreaking", setHarshBrakingData);
      fetchAlertData("harshAcceleration", setHarshAccelerationData);
      fetchAlertData("Freewheeling", setFreewheelingData);
    }
  }, [selectedVehicles, dateRange, userId, groupId]);

  // Process data for charts and counts using alert API data
  const processedData = useMemo(() => {
    const counts = {
      idling: 0,
      overspeed: 0,
      harshBreaking: 0,
      harshAcceleration: 0,
      freeRunning: 0,
    };

    // Initialize all selected vehicles with 0 counts
    const allVehicles: { [key: string]: any } = {};
    selectedVehicles.forEach((vehicle) => {
      const vehicleNo =
        vehicle.vehReg ||
        vehicle.vehicle_registration ||
        `Vehicle ${vehicle.vId || vehicle.vehicle_id}`;
      allVehicles[vehicleNo] = {
        overspeed: 0,
        harshBreaking: 0,
        harshAcceleration: 0,
        freeRunning: 0,
        vId: vehicle.vId || vehicle.vehicle_id,
      };
    });

    // Helper function to process alert data and count alerts per vehicle
    const processAlertData = (alertData: any[], alertType: string) => {
      let totalCount = 0;

      // The API returns data in a specific format where alertData[0] contains all alert types
      if (alertData.length > 0 && alertData[0][alertType]) {
        const alertEvents = alertData[0][alertType];

        const vehicleAlertCounts: { [key: string]: number } = {};

        // Process each alert event
        alertEvents.forEach((alertEvent: any) => {
          const vehicleNo = alertEvent.vehicle_no;

          // Find matching vehicle in our selected vehicles
          const matchingVehicle = selectedVehicles.find(
            (v) =>
              v.vehReg === vehicleNo ||
              v.vehicle_registration === vehicleNo ||
              v.vehReg?.replace(/\s/g, "") === vehicleNo?.replace(/\s/g, ""), // Remove spaces for comparison
          );

          if (matchingVehicle) {
            const vehicleDisplayName =
              matchingVehicle.vehReg ||
              matchingVehicle.vehicle_registration ||
              `Vehicle ${matchingVehicle.vId || matchingVehicle.vehicle_id}`;

            // Count alerts per vehicle
            if (!vehicleAlertCounts[vehicleDisplayName]) {
              vehicleAlertCounts[vehicleDisplayName] = 0;
            }
            vehicleAlertCounts[vehicleDisplayName]++;
            totalCount++;
          }
        });

        // Update allVehicles with the counts
        Object.entries(vehicleAlertCounts).forEach(
          ([vehicleDisplayName, count]) => {
            if (allVehicles[vehicleDisplayName]) {
              allVehicles[vehicleDisplayName][alertType] = count;
            }
          },
        );
      }
      // Check if alertData has vehicle info already attached (from individual calls)
      else if (alertData.length > 0 && alertData[0]._vehicleInfo) {
        alertData.forEach((vehicleAlerts) => {
          const vehicle = vehicleAlerts._vehicleInfo;
          const vehicleDisplayName =
            vehicle.vehReg ||
            vehicle.vehicle_registration ||
            `Vehicle ${vehicle.vId || vehicle.vehicle_id}`;

          // Get alert count based on the alert field
          let alertCount = 0;
          const alertArray = vehicleAlerts[alertType];

          if (Array.isArray(alertArray)) {
            alertCount = alertArray.length;
          }

          if (allVehicles[vehicleDisplayName]) {
            allVehicles[vehicleDisplayName][alertType] = alertCount;
          }

          totalCount += alertCount;
        });
      }
      // Legacy: Check if alertData is an array of vehicle alert objects
      else if (
        alertData.length > 0 &&
        (alertData[0].sys_service_id || alertData[0].lorry_no)
      ) {
        alertData.forEach((vehicleAlerts) => {
          const vehicleId = vehicleAlerts.sys_service_id;
          const vehicleNo = vehicleAlerts.lorry_no;

          // Find matching vehicle in our selected vehicles
          const matchingVehicle = selectedVehicles.find(
            (v) =>
              v.vId === vehicleId ||
              v.vehReg === vehicleNo ||
              v.vehReg === vehicleNo.toString(),
          );

          if (matchingVehicle) {
            const vehicleDisplayName =
              matchingVehicle.vehReg ||
              matchingVehicle.vehicle_registration ||
              `Vehicle ${matchingVehicle.vId || matchingVehicle.vehicle_id}`;

            // Get alert count based on the alert field
            let alertCount = 0;
            const alertArray = vehicleAlerts[alertType];

            if (Array.isArray(alertArray)) {
              alertCount = alertArray.length;
            }

            if (allVehicles[vehicleDisplayName]) {
              allVehicles[vehicleDisplayName][alertType] = alertCount;
            }

            totalCount += alertCount;
          }
        });
      }

      return totalCount;
    };

    // Process each alert type
    counts.overspeed = processAlertData(overspeedData.data, "overspeed");
    counts.harshBreaking = processAlertData(
      harshBrakingData.data,
      "harshBreak",
    );
    counts.harshAcceleration = processAlertData(
      harshAccelerationData.data,
      "harshacc",
    );
    counts.freeRunning = processAlertData(
      freewheelingData.data,
      "freewheeling",
    );

    // Keep idling count from vehicle report data for compatibility
    if (vehicleReportDataMap && vehicleReportDataMap.size > 0) {
      selectedVehicles.forEach((vehicle) => {
        const vehicleReportData = vehicleReportDataMap.get(vehicle.vId);
        if (vehicleReportData?.list?.[0]) {
          const reportData = vehicleReportData.list[0];
          // Idling is still handled by IdlingReport component, so we don't need to process it here
        }
      });
    }

    // Convert to chart data format - INCLUDE ALL SELECTED VEHICLES
    const createChartData = (alertField: string): ChartData[] => {
      return Object.entries(allVehicles)
        .map(([vehicleNo, alerts]) => ({
          vehicleNumber: vehicleNo,
          count: alerts[alertField] || 0,
        }))
        .sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber)); // Sort alphabetically
    };

    return {
      counts,
      chartData: {
        overspeed: createChartData("overspeed"),
        harshBreaking: createChartData("harshBreak"),
        harshAcceleration: createChartData("harshacc"),
        freeRunning: createChartData("freewheeling"),
      },
      loading: {
        overspeed: overspeedData.loading,
        harshBreaking: harshBrakingData.loading,
        harshAcceleration: harshAccelerationData.loading,
        freeRunning: freewheelingData.loading,
      },
      errors: {
        overspeed: overspeedData.error,
        harshBreaking: harshBrakingData.error,
        harshAcceleration: harshAccelerationData.error,
        freeRunning: freewheelingData.error,
      },
    };
  }, [
    selectedVehicles,
    vehicleReportDataMap,
    overspeedData,
    harshBrakingData,
    harshAccelerationData,
    freewheelingData,
  ]);

  const renderBarChart = (
    data: ChartData[],
    title: string,
    color: string,
    loading: boolean,
    error: string | null,
  ) => {
    return (
      <div className="w-full">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-xs text-gray-600">
            {dayjs(dateRange[0]).format("MMM DD, YYYY")} to{" "}
            {dayjs(dateRange[1]).format("MMM DD, YYYY")}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" />
            <span className="ml-3 text-gray-600">
              Loading {title.toLowerCase()} data...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Alert
              message="Error Loading Data"
              description={`Failed to load ${title.toLowerCase()} data: ${error}`}
              type="error"
              showIcon
            />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-base">
              No {title.toLowerCase()} alerts found for the selected period
            </div>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 40,
                  right: 30,
                  left: 40,
                  bottom: 60,
                }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="vehicleNumber"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12, fill: "#666" }}
                  stroke="#666"
                />
                <YAxis
                  label={{
                    value: `${title} Count`,
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "#666",
                      fontSize: "14px",
                    },
                  }}
                  tick={{ fontSize: 12, fill: "#666" }}
                  stroke="#666"
                />
                <Tooltip
                  formatter={(value: any) => [value, `${title} Count`]}
                  labelFormatter={(label: string) => `Vehicle: ${label}`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={color}
                  name={`${title} Count`}
                  radius={[4, 4, 0, 0]}
                  stroke={color}
                  strokeWidth={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const tabItems = [
    {
      key: "idling",
      label: (
        <div className="flex items-center gap-2">
          <span>Fuel Consumed (Idle)</span>
          <Badge count={processedData.counts.idling} size="small" />
        </div>
      ),
      content: (
        <IdlingReport
          limitedVehicles={selectedVehicles}
          dateRange={[dayjs(dateRange[0]), dayjs(dateRange[1])] as any}
          vehicleReportDataMap={vehicleReportDataMap}
        />
      ),
    },
    {
      key: "overspeed",
      label: (
        <div className="flex items-center gap-2">
          <span>Over Speeding</span>
          <Badge count={processedData.counts.overspeed} size="small" />
        </div>
      ),
      content: renderBarChart(
        processedData.chartData.overspeed,
        "Over Speeding",
        "#FF6E64",
        processedData.loading.overspeed,
        processedData.errors.overspeed,
      ),
    },
    {
      key: "harshBreaking",
      label: (
        <div className="flex items-center gap-2">
          <span>Harsh Braking</span>
          <Badge count={processedData.counts.harshBreaking} size="small" />
        </div>
      ),
      content: renderBarChart(
        processedData.chartData.harshBreaking,
        "Harsh Braking",
        "#D6D0FD",
        processedData.loading.harshBreaking,
        processedData.errors.harshBreaking,
      ),
    },
    {
      key: "harshAcceleration",
      label: (
        <div className="flex items-center gap-2">
          <span>Harsh Acceleration</span>
          <Badge count={processedData.counts.harshAcceleration} size="small" />
        </div>
      ),
      content: renderBarChart(
        processedData.chartData.harshAcceleration,
        "Harsh Acceleration",
        "#d97706",
        processedData.loading.harshAcceleration,
        processedData.errors.harshAcceleration,
      ),
    },
    {
      key: "freeRunning",
      label: (
        <div className="flex items-center gap-2">
          <span>Free Wheeling</span>
          <Badge count={processedData.counts.freeRunning} size="small" />
        </div>
      ),
      content: renderBarChart(
        processedData.chartData.freeRunning,
        "Free Wheeling",
        "#0891b2",
        processedData.loading.freeRunning,
        processedData.errors.freeRunning,
      ),
    },
  ];

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="middle"
          className="alert-tabs"
          tabBarStyle={{
            borderBottom: "2px solid #f0f0f0",
            marginBottom: "8px",
          }}
        >
          {tabItems.map((tab) => (
            <TabPane tab={tab.label} key={tab.key}>
              <div className="bg-gray-50 rounded-lg p-2">{tab.content}</div>
            </TabPane>
          ))}
        </Tabs>
      </div>

      <style jsx global>{`
        .alert-tabs .ant-tabs-tab {
          padding: 4px 10px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          border-radius: 6px 6px 0 0 !important;
          margin-right: 2px !important;
          background: linear-gradient(
            135deg,
            #f8fafc 0%,
            #e2e8f0 100%
          ) !important;
          border: 2px solid #e2e8f0 !important;
          transition: all 0.3s ease !important;
        }

        .alert-tabs .ant-tabs-tab-active {
          background: #67c090 !important;
          color: white !important;
          border-color: #fff !important;
          transform: translateY(-2px) !important;
        }

        .alert-tabs .ant-tabs-tab-active span {
          color: white !important;
        }

        .alert-tabs .ant-tabs-tab-active .ant-badge {
          color: white !important;
        }

        .alert-tabs .ant-tabs-tab-active .ant-badge .ant-badge-count {
          background: #f59e0b !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          min-width: 16px !important;
          height: 16px !important;
          line-height: 16px !important;
          border-radius: 8px !important;
          font-size: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }

        .alert-tabs .ant-tabs-content-holder {
          padding-top: 0 !important;
        }

        .alert-tabs .ant-tabs-tab .ant-badge-count {
          background: #f59e0b !important;
          color: white !important;
          font-weight: bold !important;
          min-width: 16px !important;
          height: 16px !important;
          line-height: 16px !important;
          border-radius: 8px !important;
          font-size: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3) !important;
        }

        .recharts-cartesian-axis-tick-value {
          font-size: 12px !important;
          font-weight: 500 !important;
        }

        .recharts-tooltip-wrapper {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
};

export default React.memo(AlertTabs);
