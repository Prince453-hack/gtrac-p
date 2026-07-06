"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component to handle dynamic map resizing and fitting bounds
const MapResizerAndFit: React.FC<{ path: any[] }> = ({ path }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Trigger immediate resize
    map.invalidateSize();

    // Trigger sequential resizes to account for Modal opening transitions
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    const timer3 = setTimeout(() => {
      map.invalidateSize();
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [map]);

  useEffect(() => {
    if (path && path.length > 0 && map) {
      const validPoints = path.filter(
        (p) => p.lat != null && !isNaN(Number(p.lat)) && p.lng != null && !isNaN(Number(p.lng))
      );
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map((p) => [Number(p.lat), Number(p.lng)]));
        map.fitBounds(bounds, {
          padding: [10, 10],
          maxZoom: 18,
        });
      }
    }
  }, [path, map]);

  return null;
};

interface TripOverviewMiniMapProps {
  path: any[];
}

const TripOverviewMiniMap: React.FC<TripOverviewMiniMapProps> = ({ path }) => {
  const hasValidPath = path && path.length > 0;
  const validPoints = hasValidPath
    ? path.filter(
        (p) => p.lat != null && !isNaN(Number(p.lat)) && p.lng != null && !isNaN(Number(p.lng))
      )
    : [];

  const defaultCenter: [number, number] = useMemo(() => {
    if (validPoints.length > 0) {
      return [Number(validPoints[0].lat), Number(validPoints[0].lng)];
    }
    return [28.6139, 77.209]; // Delhi fallback
  }, [validPoints]);

  const startIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: "/assets/images/map/start-end-flags/start-flag.png",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  }, []);

  const endIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: "/assets/images/map/start-end-flags/end-flag.png",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  }, []);

  // Force Leaflet to re-create the map instance when coordinates change,
  // which solves most initialization rendering issues in modals.
  const mapKey = useMemo(() => {
    if (validPoints.length > 0) {
      return `map-${validPoints.length}-${validPoints[0].lat}-${validPoints[0].lng}`;
    }
    return "map-empty";
  }, [validPoints]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MapContainer
        key={mapKey}
        center={defaultCenter}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapResizerAndFit path={validPoints} />

        {validPoints.length > 0 && (
          <Polyline
            positions={validPoints.map((p) => [Number(p.lat), Number(p.lng)])}
            pathOptions={{
              color: "#0390fc",
              opacity: 0.8,
              weight: 4,
            }}
          />
        )}

        {validPoints.length > 0 && (
          <Marker
            position={[Number(validPoints[0].lat), Number(validPoints[0].lng)]}
            icon={startIcon}
          >
            <Popup>
              <div className="text-xs font-semibold">
                <p className="font-bold text-sm text-neutral-800 mb-1">Start Point</p>
                <p>Time: {validPoints[0].datetime || "—"}</p>
                <p>Location: {validPoints[0].location?.replaceAll("_", " ") || "—"}</p>
                <p>Speed: {validPoints[0].speed} km/h</p>
              </div>
            </Popup>
          </Marker>
        )}

        {validPoints.length > 1 && (
          <Marker
            position={[
              Number(validPoints[validPoints.length - 1].lat),
              Number(validPoints[validPoints.length - 1].lng),
            ]}
            icon={endIcon}
          >
            <Popup>
              <div className="text-xs font-semibold">
                <p className="font-bold text-sm text-neutral-800 mb-1">End Point</p>
                <p>Time: {validPoints[validPoints.length - 1].datetime || "—"}</p>
                <p>Location: {validPoints[validPoints.length - 1].location?.replaceAll("_", " ") || "—"}</p>
                <p>Speed: {validPoints[validPoints.length - 1].speed} km/h</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default TripOverviewMiniMap;
