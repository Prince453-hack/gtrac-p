import { GetItnaryWithMapResponse } from "@/app/_globalRedux/services/types";
import { computeMetrics, Point } from "@/app/_components/dashboard/fuelAdblue/FuelAndAdblueTabs";

export function calculateCentralFuelMetrics({
  centralFuelLevelData,
  distance,
  extra,
}: {
  centralFuelLevelData: any;
  distance: string;
  extra: string | number;
}): { fuelConsumed: number | null; mileage: number | null } {
  if (
    !centralFuelLevelData?.tankData?.[0]?.data ||
    centralFuelLevelData.tankData[0].data.length < 2
  ) {
    return { fuelConsumed: null, mileage: null };
  }

  const sortedData = [...centralFuelLevelData.tankData[0].data]
    .filter((pt) => typeof pt.aV === "number" && pt.aV > 0)
    .sort((a, b) => a.eD - b.eD);

  if (sortedData.length < 2) {
    return { fuelConsumed: null, mileage: null };
  }

  const firstRv = sortedData[0].aV;
  const lastRv = sortedData[sortedData.length - 1].aV;

  let totalFuelFilling = 0;
  for (let i = 1; i < sortedData.length; i++) {
    const diff = sortedData[i].aV - sortedData[i - 1].aV;
    if (diff > 5) {
      totalFuelFilling += diff;
    }
  }

  let fuelConsumed = Math.abs(firstRv + totalFuelFilling - lastRv);

  const totalDistValue =
    Number(extra) === 0 || isNaN(Number(extra))
      ? Number(distance.split(" ")[0])
      : Number(distance.split(" ")[0]) +
        (Number(distance.split(" ")[0]) * Number(extra)) / 100;

  if (fuelConsumed <= 0 || totalDistValue <= 0) {
    return { fuelConsumed, mileage: 0 };
  }

  const mileage = totalDistValue / fuelConsumed;
  return { fuelConsumed, mileage };
}

export function calculateUser833193FuelMetrics({
  fuelData,
  distance,
  extra,
}: {
  fuelData: any;
  distance: string;
  extra: string | number;
}): { fuelConsumed: number | null; mileage: number | null } {
  if (!fuelData?.list || fuelData.list.length === 0) {
    return { fuelConsumed: null, mileage: null };
  }
  const sortedData = [...fuelData.list].sort(
    (a: any, b: any) => b.timeinepoc - a.timeinepoc,
  );

  const firstRv = sortedData[0]?.rv;
  const lastRv = sortedData[sortedData.length - 1]?.rv;

  if (
    firstRv === undefined ||
    lastRv === undefined ||
    firstRv === null ||
    lastRv === null
  ) {
    return { fuelConsumed: null, mileage: null };
  }

  const totalFuelFilling = fuelData.list
    .filter(
      (entry: any) => entry.fueltype === "Fuel Filling" && entry.filling > 0,
    )
    .reduce((sum: number, entry: any) => sum + entry.filling, 0);

  let fuelConsumed = Math.abs(lastRv + totalFuelFilling - firstRv);

  const totalDistValue =
    Number(extra) === 0 || isNaN(Number(extra))
      ? Number(distance.split(" ")[0])
      : Number(distance.split(" ")[0]) +
        (Number(distance.split(" ")[0]) * Number(extra)) / 100;

  if (fuelConsumed <= 0 || totalDistValue <= 0) {
    return { fuelConsumed, mileage: 0 };
  }

  const mileage = totalDistValue / fuelConsumed;

  return { fuelConsumed, mileage };
}

export function calculateMileageAndFuel({
  response,
  userId,
}: {
  response: GetItnaryWithMapResponse;
  userId: string | number;
}): { mileage: number; fuelConsumed: number } {
  const readings: Point[] = Array.isArray(response.fuelarray)
    ? response.fuelarray
        .filter(
          (p) =>
            p.tel_fuel !== 0 &&
            p.tel_fuel !== undefined &&
            p.tel_fuel !== null,
        )
        .map((p) => ({
          odometer: p.tel_odometer ? p.tel_odometer.toString() : "0",
          fuel: p.tel_fuel ? p.tel_fuel : 0,
          adblue: 0,
          time: p.datetime,
          gps_latitude: p.lat,
          gps_longitude: p.lng,
          location: p.location,
          event: null,
          amountFilled: null,
          amountStolen: null,
          distanceSinceLastFill: null,
        }))
    : [];

  if (readings.length < 2) {
    return { mileage: 0, fuelConsumed: 0 };
  }

  const enriched = computeMetrics(
    readings,
    "fuel",
    Number(userId) === 833193 ? 10 : 70,
  );

  const addedFuel = enriched.reduce(
    (sum, pt) => sum + (pt.amountFilled ?? 0),
    0,
  );

  let totalConsumed =
    (readings[0].fuel ?? 0) - (readings[readings.length - 1].fuel ?? 0);
  totalConsumed += addedFuel;

  if (totalConsumed <= 0) {
    return { mileage: 0, fuelConsumed: 0 };
  }

  const mileage =
    (isNaN(Number(response.totalRunningDistanceKM))
      ? response.calculatedTotalDistance
      : Number(response.totalRunningDistanceKM)) / totalConsumed;

  return { mileage, fuelConsumed: totalConsumed };
}
