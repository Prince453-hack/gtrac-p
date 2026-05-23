"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with webpack
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green icon for start point
const StartIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red icon for end point
const EndIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PathPoint {
  lat: number;
  lng: number;
  gpstime?: string;
  datetime?: string;
  speed: number;
  location: string;
}

// Helper to get time from path point
const getTime = (point: PathPoint): string =>
  point.gpstime || point.datetime || "";

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  pathPoints?: PathPoint[];
}

const Map = ({
  center = [40.7128, -74.006],
  zoom = 16,
  className = "h-screen w-full",
  pathPoints = [],
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
      map,
    );

    // Draw path trail if points exist
    if (pathPoints.length > 0) {
      const latLngs: L.LatLngExpression[] = pathPoints.map((point) => [
        point.lat,
        point.lng,
      ]);

      // Draw the polyline trail
      const polyline = L.polyline(latLngs, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      // Add start marker (green)
      const startPoint = pathPoints[0];
      L.marker([startPoint.lat, startPoint.lng], { icon: StartIcon })
        .addTo(map)
        .bindPopup(
          `<b>Start Point</b><br/>Time: ${getTime(startPoint)}<br/>Speed: ${startPoint.speed} km/h<br/>Location: ${startPoint.location.replace(/_/g, " ")}`,
        );

      // Add end marker (red)
      const endPoint = pathPoints[pathPoints.length - 1];
      L.marker([endPoint.lat, endPoint.lng], { icon: EndIcon })
        .addTo(map)
        .bindPopup(
          `<b>End Point</b><br/>Time: ${getTime(endPoint)}<br/>Speed: ${endPoint.speed} km/h<br/>Location: ${endPoint.location.replace(/_/g, " ")}`,
        );

      // Fit map to show entire trail
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else {
      // No path points, just show center marker
      L.marker(center).addTo(map).bindPopup("Location").openPopup();
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, pathPoints]);

  return <div ref={mapRef} className={className} />;
};

export default Map;
