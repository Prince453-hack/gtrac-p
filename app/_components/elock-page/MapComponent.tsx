"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
});

// Custom red marker icon to match the design
const redIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.3 12.5 28.5 12.5 28.5s12.5-20.2 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#e53e3e"/>
      <circle cx="12.5" cy="12.5" r="5.5" fill="white"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
  shadowSize: [41, 41],
});

function MapUpdater({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);

  return null;
}

// Zoom Controls Component
function ZoomControls() {
  const map = useMapEvents({});

  const zoomIn = () => {
    map.zoomIn();
  };

  const zoomOut = () => {
    map.zoomOut();
  };

  return (
    <>
      <div
        className="leaflet-control-zoom leaflet-bar leaflet-control"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
        }}
      >
        <button
          onClick={zoomIn}
          className="w-8 h-8 bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm text-lg font-bold rounded-t"
          type="button"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 bg-white border border-gray-300 border-t-0 flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm text-lg font-bold rounded-b"
          type="button"
          title="Zoom out"
        >
          −
        </button>
      </div>
    </>
  );
}

interface MapComponentProps {
  lat?: number;
  lng?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ lat, lng }) => {
  const hasValidCoordinates = lat && lng;
  const vehiclePosition: [number, number] | null = hasValidCoordinates
    ? [lat, lng]
    : null;

  const defaultCenter: [number, number] = [28.6139, 77.209]; // New Delhi center
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    if (!mapContainerRef.current) return;

    try {
      if (!isFullscreen) {
        if (mapContainerRef.current.requestFullscreen) {
          await mapContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  // Listen for fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={`h-full flex flex-col bg-white border-l border-gray-200 ${isFullscreen ? "fixed inset-0 z-[9999]" : ""}`}
    >
      {/* Map Header */}
      <div className="flex items-center justify-between px-2 py-[9px] border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-800">Live Location</h3>
        <div className="flex space-x-1">
          <button
            onClick={toggleFullscreen}
            className="w-6 h-6 flex items-center justify-center border border-gray-300 bg-white text-gray-600 text-xs hover:bg-gray-50"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "⤓" : "⤢"}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          key="map-container"
          center={vehiclePosition || defaultCenter}
          zoom={hasValidCoordinates ? 15 : 6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map Updater - updates center when coordinates change */}
          <MapUpdater lat={lat} lng={lng} />

          {/* Vehicle Marker - only show when valid coordinates exist */}
          {vehiclePosition && (
            <Marker position={vehiclePosition} icon={redIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Current Vehicle Location</strong>
                  <br />
                  Lat: {lat?.toFixed(6)}, Lng: {lng?.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Custom Zoom Controls - inside MapContainer */}
          <ZoomControls />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
          <div className="text-xs font-medium text-gray-700 mb-1">Legend</div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Vehicle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
