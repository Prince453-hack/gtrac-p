"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.8.0/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.8.0/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.8.0/images/marker-shadow.png",
});

// Create custom icons for different vehicle states with vehicle number
const createVehicleIcon = (status: string, vehicleNumber: string) => {
  const color = status === "RUNNING" ? "#10b981" : "#ef4444";

  return L.divIcon({
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      ">
        <!-- Vehicle Number Label -->
        <div style="
          background-color: white;
          color: ${color};
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid ${color};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          white-space: nowrap;
          margin-bottom: 2px;
          min-width: fit-content;
        ">
          ${vehicleNumber}
        </div>
        
        <!-- Vehicle Marker -->
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background-color: white;
            border-radius: 50%;
          "></div>
          ${
            status === "RUNNING"
              ? `
            <div style="
              position: absolute;
              width: 20px;
              height: 20px;
              border: 2px solid ${color};
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          `
              : ""
          }
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      </style>
    `,
    className: "vehicle-marker",
    iconSize: [120, 40],
    iconAnchor: [60, 35],
  });
};

interface VehicleData {
  vId: number;
  vehReg: string;
  gpsDtl?: {
    mode: string;
    latLngDtl?: {
      lat: number;
      lng: number;
      addr: string;
    };
  };
}

interface VehicleHistory {
  [vehicleId: string]: Array<{
    lat: number;
    lng: number;
    timestamp: number;
  }>;
}

interface MapComponentProps {
  vehicles: VehicleData[];
  selectedVehicleIds: string[];
  onClose: () => void;
}

// Component to handle map updates when vehicles are selected
const MapUpdater: React.FC<{
  displayVehicles: VehicleData[];
  selectedVehicleIds: string[];
}> = ({ displayVehicles, selectedVehicleIds }) => {
  const map = useMap();
  const userHasInteractedRef = useRef(false);

  useMapEvents({
    dragstart: () => {
      userHasInteractedRef.current = true;
    },
    zoomstart: () => {
      userHasInteractedRef.current = true;
    },
    movestart: () => {
      userHasInteractedRef.current = true;
    },
  });

  useEffect(() => {
    userHasInteractedRef.current = false;
  }, [selectedVehicleIds]);

  useEffect(() => {
    if (displayVehicles.length === 0 || userHasInteractedRef.current) return;

    if (displayVehicles.length === 1) {
      // Single vehicle: zoom to specific location
      const vehicle = displayVehicles[0];
      const lat = vehicle.gpsDtl?.latLngDtl?.lat;
      const lng = vehicle.gpsDtl?.latLngDtl?.lng;

      if (lat && lng) {
        map.setView([lat, lng], 16, { animate: true, duration: 1 });
      }
    } else if (displayVehicles.length > 1) {
      // Multiple vehicles: fit bounds to show all vehicles
      const coordinates: [number, number][] = displayVehicles
        .filter(
          (vehicle) =>
            vehicle.gpsDtl?.latLngDtl?.lat && vehicle.gpsDtl?.latLngDtl?.lng,
        )
        .map((vehicle) => [
          vehicle.gpsDtl!.latLngDtl!.lat,
          vehicle.gpsDtl!.latLngDtl!.lng,
        ]);

      if (coordinates.length > 1) {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1,
        });
      }
    }
  }, [map, displayVehicles]);

  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({
  vehicles,
  selectedVehicleIds,
  onClose,
}) => {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Reset vehicle history when component mounts or live mode changes
  useEffect(() => {
    setVehicleHistory({});
  }, [isLiveMode]);

  // Filter vehicles that have valid coordinates and are selected
  const displayVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const hasCoords =
        vehicle.gpsDtl?.latLngDtl?.lat && vehicle.gpsDtl?.latLngDtl?.lng;
      const isSelected = selectedVehicleIds.includes(vehicle.vId.toString());
      return hasCoords && isSelected;
    });
  }, [vehicles, selectedVehicleIds]);

  // Clean up history for vehicles that are no longer selected
  useEffect(() => {
    const selectedVehicleIdSet = new Set(selectedVehicleIds);

    setVehicleHistory((prev) => {
      const cleanedHistory: VehicleHistory = {};

      // Only keep history for currently selected vehicles
      Object.keys(prev).forEach((vehicleId) => {
        if (selectedVehicleIdSet.has(vehicleId)) {
          cleanedHistory[vehicleId] = prev[vehicleId];
        }
      });

      return cleanedHistory;
    });
  }, [selectedVehicleIds]);

  // Update vehicle history for trail visualization
  useEffect(() => {
    if (isLiveMode && displayVehicles.length > 0) {
      const currentTime = Date.now();
      setLastUpdateTime(currentTime);

      setVehicleHistory((prev) => {
        const newHistory = { ...prev };

        displayVehicles.forEach((vehicle) => {
          const vehicleId = vehicle.vId.toString();
          const lat = vehicle.gpsDtl?.latLngDtl?.lat;
          const lng = vehicle.gpsDtl?.latLngDtl?.lng;

          if (lat && lng) {
            // Reset history for newly selected vehicles (start fresh)
            if (!newHistory[vehicleId]) {
              newHistory[vehicleId] = [];
            }

            // Add new position if different from last position
            const lastPosition =
              newHistory[vehicleId][newHistory[vehicleId].length - 1];
            if (
              !lastPosition ||
              lastPosition.lat !== lat ||
              lastPosition.lng !== lng
            ) {
              newHistory[vehicleId].push({
                lat,
                lng,
                timestamp: currentTime,
              });
            }

            if (newHistory[vehicleId].length > 20) {
              newHistory[vehicleId] = newHistory[vehicleId].slice(-20);
            }
          }
        });

        return newHistory;
      });
    }
  }, [displayVehicles, isLiveMode]);

  // Update last update time when vehicle data changes (from parent polling)
  useEffect(() => {
    if (isLiveMode) {
      setLastUpdateTime(Date.now());
    }
  }, [vehicles, isLiveMode]);

  // Calculate center point based on displayed vehicles
  const mapCenter = useMemo(() => {
    if (displayVehicles.length === 0) {
      // Default to Singapore coordinates if no vehicles
      return [1.3521, 103.8198] as [number, number];
    }

    const totalLat = displayVehicles.reduce(
      (sum, vehicle) => sum + (vehicle.gpsDtl?.latLngDtl?.lat || 0),
      0,
    );
    const totalLng = displayVehicles.reduce(
      (sum, vehicle) => sum + (vehicle.gpsDtl?.latLngDtl?.lng || 0),
      0,
    );

    return [
      totalLat / displayVehicles.length,
      totalLng / displayVehicles.length,
    ] as [number, number];
  }, [displayVehicles]);

  // Determine zoom level based on number of vehicles
  const zoomLevel = useMemo(() => {
    if (displayVehicles.length === 0) return 11;
    if (displayVehicles.length === 1) return 15;
    return 12;
  }, [displayVehicles.length]);

  const formatAddress = (addr: string) => {
    if (!addr) return "Unknown Location";
    return addr.replaceAll("_", " ");
  };

  return (
    <div className="relative w-full h-full">
      {/* Live/History Toggle */}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[1000] bg-white shadow-lg hover:shadow-xl text-gray-700 px-4 py-2 rounded-lg font-medium transition-all border border-gray-200"
      >
        Hide Map
      </button>

      {/* Vehicle count info */}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height: "100%", width: "100%" }}
        className="leaflet-container"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Map updater component to handle dynamic zoom/bounds */}
        <MapUpdater
          displayVehicles={displayVehicles}
          selectedVehicleIds={selectedVehicleIds}
        />

        {/* Vehicle route trails in live mode */}
        {isLiveMode &&
          Object.entries(vehicleHistory).map(([vehicleId, history]) => {
            if (history.length < 2) return null;

            const positions: [number, number][] = history.map((point) => [
              point.lat,
              point.lng,
            ]);
            const vehicle = displayVehicles.find(
              (v) => v.vId.toString() === vehicleId,
            );
            const isRunning = vehicle?.gpsDtl?.mode === "RUNNING";

            return (
              <Polyline
                key={`trail-${vehicleId}`}
                positions={positions}
                pathOptions={{
                  color: isRunning ? "#10b981" : "#ef4444",
                  weight: 3,
                  opacity: 0.7,
                  dashArray: isRunning ? undefined : "5, 10",
                }}
              />
            );
          })}

        {displayVehicles.map((vehicle) => {
          const lat = vehicle.gpsDtl?.latLngDtl?.lat;
          const lng = vehicle.gpsDtl?.latLngDtl?.lng;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={vehicle.vId}
              position={[lat, lng]}
              icon={createVehicleIcon(
                vehicle.gpsDtl?.mode || "STOPPED",
                vehicle.vehReg,
              )}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="font-semibold text-gray-800 mb-2">
                    {vehicle.vehReg}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          vehicle.gpsDtl?.mode === "RUNNING"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {vehicle.gpsDtl?.mode || "Unknown"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="font-medium text-gray-600">
                        Location:
                      </span>
                      <p className="text-gray-700 mt-1 text-xs leading-relaxed">
                        {formatAddress(
                          vehicle.gpsDtl?.latLngDtl?.addr || "Unknown Location",
                        )}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
                    </div>

                    {isLiveMode && (
                      <div className="text-xs text-green-600 mt-1 font-medium">
                        • Live Tracking Active
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* No vehicles message */}
      {displayVehicles.length === 0 && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center z-[500]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No vehicles to display
            </h3>
            <p className="text-gray-500">
              {selectedVehicleIds.length > 0
                ? "Selected vehicles don't have valid GPS coordinates"
                : "Please select vehicles from the sidebar to view them on the map"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
