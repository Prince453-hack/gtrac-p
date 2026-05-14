"use client";

import { useLazyGetRawGearDataByVehicleAndDateQuery } from "@/app/_globalRedux/services/gearDetails";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetVehicleReportQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { Button, DatePicker, Select, Tooltip } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import AlertTabs from "../fleet-report/alert-tabs";
import GearEngineSpeed from "../fleet-report/gear-engine-speed";
import GearUtilization from "../fleet-report/gear-utilization";
import FuelEfficiencyReport from "./fuel-efficiency-report";

const View = () => {
  const yesterday = dayjs().subtract(1, "day");
  const sevenDaysAgoFromYesterday = dayjs().subtract(8, "days");
  const [timePeriod, setTimePeriod] = useState("Last 7 days");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    sevenDaysAgoFromYesterday.startOf("day"),
    yesterday.endOf("day"),
  ]);
  const [committedDateRange, setCommittedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs]
  >([sevenDaysAgoFromYesterday.startOf("day"), yesterday.endOf("day")]);
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleData[]>([]);
  const [gearDataMap, setGearDataMap] = useState<Map<number, any>>(new Map());
  const [loadingGear, setLoadingGear] = useState(false);

  const [selectedEngineSpeedVehicle, setSelectedEngineSpeedVehicle] =
    useState<VehicleData | null>(null);
  const [loadingEngineSpeedGear, setLoadingEngineSpeedGear] = useState(false);

  const [previousSelectedVehicles, setPreviousSelectedVehicles] = useState<
    VehicleData[]
  >([]);

  // State to manage which vehicles are selected for display
  const [selectedReportVehicles, setSelectedReportVehicles] = useState<
    VehicleData[]
  >([]);

  const [limitedVehiclesState, setLimitedVehiclesState] = useState<
    VehicleData[]
  >([]);

  const [vehicleReportDataMap, setVehicleReportDataMap] = useState<
    Map<number, any>
  >(new Map());
  const [loadingVehicleReport, setLoadingVehicleReport] = useState(false);
  const [ratioFromStandstill, setRatioFromStandstill] = useState(false);

  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth
  ) || {
    userId: "833105",
    groupId: "59872",
    parentUser: "1",
  };

  // Get vehicles list
  const { data: vehiclesData, isLoading: vehiclesLoading } =
    useGetVehiclesByStatusQuery({
      token: groupId?.toString() || "59872",
      userId: userId?.toString() || "833105",
      pUserId: parentUser?.toString() || "1",
      mode: "",
    });

  const allVehicles = vehiclesData?.list || [];

  const allowedVehicles = useMemo(() => {
    return allVehicles.filter((vehicle: any) => {
      return vehicle.gpsDtl.fuel && vehicle.gpsDtl.fuel <= 100;
    });
  }, [allVehicles]);

  const limitedVehicles = useMemo(() => {
    // If we have a manually set state, use that
    if (limitedVehiclesState.length > 0) {
      return limitedVehiclesState;
    }

    const shuffled = [...allowedVehicles].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(6, shuffled.length));
  }, [allowedVehicles, limitedVehiclesState]);

  const [fetchGearData] = useLazyGetRawGearDataByVehicleAndDateQuery();
  const [getVehicleReport] = useLazyGetVehicleReportQuery();

  const alertTabsProps = useMemo(
    () => ({
      selectedVehicles: selectedReportVehicles,
      dateRange: [
        committedDateRange[0].format("YYYY-MM-DD HH:mm:ss"),
        committedDateRange[1].format("YYYY-MM-DD HH:mm:ss"),
      ] as [string, string],
      vehicleReportDataMap,
    }),
    [selectedReportVehicles, committedDateRange, vehicleReportDataMap]
  );

  useEffect(() => {
    if (limitedVehicles.length > 0 && selectedVehicles.length === 0) {
      const initialVehicles = limitedVehicles.slice(
        0,
        Math.min(3, limitedVehicles.length)
      );
      setSelectedVehicles(initialVehicles);
      setPreviousSelectedVehicles([]);
    }
  }, [limitedVehicles]);

  useEffect(() => {
    if (allowedVehicles.length > 0 && limitedVehiclesState.length === 0) {
      const shuffled = [...allowedVehicles].sort(() => 0.5 - Math.random());
      const initialLimited = shuffled.slice(0, Math.min(6, shuffled.length));
      setLimitedVehiclesState(initialLimited);
    }
  }, [allowedVehicles, limitedVehiclesState.length]);

  // Remove auto-selection for report vehicles - let user manually select

  const fetchGearDataForSingleVehicle = async (vehicle: VehicleData) => {
    setLoadingGear(true);

    try {
      const params = {
        vId: vehicle.vId,
        startdate: committedDateRange[0].format("YYYY-MM-DD HH:mm:ss"),
        enddate: committedDateRange[1].format("YYYY-MM-DD HH:mm:ss"),
        requestfor: parseInt(groupId?.toString() || "59872"),
        userid: userId?.toString() || "833105",
        interval: 1,
      };

      const result = await fetchGearData(params).unwrap();

      setGearDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(vehicle.vId, result);
        return newMap;
      });
    } catch (error) {
      console.error(
        `Error fetching gear data for vehicle ${vehicle.vId}:`,
        error
      );
      // Store null for failed requests
      setGearDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(vehicle.vId, null);
        return newMap;
      });
    } finally {
      setLoadingGear(false);
    }
  };

  const fetchVehicleReportForVehicles = async (forceRefresh = false) => {
    if (allowedVehicles.length === 0) {
      setVehicleReportDataMap(new Map());
      setLoadingVehicleReport(false);
      return;
    }

    setLoadingVehicleReport(true);

    try {
      const reportPromises = allowedVehicles.map(async (vehicle) => {
        const params = {
          vId: vehicle.vId,
          startdate: committedDateRange[0].format("YYYY-MM-DD"),
          enddate: committedDateRange[1].format("YYYY-MM-DD"),
          requestfor: parseInt(groupId?.toString() || "59872"),
          userid: parseInt(userId?.toString() || "833105"),
        };

        try {
          const result = await getVehicleReport(params).unwrap();
          return { vehicleId: vehicle.vId, data: result };
        } catch (error) {
          console.error(
            `Error fetching vehicle report data for vehicle ${vehicle.vId}:`,
            error
          );
          return { vehicleId: vehicle.vId, data: null };
        }
      });

      const reportResults = await Promise.all(reportPromises);

      // Create new map with all the results
      const newVehicleReportDataMap = new Map();
      reportResults.forEach((result) => {
        newVehicleReportDataMap.set(result.vehicleId, result.data);
      });

      setVehicleReportDataMap(newVehicleReportDataMap);
    } catch (error) {
      console.error("Error fetching vehicle report data:", error);
      setVehicleReportDataMap(new Map());
    } finally {
      setLoadingVehicleReport(false);
    }
  };

  const fetchGearDataForVehicles = async (forceRefresh = false) => {
    if (selectedVehicles.length === 0) {
      setGearDataMap(new Map());
      setLoadingGear(false);
      setPreviousSelectedVehicles([]);
      return;
    }

    setLoadingGear(true);

    try {
      // Fetch data in parallel for all vehicles
      const gearPromises = selectedVehicles.map(async (vehicle) => {
        try {
          const params = {
            vId: vehicle.vId,
            startdate: committedDateRange[0].format("YYYY-MM-DD HH:mm:ss"),
            enddate: committedDateRange[1].format("YYYY-MM-DD HH:mm:ss"),
            requestfor: parseInt(groupId?.toString() || "59872"),
            userid: userId?.toString() || "833105",
            interval: 1,
          };

          const result = await fetchGearData(params).unwrap();
          return { vehicleId: vehicle.vId, data: result };
        } catch (error) {
          console.error(
            `Error fetching gear data for vehicle ${vehicle.vId}:`,
            error
          );
          return { vehicleId: vehicle.vId, data: null };
        }
      });

      const gearResults = await Promise.all(gearPromises);

      // Update the gear data map with all results
      setGearDataMap((prev) => {
        const newMap = new Map(prev);
        gearResults.forEach((result) => {
          newMap.set(result.vehicleId, result.data);
        });
        return newMap;
      });

      setPreviousSelectedVehicles([...selectedVehicles]);
    } catch (error) {
      console.error("Error fetching gear data:", error);
      setGearDataMap(new Map());
    } finally {
      setLoadingGear(false);
    }
  };

  const [dropdownValue, setDropdownValue] = useState<string | null>(null);

  const handleAddVehicle = (vehicleId: string) => {
    const vehicle = allowedVehicles.find((v) => v.vId === parseInt(vehicleId));
    if (vehicle && selectedVehicles.length < 3 && !ratioFromStandstill) {
      setSelectedVehicles((prev) => [...prev, vehicle]);
      setDropdownValue(null);
      fetchGearDataForSingleVehicle(vehicle);
    }
  };

  const handleRemoveVehicle = (vehicle: VehicleData) => {
    setSelectedVehicles((prev) => prev.filter((v) => v.vId !== vehicle.vId));
    setDropdownValue(null);
    setGearDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(vehicle.vId);
      return newMap;
    });
    // Reset ratio from standstill when vehicle selection changes
    setRatioFromStandstill(false);
  };

  useEffect(() => {
    if (selectedVehicles.length > 0 && previousSelectedVehicles.length === 0) {
      fetchGearDataForVehicles(false);
    } else if (selectedVehicles.length === 0) {
      setGearDataMap(new Map());
      setLoadingGear(false);
      setPreviousSelectedVehicles([]);
    }

    // Reset ratio from standstill if vehicle count changes
    if (selectedVehicles.length !== 1) {
      setRatioFromStandstill(false);
    }
  }, [selectedVehicles, previousSelectedVehicles]);

  useEffect(() => {
    if (allowedVehicles.length > 0) {
      fetchVehicleReportForVehicles(false);
    } else {
      setVehicleReportDataMap(new Map());
      setLoadingVehicleReport(false);
    }
  }, [allowedVehicles, committedDateRange]);

  useEffect(() => {
    if (limitedVehiclesState.length > 0) {
      // Alert tabs vehicles are now based on limitedVehiclesState
      const alertTabsVehicles = limitedVehiclesState;
    }
  }, [limitedVehiclesState]);

  useEffect(() => {
    if (selectedVehicles.length > 0) {
      fetchGearDataForVehicles(true);
    }
  }, [committedDateRange]);

  const handleEngineSpeedVehicleChange = async (vehicle: VehicleData) => {
    setSelectedEngineSpeedVehicle(vehicle);

    if (gearDataMap.has(vehicle.vId)) {
      return;
    }

    setLoadingEngineSpeedGear(true);
    try {
      const params = {
        vId: vehicle.vId,
        startdate: committedDateRange[0].format("YYYY-MM-DD HH:mm:ss"),
        enddate: committedDateRange[1].format("YYYY-MM-DD HH:mm:ss"),
        requestfor: parseInt(groupId?.toString() || "59872"),
        userid: userId?.toString() || "833105",
        interval: 1,
      };

      const result = await fetchGearData(params).unwrap();

      // Store the data in the same gearDataMap
      setGearDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(vehicle.vId, result);
        return newMap;
      });
    } catch (error) {
      console.error("Error fetching engine speed gear data:", error);
      // Store null for failed requests
      setGearDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(vehicle.vId, null);
        return newMap;
      });
    } finally {
      setLoadingEngineSpeedGear(false);
    }
  };

  const timePeriodOptions = [
    { value: "Yesterday", label: "Yesterday" },
    { value: "Today", label: "Today" },
    { value: "Last 7 days", label: "Last 7 days" },
    { value: "Last 15 days", label: "Last 15 days" },
    { value: "Last 30 days", label: "Last 30 days" },
    { value: "Custom", label: "Custom" },
  ];

  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
    const today = dayjs();
    const yesterday = today.subtract(1, "day");

    let newDateRange: [dayjs.Dayjs, dayjs.Dayjs];

    switch (value) {
      case "Yesterday":
        newDateRange = [yesterday.startOf("day"), yesterday.endOf("day")];
        break;
      case "Today":
        newDateRange = [today.startOf("day"), today.endOf("day")];
        break;
      case "Last 7 days":
        newDateRange = [
          today.subtract(8, "day").startOf("day"),
          yesterday.endOf("day"),
        ];
        break;
      case "Last 15 days":
        newDateRange = [
          today.subtract(16, "day").startOf("day"),
          yesterday.endOf("day"),
        ];
        break;
      case "Last 30 days":
        newDateRange = [
          today.subtract(31, "day").startOf("day"),
          yesterday.endOf("day"),
        ];
        break;
      default:
        return;
    }

    setDateRange(newDateRange);
  };

  const handleSet = () => {
    setCommittedDateRange(dateRange);
    setGearDataMap(new Map());
    setVehicleReportDataMap(new Map());
    if (selectedVehicles.length > 0) {
      fetchGearDataForVehicles(true);
      fetchVehicleReportForVehicles(true);
    }
  };

  const gearDataArray = useMemo(() => {
    return selectedVehicles.map(
      (vehicle) => gearDataMap.get(vehicle.vId) || null
    );
  }, [selectedVehicles, gearDataMap]);

  const engineSpeedGearData = useMemo(() => {
    if (!selectedEngineSpeedVehicle) return [];
    const data = gearDataMap.get(selectedEngineSpeedVehicle.vId);
    return data ? [data] : [];
  }, [selectedEngineSpeedVehicle, gearDataMap]);

  return (
    <div className="p-5 bg-[#FFFFFF] min-h-screen overflow-y-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-800">
              Fleet Performance
            </h1>
            <span className="text-sm text-gray-500">
              Show:{" "}
              <span className="text-gray-800 font-medium">Last 7 days</span>
            </span>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            {/* Time Period */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600 mb-1">
                Time Period
              </span>
              <Select
                value={timePeriod}
                onChange={handleTimePeriodChange}
                style={{ width: 160 }}
                options={timePeriodOptions}
              />
            </div>

            {/* From Date */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600 mb-1">
                From
              </span>
              <DatePicker
                value={dateRange[0]}
                onChange={(date) => {
                  if (date) {
                    setDateRange([date, dateRange[1]]);
                    setTimePeriod("Custom");
                  }
                }}
                format="DD MMM, YYYY"
                style={{ width: 140 }}
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600 mb-1">To</span>
              <DatePicker
                value={dateRange[1]}
                onChange={(date) => {
                  if (date) {
                    setDateRange([dateRange[0], date]);
                    setTimePeriod("Custom");
                  }
                }}
                format="DD MMM, YYYY"
                style={{ width: 140 }}
              />
            </div>

            {/* Set Button */}
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
      </div>

      {/* Vehicle Selection Container */}
      <div className="mb-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Selected Vehicles for Reports
          </h2>

          <div className="flex items-center space-x-3">
            <div className="flex flex-wrap gap-3 mb-4">
              {selectedReportVehicles.map((vehicle) => (
                <div
                  key={vehicle.vId}
                  className="flex items-center text-[#478c83] p-2 rounded-lg border border-[#478c83]"
                >
                  <span className="font-semibold mr-2">
                    {vehicle.vehReg || `Vehicle ${vehicle.vId}`}
                  </span>
                  <button
                    onClick={() => {
                      const updatedVehicles = selectedReportVehicles.filter(
                        (v) => v.vId !== vehicle.vId
                      );
                      setSelectedReportVehicles(updatedVehicles);
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

            {selectedReportVehicles.length < allowedVehicles.length && (
              <div className="flex items-center gap-3 -mt-2.5">
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
                      !selectedReportVehicles.some((v) => v.vId === vehicle.vId)
                    ) {
                      const updatedVehicles = [
                        ...selectedReportVehicles,
                        vehicle,
                      ];
                      setSelectedReportVehicles(updatedVehicles);
                    }
                  }}
                  options={allowedVehicles
                    .filter(
                      (vehicle: any) =>
                        !selectedReportVehicles.some(
                          (v) => v.vId === vehicle.vId
                        )
                    )
                    .map((vehicle: any) => ({
                      value: vehicle.vId.toString(),
                      label: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                    }))}
                />
              </div>
            )}

            {/* Show count info */}
            <div className="flex items-center gap-3 -mt-2.5">
              <span className="text-sm text-gray-600">
                Showing {selectedReportVehicles.length} of{" "}
                {allowedVehicles.length} available vehicles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Efficiency Report */}
      <FuelEfficiencyReport
        dateRange={committedDateRange}
        limitedVehicles={selectedReportVehicles}
        userId={userId?.toString() || "833105"}
        groupId={groupId?.toString() || "59872"}
        vehicleReportDataMap={vehicleReportDataMap}
        loadingVehicleReport={loadingVehicleReport}
      />

      {/* Alert Tabs */}
      <div className="mt-8">
        <AlertTabs {...alertTabsProps} />
      </div>

      {/* Gear Utilization Section */}
      <div className="mt-8">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Gear Utilization
          </h2>

          {/* Vehicle Selection */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Selected Vehicles
              </h3>
            </div>

            {/* Display selected vehicles with cross buttons and controls on same row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex flex-wrap gap-3">
                  {selectedVehicles.map((vehicle) => (
                    <div
                      key={vehicle.vId}
                      className="flex items-center bg-[#478c8325] text-[#478c83] p-2 rounded-lg border"
                    >
                      <span className="font-medium mr-2">
                        {vehicle.vehReg || `Vehicle ${vehicle.vId}`}
                      </span>
                      <button
                        onClick={() =>
                          !ratioFromStandstill && handleRemoveVehicle(vehicle)
                        }
                        className={`text-[#478c83] hover:text-white hover:bg-[#478c8369] rounded-full p-1 transition-colors ${
                          ratioFromStandstill
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title={
                          ratioFromStandstill
                            ? "Disable Ratio from Standstill to remove vehicles"
                            : "Remove vehicle"
                        }
                        disabled={ratioFromStandstill}
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

                {/* Add vehicle dropdown */}
                {selectedVehicles.length < 3 && !ratioFromStandstill && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Add Vehicle:</span>
                    <Select
                      placeholder="Select a vehicle to add"
                      style={{ width: 200 }}
                      value={dropdownValue}
                      onChange={handleAddVehicle}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={allowedVehicles
                        .filter(
                          (vehicle) =>
                            !selectedVehicles.some((v) => v.vId === vehicle.vId)
                        )
                        .map((vehicle) => ({
                          value: vehicle.vId.toString(),
                          label: vehicle.vehReg || `Vehicle ${vehicle.vId}`,
                        }))}
                    />
                  </div>
                )}
              </div>

              {/* Ratio from Standstill Section - moved to right side */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-800">
                  Ratio from Standstill
                </span>
                <Tooltip
                  title={
                    selectedVehicles.length !== 1
                      ? "Select only one vehicle to enable this"
                      : ""
                  }
                  placement="top"
                >
                  <Button
                    size="small"
                    type={ratioFromStandstill ? "primary" : "default"}
                    disabled={selectedVehicles.length !== 1}
                    onClick={() => {
                      if (selectedVehicles.length === 1) {
                        setRatioFromStandstill(!ratioFromStandstill);
                      }
                    }}
                    className={`min-w-[50px] ${
                      selectedVehicles.length !== 1
                        ? "cursor-not-allowed opacity-50"
                        : ratioFromStandstill
                        ? "bg-blue-600 hover:bg-blue-700 border-blue-600"
                        : "hover:border-blue-600 hover:text-blue-600"
                    }`}
                  >
                    {ratioFromStandstill ? "ON" : "OFF"}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Gear Utilization Charts */}
          <GearUtilization
            selectedVehicles={selectedVehicles}
            gearData={gearDataArray}
            loadingGear={loadingGear}
            ratioFromStandstill={ratioFromStandstill}
          />
        </div>
      </div>

      {/* Gear Engine Speed Distribution */}
      <GearEngineSpeed
        allVehicles={selectedVehicles}
        gearData={engineSpeedGearData}
        loadingGear={loadingEngineSpeedGear}
        onVehicleChange={handleEngineSpeedVehicleChange}
      />
    </div>
  );
};

export default View;
