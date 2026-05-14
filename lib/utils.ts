import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPointInsidePOI(
  point: { lat: number; lng: number },
  poi: any
): boolean {
  const latLng = new google.maps.LatLng(point.lat, point.lng);

  if (poi.gps_radius) {
    const poiCenter = new google.maps.LatLng(
      poi.gps_latitude,
      poi.gps_longitude
    );
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      latLng,
      poiCenter
    );
    return distance <= poi.gps_radius;
  }

  // Polygon POI
  if (poi.points && poi.points.length) {
    const polygon = new google.maps.Polygon({
      paths: poi.points.map((p: any) => ({
        lat: p.gps_latitude,
        lng: p.gps_longitude,
      })),
    });

    return google.maps.geometry.poly.containsLocation(latLng, polygon);
  }

  return false;
}
