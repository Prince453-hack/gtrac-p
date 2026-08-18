"use client";

import { useLoginMutation } from "@/app/_globalRedux/services/fuelAuth";
import { useLazyGetFuelLevelQuery } from "@/app/_globalRedux/services/fuelCentralData";
import { useGetAllFuelDataGraphQuery } from "@/app/_globalRedux/services/fuelData";
import { useLazyGetRawFuelWithDateEcoQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useLazyGetpathwithDateDaignosticOBDQuery } from "@/app/_globalRedux/services/trackingDashboardOBD";
import { RootState } from "@/app/_globalRedux/store";
import { calculateFuelMetricsFor833916 } from "@/app/helpers/fuelMetrics833916";
import {
  calculateCentralFuelMetrics,
  calculateMileageAndFuel,
  calculateUser833193FuelMetrics,
} from "@/app/helpers/fuelMetricsHelper";
import { getAlphabetsFirstChr } from "@/app/helpers/stringManipulation";
import { Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { vehiclePairs } from "./fuelAdblue/vehiclePairs";

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
  const [getRawFuelData, { isLoading: isRawFuelLoading }] =
    useLazyGetRawFuelWithDateEcoQuery();

  const isVehiclePair = Boolean(vehiclePairs[String(selectedVehicle.vId)]);

  const [loginTrigger, { data: fuelAuthRes }] = useLoginMutation();
  const [
    getFuelLevel,
    { data: centralFuelLevelData, isLoading: isCentralFuelLoading },
  ] = useLazyGetFuelLevelQuery();

  useEffect(() => {
    if (isVehiclePair && selectedVehicle.vId !== 0) {
      if (!fuelAuthRes?.jwt) {
        loginTrigger();
      } else {
        const sD =
          customRange.dateRangeForDataFetching.startDate ||
          new Date().toISOString().split("T")[0] + " 00:00";
        const eD =
          customRange.dateRangeForDataFetching.endDate ||
          new Date().toISOString().split("T")[0] + " 23:59";

        const imei =
          vehiclePairs[String(selectedVehicle.vId)] ||
          String(selectedVehicle.vId);
        const timeBegin = Math.floor(new Date(sD).getTime() / 1000);
        const timeEnd = Math.floor(new Date(eD).getTime() / 1000);

        getFuelLevel({
          vehicleID: imei,
          timeBegin,
          timeEnd,
          token: fuelAuthRes.jwt,
        });
      }
    }
  }, [
    isVehiclePair,
    selectedVehicle.vId,
    customRange.dateRangeForDataFetching,
    fuelAuthRes?.jwt,
    loginTrigger,
    getFuelLevel,
  ]);

  // Fuel tracking API call - only for user 833193, 833818, or vehicle pairs
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
        skip:
          selectedVehicle.vId === 0 ||
          !userId ||
          (!isVehiclePair && ![833193, 833818].includes(Number(userId))),
      },
    );

  useEffect(() => {
    if (Number(userId) === 833916 && selectedVehicle.vId !== 0) {
      getRawFuelData({
        userId: Number(userId),
        vehId: selectedVehicle.vId,
        startDate:
          customRange.dateRangeForDataFetching.startDate ||
          new Date().toISOString().split("T")[0] + " 00:00",
        endDate:
          customRange.dateRangeForDataFetching.endDate ||
          new Date().toISOString().split("T")[0] + " 23:59",
        interval: "30",
      });
    }
  }, [
    customRange.dateRangeForDataFetching,
    getRawFuelData,
    selectedVehicle.vId,
    userId,
  ]);

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
        (!isVehiclePair &&
          Number(userId) !== 833916 &&
          (!selectedVehicle.gpsDtl?.fuel ||
            selectedVehicle.gpsDtl.fuel > 100 ||
            selectedVehicle.gpsDtl.port === 31500))
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
    selectedVehicle.gpsDtl?.fuel,
    customRange.dateRangeForDataFetching,
    userId,
    isVehiclePair,
  ]);

  useEffect(() => {
    if (
      selectedVehicle.vId !== 0 &&
      isApmTotalKmLoading === false &&
      isGetPathWithDateDiagnosticLoading === false
    ) {
      const tempMileageAndFuel = calculateMileageAndFuel({
        response: vehicleItnaryWithPath,
        userId,
      });
      setMileageAndFuelConsumed(tempMileageAndFuel);
    }
  }, [
    isApmTotalKmLoading,
    isGetPathWithDateDiagnosticLoading,
    vehicleItnaryWithPath,
    userId,
  ]);

  const calculateUser833916FuelMetrics = () =>
    calculateFuelMetricsFor833916({
      pathArray: obdData?.patharry || vehicleItnaryWithPath?.patharry,
      distance,
      extra,
    });

  return (
    <div className="text-sm">
      <div className="flex justify-between">
        <div className="flex items-center justify-center flex-col border w-full h-24 border-x-0">
          <h3 className=" relative bottom-1.5">Running Time</h3>
          {isGetPathWithDateDiagnosticLoading ||
          isApmTotalKmLoading ||
          isFuelDataLoading ||
          isObdLoading ||
          isRawFuelLoading ? (
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
          isObdLoading ||
          isRawFuelLoading ? (
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

        {Number(userId) === 833916 ||
        isVehiclePair ||
        (selectedVehicle.gpsDtl.fuel &&
          selectedVehicle.gpsDtl.fuel <= 100 &&
          selectedVehicle.gpsDtl.port !== 31500) ? (
          <div className="flex items-center justify-center flex-col border w-full h-24">
            <h3 className=" relative bottom-1">Mileage</h3>
            {isGetPathWithDateDiagnosticLoading ||
            isApmTotalKmLoading ||
            isFuelDataLoading ||
            isObdLoading ||
            isCentralFuelLoading ||
            isRawFuelLoading ? (
              <Skeleton.Button
                active={true}
                size="small"
                className="mt-0.5 h-[20px]"
              />
            ) : (
              <p className="font-semibold mt-0.5">
                {(() => {
                  if (isVehiclePair) {
                    const { mileage } = calculateCentralFuelMetrics({
                      centralFuelLevelData,
                      distance,
                      extra,
                    });
                    if (
                      mileage !== null &&
                      mileage !== 0 &&
                      isFinite(mileage)
                    ) {
                      return mileage.toFixed(2);
                    }
                  }

                  if (Number(userId) === 833193 || Number(userId) === 833818) {
                    const { mileage } = calculateUser833193FuelMetrics({
                      fuelData,
                      distance,
                      extra,
                    });
                    if (
                      mileage !== null &&
                      mileage !== 0 &&
                      isFinite(mileage)
                    ) {
                      return mileage.toFixed(2);
                    }
                  }

                  if (Number(userId) === 833916) {
                    const { mileage } = calculateUser833916FuelMetrics();
                    if (
                      mileage !== null &&
                      mileage !== 0 &&
                      isFinite(mileage)
                    ) {
                      return mileage.toFixed(2);
                    }
                  }

                  const mileageValue = obdData?.totalmileage;
                  if (
                    mileageValue !== undefined &&
                    mileageValue !== null &&
                    isFinite(mileageValue) &&
                    mileageValue <= 7 &&
                    mileageValue > 0
                  ) {
                    return mileageValue;
                  }

                  return mileageAndFuelConsumed.mileage !== 0 &&
                    isFinite(mileageAndFuelConsumed.mileage)
                    ? mileageAndFuelConsumed.mileage.toFixed(2)
                    : "-";
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

        {Number(userId) === 833916 ||
        isVehiclePair ||
        (selectedVehicle.gpsDtl.fuel &&
          selectedVehicle.gpsDtl.fuel <= 100 &&
          selectedVehicle.gpsDtl.port !== 31500) ? (
          <div className="flex items-center justify-center flex-col border w-full h-24 border-x-0">
            <h3 className=" relative bottom-1">Fuel Consumed</h3>
            {isGetPathWithDateDiagnosticLoading ||
            isApmTotalKmLoading ||
            isFuelDataLoading ||
            isObdLoading ||
            isCentralFuelLoading ||
            isRawFuelLoading ? (
              <Skeleton.Button
                active={true}
                size="small"
                className="mt-0.5 h-[20px]"
              />
            ) : (
              <p className="font-semibold mt-0.5">
                {(() => {
                  if (isVehiclePair) {
                    const { fuelConsumed } = calculateCentralFuelMetrics({
                      centralFuelLevelData,
                      distance,
                      extra,
                    });
                    if (
                      fuelConsumed !== null &&
                      fuelConsumed !== 0 &&
                      isFinite(fuelConsumed)
                    ) {
                      return `${fuelConsumed.toFixed(2)} L`;
                    }
                  }

                  if (Number(userId) === 833193 || Number(userId) === 833818) {
                    const { fuelConsumed } = calculateUser833193FuelMetrics({
                      fuelData,
                      distance,
                      extra,
                    });
                    if (
                      fuelConsumed !== null &&
                      fuelConsumed !== 0 &&
                      isFinite(fuelConsumed)
                    ) {
                      return `${fuelConsumed.toFixed(2)} L`;
                    }
                  }

                  if (Number(userId) === 833916) {
                    const { fuelConsumed } = calculateUser833916FuelMetrics();
                    if (
                      fuelConsumed !== null &&
                      fuelConsumed !== 0 &&
                      isFinite(fuelConsumed)
                    ) {
                      return `${fuelConsumed.toFixed(2)} L`;
                    }
                  }

                  if (obdData?.totalFuelConsumedT !== undefined) {
                    const fuelValue = obdData.totalFuelConsumedT;
                    const mileageValue = obdData?.totalmileage;

                    if (
                      mileageValue !== undefined &&
                      mileageValue !== null &&
                      isFinite(mileageValue) &&
                      mileageValue <= 7 &&
                      fuelValue >= 0 &&
                      fuelValue <= 10000
                    ) {
                      return `${fuelValue?.toFixed(2)} L`;
                    }
                  }

                  return mileageAndFuelConsumed.fuelConsumed !== 0 &&
                    isFinite(mileageAndFuelConsumed.fuelConsumed)
                    ? `${mileageAndFuelConsumed.fuelConsumed.toFixed(2)} L`
                    : "-";
                })()}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
