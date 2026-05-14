"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  useGetVehiclesByStatusQuery,
  useLazyGetVehiclesByStatusQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { Checkbox, Switch, Tooltip } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import MapComponent from "./MapComponent";

const View = () => {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isApiEnabled, setIsApiEnabled] = useState(true); // Default to ON
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarVehicles, setSidebarVehicles] = useState<VehicleData[]>([]);
  const [hasSidebarSnapshot, setHasSidebarSnapshot] = useState(false);
  const [liveVehicles, setLiveVehicles] = useState<VehicleData[]>([]);

  const { userId, groupId } = useSelector((state: RootState) => state.auth);

  const {
    data: vehicleData,
    isLoading,
    isFetching,
  } = useGetVehiclesByStatusQuery(
    {
      token: groupId,
      userId: userId,
      pUserId: userId,
      mode: "",
    },
    {
      skip: !groupId || !userId || !isApiEnabled,
      refetchOnMountOrArgChange: true,
    },
  );

  const [triggerLiveVehicleQuery] = useLazyGetVehiclesByStatusQuery();

  const runningVehicles = React.useMemo(() => {
    return (
      vehicleData?.list?.filter(
        (vehicle: VehicleData) => vehicle.gpsDtl?.mode === "RUNNING",
      ) || []
    );
  }, [vehicleData]);

  useEffect(() => {
    setSidebarVehicles([]);
    setHasSidebarSnapshot(false);
  }, [groupId, userId, isApiEnabled]);

  useEffect(() => {
    if (!isApiEnabled || hasSidebarSnapshot || !vehicleData) {
      return;
    }

    const initialSidebarVehicles =
      vehicleData.list?.filter(
        (vehicle: VehicleData) => vehicle.gpsDtl?.mode === "RUNNING",
      ) || [];

    setSidebarVehicles(initialSidebarVehicles);
    setHasSidebarSnapshot(true);
  }, [vehicleData, isApiEnabled, hasSidebarSnapshot]);

  // Filter vehicles based on search term
  const filteredVehicles = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return sidebarVehicles;
    }

    return sidebarVehicles.filter(
      (vehicle: VehicleData) =>
        vehicle.vehReg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.gpsDtl?.latLngDtl?.addr
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
  }, [sidebarVehicles, searchTerm]);

  // Stable handler to prevent re-renders
  const handleVehicleSelect = useCallback(
    (vehicleId: string, checked: boolean) => {
      if (checked) {
        setSelectedVehicles((prev) => {
          const newSelection = [...prev, vehicleId];

          return newSelection;
        });
      } else {
        setSelectedVehicles((prev) => {
          const newSelection = prev.filter((id) => id !== vehicleId);

          return newSelection;
        });
      }
    },
    [],
  );

  // Use filtered vehicles for enhanced running vehicles
  const enhancedRunningVehicles = showMap ? liveVehicles : filteredVehicles;

  const formatAddress = (addr: string) => {
    if (!addr) return "Unknown Location";
    return addr.replaceAll("_", " ");
  };

  useEffect(() => {
    if (!showMap || !isApiEnabled || !groupId || !userId) {
      return;
    }

    let isActive = true;

    const fetchLiveVehicles = async () => {
      try {
        const result = await triggerLiveVehicleQuery({
          token: groupId,
          userId: userId,
          pUserId: userId,
          mode: "",
        }).unwrap();

        if (!isActive) {
          return;
        }

        setLiveVehicles(result?.list || []);
      } catch {
        if (isActive) {
          setLiveVehicles([]);
        }
      }
    };

    fetchLiveVehicles();
    const interval = window.setInterval(fetchLiveVehicles, 10000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [showMap, isApiEnabled, groupId, userId, triggerLiveVehicleQuery]);

  useEffect(() => {
    if (!showMap) {
      setLiveVehicles([]);
    }
  }, [showMap]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full absolute"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full relative animate-ping"></div>
            <h1 className="text-lg font-semibold text-gray-800">
              Live Vehicle Tracking
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Vehicles Count:{" "}
              {isLoading || isFetching ? (
                <LoadingOutlined />
              ) : (
                runningVehicles.length
              )}
            </p>
            <div className="flex items-center gap-2">
              <Tooltip
                title={isApiEnabled ? "Live" : "Offline"}
                mouseEnterDelay={1}
              >
                <Switch
                  size="small"
                  checked={isApiEnabled}
                  onChange={setIsApiEnabled}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
              </Tooltip>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search vehicles by registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-gray-600"
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
              )}
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)] pb-10">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 animate-pulse">
              Loading vehicles...
            </div>
          ) : runningVehicles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No running vehicles found
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No vehicles found matching &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            filteredVehicles.map((vehicle: VehicleData) => {
              const vehicleKey = `vehicle-${vehicle.vId}`;
              const hasGpsData =
                vehicle.gpsDtl?.latLngDtl?.lat &&
                vehicle.gpsDtl?.latLngDtl?.lng;

              return (
                <div key={vehicleKey} className="p-2">
                  <div className="flex items-start gap-3 border border-l-2 shadow-sm border-l-blue-600 rounded-md p-1 relative">
                    <span className="absolute top-1 right-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Running
                    </span>

                    <Checkbox
                      checked={selectedVehicles.includes(
                        vehicle.vId.toString(),
                      )}
                      onChange={(e) =>
                        handleVehicleSelect(
                          vehicle.vId.toString(),
                          e.target.checked,
                        )
                      }
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0 pr-16">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {vehicle.vehReg}
                        </span>
                      </div>

                      <div className="flex items-start gap-1">
                        <svg
                          className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs text-gray-600 line-clamp-2">
                          {formatAddress(
                            vehicle.gpsDtl?.latLngDtl?.addr ||
                              "Unknown Location",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        {showMap ? (
          <MapComponent
            vehicles={enhancedRunningVehicles}
            selectedVehicleIds={selectedVehicles}
            onClose={() => setShowMap(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Live Vehicle Tracking
              </h3>
              <p className="text-gray-500 mb-4">
                Select vehicles from the sidebar to track them on the map
              </p>
              <button
                onClick={() => setShowMap(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Show Map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default View;
