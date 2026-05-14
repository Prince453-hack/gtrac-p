"use client";

import React, { useEffect, useState } from "react";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import fuelGreen from "@/public/assets/svgs/common/fuel_green.svg";
import fuelRed from "@/public/assets/svgs/common/fuel_red.svg";
import { Button, Modal, Tooltip } from "antd";
import Image from "next/image";
import { FuelAdblueTabs } from "./fuelAdblue/FuelAndAdblueTabs";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { setHours, setMinutes, subDays } from "date-fns";

import { setSelectedVehicleCustomRangeSelected } from "@/app/_globalRedux/dashboard/selectedVehicleCustomRangeReuseWithoutDoubleDateSlice";

import { useGetAllFuelDataGraphQuery } from "@/app/_globalRedux/services/fuelData";
import moment from "moment";
import { CustomRangePickerReuseWithoutDoubleDate } from "./CustomRangePickerReuseWithoutDoubleDate";

import { useLazyGetRawFuelWithDateQuery } from "@/app/_globalRedux/services/trackingDashboard";
export const Fuel = ({ data }: { data: VehicleData }) => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState([
    subDays(setHours(setMinutes(new Date(), 0), 0), 7),
    new Date(),
  ]);
  const [getRawData, { data: rawData, isLoading, error }] =
    useLazyGetRawFuelWithDateQuery();

  // New fuel tracking API call - only for user 833193
  const { data: fuelTrackingData, isLoading: isFuelTrackingLoading } =
    useGetAllFuelDataGraphQuery(
      {
        sys_service_id: data.vId,
        startdate: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm"),
        enddate: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm"),
        userid: Number(userId),
      },
      {
        skip: !isModalOpen || !data.vId || !userId || Number(userId) !== 833193,
      }
    );

  const isGetRawWithDataWithoutLocationLoading = useSelector(
    (state: RootState) =>
      Object.values(state.allTripApi.queries).some(
        (query) =>
          query &&
          query.endpointName === "getRawFuelWithDate" &&
          query.status === "pending"
      )
  );

  const handleFetchFuelAdblueAlerts = () => {
    // Only call raw fuel API for users other than 833193
    if (Number(userId) !== 833193) {
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
    [isModalOpen]
  );

  return (
    <>
      {data.gpsDtl.fuel &&
      data.gpsDtl.fuel <= 100 &&
      data.gpsDtl.port !== 31500 ? (
        <Tooltip title="Fuel Percentage" mouseEnterDelay={1}>
          <div
            className="flex items-center gap-2 border border-neutral-200 rounded-full px-2 py-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
              handleFetchFuelAdblueAlerts();
            }}
          >
            <div className="w-[14px] h-[14px]">
              {data.gpsDtl.fuel > 50 ? (
                <Image src={fuelGreen} alt="fuel green" />
              ) : (
                <Image src={fuelRed} alt="fuel red" />
              )}
            </div>
            <div>
              <p className="font-semibold text-xs text-neutral-600">
                {Number(userId) === 833193
                  ? data.gpsDtl.fuel.toFixed(2)
                  : data.gpsDtl.fuel.toFixed(0)}
                {Number(userId) === 833193 ? "L" : "%"}
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
              loading={isLoading || isGetRawWithDataWithoutLocationLoading}
            >
              Fetch Alerts
            </Button>
          </div>

          <FuelAdblueTabs
            data={data}
            rawData={rawData}
            fuelTrackingData={fuelTrackingData}
            isLoading={
              isLoading ||
              isGetRawWithDataWithoutLocationLoading ||
              isFuelTrackingLoading
            }
            error={error}
            startDate={customDateRange[0]}
            endDate={customDateRange[1]}
          />
        </div>
      </Modal>
    </>
  );
};
