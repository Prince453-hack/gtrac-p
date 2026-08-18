"use client";

import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import fuelGreen from "@/public/assets/svgs/common/fuel_green.svg";
import fuelRed from "@/public/assets/svgs/common/fuel_red.svg";
import { Button, Modal, Spin, Tooltip } from "antd";
import { setHours, setMinutes, subDays } from "date-fns";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FuelAdblueTabs } from "./fuelAdblue/FuelAndAdblueTabs";

import { setSelectedVehicleCustomRangeSelected } from "@/app/_globalRedux/dashboard/selectedVehicleCustomRangeReuseWithoutDoubleDateSlice";

import { useLoginMutation } from "@/app/_globalRedux/services/fuelAuth";
import { useGetFuelLevelQuery } from "@/app/_globalRedux/services/fuelCentralData";
import { useGetAllFuelDataGraphQuery } from "@/app/_globalRedux/services/fuelData";
import moment from "moment";
import { CustomRangePickerReuseWithoutDoubleDate } from "./CustomRangePickerReuseWithoutDoubleDate";
import { vehiclePairs } from "./fuelAdblue/vehiclePairs";

import {
  useLazyGetRawFuelWithDateEcoQuery,
  useLazyGetRawFuelWithDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
export const Fuel = ({ data }: { data: VehicleData }) => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState([
    subDays(setHours(setMinutes(new Date(), 0), 0), 7),
    new Date(),
  ]);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [getRawData, { data: rawData, isLoading, error }] =
    useLazyGetRawFuelWithDateQuery();
  const [
    getRawDataEco,
    { data: rawDataEco, isLoading: isLoadingEco, error: errorEco },
  ] = useLazyGetRawFuelWithDateEcoQuery();

  const isVehiclePair = Boolean(vehiclePairs[String(data.vId)]);
  const isSearchFuelUser =
    (Number(userId) === 833818 || isVehiclePair) && Number(userId) !== 833193;

  const [loginTrigger, { data: loginRes, isLoading: isAuthLoading }] =
    useLoginMutation();

  useEffect(() => {
    if (isSearchFuelUser) {
      loginTrigger();
    }
  }, [isSearchFuelUser, loginTrigger]);

  const { timeBegin, timeEnd } = useMemo(() => {
    const end = Math.floor(Date.now() / 1000);
    const begin = end - 7 * 24 * 3600; // last 7 days
    return { timeBegin: begin, timeEnd: end };
  }, [data.vId]);

  const imei = vehiclePairs[String(data.vId)] || String(data.vId);

  const { data: fuelLevelData, isLoading: isFuelLevelLoading } =
    useGetFuelLevelQuery(
      {
        vehicleID: imei,
        timeBegin,
        timeEnd,
        token: loginRes?.jwt || "",
      },
      {
        skip: !isSearchFuelUser || !loginRes?.jwt || !data.vId,
      },
    );

  const isFuelLoading =
    isSearchFuelUser && (isAuthLoading || isFuelLevelLoading || !fuelLevelData);

  const lastFuelFromLevelData = useMemo(() => {
    if (
      fuelLevelData?.tankData?.[0]?.data &&
      fuelLevelData.tankData[0].data.length > 0
    ) {
      const sorted = [...fuelLevelData.tankData[0].data]
        .filter((item) => typeof item.aV === "number" && item.aV > 0)
        .sort((a, b) => a.eD - b.eD);
      if (sorted.length > 0) {
        return sorted[sorted.length - 1].aV;
      }
    }
    return undefined;
  }, [fuelLevelData]);

  const displayFuel =
    Number(userId) === 833193
      ? data.gpsDtl.fuel
      : isSearchFuelUser
      ? lastFuelFromLevelData !== undefined
        ? lastFuelFromLevelData
        : data.gpsDtl.fuel
      : data.gpsDtl.fuel;

  const isLitersFuelUser =
    [833193, 833916, 833818].includes(Number(userId)) || isVehiclePair;
  const isEcoUser = Number(userId) === 833916;
  const activeRawData = isEcoUser ? rawDataEco : rawData;
  const activeIsLoading = isEcoUser ? isLoadingEco : isLoading;
  const activeError = isEcoUser ? errorEco : error;

  const { data: fuelTrackingData, isLoading: isFuelTrackingLoading } =
    useGetAllFuelDataGraphQuery(
      {
        sys_service_id: data.vId,
        startdate: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm"),
        enddate: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm"),
        userid: Number(userId),
      },
      {
        skip:
          !isModalOpen ||
          !data.vId ||
          !userId ||
          Number(userId) === 833193 ||
          Number(userId) === 833818,
      },
    );

  const isGetRawWithDataWithoutLocationLoading = useSelector(
    (state: RootState) =>
      Object.values(state.allTripApi.queries).some(
        (query) =>
          query &&
          (query.endpointName === "getRawFuelWithDate" ||
            query.endpointName === "getRawFuelWithDateEco") &&
          query.status === "pending",
      ),
  );

  const handleFetchFuelAdblueAlerts = () => {
    if (Number(userId) === 833193 || Number(userId) === 833818) {
      setFetchTrigger((prev) => prev + 1);
    } else if (isEcoUser) {
      getRawDataEco({
        userId: Number(userId),
        vehId: data.vId,
        startDate: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm"),
        endDate: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm"),
        interval: "30",
      });
    } else {
      getRawData({
        userId: Number(userId),
        vehId: data.vId,
        startDate: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm"),
        endDate: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm"),
        interval: "30",
      });
    }
  };

  useEffect(
    () => {
      dispatch(setSelectedVehicleCustomRangeSelected("Last 7 Days"));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isModalOpen],
  );

  return (
    <>
      {displayFuel &&
      (isLitersFuelUser || displayFuel <= 100) &&
      data.gpsDtl.port !== 31500 ? (
        <Tooltip
          title={isLitersFuelUser ? "Fuel (Liters)" : "Fuel Percentage"}
          mouseEnterDelay={1}
        >
          <div
            className="flex items-center gap-2 border border-neutral-200 rounded-full px-2 py-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
              handleFetchFuelAdblueAlerts();
            }}
          >
            <div className="w-[14px] h-[14px]">
              {displayFuel > 50 ? (
                <Image src={fuelGreen} alt="fuel green" />
              ) : (
                <Image src={fuelRed} alt="fuel red" />
              )}
            </div>
            <div>
              <p className="font-semibold text-xs text-neutral-600 flex items-center justify-center">
                {isFuelLoading ? (
                  <Spin
                    size="small"
                    style={{ transform: "scale(0.8)", display: "inline-block" }}
                  />
                ) : isLitersFuelUser ? (
                  Number(userId) === 833916 ? (
                    `${displayFuel.toFixed(0)}L`
                  ) : (
                    `${displayFuel.toFixed(2)}L`
                  )
                ) : (
                  `${displayFuel.toFixed(0)}%`
                )}
              </p>
            </div>
          </div>
        </Tooltip>
      ) : null}

      <Modal
        open={isModalOpen}
        onCancel={(e) => {
          e.stopPropagation();
          setIsModalOpen(false);
        }}
        footer={null}
        style={{ top: 60, position: "relative" }}
        width={"90vw"}
      >
        <div
          className="flex flex-col"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between border-b border-b-neutral-200 pb-2 mb-4">
            <div className="text-lg font-semibold">
              Fuel & Adblue: ({data.vehReg})
            </div>
          </div>
          <div className="flex items-center justify-end w-full gap-2">
            <CustomRangePickerReuseWithoutDoubleDate
              customDateRange={customDateRange}
              setCustomDateRange={setCustomDateRange}
            />

            <Button
              type="primary"
              size="middle"
              onClick={handleFetchFuelAdblueAlerts}
              loading={
                activeIsLoading || isGetRawWithDataWithoutLocationLoading
              }
            >
              Fetch Alerts
            </Button>
          </div>

          <FuelAdblueTabs
            data={data}
            rawData={activeRawData}
            fuelTrackingData={fuelTrackingData}
            isLoading={
              activeIsLoading ||
              isGetRawWithDataWithoutLocationLoading ||
              isFuelTrackingLoading
            }
            error={activeError}
            startDate={customDateRange[0]}
            endDate={customDateRange[1]}
            fetchTrigger={fetchTrigger}
          />
        </div>
      </Modal>
    </>
  );
};
