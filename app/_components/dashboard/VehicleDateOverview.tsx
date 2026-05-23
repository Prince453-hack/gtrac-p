"use client";

import { useGetAllFuelDataGraphQuery } from "@/app/_globalRedux/services/fuelData";
import { useGetpathwithDateDaignosticQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useLazyGetpathwithDateDaignosticOBDQuery } from "@/app/_globalRedux/services/trackingDashboardOBD";
import { GetItnaryWithMapResponse } from "@/app/_globalRedux/services/types";
import { RootState } from "@/app/_globalRedux/store";
import { getAlphabetsFirstChr } from "@/app/helpers/stringManipulation";
import { Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { computeMetrics, Point } from "./fuelAdblue/FuelAndAdblueTabs";

export const VehicleDateOverview = ({
  travelTime,
  distance,
  stoppedTime,
}: {
  travelTime: string;
  distance: string;
  stoppedTime: string;
}) => {
  const { extra, userId } = useSelector((state: RootState) => state.auth);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath,
  );
  const customRange = useSelector((state: RootState) => state.customRange);

  const [mileageAndFuelConsumed, setMileageAndFuelConsumed] = useState<{
    mileage: number;
    fuelConsumed: number;
  }>({ mileage: 0, fuelConsumed: 0 });

  // OBD API for fuel-related data
  const [obdData, setObdData] = useState<any>(null);
  const [isObdLoading, setIsObdLoading] = useState(false);
  const [getOBDData] = useLazyGetpathwithDateDaignosticOBDQuery();

  // Fuel tracking API call - only for user 833193
  const { data: fuelData, isLoading: isFuelDataLoading } =
    useGetAllFuelDataGraphQuery(
      {
        sys_service_id: selectedVehicle.vId,
        startdate:
          customRange.dateRangeForDataFetching.startDate ||
          new Date().toISOString().split("T")[0] + " 00:00",
        enddate:
          customRange.dateRangeForDataFetching.endDate ||
          new Date().toISOString().split("T")[0] + " 23:59",
        userid: userId,
      },
      {
        skip: selectedVehicle.vId === 0 || !userId || Number(userId) !== 833193,
      },
    );

  const { data: diagnosticData, isLoading: isDiagnosticLoading } =
    useGetpathwithDateDaignosticQuery(
      {
        vId: selectedVehicle.vId,
        startDate:
          customRange.dateRangeForDataFetching.startDate ||
          new Date().toISOString().split("T")[0] + " 00:00",
        endDate:
          customRange.dateRangeForDataFetching.endDate ||
          new Date().toISOString().split("T")[0] + " 23:59",
        userId: userId,
      },
      {
        skip: true || selectedVehicle.vId === 0 || !userId,
      },
    );

  const isGetPathWithDateDiagnosticLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getpathwithDateDaignostic" &&
        query.status === "pending",
    ),
  );

  const isApmTotalKmLoading = useSelector(
    (state: RootState) => state.isApmTotalKmmLoading,
  );

  // Fetch OBD data for fuel-related metrics
  useEffect(() => {
    const fetchOBDData = async () => {
      if (
        selectedVehicle.vId === 0 ||
        !userId ||
        selectedVehicle.gpsDtl.port === 31500 ||
        (!selectedVehicle.gpsDtl.fuel && selectedVehicle.gpsDtl.fuel >= 100)
      ) {
        setObdData(null);
        return;
      }

      setIsObdLoading(true);
      try {
        const result = await getOBDData({
          vId: selectedVehicle.vId,
          startdate:
            customRange.dateRangeForDataFetching.startDate ||
            new Date().toISOString().split("T")[0] + " 00:00",
          enddate:
            customRange.dateRangeForDataFetching.endDate ||
            new Date().toISOString().split("T")[0] + " 23:59",
          requestfor: 0,
          userid: Number(userId) || 833105,
        }).unwrap();
        setObdData(result);
      } catch (error) {
        console.error("Error fetching OBD data:", error);
        setObdData(null);
      } finally {
        setIsObdLoading(false);
      }
    };

    fetchOBDData();
  }, [
    selectedVehicle.vId,
    selectedVehicle.gpsDtl.fuel,
    customRange.dateRangeForDataFetching,
    userId,
  ]);

  function calculateMileageAndFuel(response: GetItnaryWithMapResponse): {
    mileage: number;
    fuelConsumed: number;
  } {
    const readings: Point[] = Array.isArray(response.fuelarray)
      ? response.fuelarray
          .filter(
            (p) =>
              p.tel_fuel !== 0 &&
              p.speed >= 2 &&
              p.speed <= 5 &&
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

    if (totalConsumed === 0) {
      return { mileage: 0, fuelConsumed: 0 };
    }

    const mileage =
      (isNaN(Number(response.totalRunningDistanceKM))
        ? response.calculatedTotalDistance
        : Number(response.totalRunningDistanceKM)) / totalConsumed;

    return { mileage, fuelConsumed: totalConsumed };
  }

  useEffect(() => {
    if (
      selectedVehicle.vId !== 0 &&
      isApmTotalKmLoading === false &&
      isGetPathWithDateDiagnosticLoading === false
    ) {
      const tempMileageAndFuel = calculateMileageAndFuel(vehicleItnaryWithPath);
      setMileageAndFuelConsumed(tempMileageAndFuel);
    }
  }, [isApmTotalKmLoading, isGetPathWithDateDiagnosticLoading]);

  const calculateUser833193FuelMetrics = () => {
    if (!fuelData?.list || fuelData.list.length === 0) {
      return { fuelConsumed: null, mileage: null };
    }
    const sortedData = [...fuelData.list].sort(
      (a: any, b: any) => b.timeinepoc - a.timeinepoc,
    );

    const firstRv = sortedData[0]?.rv; // First date (newest)
    const lastRv = sortedData[sortedData.length - 1]?.rv; // Last date (oldest)

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

    // Calculate total distance
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
  };

  return (
    <div className="text-sm">
      <div className="flex justify-between">
        <div className="flex items-center justify-center flex-col border w-full h-24 border-x-0">
          <h3 className=" relative bottom-1.5">Running Time</h3>
          {isGetPathWithDateDiagnosticLoading ||
          isApmTotalKmLoading ||
          isFuelDataLoading ||
          isObdLoading ? (
            <Skeleton.Button
              active={true}
              size="small"
              className="mt-0.5 h-[20px]"
            />
          ) : (
            <p className="font-semibold mt-0.5">
              {getAlphabetsFirstChr(travelTime)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center flex-col border w-full h-24">
          <h3 className=" relative bottom-1">Total Distance</h3>
          {isGetPathWithDateDiagnosticLoading ||
          isApmTotalKmLoading ||
          isFuelDataLoading ||
          isObdLoading ? (
            <Skeleton.Button
              active={true}
              size="small"
              className="mt-0.5 h-[20px]"
            />
          ) : (
            <p className="font-semibold mt-0.5">
              {Number(extra) === 0 || isNaN(Number(extra))
                ? Number(distance.split(" ")[0])
                : (
                    Number(distance.split(" ")[0]) +
                    (Number(distance.split(" ")[0]) * Number(extra)) / 100
                  ).toFixed(0)}{" "}
              KM
            </p>
          )}
        </div>

        {selectedVehicle.gpsDtl.fuel &&
        selectedVehicle.gpsDtl.fuel <= 100 &&
        selectedVehicle.gpsDtl.port !== 31500 ? (
          <div className="flex items-center justify-center flex-col border w-full h-24">
            <h3 className=" relative bottom-1">Mileage</h3>
            {isGetPathWithDateDiagnosticLoading ||
            isApmTotalKmLoading ||
            isFuelDataLoading ||
            isObdLoading ? (
              <Skeleton.Button
                active={true}
                size="small"
                className="mt-0.5 h-[20px]"
              />
            ) : (
              <p className="font-semibold mt-0.5">
                {(() => {
                  if (Number(userId) === 833193) {
                    const { mileage } = calculateUser833193FuelMetrics();
                    return mileage !== null && mileage !== 0
                      ? mileage.toFixed(2)
                      : "-";
                  }

                  const mileageValue = obdData?.totalmileage;
                  if (mileageValue === undefined || mileageValue === null)
                    return "-";
                  if (!isFinite(mileageValue) || mileageValue > 7) return "-";
                  return mileageValue;
                })()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center flex-col border w-full h-24 border-x-0">
            <h3 className=" relative bottom-1">Stopped Time</h3>
            {isGetPathWithDateDiagnosticLoading ||
            isApmTotalKmLoading ||
            isFuelDataLoading ||
            isObdLoading ? (
              <Skeleton.Button
                active={true}
                size="small"
                className="mt-0.5 h-[20px]"
              />
            ) : (
              <p className="font-semibold mt-0.5">
                {getAlphabetsFirstChr(stoppedTime)}
              </p>
            )}
          </div>
        )}

        {selectedVehicle.gpsDtl.fuel &&
        selectedVehicle.gpsDtl.fuel <= 100 &&
        selectedVehicle.gpsDtl.port !== 31500 ? (
          <div className="flex items-center justify-center flex-col border w-full h-24 border-x-0">
            <h3 className=" relative bottom-1">Fuel Consumed</h3>
            {isGetPathWithDateDiagnosticLoading ||
            isApmTotalKmLoading ||
            isFuelDataLoading ||
            isDiagnosticLoading ||
            isObdLoading ? (
              <Skeleton.Button
                active={true}
                size="small"
                className="mt-0.5 h-[20px]"
              />
            ) : (
              <p className="font-semibold mt-0.5">
                {(() => {
                  if (Number(userId) === 833193) {
                    const { fuelConsumed } = calculateUser833193FuelMetrics();
                    return fuelConsumed !== null
                      ? `${fuelConsumed.toFixed(2)} L`
                      : "-";
                  }

                  if (obdData?.totalFuelConsumedT !== undefined) {
                    const fuelValue = obdData.totalFuelConsumedT;
                    const mileageValue = obdData?.totalmileage;

                    // Check if mileage is invalid first
                    if (
                      mileageValue === undefined ||
                      mileageValue === null ||
                      !isFinite(mileageValue) ||
                      mileageValue > 7
                    ) {
                      return "-";
                    }

                    // Handle negative values (might be cumulative ECU values)
                    if (fuelValue < 0) {
                      console.warn(
                        "Negative fuel value detected, might be cumulative ECU data:",
                        fuelValue,
                      );
                      return "- L (Invalid data)";
                    }

                    // Handle very large values (might be cumulative ECU values)
                    if (fuelValue > 10000) {
                      console.warn(
                        "Very large fuel value detected, might be cumulative ECU data:",
                        fuelValue,
                      );
                      return "- L (Invalid data)";
                    }

                    // Display reasonable fuel consumption values
                    return `${fuelValue?.toFixed(2)} L`;
                  }

                  return "-";
                })()}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
