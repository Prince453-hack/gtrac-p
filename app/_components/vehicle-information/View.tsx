"use client";

import { useLazyGetRawGearDataByVehicleAndDateQuery } from "@/app/_globalRedux/services/gearDetails";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetAlertsByDateQuery,
  useLazyGetVehicleReportQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { Button, Select, Spin } from "antd";
import moment from "moment";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CustomDatePicker from "../common/datePicker";

const { Option } = Select;

const View = () => {
  const {
    groupId: token,
    userId,
    parentUser,
  } = useSelector((state: RootState) => state.auth);
  const recentlyClickedVehicles = useSelector(
    (state: RootState) => state.recentlyClickedVehicles,
  );

  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [isVehicleChanging, setIsVehicleChanging] = useState<boolean>(false);
  const [isGearDataLoading, setIsGearDataLoading] = useState<boolean>(false);
  const [vehicleReportData, setVehicleReportData] = useState<any>(null);
  const [loadingTimeoutIds, setLoadingTimeoutIds] = useState<NodeJS.Timeout[]>(
    [],
  );

  // Alert data state management
  const [overspeedData, setOverspeedData] = useState({
    data: [],
    loading: false,
    error: null,
  });
  const [harshBrakingData, setHarshBrakingData] = useState({
    data: [],
    loading: false,
    error: null,
  });
  const [harshAccelerationData, setHarshAccelerationData] = useState({
    data: [],
    loading: false,
    error: null,
  });
  const [freewheelingData, setFreewheelingData] = useState({
    data: [],
    loading: false,
    error: null,
  });
  const yesterday = moment().subtract(1, "day");
  const sevenDaysAgoFromYesterday = moment().subtract(8, "days");
  const [dateRange, setDateRange] = useState<Date[]>([
    sevenDaysAgoFromYesterday.clone().startOf("day").toDate(),
    yesterday.clone().endOf("day").toDate(),
  ]);

  // Fetch vehicles using mob API
  const {
    data: vehiclesData,
    isLoading: isVehiclesLoading,
    error,
  } = useGetVehiclesByStatusQuery({
    token: token?.toString() || "59872",
    userId: userId?.toString() || "833105",
    pUserId: parentUser?.toString() || "1",
    mode: "",
  });

  // Dynamic filtering function for vehicles with fuel condition
  const allowedVehicles = useMemo(() => {
    return (vehiclesData?.list || []).filter((vehicle: any) => {
      return vehicle.gpsDtl.fuel && vehicle.gpsDtl.fuel <= 100;
    });
  }, [vehiclesData?.list]);

  const vehicles = useMemo(() => {
    return allowedVehicles.map((vehicle: any) => ({
      id: vehicle.vId,
      veh_reg: vehicle.vehReg,
    }));
  }, [allowedVehicles]);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      const lastClickedVehicle = recentlyClickedVehicles.vehicles.find(
        (recentVehicle) =>
          vehicles.some(
            (allowedVehicle) => allowedVehicle.veh_reg === recentVehicle.vehReg,
          ),
      );

      if (lastClickedVehicle) {
        const matchedVehicle = vehicles.find(
          (v) => v.veh_reg === lastClickedVehicle.vehReg,
        );
        if (matchedVehicle) {
          setSelectedVehicle(matchedVehicle.veh_reg);
          setSelectedVehicleId(matchedVehicle.id);
          return;
        }
      }
      const firstVehicle = vehicles[0];
      setSelectedVehicle(firstVehicle.veh_reg);
      setSelectedVehicleId(firstVehicle.id);
    }
  }, [vehicles, selectedVehicle, recentlyClickedVehicles.vehicles]);

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      loadingTimeoutIds.forEach((timeout) => clearTimeout(timeout));
    };
  }, [loadingTimeoutIds]);

  // Fetch all alert types when dependencies change
  useEffect(() => {
    if (
      selectedVehicleId &&
      selectedVehicle &&
      userId &&
      token &&
      dateRange.length === 2
    ) {
      fetchAlertData("OverSpeed", setOverspeedData);
      fetchAlertData("harshBreaking", setHarshBrakingData);
      fetchAlertData("harshAcceleration", setHarshAccelerationData);
      fetchAlertData("Freewheeling", setFreewheelingData);
    }
  }, [selectedVehicleId, selectedVehicle, dateRange, userId, token]);

  // Lazy queries for fresh data without caching
  const [getVehicleReport, { isLoading: isVehicleReportLoading }] =
    useLazyGetVehicleReportQuery();

  const [getGearData, { data: gearData, isLoading: isGearLoading }] =
    useLazyGetRawGearDataByVehicleAndDateQuery();

  const [fetchAlerts] = useLazyGetAlertsByDateQuery();

  interface GearChartData {
    gear: string;
    speed: number;
    percentage: number;
  }

  const fetchAlertData = async (
    alertType: string,
    setState: React.Dispatch<React.SetStateAction<any>>,
  ) => {
    if (!selectedVehicleId || !userId || !token) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((prev: any) => ({ ...prev, loading: true, error: null }));

    try {
      const isFreewheelingAlert = alertType === "Freewheeling";

      const result = await fetchAlerts({
        userId: userId?.toString(),
        token: token?.toString(),
        alertType: alertType,
        startDateTime: moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
        endDateTime: moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
        vehReg: isFreewheelingAlert ? "" : selectedVehicle,
        vehId: isFreewheelingAlert ? 0 : selectedVehicleId,
      }).unwrap();

      let filteredData = result.list || [];
      if (isFreewheelingAlert && filteredData.length > 0) {
        filteredData = filteredData.map((item: any) => {
          if (item.freewheeling && Array.isArray(item.freewheeling)) {
            return {
              ...item,
              freewheeling: item.freewheeling.filter((alert: any) => {
                const alertVehicle =
                  alert.vehicle_no || alert.vehicleno || alert.vehReg;
                return (
                  alertVehicle === selectedVehicle ||
                  alertVehicle?.replace(/\s/g, "") ===
                    selectedVehicle?.replace(/\s/g, "")
                );
              }),
            };
          }
          return item;
        });
      }

      setState({ data: filteredData, loading: false, error: null });
    } catch (error: any) {
      console.error(`Error fetching ${alertType} alerts:`, error);
      setState({
        data: [],
        loading: false,
        error: error.message || "Failed to fetch data",
      });
    }
  };

  // Calculate gear engine speed distribution data
  const calculateGearEngineSpeedData = (): GearChartData[] => {
    if (!gearData || !gearData.rawdata) {
      // Return gears 1-7 with 0 data when no data available
      return Array.from({ length: 7 }, (_, i) => ({
        gear: getGearName(i + 1),
        speed: 0,
        percentage: 0,
      }));
    }

    const rawData = gearData.rawdata;
    // Filter out gear 0 from the data
    const validGearData = rawData.filter((item: any) => item.gear !== 0);
    const totalRecords = validGearData.length;

    if (totalRecords === 0) {
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

  // Get gear name helper function
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

  // Custom tooltip for the gear chart
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

  // Get chart data
  const chartData = calculateGearEngineSpeedData();

  // Helper function to get alert count from alert API data
  const getAlertCountFromAPI = (alertDataState: any, alertField: string) => {
    if (
      alertDataState.loading ||
      !alertDataState.data ||
      alertDataState.data.length === 0
    ) {
      return 0;
    }

    let totalCount = 0;

    // The API returns data in a specific format where alertData[0] contains all alert types
    if (alertDataState.data.length > 0 && alertDataState.data[0][alertField]) {
      const alertEvents = alertDataState.data[0][alertField];

      // Filter alerts for the current vehicle
      const vehicleAlerts = alertEvents.filter((alertEvent: any) => {
        return (
          alertEvent.vehicle_no === selectedVehicle ||
          alertEvent.vehicle_no?.replace(/\s/g, "") ===
            selectedVehicle?.replace(/\s/g, "")
        );
      });

      totalCount = vehicleAlerts.length;
    }

    return totalCount;
  };

  const getDateRangeDays = () => {
    if (!dateRange || dateRange.length !== 2) return 7;
    const startDate = moment(dateRange[0]);
    const endDate = moment(dateRange[1]);
    return endDate.diff(startDate, "days") + 1;
  };

  // Scoring functions based on the criteria provided
  const calculateTotalDistanceScore = () => {
    if (
      isVehicleChanging ||
      isVehicleReportLoading ||
      !vehicleReportData?.list?.[0]
    ) {
      return 0;
    }
    const totalKm = parseFloat(vehicleReportData.list[0].total_km || "0");
    const days = getDateRangeDays();
    const avgPerDay = totalKm / days; // Calculate per-day average

    // Based on criteria: <500km = 5 points, >500km = 10 points (per day logic)
    if (avgPerDay < 500) {
      return 5;
    } else {
      return 10;
    }
  };

  const calculateMileageScore = () => {
    if (
      isVehicleChanging ||
      isVehicleReportLoading ||
      !vehicleReportData?.list?.[0]
    ) {
      return 0;
    }
    const mileage = parseFloat(vehicleReportData.list[0].avg_mileage || "0");

    // Based on criteria: <3 = 5 points, 3-4.5 = 7.5 points, >4.5 = 10 points
    if (mileage < 3) {
      return 5;
    } else if (mileage >= 3 && mileage < 4.5) {
      return 7.5;
    } else if (mileage >= 4.5) {
      return 10;
    }
    return 0;
  };

  const calculateFuelConsumedScore = () => {
    if (
      isVehicleChanging ||
      isVehicleReportLoading ||
      !vehicleReportData?.list?.[0]
    ) {
      return 0;
    }
    const idleFuelConsumed = parseFloat(
      vehicleReportData.list[0].idle_fuel_consumed || "0",
    );
    const totalKm = parseFloat(vehicleReportData.list[0].total_km || "0");

    if (totalKm === 0) return 10;

    const fuelPer500Km = (idleFuelConsumed / totalKm) * 500;

    if (fuelPer500Km < 5) {
      return 10;
    } else if (fuelPer500Km >= 5 && fuelPer500Km < 10) {
      return 5;
    }
    return 0;
  };

  const calculateFreeWheellingScore = () => {
    if (isVehicleChanging || isVehicleReportLoading) {
      return 0;
    }
    const count = getAlertCountFromAPI(freewheelingData, "freewheeling");

    // Score based on absolute count for the selected period
    if (count < 2) {
      return 10;
    } else if (count >= 2 && count <= 5) {
      return 5;
    }
    return 0;
  };

  const calculateHarshAccelerationScore = () => {
    if (isVehicleChanging || isVehicleReportLoading) {
      return 0;
    }
    const count = getAlertCountFromAPI(harshAccelerationData, "harshacc");

    if (count < 2) {
      return 10;
    } else if (count >= 2 && count <= 5) {
      return 5;
    }
    return 0;
  };

  const calculateOverSpeedingScore = () => {
    if (isVehicleChanging || isVehicleReportLoading) {
      return 0;
    }
    const count = getAlertCountFromAPI(overspeedData, "overspeed");

    if (count < 2) {
      return 10;
    } else if (count >= 2 && count <= 5) {
      return 5;
    }
    return 0;
  };

  const calculateHarshBrakeScore = () => {
    if (isVehicleChanging || isVehicleReportLoading) {
      return 0;
    }
    const count = getAlertCountFromAPI(harshBrakingData, "harshBreak");

    if (count < 2) {
      return 10;
    } else if (count >= 2 && count <= 5) {
      return 5;
    }
    return 0;
  };

  const calculateOptimalGearScore = () => {
    if (
      isGearLoading ||
      isGearDataLoading ||
      !gearData?.rawdata ||
      gearData.rawdata.length === 0
    ) {
      return 0;
    }

    const validGearData = gearData.rawdata.filter(
      (item: any) => item.gear !== 0,
    );
    const totalRecords = validGearData.length;
    if (totalRecords === 0) {
      return 0;
    }

    const optimalGearRecords = validGearData.filter(
      (item: any) => item.gear === 5 || item.gear === 6 || item.gear === 7,
    );
    const utilization = (optimalGearRecords.length / totalRecords) * 100;

    if (utilization > 70) {
      return 10;
    } else if (utilization >= 60 && utilization <= 70) {
      return 5;
    }
    return 0;
  };

  const calculateTotalScore = () => {
    const scores = [
      calculateTotalDistanceScore(),
      calculateMileageScore(),
      calculateFuelConsumedScore(),
      calculateFreeWheellingScore(),
      calculateHarshAccelerationScore(),
      calculateOverSpeedingScore(),
      calculateHarshBrakeScore(),
      calculateOptimalGearScore(),
    ];

    return scores.reduce((total, score) => total + score, 0);
  };

  const calculateTotalScorePercentage = () => {
    const totalScore = calculateTotalScore();
    const percentage = (totalScore / 80) * 100;
    return percentage.toFixed(1);
  };

  const calculateOptimalGearUtilization = () => {
    if (
      isGearLoading ||
      isGearDataLoading ||
      !gearData?.rawdata ||
      gearData.rawdata.length === 0
    ) {
      return isGearLoading || isGearDataLoading ? "Loading..." : "0%";
    }

    const validGearData = gearData.rawdata.filter(
      (item: any) => item.gear !== 0,
    );
    const totalRecords = validGearData.length;

    if (totalRecords === 0) {
      return "0%";
    }

    const optimalGearRecords = validGearData.filter(
      (item: any) => item.gear === 5 || item.gear === 6 || item.gear === 7,
    );
    const utilization = (optimalGearRecords.length / totalRecords) * 100;

    return `${utilization.toFixed(1)}%`;
  };

  useEffect(() => {
    if (selectedVehicleId && userId && token) {
      setIsGearDataLoading(true);

      const gearTimeoutId = setTimeout(() => {
        console.warn("Gear data fetching timed out after 8 seconds");
        setIsGearDataLoading(false);
      }, 15000);

      getGearData({
        vId: selectedVehicleId,
        startdate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
        enddate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
        requestfor: parseInt(token),
        userid: userId.toString(),
        interval: 120,
      })
        .then((result) => {
          clearTimeout(gearTimeoutId);
          if (
            result.error ||
            (result.data && result.data.message === "Something went wrong") ||
            (result.data && result.data.success === false)
          ) {
            console.warn("Gear API returned error:", result);
          }
          setIsGearDataLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching gear data:", error);
          clearTimeout(gearTimeoutId);
          setIsGearDataLoading(false);
        });
    }
  }, [selectedVehicleId, userId, token, getGearData]);

  const metricsData = [
    {
      title: "Total Distance Covered",
      value:
        isVehicleChanging || isVehicleReportLoading
          ? "Loading..."
          : vehicleReportData?.list?.[0]?.total_km
            ? `${Math.floor(parseFloat(vehicleReportData.list[0].total_km))} KM`
            : "0 KM",
      icon: "/assets/images/driverInfo/map.png",
    },
    {
      title: "Mileage",
      value:
        isVehicleChanging || isVehicleReportLoading
          ? "Loading..."
          : vehicleReportData?.list?.[0]?.avg_mileage
            ? `${parseFloat(vehicleReportData.list[0].avg_mileage).toFixed(
                2,
              )} Km/liters`
            : "0.00 Km/liters",
      icon: "/assets/images/driverInfo/odo.png",
    },
    {
      title: "Fuel Consumed (Idle)",
      value:
        isVehicleChanging || isVehicleReportLoading
          ? "Loading..."
          : vehicleReportData?.list?.[0]?.idle_fuel_consumed
            ? `${parseFloat(
                vehicleReportData.list[0].idle_fuel_consumed,
              ).toFixed(2)} Liters`
            : "0.00 Liters",
      icon: "/assets/images/driverInfo/speed.png",
    },
    {
      title: "Free wheeling Counts",
      value:
        isVehicleChanging || isVehicleReportLoading || freewheelingData.loading
          ? "Loading..."
          : getAlertCountFromAPI(freewheelingData, "freewheeling"),
      icon: "/assets/images/driverInfo/wheel.png",
    },
    {
      title: "Harsh Acceleration Counts",
      value:
        isVehicleChanging ||
        isVehicleReportLoading ||
        harshAccelerationData.loading
          ? "Loading..."
          : getAlertCountFromAPI(harshAccelerationData, "harshacc"),
      icon: "/assets/images/driverInfo/fault1.png",
    },
    {
      title: "Over speeding Counts",
      value:
        isVehicleChanging || isVehicleReportLoading || overspeedData.loading
          ? "Loading..."
          : getAlertCountFromAPI(overspeedData, "overspeed"),
      icon: "/assets/images/driverInfo/fault4.png",
    },
    {
      title: "Harsh Brake Counts",
      value:
        isVehicleChanging || isVehicleReportLoading || harshBrakingData.loading
          ? "Loading..."
          : getAlertCountFromAPI(harshBrakingData, "harshBreak"),
      icon: "/assets/images/driverInfo/break.png",
    },
    {
      title: "Optimal Gear Utilization",
      value:
        isGearLoading || isGearDataLoading
          ? "Loading..."
          : `${calculateOptimalGearUtilization()}`,
      icon: "/assets/images/driverInfo/fault.png",
    },
    {
      title: "Proactive Fault Code Resolution",
      value: "-",
      icon: "/assets/images/driverInfo/fault3.png",
    },
  ];

  const fetchVehicleData = async (vehicleId: number, vehicleReg: string) => {
    if (!vehicleId || !userId || !token) return;

    // Clear any existing timeouts
    loadingTimeoutIds.forEach((timeout) => clearTimeout(timeout));
    setLoadingTimeoutIds([]);

    const timeoutId = setTimeout(() => {
      console.warn("Data fetching timed out after 10 seconds");
      setIsVehicleChanging(false);
      setIsGearDataLoading(false);
    }, 15000);

    setLoadingTimeoutIds([timeoutId]);

    try {
      const vehicleReportResult = await getVehicleReport({
        vId: vehicleId,
        startdate: moment(dateRange[0]).format("YYYY-MM-DD"),
        enddate: moment(dateRange[1]).format("YYYY-MM-DD"),
        requestfor: parseInt(token || "0"),
        userid: parseInt(userId || "0"),
      }).unwrap();

      // Check if the response indicates an error or no data
      if (
        vehicleReportResult?.message === "Something went wrong" ||
        vehicleReportResult?.success === false ||
        !vehicleReportResult?.list ||
        vehicleReportResult.list.length === 0
      ) {
        console.warn(
          "Vehicle Report API returned error or empty data:",
          vehicleReportResult,
        );
        setVehicleReportData(null);
      } else {
        setVehicleReportData(vehicleReportResult);
      }

      // Clear timeout and stop loading state
      clearTimeout(timeoutId);
      setIsVehicleChanging(false);
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      // Clear timeout and stop loading state
      clearTimeout(timeoutId);
      setIsVehicleChanging(false);
    }
  };

  useEffect(() => {
    if (selectedVehicleId > 0 && selectedVehicle) {
      fetchVehicleData(selectedVehicleId, selectedVehicle);
    }
  }, [selectedVehicleId, selectedVehicle, userId, token]);

  const handleVehicleChange = (vehicleReg: string) => {
    // Clear any existing timeouts first
    loadingTimeoutIds.forEach((timeout) => clearTimeout(timeout));
    setLoadingTimeoutIds([]);

    // Clear previous data and set loading state
    setIsVehicleChanging(true);
    setVehicleReportData(null);
    setSelectedVehicle(vehicleReg);

    const vehicle = vehicles.find((v) => v.veh_reg === vehicleReg);
    if (vehicle) {
      setSelectedVehicleId(vehicle.id);
    }
  };

  // Helper function to render loading cell content
  const renderLoadingCell = (isLoading: boolean, content: string | number) => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Spin size="small" />
          <span>Loading...</span>
        </div>
      );
    }
    return content;
  };

  const handleSet = () => {
    // Refetch data with current vehicle and date range
    if (selectedVehicleId > 0 && selectedVehicle) {
      // Clear any existing timeouts first
      loadingTimeoutIds.forEach((timeout) => clearTimeout(timeout));
      setLoadingTimeoutIds([]);

      setIsVehicleChanging(true);
      setVehicleReportData(null);

      // Refetch vehicle report data
      fetchVehicleData(selectedVehicleId, selectedVehicle);

      // Refetch alert data
      fetchAlertData("OverSpeed", setOverspeedData);
      fetchAlertData("harshBreaking", setHarshBrakingData);
      fetchAlertData("harshAcceleration", setHarshAccelerationData);
      fetchAlertData("Freewheeling", setFreewheelingData);
    }
  };

  // Function to get dynamic date range text
  const getDateRangeText = () => {
    const startDate = moment(dateRange[0]).format("DD/MM/YYYY");
    const endDate = moment(dateRange[1]).format("DD/MM/YYYY");

    // Check if it's today
    const isToday =
      moment(dateRange[0]).isSame(moment(), "day") &&
      moment(dateRange[1]).isSame(moment(), "day");

    // Check if it's yesterday
    const isYesterday =
      moment(dateRange[0]).isSame(moment().subtract(1, "day"), "day") &&
      moment(dateRange[1]).isSame(moment().subtract(1, "day"), "day");

    // Check if it's a week range (7 days from start to end)
    const daysDiff = moment(dateRange[1]).diff(moment(dateRange[0]), "days");
    const isWeekRange = daysDiff === 6; // 7 days total (0-6 diff)

    if (isToday) {
      return "Today";
    } else if (isYesterday) {
      return "Yesterday";
    } else if (isWeekRange && moment(dateRange[1]).isSame(moment(), "day")) {
      return "Last 7 Days";
    } else if (startDate === endDate) {
      return startDate;
    } else {
      return `${startDate} - ${endDate}`;
    }
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Driver Performance
          </h1>
          <span className="text-gray-500 text-sm">
            Show: {getDateRangeText()}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left Side - Form Controls */}
          <div className="flex items-end gap-6">
            {/* Search Vehicle */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-2">
                Search Vehicle
              </label>
              <div className="flex space-x-5">
                <Select
                  value={selectedVehicle}
                  onChange={handleVehicleChange}
                  placeholder="Select vehicle"
                  style={{ width: 180, height: 20 }}
                  showSearch
                  optionFilterProp="children"
                  loading={isVehiclesLoading}
                  disabled={isVehiclesLoading || !!error}
                >
                  {vehicles.map((vehicle) => {
                    return (
                      <Option key={vehicle.id} value={vehicle.veh_reg}>
                        {vehicle.veh_reg}
                      </Option>
                    );
                  })}
                </Select>

                <div className="border border-gray-300" />
              </div>
            </div>

            {/* From Date */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-2">Date</label>
              <div className="max-w-[240px]">
                <CustomDatePicker
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showTimeSelect={false}
                  format="dd/MM/yyyy"
                />
              </div>
            </div>

            {/* Button */}
            <div className="flex">
              <Button
                type="primary"
                onClick={handleSet}
                style={{ height: 25 }}
                className="px-8 bg-teal-500 hover:bg-teal-600 border-teal-500 hover:border-teal-600"
              >
                Submit
              </Button>
            </div>
          </div>

          <div className="flex-shrink-0 relative select-none">
            <Image
              src="/assets/svgs/fleet/percentage.png"
              alt="Total Scores Percentage"
              width={100}
              height={100}
              className="object-contain"
              draggable="false"
            />
            <div className="absolute inset-0 items-center justify-center flex flex-col">
              <span className="text-[9px]">Total Score</span>
              <span className="text-lg font-semibold text-gray-800">
                {isVehicleChanging ||
                isVehicleReportLoading ||
                isGearLoading ||
                isGearDataLoading
                  ? "..."
                  : `${calculateTotalScorePercentage()}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-6">
        {metricsData.map(({ title, icon, value }) => (
          <div className="bg-[#EDF7F4B5] h-32 w-[270px] relative" key={title}>
            <div className="px-6 py-4">
              <h1 className="text-[#575757] font-semibold">{title}</h1>
            </div>
            <div className="border-t border-[#4FAF8F80] w-full" />

            <div className="px-6 py-4 text-2xl font-semibold text-[#43A182] min-h-[3rem] flex items-center">
              {value === "Loading..." ? (
                <div className="flex items-center space-x-2">
                  <Spin size="small" />
                  <span className="text-lg">Loading...</span>
                </div>
              ) : (
                <span>{value}</span>
              )}
            </div>

            <div className="">
              <Image
                src={icon}
                alt={title}
                width={56}
                height={56}
                className="absolute bottom-1 right-2"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Driver Score Card Table */}
      <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Driver Score Card
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#EDF7F4" }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b  border-r border-gray-200">
                  Total Mark&apos;s
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Mark&apos;s Scored
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  1
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Total Distance Covered
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {renderLoadingCell(
                    isVehicleChanging || isVehicleReportLoading,
                    vehicleReportData?.list?.[0]?.total_km
                      ? `${Math.floor(
                          parseFloat(vehicleReportData.list[0].total_km),
                        )} KM`
                      : "0 KM",
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateTotalDistanceScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  2
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Mileage
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : vehicleReportData?.list?.[0]?.avg_mileage
                      ? `${parseFloat(
                          vehicleReportData.list[0].avg_mileage,
                        ).toFixed(2)} Km/liters`
                      : "0.00 Km/liters"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateMileageScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  3
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Fuel Consumed (Idle)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : vehicleReportData?.list?.[0]?.idle_fuel_consumed
                      ? `${parseFloat(
                          vehicleReportData.list[0].idle_fuel_consumed,
                        ).toFixed(2)} Liters`
                      : "0.00 Liters"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateFuelConsumedScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  4
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Free wheeling Counts
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {renderLoadingCell(
                    isVehicleChanging ||
                      isVehicleReportLoading ||
                      freewheelingData.loading,
                    getAlertCountFromAPI(freewheelingData, "freewheeling"),
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateFreeWheellingScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  5
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Harsh Acceleration Counts
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {renderLoadingCell(
                    isVehicleChanging ||
                      isVehicleReportLoading ||
                      harshAccelerationData.loading,
                    getAlertCountFromAPI(harshAccelerationData, "harshacc"),
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateHarshAccelerationScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  6
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Over Speeding Counts
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {renderLoadingCell(
                    isVehicleChanging ||
                      isVehicleReportLoading ||
                      overspeedData.loading,
                    getAlertCountFromAPI(overspeedData, "overspeed"),
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateOverSpeedingScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  7
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Harsh Brake Counts
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {renderLoadingCell(
                    isVehicleChanging ||
                      isVehicleReportLoading ||
                      harshBrakingData.loading,
                    getAlertCountFromAPI(harshBrakingData, "harshBreak"),
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isVehicleReportLoading
                    ? "Loading..."
                    : calculateHarshBrakeScore()}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  8
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  Optimal Gear Utilization
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r border-gray-200 font-semibold">
                  {renderLoadingCell(
                    isVehicleChanging || isGearLoading || isGearDataLoading,
                    calculateOptimalGearUtilization(),
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isVehicleChanging || isGearLoading || isGearDataLoading
                    ? "Loading..."
                    : calculateOptimalGearScore()}
                </td>
              </tr>
            </tbody>
            <tfoot style={{ backgroundColor: "#EDF7F4" }}>
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-right text-sm font-medium text-gray-900 border-r border-gray-200"
                >
                  Total Scored
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                  80
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                  {isVehicleChanging ||
                  isVehicleReportLoading ||
                  isGearLoading ||
                  isGearDataLoading
                    ? "Loading..."
                    : calculateTotalScore()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Gear Specific Engine Speed Distribution Chart */}
      <div className="mt-8 bg-white border rounded-lg mb-20">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Gear Specific Engine Speed Distribution
          </h2>
          <div className="flex items-center mt-2">
            <Image
              src="/assets/svgs/fleet/truck.png"
              alt="Vehicle"
              width={20}
              height={20}
              className="mr-2"
            />
            <span className="text-sm text-gray-600 font-medium">
              {selectedVehicle || "No vehicle selected"}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="px-6 pb-6">
          <div
            className="border rounded-sm bg-gray-50"
            style={{ height: "400px" }}
          >
            {isGearLoading || isGearDataLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spin size="large" />
                  <p className="mt-2 text-gray-500">Loading gear data...</p>
                </div>
              </div>
            ) : !gearData ||
              !gearData.rawdata ||
              gearData.rawdata.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Image
                    src="/assets/svgs/fleet/no-data.png"
                    alt="No Data Available"
                    width={120}
                    height={120}
                    className="mx-auto mb-4"
                  />
                  <p className="text-gray-500">
                    No gear data available for the selected period
                  </p>
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
        </div>
      </div>
    </div>
  );
};

export default View;
