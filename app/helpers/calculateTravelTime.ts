import { haversineDistance } from "./haversineDistance";

/**
 * Calculate estimated travel time in hours based on distance and average speed
 * @param distanceKm - Distance in kilometers
 * @param averageSpeedKmh - Average speed in km/h (default: 60 km/h)
 * @returns Estimated travel time in hours
 */
export const calculateTravelTimeFromDistance = (
  distanceKm: number,
  averageSpeedKmh: number = 60
): number => {
  if (distanceKm <= 0 || averageSpeedKmh <= 0) return 0;
  return Math.round((distanceKm / averageSpeedKmh) * 100) / 100;
};

/**
 * Calculate travel time using haversine distance between two points
 * @param startLat - Starting latitude
 * @param startLng - Starting longitude
 * @param endLat - Ending latitude
 * @param endLng - Ending longitude
 * @param averageSpeedKmh - Average speed in km/h (default: 60 km/h)
 * @returns Estimated travel time in hours
 */
export const calculateTravelTimeFromCoordinates = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  averageSpeedKmh: number = 60
): number => {
  try {
    const distanceKm = haversineDistance(
      startLat,
      startLng,
      endLat,
      endLng,
      "km"
    );
    return calculateTravelTimeFromDistance(distanceKm, averageSpeedKmh);
  } catch (error) {
    console.error("Error calculating travel time from coordinates:", error);
    return 0;
  }
};
