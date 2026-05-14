"use client";

import { useLazyGetRawGearDataByVehicleAndDateQuery } from "@/app/_globalRedux/services/gearDetails";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetVehicleReportQuery,
  useLazyGetpathwithDateDaignosticQuery,
  useLazyGetAlertsByDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Select, Table } from "antd";
import moment from "moment";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import CustomDatePicker from "../common/datePicker";
import CurrentState from "./current-state";
import DrivingBehavior from "./driving-behavior";
import GearUtilization from "./gear-utilization";
import RouteReport from "./route-report";
import VehicleUsage from "./vehicle-usage";

const View = () => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const startOfSevenDaysAgo = new Date(
    sevenDaysAgo.getFullYear(),
    sevenDaysAgo.getMonth(),
    sevenDaysAgo.getDate(),
    0,
    0,
    0,
  );

  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  );

  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfSevenDaysAgo,
    endOfToday,
  ]);
  const [fleetData, setFleetData] = useState<any[]>([]);
  const [gearData, setGearData] = useState<any[]>([]);
  const [loadingFleetData, setLoadingFleetData] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [loadingGear, setLoadingGear] = useState(false);
  const [replayModal, setReplayModal] = useState<{
    open: boolean;
    vehicle: any;
    pathData: any;
    loading: boolean;
  }>({ open: false, vehicle: null, pathData: null, loading: false });

  const [selectedVehicles, setSelectedVehicles] = useState<any[]>([]);

  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  ) || {
    userId: "833105",
    groupId: "59872",
    parentUser: "1",
  };

  const { data: vehiclesData, isLoading } = useGetVehiclesByStatusQuery({
    token: groupId?.toString() || "59872",
    userId: userId?.toString() || "833105",
    pUserId: parentUser?.toString() || "1",
    mode: "",
  });

  const allowedVehicles = useMemo(() => {
    return (vehiclesData?.list || []).filter((vehicle: any) => {
      return vehicle.gpsDtl.fuel && vehicle.gpsDtl.fuel <= 100;
    });
  }, [vehiclesData?.list]);

  // Filter vehicles to only include allowed ones
  const filteredVehiclesList = allowedVehicles;

  const [getPathDiagnostic] = useLazyGetpathwithDateDaignosticQuery();
  const [getGearData] = useLazyGetRawGearDataByVehicleAndDateQuery();
  const [getVehicleReport] = useLazyGetVehicleReportQuery();
  const [fetchAlerts] = useLazyGetAlertsByDateQuery();

  const allVehicles = filteredVehiclesList || [];

  const getAlertEventsFromResult = (data: any, alertType: string): any[] => {
    switch (alertType) {
      case "OverSpeed":
        return data.overspeed || [];
      case "harshBreaking":
        return data.harshBreak || [];
      case "harshAcceleration":
        return data.harshacc || [];
      case "Freewheeling":
        return data.freewheeling || [];
      default:
        return [];
    }
  };

  const fetchAlertDataForVehicle = async (
    vehicle: any,
    alertType: string,
  ): Promise<number> => {
    if (!vehicle || !userId || !groupId) {
      return 0;
    }

    try {
      const isFreewheelingAlert = alertType === "Freewheeling";

      const result = await fetchAlerts({
        userId: userId?.toString(),
        token: groupId?.toString(),
        alertType: alertType,
        startDateTime: moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
        endDateTime: moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
        vehReg: isFreewheelingAlert ? "" : vehicle.vehReg,
        vehId: isFreewheelingAlert ? 0 : vehicle.vId,
      }).unwrap();

      if (result.list && result.list.length > 0) {
        const alertEvents = getAlertEventsFromResult(result.list[0], alertType);

        if (alertEvents && alertEvents.length > 0) {
          // Filter alerts for the current vehicle
          const vehicleAlerts = alertEvents.filter((alertEvent: any) => {
            return (
              alertEvent.vehicle_no === vehicle.vehReg ||
              alertEvent.vehicle_no?.replace(/\s/g, "") ===
                vehicle.vehReg?.replace(/\s/g, "")
            );
          });

          return vehicleAlerts.length;
        }
      }

      return 0;
    } catch (error) {
      console.error(
        `Error fetching ${alertType} alerts for vehicle ${vehicle.vehReg}:`,
        error,
      );
      return 0;
    }
  };

  const calculateOptimalGearUtilization = (gearDataArray: any[]) => {
    if (!gearDataArray || gearDataArray.length === 0) return "0%";

    // Filter out gear 0 from total records count
    const validGearRecords = gearDataArray.filter((item) => item.gear !== 0);
    const totalRecords = validGearRecords.length;

    if (totalRecords === 0) return "0%";

    const optimalGearRecords = validGearRecords.filter(
      (item) => item.gear === 5 || item.gear === 6 || item.gear === 7,
    );
    const utilization = (optimalGearRecords.length / totalRecords) * 100;

    return `${utilization.toFixed(1)}%`;
  };

  const normalizeVehicleReport = (result: any, alertData?: any) => {
    if (
      !result ||
      !result.success ||
      !result.list ||
      result.list.length === 0
    ) {
      return {
        vId: 0,
        vehReg: "",
        lat: 0,
        lng: 0,
        running: 0,
        idle: 0,
        stop: 0,
        inactive: 0,
        distance: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        engineHours: 0,
        fuel: 0,
        co2: 0,
        driverScore: 0,
        vehicleScore: 0,
        patharry: [],
        stopagearry: [],
        ignitionStatusChangeArray: [],
        rawdata: [],
        success: false,
        totalmileage: "0.00",
        totalRunningDistanceKM: 0,
        totalFuelConsumedT: 0,
        idleFuelConsumed: 0,
        runningHours: 0,
        stoppages: 0,
        runningTime: "0h 0m",
        totalDistance: "0 KM",
        stoppageTime: "0h 0m",
        // Default alert values when using alert API
        harshacceleration: alertData?.harshacceleration || 0,
        harshbraking: alertData?.harshbraking || 0,
        overspeeding: alertData?.overspeeding || 0,
        freewheeling: alertData?.freewheeling || 0,
      };
    }

    const data = result.list[0];

    const timeStringToSeconds = (timeStr: string) => {
      if (!timeStr || timeStr === "null" || timeStr === null) return 0;
      const parts = timeStr.split(":");
      if (parts.length !== 3) return 0;
      return (
        parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
      );
    };

    const timeStringToHours = (timeStr: string) => {
      if (!timeStr || timeStr === "null" || timeStr === null) return 0;
      const parts = timeStr.split(":");
      if (parts.length !== 3) return 0;
      return (
        parseFloat(parts[0]) +
        parseFloat(parts[1]) / 60 +
        parseFloat(parts[2]) / 3600
      );
    };

    // Helper function to format hours to "Xh Ym" format
    const formatHoursToTime = (hours: number) => {
      if (!hours || hours === 0) return "0h 0m";
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return `${wholeHours}h ${minutes}m`;
    };

    const runningHours = timeStringToHours(data.total_running_sec) || 0;
    const stoppageHours = timeStringToHours(data.total_stoppage_sec) || 0;
    const totalKm = parseFloat(data.total_km) || 0;

    return {
      vId: parseInt(data.vehicle_id) || 0,
      vehReg: data.vehicle_registration || "",
      lat: 0, // Not available in vehicle report
      lng: 0, // Not available in vehicle report
      running: timeStringToSeconds(data.total_running_sec) || 0,
      idle: parseFloat(data.idle_fuel_consumed) || 0, // Correct mapping for idle fuel consumed
      stop: timeStringToSeconds(data.total_stoppage_sec) || 0,
      inactive: 0, // Not available in vehicle report
      distance: totalKm,
      maxSpeed: data.max_speed || 0,
      avgSpeed: parseFloat(data.avg_mileage) || 0,
      engineHours: runningHours,
      fuel: parseFloat(data.total_fuel_consumed) || 0,
      co2: 0, // Not available in vehicle report
      driverScore: 0, // Not available in vehicle report
      vehicleScore: 0, // Not available in vehicle report
      patharry: [],
      stopagearry: [], // Not available in vehicle report
      ignitionStatusChangeArray: [],
      rawdata: [],
      success: true,
      totalmileage: parseFloat(data.avg_mileage).toFixed(2) || "0.00",
      totalRunningDistanceKM: totalKm, // Kilometer & Total Distance = total_km
      totalFuelConsumedT: parseFloat(data.total_fuel_consumed) || 0,
      idleFuelConsumed: parseFloat(data.idle_fuel_consumed) || 0,
      runningHours: runningHours, // Running Hours = total_running_sec (in hours)
      stoppages: stoppageHours,
      runningTime: formatHoursToTime(runningHours),
      totalDistance: `${totalKm} KM`,
      stoppageTime: formatHoursToTime(stoppageHours),
      // Use alert API data instead of vehicle report data
      harshacceleration: alertData?.harshacceleration || 0,
      harshbraking: alertData?.harshbraking || 0,
      overspeeding: alertData?.overspeeding || 0,
      freewheeling: alertData?.freewheeling || 0,
    };
  };

  const normalizeGear = (result: any) => {
    if (
      !result ||
      result.message === "Something went wrong" ||
      result.success === false
    ) {
      return { success: false, rawdata: [], _placeholder: true };
    }
    return result;
  };

  const fetchFleetData = async (showValueLoaders = false) => {
    if (selectedVehicles.length === 0) return;

    if (showValueLoaders) {
      setLoadingValues(true);
      setLoadingDiagnostic(true);
      setLoadingGear(true);
    } else {
      setLoadingFleetData(true);
    }

    const formatDateForAPI = (date: Date, isEndDate: boolean = false) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const time = isEndDate ? "23:59" : "00:00";
      return `${year}-${month}-${day} ${time}`;
    };

    const startDate = formatDateForAPI(dateRange[0], false);
    const endDate = formatDateForAPI(dateRange[1], true);

    try {
      // First fetch vehicle report data
      const vehicleReportPromises = selectedVehicles.map((vehicle) => {
        const vehicleReportStartDate = dateRange[0].toISOString().split("T")[0];
        const vehicleReportEndDate = dateRange[1].toISOString().split("T")[0];

        return Promise.race([
          getVehicleReport({
            vId: vehicle.vId,
            startdate: vehicleReportStartDate,
            enddate: vehicleReportEndDate,
            requestfor: parseInt(groupId?.toString() || "59872"),
            userid: parseInt(userId?.toString() || "833105"),
          }).unwrap(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Vehicle report timeout")),
              15000,
            ),
          ),
        ]).catch(() => null);
      });

      // Fetch alert data for all vehicles and alert types
      const alertPromises = selectedVehicles.map(async (vehicle) => {
        const alertTypes = [
          "OverSpeed",
          "harshBreaking",
          "harshAcceleration",
          "Freewheeling",
        ];
        const alertResults = await Promise.all(
          alertTypes.map((alertType) =>
            fetchAlertDataForVehicle(vehicle, alertType).catch(() => 0),
          ),
        );

        return {
          overspeeding: alertResults[0],
          harshbraking: alertResults[1],
          harshacceleration: alertResults[2],
          freewheeling: alertResults[3],
        };
      });

      // Wait for both vehicle reports and alert data
      const [vehicleReports, alertsResults] = await Promise.all([
        Promise.all(vehicleReportPromises),
        Promise.all(alertPromises),
      ]);

      // Combine vehicle reports with alert data
      const combinedData = vehicleReports.map((reportResult, index) => {
        const alertData = alertsResults[index];
        return normalizeVehicleReport(reportResult, alertData);
      });

      setFleetData(combinedData as any[]);
      setLoadingDiagnostic(false);

      if (showValueLoaders) {
        setLoadingValues(false);
      } else {
        setLoadingFleetData(false);
      }

      // Now fetch gear data separately without caching
      const gearPromises = selectedVehicles.map((vehicle) =>
        getGearData({
          vId: vehicle.vId,
          startdate: startDate,
          enddate: endDate,
          requestfor: 0,
          userid: userId?.toString() || "833105",
          interval: 120,
        })
          .unwrap()
          .then(normalizeGear)
          .catch(() => normalizeGear(null)),
      );

      const gearDataArr = await Promise.all(gearPromises);
      setGearData(gearDataArr);
      setLoadingGear(false);
    } catch (error) {
      setFleetData([]);
      setGearData([]);
    } finally {
      setLoadingFleetData(false);
      setLoadingValues(false);
      setLoadingGear(false);
    }
  };

  useEffect(() => {
    if (selectedVehicles.length > 0 && fleetData.length === 0) {
      fetchFleetData(false);
    }
  }, [selectedVehicles.length]);

  // Function to fetch data for a single vehicle - OPTIMIZED
  const fetchSingleVehicleData = async (vehicle: any, vehicleIndex: number) => {
    const formatDateForAPI = (date: Date, isEndDate: boolean = false) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const time = isEndDate ? "23:59" : "00:00";
      return `${year}-${month}-${day} ${time}`;
    };

    const startDate = formatDateForAPI(dateRange[0], false);
    const endDate = formatDateForAPI(dateRange[1], true);

    setFleetData((prev) => {
      const newData = [...prev];
      newData[vehicleIndex] = { loading: true }; // Show loading state
      return newData;
    });

    setGearData((prev) => {
      const newData = [...prev];
      newData[vehicleIndex] = { loading: true }; // Show loading state
      return newData;
    });

    try {
      const vehicleReportStartDate = dateRange[0].toISOString().split("T")[0];
      const vehicleReportEndDate = dateRange[1].toISOString().split("T")[0];

      const vehicleReportPromise = Promise.race([
        getVehicleReport({
          vId: vehicle.vId,
          startdate: vehicleReportStartDate,
          enddate: vehicleReportEndDate,
          requestfor: parseInt(groupId?.toString() || "59872"),
          userid: parseInt(userId?.toString() || "833105"),
        }).unwrap(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Vehicle report timeout")), 15000),
        ),
      ]).catch(() => null);

      const alertPromise = (async () => {
        const alertTypes = [
          "OverSpeed",
          "harshBreaking",
          "harshAcceleration",
          "Freewheeling",
        ];
        const alertResults = await Promise.all(
          alertTypes.map((alertType) =>
            fetchAlertDataForVehicle(vehicle, alertType).catch(() => 0),
          ),
        );

        return {
          overspeeding: alertResults[0],
          harshbraking: alertResults[1],
          harshacceleration: alertResults[2],
          freewheeling: alertResults[3],
        };
      })();

      const gearPromise = getGearData({
        vId: vehicle.vId,
        startdate: startDate,
        enddate: endDate,
        requestfor: 0,
        userid: userId?.toString() || "833105",
        interval: 120,
      })
        .unwrap()
        .then(normalizeGear)
        .catch(() => normalizeGear(null));

      // Update vehicle report data when both vehicle report and alert data are available
      Promise.all([vehicleReportPromise, alertPromise]).then(
        ([vehicleReport, alertData]) => {
          const combinedData = normalizeVehicleReport(vehicleReport, alertData);
          setFleetData((prev) => {
            const newData = [...prev];
            newData[vehicleIndex] = combinedData;
            return newData;
          });
        },
      );

      gearPromise.then((gear) => {
        setGearData((prev) => {
          const newData = [...prev];
          newData[vehicleIndex] = gear;
          return newData;
        });
      });
    } catch (error) {
      // Handle errors silently - no console logs
      setFleetData((prev) => {
        const newData = [...prev];
        newData[vehicleIndex] = normalizeVehicleReport(null, {
          overspeeding: 0,
          harshbraking: 0,
          harshacceleration: 0,
          freewheeling: 0,
        });
        return newData;
      });

      setGearData((prev) => {
        const newData = [...prev];
        newData[vehicleIndex] = normalizeGear(null);
        return newData;
      });
    }
  };

  // Calculate metrics from real data
  const calculateMetrics = (data: any, index: number) => {
    const diagnostic = fleetData[index];
    const gearInfo = gearData[index];

    // Calculate fuel consumed during idle
    const calculateIdleFuelConsumed = (diagnosticData: any) => {
      if (
        !diagnosticData ||
        !diagnosticData.success ||
        diagnosticData.loading
      ) {
        return "0";
      }

      // Use idleFuelConsumed from vehicle report API response
      const idleFuelConsumed = diagnosticData.idleFuelConsumed || 0;
      return idleFuelConsumed > 0 ? idleFuelConsumed.toFixed(2) : "0";
    };

    return {
      fuelMileage:
        loadingFleetData ||
        loadingDiagnostic ||
        !diagnostic ||
        diagnostic.loading
          ? "loading"
          : (diagnostic.totalmileage ?? 0).toString(),
      gearUtilization:
        loadingFleetData ||
        loadingGear ||
        !gearInfo?.rawdata ||
        gearInfo.loading
          ? "loading"
          : calculateOptimalGearUtilization(gearInfo.rawdata),
      fuelConsumed:
        loadingFleetData ||
        loadingDiagnostic ||
        !diagnostic ||
        diagnostic.loading
          ? "loading"
          : calculateIdleFuelConsumed(diagnostic),
      fuelTheft: "0", // Static value - always show
    };
  };

  // Dynamic data for the fleet comparison table
  const generateDynamicStaticData = () => {
    const baseData = [
      {
        key: "summary",
        metric: "Summary",
        ...selectedVehicles.reduce(
          (acc, _, index) => {
            acc[`vehicle${index + 1}`] = "";
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
      {
        key: "fuel-mileage",
        metric: "Fuel Mileage",
        ...selectedVehicles.reduce(
          (acc, _, index) => {
            acc[`vehicle${index + 1}`] = calculateMetrics(
              fleetData[index],
              index,
            ).fuelMileage;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
      {
        key: "gear-utilization",
        metric: "Optimal Gear Utilization",
        ...selectedVehicles.reduce(
          (acc, _, index) => {
            acc[`vehicle${index + 1}`] = calculateMetrics(
              fleetData[index],
              index,
            ).gearUtilization;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
      {
        key: "fuel-consumed",
        metric: "Fuel Consumed (Idle)",
        ...selectedVehicles.reduce(
          (acc, _, index) => {
            acc[`vehicle${index + 1}`] = calculateMetrics(
              fleetData[index],
              index,
            ).fuelConsumed;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
      {
        key: "fuel-theft",
        metric: "Fuel Theft",
        ...selectedVehicles.reduce(
          (acc, _, index) => {
            acc[`vehicle${index + 1}`] = calculateMetrics(
              fleetData[index],
              index,
            ).fuelTheft;
            return acc;
          },
          {} as Record<string, string>,
        ),
      },
    ];
    return baseData;
  };

  const staticData = generateDynamicStaticData();

  const columns = [
    {
      title: (
        <div className="flex items-center text-left">
          <div className="">
            <img
              src="/assets/svgs/fleet/truck.png"
              alt="Truck"
              width={20}
              height={20}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div className="flex flex-col ml-2">
            <div className="text-sm font-semibold">Vehicle No</div>
            <div className="text-xs text-gray-500">Model Name</div>
          </div>
        </div>
      ),
      dataIndex: "metric",
      key: "metric",
      width: 150,
      render: (text: string, record: any) => {
        if (record.key === "summary") {
          return (
            <div className="flex items-center space-x-2 py-1">
              <div className="w-4 h-4 bg-teal-100 rounded flex items-center justify-center">
                <span className="text-teal-600 text-xs">📋</span>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {text}
              </span>
            </div>
          );
        }
        if (record.key === "fuel-consumed") {
          return (
            <div className="text-gray-600">
              <div>Fuel Consumed</div>
              <div className="text-xs text-gray-500">(Idle)</div>
            </div>
          );
        }
        return <div className="text-gray-600">{text}</div>;
      },
    },
    // Dynamic columns based on selected vehicles
    ...selectedVehicles.map((vehicle: any, index: number) => ({
      title: (
        <div className="flex items-center justify-center space-x-2 relative">
          <button
            onClick={() => {
              const newSelectedVehicles = selectedVehicles.filter(
                (_, i) => i !== index,
              );
              setSelectedVehicles(newSelectedVehicles);
              // Remove data at specific index instead of resetting all
              setFleetData((prev) => prev.filter((_, i) => i !== index));
              setGearData((prev) => prev.filter((_, i) => i !== index));
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 text-red-500 rounded-full border bg-red-100 border-red-500 text-md hover:text-red-600 z-10 flex items-center justify-center"
            style={{ fontSize: "10px" }}
          >
            X
          </button>
          <div className="flex items-center justify-center">
            <img
              src="/assets/svgs/fleet/truckIcon.png"
              alt="Truck"
              width={70}
              height={70}
              style={{ objectFit: "contain" }}
              draggable={false}
            />
          </div>
          <div className="text-left">
            <div className="text-md font-semibold">
              {vehicle.vehReg || `Vehicle ${index + 1}`}
            </div>
            <div className="text-xs text-gray-400">
              {vehicle.gpsDtl.model || vehicle.vehicleName || "Model N/A"}
            </div>
          </div>
        </div>
      ),
      dataIndex: `vehicle${index + 1}`,
      key: `vehicle${index + 1}`,
      align: "center" as const,
      render: (value: string) => (
        <div className="text-center font-medium">
          {value === "loading" ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
            </div>
          ) : (
            value
          )}
        </div>
      ),
    })),
  ];

  const handleDateRangeChange = (value: Date[]) => {
    if (value.length >= 2) {
      setDateRange([value[0], value[1]]);
    }
  };

  const handleSubmit = () => {
    fetchFleetData(true);
  };

  const getDateRangeDisplay = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      dateRange[0].toDateString() === today.toDateString() &&
      dateRange[1].toDateString() === today.toDateString();

    const isYesterday =
      dateRange[0].toDateString() === yesterday.toDateString() &&
      dateRange[1].toDateString() === yesterday.toDateString();

    if (isToday) {
      return "Today";
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      const startDate = dateRange[0].toLocaleDateString();
      const endDate = dateRange[1].toLocaleDateString();
      return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    }
  };

  const handleViewReplay = async (vehicle: any, index: number) => {
    setReplayModal({
      open: true,
      vehicle: vehicle,
      pathData: null,
      loading: true,
    });

    const formatDateForAPI = (date: Date, isEndDate: boolean = false) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const time = isEndDate ? "23:59" : "00:00";
      return `${year}-${month}-${day} ${time}`;
    };

    const startDate = formatDateForAPI(dateRange[0], false);
    const endDate = formatDateForAPI(dateRange[1], true);

    try {
      const pathData = await Promise.race([
        getPathDiagnostic({
          vId: vehicle.vId,
          startDate: startDate,
          endDate: endDate,
          userId: userId?.toString() || "833105",
        }).unwrap(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Diagnostic API timeout")), 15000),
        ),
      ]);

      setReplayModal({
        open: true,
        vehicle: vehicle,
        pathData: pathData,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch diagnostic data for replay:", error);
      setReplayModal({
        open: true,
        vehicle: vehicle,
        pathData: { error: true, message: "Failed to load replay data" },
        loading: false,
      });
    }
  };

  return (
    <div className="p-5 bg-[#FFFFFF] min-h-screen overflow-y-auto">
      <style jsx>{`
        .fleet-comparison-table .ant-table-thead > tr > th {
          background-color: #f8f9fa !important;
          border-bottom: 2px solid #e9ecef !important;
          border-right: 2px solid #d1d5db !important;
          padding: 20px 8px !important;
          text-align: center !important;
          position: relative !important;
          height: 100px !important;
        }
        .fleet-comparison-table .ant-table-thead > tr > th:first-child {
          text-align: left !important;
        }
        .fleet-comparison-table .ant-table-thead > tr > th:last-child {
          border-right: none !important;
        }
        .fleet-comparison-table .ant-table-tbody > tr > td {
          padding: 16px 8px !important;
          border-bottom: 1px solid #e9ecef !important;
          border-right: 2px solid #d1d5db !important;
          position: relative !important;
        }
        .fleet-comparison-table .ant-table-tbody > tr > td:first-child {
          background-color: #f8f9fa !important;
          font-weight: 500 !important;
          text-align: left !important;
        }
        .fleet-comparison-table .ant-table-tbody > tr > td:last-child {
          border-right: none !important;
        }
        .fleet-comparison-table .ant-table-tbody > tr:hover > td {
          background-color: #f1f3f4 !important;
        }
        .fleet-comparison-table .ant-table-tbody > tr:hover > td:first-child {
          background-color: #e9ecef !important;
        }
        .fleet-comparison-table .ant-table {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }
        .fleet-comparison-table
          .ant-table-tbody
          > tr[data-row-key="summary"]
          > td {
          padding: 4px 8px !important;
          height: 35px !important;
          line-height: 1 !important;
          vertical-align: middle !important;
        }
        .vehicle-select-dropdown .ant-select-selector {
          border: 1px solid #44444e !important;
          background-color: #f8f9fa !important;
        }
        .vehicle-select-dropdown .ant-select-selection-placeholder {
          color: #44444e !important;
          font-weight: 500 !important;
        }
        .vehicle-select-dropdown:hover .ant-select-selector {
          border-color: #44444e !important;
          box-shadow: 0 0 0 2px rgba(68, 68, 78, 0.1) !important;
        }
      `}</style>
      <div className="flex items-center">
        <div className="flex items-center space-x-3 flex-1">
          <h1 className="font-bold text-xl">Fleet Comparison</h1>
          <h2 className="text-sm text-gray-500">
            Show :{" "}
            <span className="text-gray-800">{getDateRangeDisplay()}</span>
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <Select
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) => {
              const lbl = (option?.label ?? "").toString().toLowerCase();
              return lbl.includes(input.toLowerCase());
            }}
            placeholder={
              selectedVehicles.length >= 4 ? "Max 4 vehicles" : "Add vehicle..."
            }
            style={{
              width: 200,
              border: "1px solid #44444E",
              borderRadius: 4,
            }}
            className="vehicle-select-dropdown"
            size="small"
            value={null}
            disabled={selectedVehicles.length >= 4}
            onChange={(vId) => {
              if (selectedVehicles.length >= 4) {
                return;
              }

              const selectedVehicle = allVehicles.find((v) => v.vId === vId);
              if (
                selectedVehicle &&
                !selectedVehicles.some((v) => v.vId === vId)
              ) {
                const newSelectedVehicles = [
                  ...selectedVehicles,
                  selectedVehicle,
                ];
                setSelectedVehicles(newSelectedVehicles);
                // Fetch data only for the newly added vehicle
                const newVehicleIndex = newSelectedVehicles.length - 1;
                fetchSingleVehicleData(selectedVehicle, newVehicleIndex);
              }
            }}
            options={allVehicles
              .filter(
                (vehicle) =>
                  !selectedVehicles.some((sv) => sv.vId === vehicle.vId),
              )
              .map((vehicle) => ({
                value: vehicle.vId,
                label: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                disabled: false,
              }))}
          />
          <div className="max-w-[240px]">
            <CustomDatePicker
              dateRange={dateRange}
              setDateRange={handleDateRangeChange}
              showTimeSelect={false}
              format="dd/MM/yyyy"
            />
          </div>
          <Button
            type="primary"
            size="small"
            style={{ backgroundColor: "#478c83", borderColor: "#478c83" }}
            onClick={handleSubmit}
            loading={loadingValues}
          >
            Submit
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 my-4 bg-[#EDF7F4] py-1.5 px-2 rounded-md select-none">
        <InfoCircleOutlined style={{ color: "#478c83" }} />
        <p className="text-gray-500 text-xs">
          Compare your vehicle performance.
        </p>
      </div>

      <div className="border rounded-sm min-h-[400px] overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#478c83] mx-auto mb-2"></div>
              <p className="text-gray-500">Loading vehicles...</p>
            </div>
          </div>
        ) : selectedVehicles.length === 0 ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="mb-4">
                <img
                  src="/assets/svgs/fleet/truckIcon.png"
                  alt="No vehicles selected"
                  width={80}
                  height={80}
                  style={{ objectFit: "contain", opacity: 0.5 }}
                  className="mx-auto"
                  draggable={false}
                />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Select A Vehicle to Continue
              </h3>
              <p className="text-gray-500 text-sm mb-2">
                Choose vehicles from the dropdown above to start comparing fleet
                performance
              </p>
              <p className="text-teal-600 text-sm font-medium">
                Total Vehicles: {allowedVehicles.length}
              </p>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={staticData}
            pagination={false}
            bordered={false}
            size="large"
            className="fleet-comparison-table"
            rowClassName={(record, index) =>
              index % 2 === 0 ? "bg-gray-50" : "bg-white"
            }
            scroll={{ x: "max-content" }}
            style={{
              backgroundColor: "white",
            }}
          />
        )}
      </div>

      {selectedVehicles.length > 0 && (
        <>
          <div className="mt-6">
            <div
              className="border rounded-sm bg-white overflow-x-auto"
              style={{
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                overflow: "hidden auto",
              }}
            >
              {/* Route Row - White background (like Summary row) */}
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
                    <span className="text-gray-600">🗺️</span>
                    <span className="text-gray-700 font-medium">Route</span>
                  </div>
                </div>
              </div>

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
                  <span className="text-gray-700 font-medium">Kilometer</span>
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
                      {loadingFleetData ||
                      loadingDiagnostic ||
                      !fleetData[index] ||
                      fleetData[index]?.loading ? (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#478c83]"></div>
                        </div>
                      ) : (
                        `${fleetData[index]?.totalRunningDistanceKM || 0} KM`
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Replay Row - White background (like Gear Utilization row) */}
              <div
                className="flex bg-white"
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
                  <span className="text-gray-700 font-medium">Replay</span>
                </div>
                {selectedVehicles.map((vehicle, index) => (
                  <div
                    key={index}
                    className="flex-1 flex items-center justify-center"
                    style={{
                      padding: "16px 8px",
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-blue-500 text-2xl">
                        <img
                          src="/assets/svgs/fleet/route.png"
                          alt="Replay Icon"
                          width={24}
                          height={24}
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <p
                        className="text-[#1884F8] hover:text-[#1884f8e0] p-0 cursor-pointer"
                        onClick={() => {
                          handleViewReplay(vehicle, index);
                        }}
                      >
                        View Replay
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle Usage Section */}
          <VehicleUsage
            firstFourVehicles={selectedVehicles}
            fleetData={fleetData}
            loadingFleetData={loadingFleetData}
            loadingDiagnostic={loadingDiagnostic}
            isLoading={isLoading}
          />

          {/* Driving Behavior Section */}
          <DrivingBehavior
            selectedVehicles={selectedVehicles}
            fleetData={fleetData}
            loadingFleetData={loadingFleetData}
            loadingDiagnostic={loadingDiagnostic}
          />

          {/* Gear Utilization Section */}
          <GearUtilization
            selectedVehicles={selectedVehicles}
            gearData={gearData}
            loadingGear={loadingGear}
          />

          {/* Current State Section */}
          <CurrentState
            selectedVehicles={selectedVehicles}
            vehiclesData={selectedVehicles}
            loadingVehicles={isLoading}
          />
        </>
      )}

      <RouteReport
        isOpen={replayModal.open}
        vehicle={replayModal.vehicle}
        pathData={replayModal.pathData}
        loading={replayModal.loading}
        onClose={() => {
          setReplayModal({
            open: false,
            vehicle: null,
            pathData: null,
            loading: false,
          });
        }}
      />
    </div>
  );
};

export default View;
