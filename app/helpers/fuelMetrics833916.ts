type FuelMetricsResult = {
  fuelConsumed: number | null;
  mileage: number | null;
};

type FuelMetricPoint = {
  rowwiseDistance?: number;
  distance?: number;
  speed?: number;
};

const getMileageFromSpeed = (speed: number): number => {
  if (speed <= 5) return 10.0;
  if (speed <= 15) return 14.0;
  if (speed <= 25) return 16.0;
  if (speed <= 40) return 17.5;
  if (speed <= 60) return 19.0;
  if (speed <= 80) return 18.0;
  return 16.5;
};

const getBaseDistance = (distance: string): number => {
  const value = Number(distance.split(" ")[0]);
  return Number.isFinite(value) ? value : 0;
};

export const calculateFuelMetricsFor833916 = ({
  pathArray,
  distance,
  extra,
}: {
  pathArray?: FuelMetricPoint[] | null;
  distance: string;
  extra: number | string;
}): FuelMetricsResult => {
  if (!Array.isArray(pathArray) || pathArray.length === 0) {
    return { fuelConsumed: null, mileage: null };
  }

  let calculatedTotalDistance = 0;
  let fuelConsumed = 0;

  for (const point of pathArray) {
    const pointDistance = Number(point.rowwiseDistance || point.distance || 0);
    const speed = Number(point.speed || 0);

    if (pointDistance <= 0) continue;

    const pointMileage = getMileageFromSpeed(speed);

    calculatedTotalDistance += pointDistance;
    fuelConsumed += pointDistance / pointMileage;
  }

  const baseDistance = getBaseDistance(distance);
  const extraValue = Number(extra);
  const extraDistance =
    extraValue === 0 || Number.isNaN(extraValue)
      ? baseDistance
      : baseDistance + (baseDistance * extraValue) / 100;

  const finalTotalDistance =
    calculatedTotalDistance > 0 ? calculatedTotalDistance : extraDistance;

  if (fuelConsumed <= 0) {
    return { fuelConsumed: null, mileage: null };
  }

  return {
    fuelConsumed: Number(fuelConsumed.toFixed(2)),
    mileage: Number((finalTotalDistance / fuelConsumed).toFixed(2)),
  };
};
