"use client";

import { BarChartOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import GeofenceVehiclesModal from "./GeofenceVehiclesModal";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

import TotalKmIcon from "@/public/assets/svgs/overview/total_km.svg";
import MileageIcon from "@/public/assets/svgs/overview/mileage.svg";
import FuelIcon from "@/public/assets/svgs/overview/fuel.svg";
import { useLazyGetConsolidateDetailQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useGetInGeofenceVehiclesQuery } from "@/app/_globalRedux/services/geofenceVehicles";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import moment from "moment";

interface MetricItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  size?: "small" | "middle";
  isLoading?: boolean;
}

const MetricItem = ({
  icon,
  value,
  label,
  color,
  size,
  isLoading,
}: MetricItemProps) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${
          size === "small" ? "w-8 h-8" : "w-10 h-10"
        } rounded-full flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        {isLoading ? (
          <div className="mb-1">
            <div
              className="bg-gray-200 rounded animate-pulse"
              style={{
                width: size === "small" ? "25px" : "30px",
                height: size === "small" ? "16px" : "18px",
              }}
            />
          </div>
        ) : (
          <p
            className={`${
              size === "small" ? "text-base" : "text-lg"
            } font-bold text-gray-900`}
          >
            {value}
          </p>
        )}
        <p
          className={`${
            size === "small" ? "text-[10px]" : "text-xs"
          } font-light text-gray-500`}
        >
          {label}
        </p>
      </div>
    </div>
  );
};

