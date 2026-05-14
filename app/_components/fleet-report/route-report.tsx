"use client";

import { Modal } from "antd";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const startIcon = new L.Icon({
  iconUrl: "/assets/images/map/start-end-flags/start-flag.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const endIcon = new L.Icon({
  iconUrl: "/assets/images/map/start-end-flags/end-flag.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to fit map bounds to show all path points
const FitBounds: React.FC<{
  bounds: [[number, number], [number, number]] | null;
}> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && map) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 16, // Prevent zooming in too much for short routes
      });
    }
  }, [bounds, map]);

  return null;
};

interface RouteReportProps {
  isOpen: boolean;
  vehicle: any;
  pathData: any;
  onClose: () => void;
  loading?: boolean;
}

const RouteReport: React.FC<RouteReportProps> = ({
  isOpen,
  vehicle,
  pathData,
  onClose,
  loading = false,
}) => {
  const [mapKey, setMapKey] = useState(0);

  // Reset map when modal opens
  useEffect(() => {
    if (isOpen) {
      setMapKey((prev) => prev + 1);
    }
  }, [isOpen]);

  // Check if we have valid path data
  const hasValidPath = pathData?.patharry && pathData.patharry.length > 0;

  // Calculate bounds to fit all path points
  const calculateBounds = () => {
    if (!hasValidPath) return null;

    const lats = pathData.patharry
      .map((point: any) => point.lat)
      .filter((lat: number) => lat != null && !isNaN(lat));
    const lngs = pathData.patharry
      .map((point: any) => point.lng)
      .filter((lng: number) => lng != null && !isNaN(lng));

    if (lats.length === 0 || lngs.length === 0) return null;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add some padding to the bounds (minimum 0.01 degrees for very short routes)
    const latPadding = Math.max((maxLat - minLat) * 0.1, 0.01);
    const lngPadding = Math.max((maxLng - minLng) * 0.1, 0.01);

    return [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding],
    ] as [[number, number], [number, number]];
  };

  // Get center point for map (fallback if bounds calculation fails)
  const getCenterPoint = () => {
    if (!hasValidPath) return [28.6139, 77.209]; // Default to Delhi

    const firstPoint = pathData.patharry[0];
    return [firstPoint.lat || 28.6139, firstPoint.lng || 77.209];
  };

  return (
    <Modal
      title={`Vehicle Route - ${vehicle?.vehReg || "Vehicle"}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <div style={{ height: "500px", width: "100%", position: "relative" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Route Data
              </h3>
              <p className="text-gray-500">
                Fetching route information for {vehicle?.vehReg || "Vehicle"}...
              </p>
            </div>
          </div>
        ) : hasValidPath ? (
          <MapContainer
            key={mapKey}
            center={getCenterPoint() as [number, number]}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitBounds bounds={calculateBounds()} />

            {/* Route Path */}
            <Polyline
              positions={pathData.patharry.map((point: any) => [
                point.lat,
                point.lng,
              ])}
              pathOptions={{
                color: "#0390fc",
                opacity: 0.8,
                weight: 4,
              }}
            />

            {pathData.patharry.length > 0 && (
              <Marker
                position={[pathData.patharry[0].lat, pathData.patharry[0].lng]}
                icon={startIcon}
              >
                <Popup>
                  <div>
                    <strong>Start Point</strong>
                    <br />
                    Time: {pathData.fromTime || "N/A"}
                    <br />
                    Lat: {pathData.patharry[0].lat}
                    <br />
                    Lng: {pathData.patharry[0].lng}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* End Marker - Last point in array */}
            {pathData.patharry.length > 1 && (
              <Marker
                position={[
                  pathData.patharry[pathData.patharry.length - 1].lat,
                  pathData.patharry[pathData.patharry.length - 1].lng,
                ]}
                icon={endIcon}
              >
                <Popup>
                  <div>
                    <strong>End Point</strong>
                    <br />
                    Time: {pathData.toTime || "N/A"}
                    <br />
                    Lat: {pathData.patharry[pathData.patharry.length - 1].lat}
                    <br />
                    Lng: {pathData.patharry[pathData.patharry.length - 1].lng}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Route Data Available
              </h3>
              <p className="text-gray-500">
                Unable to load route information for this vehicle.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Route Information */}
      {hasValidPath && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Route Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Distance:</span>
              <span className="ml-2 text-gray-600">
                {pathData.totalDistance || "0 KM"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration:</span>
              <span className="ml-2 text-gray-600">
                {pathData.runningTime || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Start Time:</span>
              <span className="ml-2 text-gray-600">
                {pathData.fromTime || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">End Time:</span>
              <span className="ml-2 text-gray-600">
                {pathData.toTime || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Points:</span>
              <span className="ml-2 text-gray-600">
                {pathData.patharry?.length || 0}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Vehicle:</span>
              <span className="ml-2 text-gray-600">
                {vehicle?.vehReg || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RouteReport;
