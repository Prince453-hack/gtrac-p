// haversine.ts (ES Module)

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "km" | "m" | "mi" = "km"
): number {
  if (
    ![lat1, lon1, lat2, lon2].every(
      (n) => typeof n === "number" && Number.isFinite(n)
    )
  ) {
    throw new TypeError("All coordinates must be finite numbers");
  }

  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371.0088;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distanceKm = R * c;

  switch (unit) {
    case "m":
      return Math.round(distanceKm * 1000 * 100) / 100;
    case "mi":
      return Math.round(distanceKm * 0.62137119223733 * 10000) / 10000;
    case "km":
    default:
      return Math.round(distanceKm * 10000) / 10000;
  }
}

export { haversineDistance };