const PerformanceMetrics = () => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);

  const [getConsolidateDetailTrigger] = useLazyGetConsolidateDetailQuery();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalVehicles, setModalVehicles] = useState<any[]>([]);
  const [yesterdaysConsolidatedData, setYesterdaysConsolidatedData] = useState<
    | { totalKm: string; totalFuelConsumed: string; totalMileagePerKm: string }
    | undefined
  >({
    totalKm: "",
    totalFuelConsumed: "",
    totalMileagePerKm: "",
  });

  const { data: geofenceData, isLoading: geofenceLoading } =
    useGetInGeofenceVehiclesQuery(
      { token: groupId },
      { skip: Number(userId) !== 81707 }
    );

  const geofenceVehiclesData = useMemo(() => {
    if (Number(userId) === 81707 && geofenceData?.list) {
      const totalVehicles = geofenceData.list.length;
      const delhiVehicles = geofenceData.list.filter(
        (vehicle) => vehicle.geo_street === "Delhi_Geofence"
      ).length;
      const mumbaiVehicles = geofenceData.list.filter(
        (vehicle) => vehicle.geo_street === "Mumbai_geofence"
      ).length;

      return {
        totalVehicles: totalVehicles.toString(),
        delhiVehicles: delhiVehicles.toString(),
        mumbaiVehicles: mumbaiVehicles.toString(),
      };
    }
    return null;
  }, [geofenceData, userId]);

  const handleGeofenceClick = (type: "total" | "delhi" | "mumbai") => {
    if (Number(userId) !== 81707 || !geofenceData?.list) return;

    let filteredData = geofenceData.list;
    let title = "";

    switch (type) {
      case "total":
        title = "All Vehicles in Geofence";
        break;
      case "delhi":
        filteredData = geofenceData.list.filter(
          (v) => v.geo_street === "Delhi_Geofence"
        );
        title = "Vehicles in Delhi Geofence";
        break;
      case "mumbai":
        filteredData = geofenceData.list.filter(
          (v) => v.geo_street === "Mumbai_geofence"
        );
        title = "Vehicles in Mumbai Geofence";
        break;
    }

    setModalTitle(title);
    setModalVehicles(filteredData);
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (Number(userId) === 81707) {
      setIsLoading(geofenceLoading);
    } else if (userId) {
      setIsLoading(true);
      getConsolidateDetailTrigger({
        token: groupId,
        userId,
        startDate: moment(new Date()).subtract(1, "day").format("YYYY-MM-DD"),
      }).then(({ data }) => {
        const totalKm = Array.isArray(data?.list)
          ? data.list.reduce((sum, p) => p.Total_KM + sum, 0)
          : 0;
        const totalMileagePerKm = 2.9;
        const toalFuelConsumed = totalKm / totalMileagePerKm;

        setYesterdaysConsolidatedData({
          totalKm: `${totalKm?.toFixed(2)}`,
          totalFuelConsumed: `${toalFuelConsumed?.toFixed(2)}`,
          totalMileagePerKm: `${totalMileagePerKm?.toFixed(2)}`,
        });
        setIsLoading(false);
      });
    }
  }, [userId, geofenceLoading]);
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 min-h-[156px] max-h-[156px]">
      <div className="border-b border-gray-200 pb-2 mb-4 py-2 px-3">
        <div className="mx-2 flex items-center gap-2">
          <BarChartOutlined className="text-gray-600" />
          <span className="font-medium text-gray-900">
            {Number(userId) === 81707
              ? "In Geofence"
              : "Yesterday's Performance"}
          </span>
        </div>
      </div>

      <div className="mx-2 flex gap-5 -mt-2">
        <div className="ml-4">
          <div
            className={
              Number(userId) === 81707
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : ""
            }
            onClick={() =>
              Number(userId) === 81707 && handleGeofenceClick("total")
            }
          >
            <MetricItem
              icon={
                <div>
                  <Image
                    src={TotalKmIcon}
                    alt="TableView"
                    width={60}
                    height={60}
                    draggable={false}
                  />
                </div>
              }
              value={
                Number(userId) === 81707
                  ? geofenceVehiclesData?.totalVehicles ?? "0"
                  : yesterdaysConsolidatedData?.totalKm ?? "NA"
              }
              size="middle"
              label={Number(userId) === 81707 ? "Total Vehicle" : "Total Km"}
              color="bg-blue-50"
              isLoading={isLoading}
            />
          </div>
          {/* <div className="flex items-start gap-2 ml-3 mt-1.5">
            <div className="w-2 h-2 rounded-full flex items-center justify-center bg-blue-500 mt-1.5" />
            <p className="text-[10px] font-semibold text-gray-800">
              Driven km is above set range.
            </p>
          </div> */}
        </div>
        <div className="max-w-[1px] w-[1px] h-[100px] bg-gray-200" />

        <div className="flex flex-col space-y-2 mb-1">
          <div
            className={
              Number(userId) === 81707
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : ""
            }
            onClick={() =>
              Number(userId) === 81707 && handleGeofenceClick("delhi")
            }
          >
            <MetricItem
              icon={
                <div>
                  <Image
                    src={Number(userId) === 81707 ? MileageIcon : FuelIcon}
                    alt="TableView"
                    width={60}
                    height={60}
                    draggable="false"
                  />
                </div>
              }
              value={
                Number(userId) === 81707
                  ? geofenceVehiclesData?.delhiVehicles ?? "0"
                  : yesterdaysConsolidatedData?.totalFuelConsumed ?? "NA"
              }
              size="small"
              label={
                Number(userId) === 81707 ? "In Delhi" : "Total Fuel Consumed"
              }
              color="bg-orange-50"
              isLoading={isLoading}
            />
          </div>
          <div
            className={
              Number(userId) === 81707
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : ""
            }
            onClick={() =>
              Number(userId) === 81707 && handleGeofenceClick("mumbai")
            }
          >
            <MetricItem
              icon={
                <div>
                  <Image
                    src={MileageIcon}
                    alt="TableView"
                    width={60}
                    height={60}
                    draggable={false}
                  />
                </div>
              }
              value={
                Number(userId) === 81707
                  ? geofenceVehiclesData?.mumbaiVehicles ?? "0"
                  : yesterdaysConsolidatedData?.totalMileagePerKm ?? "NA"
              }
              size="small"
              label={Number(userId) === 81707 ? "In Mumbai" : "Total Mileage"}
              color="bg-orange-50"
              isLoading={isLoading}
            />
          </div>
        </div>
        <div className="flex flex-col space-y-1 mt-4">
          <div className="">
            <Image
              src="/assets/images/truck.png"
              alt="TableView"
              width={160}
              height={90}
              className="object-contain"
              draggable={false}
            />
          </div>
          <div className="">
            <p className="text-[7px] text-gray-500 justify-end ml-10">
              TATA 3125 BS6, Phase 2, 2025
            </p>
          </div>
        </div>
      </div>

      {/* Geofence Vehicles Modal */}
      <GeofenceVehiclesModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={modalTitle}
        data={modalVehicles}
      />
    </div>
  );
};

export default PerformanceMetrics;
