"use client";

import { TruckImage } from "@/public/assets/svgs/nav";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useGetAlarmInfoMutation } from "@/app/_globalRedux/services/gpstracktech";
import {
  useLazyGetVehicleReportQuery,
  useLazyGetKuberFuelFillingAndTheftQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { useLazyGetRawGearDataByVehicleAndDateQuery } from "@/app/_globalRedux/services/gearDetails";
import moment from "moment";
import { Modal, Spin } from "antd";

interface TruckSectionProps {
  vid: string | number;
  iemi: string | null;
  dateRange?: [Date | null, Date | null];
}

// Icons
const TiredIcon = () => (
  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 10c.5-.5 1.5-.5 2 0M13 10c.5-.5 1.5-.5 2 0" />
    <path d="M10 15h4" />
  </svg>
);

const PhoneIconComponent = () => (
  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const SmokingIconComponent = () => (
  <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="14" width="14" height="4" rx="1" />
    <path d="M17 14h1v4h-1z" fill="currentColor" />
    <path d="M18 10c0-1-1-2-1-2M21 9c0-1.5-1-3-1-3" />
    <line x1="3" y1="16" x2="13" y2="16" stroke="gray" />
  </svg>
);

const SnapshotIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TruckSection = ({ iemi, vid, dateRange }: TruckSectionProps) => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const [getGPSTrackTechAlarms] = useGetAlarmInfoMutation();
  const [getVehicleReport, { data: vehicleReportData, isFetching: isReportFetching }] = useLazyGetVehicleReportQuery();
  const [getGearData, { data: gearData, isFetching: isGearFetching }] = useLazyGetRawGearDataByVehicleAndDateQuery();
  const [getFuelFilling, { data: fuelFillingData, isFetching: isFuelFetching }] = useLazyGetKuberFuelFillingAndTheftQuery();
  const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
  const vehReg = selectedVehicle?.vehReg || "HR58f6810";

  const isDataLoading = isReportFetching || isGearFetching || isFuelFetching;

  useEffect(() => {
    if (vid) {
      const startDate = dateRange && dateRange[0]
        ? moment(dateRange[0]).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");
      const endDate = dateRange && dateRange[1]
        ? moment(dateRange[1]).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");

      getVehicleReport({
        vId: Number(vid),
        startdate: startDate,
        enddate: endDate,
        requestfor: parseInt(groupId || "59872"),
        userid: parseInt(userId || "833105"),
      });
    }
  }, [vid, dateRange, userId, groupId, getVehicleReport]);

  useEffect(() => {
    if (vid && userId && groupId) {
      const startDateGear = dateRange && dateRange[0]
        ? moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss")
        : moment().format("YYYY-MM-DD HH:mm:ss");
      const endDateGear = dateRange && dateRange[1]
        ? moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss")
        : moment().format("YYYY-MM-DD HH:mm:ss");

      getGearData({
        vId: Number(vid),
        startdate: startDateGear,
        enddate: endDateGear,
        requestfor: parseInt(groupId || "59872"),
        userid: userId.toString(),
        interval: 120,
      });
    }
  }, [vid, dateRange, userId, groupId, getGearData]);

  useEffect(() => {
    if (vid && userId && groupId) {
      const startDateFuel = dateRange && dateRange[0]
        ? moment(dateRange[0]).startOf("day").format("YYYY-MM-DD HH:mm")
        : moment().startOf("day").format("YYYY-MM-DD HH:mm");
      const endDateFuel = dateRange && dateRange[1]
        ? moment(dateRange[1]).endOf("day").format("YYYY-MM-DD HH:mm")
        : moment().endOf("day").format("YYYY-MM-DD HH:mm");

      getFuelFilling({
        userId: Number(userId),
        vehId: Number(vid),
        startDate: startDateFuel,
        endDate: endDateFuel,
        type: 1,
      });
    }
  }, [vid, dateRange, userId, groupId, getFuelFilling]);

  const reportData = vehicleReportData?.list?.[0];

  const getReportValue = (value: any, defaultValue: number) => {
    if (value === undefined || value === null) return defaultValue;
    const num = parseFloat(value.toString());
    return isNaN(num) ? defaultValue : parseFloat(num.toFixed(2));
  };

  const getGearUtilization = () => {
    if (!gearData?.rawdata || gearData.rawdata.length === 0) {
      return "0%";
    }
    const validGearData = gearData.rawdata.filter((item: any) => item.gear !== 0);
    const totalRecords = validGearData.length;
    if (totalRecords === 0) return "0%";
    const optimalGearRecords = validGearData.filter(
      (item: any) => item.gear === 5 || item.gear === 6 || item.gear === 7
    );
    const utilization = (optimalGearRecords.length / totalRecords) * 100;
    return `${utilization.toFixed(1)}%`;
  };

  const getMaxFuelFilling = () => {
    if (!fuelFillingData?.list || fuelFillingData.list.length === 0) {
      return "0 L";
    }
    const values = fuelFillingData.list
      .map((item: any) => parseFloat(item.value))
      .filter((v: number) => !isNaN(v));

    if (values.length === 0) return "0 L";
    const maxVal = Math.max(...values);
    return `${maxVal} L`;
  };

  const Details = [
    {
      name: "Total Distance Covered",
      value: `${getReportValue(reportData?.total_km, 0)} KM`,
    },
    {
      name: "Mileage",
      value: `${getReportValue(reportData?.avg_mileage, 0)} km/litre`,
    },
    {
      name: "Fuel Consumed (Idle)",
      value: `${getReportValue(reportData?.idle_fuel_consumed, 0)} Litres`,
    },
    {
      name: "Optimzal Gear Utlization",
      value: getGearUtilization(),
    },
    {
      name: "Fuel Filling",
      value: getMaxFuelFilling(),
    },
    {
      name: "Proactive Fault",
      value: 0,
    },
  ];

  const isBSJ = iemi?.includes("##BSJ") ?? false;
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedAlarm, setSelectedAlarm] = useState<any>(null);
  const [modalType, setModalType] = useState<"image" | "video" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (isBSJ && iemi) {
      setLoading(true);
      const cleanImei = iemi.replace("##BSJ", "");
      const startTime = dateRange && dateRange[0]
        ? moment(dateRange[0]).startOf("day").format("YYYY-MM-DD HH:mm:ss")
        : moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
      const endTime = dateRange && dateRange[1]
        ? moment(dateRange[1]).endOf("day").format("YYYY-MM-DD HH:mm:ss")
        : moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");

      getGPSTrackTechAlarms({
        ids: [201, 38, 202, 213, 200, 209],
        pageNumber: 1,
        pageSize: 50,
        queryParams: [cleanImei],
        queryType: 1,
        startTime,
        endTime,
      })
        .unwrap()
        .then((response) => {
          if (response && response.code === 200 && response.data) {
            const withMedia = response.data.filter((alarm: any) => {
              return alarm.aviPath || alarm.imagePath || alarm.mediaPath || alarm.filePath;
            });
            setAlarms(withMedia);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch dashcam alerts in details section:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isBSJ, iemi, getGPSTrackTechAlarms, dateRange]);

  const filteredAlarms = alarms.filter((alarm) => {
    const alarmType = alarm.alarmType;
    if (activeFilter === "all") return true;
    if (activeFilter === "tired") return alarmType === 38 || alarmType === 200 || alarmType === "fatigueWarn";
    if (activeFilter === "phone") return alarmType === 201 || alarmType === "handheldPhoneCall";
    if (activeFilter === "smoking") return alarmType === 202 || alarmType === "smoking";
    return true;
  });

  const alertsPerPage = 5;
  const totalPages = Math.ceil(filteredAlarms.length / alertsPerPage);
  const indexOfLastAlert = currentPage * alertsPerPage;
  const indexOfFirstAlert = indexOfLastAlert - alertsPerPage;
  const currentAlerts = filteredAlarms.slice(indexOfFirstAlert, indexOfLastAlert);

  return (
    <div>
      <div className="relative">
        <Image
          src={TruckImage}
          alt="Truck"
          width={1200}
          height={1500}
          draggable={false}
          className="relative"
        />

        <div className="absolute top-[4.5rem] left-[26rem] flex flex-col items-center space-y-3">
          <div className="flex items-center space-x-4">
            {Details.slice(0, 3).map(({ name, value }) => (
              <div className="bg-white rounded-lg shadow-sm text-black px-2 pt-3 pb-2 w-48" key={name}>
                <p>{name}</p>
                <div className="w-full border-b border-[#A3A3A3]" />
                <h1 className="font-medium text-2xl h-8 flex items-center justify-start">
                  {isDataLoading ? (
                    <Spin size="small" />
                  ) : (
                    value
                  )}
                </h1>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {Details.slice(3, 6).map(({ name, value }) => (
              <div className="bg-white rounded-lg shadow-sm text-black px-2 pt-3 pb-2 w-48" key={name}>
                <p>{name}</p>
                <div className="w-full border-b border-[#A3A3A3]" />
                <h1 className="font-medium text-2xl h-8 flex items-center justify-start">
                  {isDataLoading ? (
                    <Spin size="small" />
                  ) : (
                    value
                  )}
                </h1>
              </div>
            ))}
          </div>
        </div>

        {isBSJ && (
          <div className="absolute left-[64.2rem] top-0 w-[410px] backdrop-blur-xl rounded-xl border border-white/80 shadow-2xl p-3 flex flex-col justify-between h-[380px]">
            <div className="flex-1 flex flex-col space-y-2">
              <div>
                <h2 className="font-bold text-gray-800 mb-2 tracking-tight">Dashcam Alerts</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "tired", label: "Tired" },
                    { id: "phone", label: "Phone Call" },
                    { id: "smoking", label: "Smoking" },
                  ].map((filter) => {
                    const isActive = activeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-150"
                          }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {/* Table Headers */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider px-4 mb-2">
                  <span className="w-[40%]">Alert type</span>
                  <span className="w-[45%] text-center">Time</span>
                  <span className="w-[15%] text-right">Media</span>
                </div>

                {/* Alerts List */}
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : currentAlerts.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 text-xs font-semibold">No alerts found</div>
                  ) : (
                    currentAlerts.map((alert) => {
                      const alertTypeNum = alert.alarmType;

                      // Format display name
                      let displayName = alert.alarmName || "Alert";
                      if (!alert.alarmName || alert.alarmName.toLowerCase() === "alert") {
                        if (alertTypeNum === 38 || alertTypeNum === 200 || alert.alarmType === "fatigueWarn") displayName = "Tired";
                        else if (alertTypeNum === 201 || alert.alarmType === "handheldPhoneCall") displayName = "Phone call";
                        else if (alertTypeNum === 202 || alert.alarmType === "smoking") displayName = "Smoking";
                      }

                      // Format time
                      const displayTime = moment(alert.alarmTime || alert.alarmTs).format("DD MMM, YYYY h:mm A");

                      return (
                        <div
                          key={alert.alarmId || alert.id}
                          className="flex items-center justify-between bg-white rounded-full border border-gray-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-2 py-1 text-xs hover:shadow-md transition-shadow duration-200"
                        >
                          {/* Alert Type & Icon */}
                          <div className="flex items-center space-x-2 w-[40%] truncate">
                            {alertTypeNum === 38 || alertTypeNum === 200 || alert.alarmType === "fatigueWarn" ? (
                              <TiredIcon />
                            ) : alertTypeNum === 201 || alert.alarmType === "handheldPhoneCall" ? (
                              <PhoneIconComponent />
                            ) : alertTypeNum === 202 || alert.alarmType === "smoking" ? (
                              <SmokingIconComponent />
                            ) : (
                              <AlertIcon />
                            )}
                            <span className="font-semibold text-gray-700">{displayName}</span>
                          </div>

                          <div className="text-gray-200 font-light select-none">|</div>

                          {/* Time */}
                          <div className="w-[45%] text-center text-gray-500 font-medium truncate">
                            {displayTime}
                          </div>

                          <div className="text-gray-200 font-light select-none">|</div>

                          {/* Media Actions */}
                          <div className="w-[15%] flex justify-end items-center space-x-1">
                            {/* Snapshot trigger */}
                            <button
                              onClick={() => {
                                setSelectedAlarm(alert);
                                setModalType("image");
                              }}
                              className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors"
                              title="View Snapshot"
                            >
                              <SnapshotIcon />
                            </button>

                            {/* Video trigger */}
                            <button
                              onClick={() => {
                                setSelectedAlarm(alert);
                                setModalType("video");
                              }}
                              className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors"
                              title="Play Video"
                            >
                              <PlayIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-xs">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed font-semibold"
                  >
                    Previous
                  </button>
                  <span className="text-gray-500 font-semibold select-none">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed font-semibold"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media Playback Modal */}
      <Modal
        title={
          selectedAlarm ? (
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-gray-800">
                {modalType === "image" ? "Alert Snapshot" : "Alert Video Playback"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vehicle: <span className="font-semibold">{vehReg}</span> | Time:{" "}
                <span className="font-semibold">
                  {moment(selectedAlarm.alarmTime || selectedAlarm.alarmTs).format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </p>
            </div>
          ) : null
        }
        open={!!selectedAlarm}
        onCancel={() => {
          setSelectedAlarm(null);
          setModalType(null);
        }}
        footer={null}
        destroyOnClose
        centered
        width={modalType === "image" ? 600 : 700}
      >
        {selectedAlarm && (
          <div className="mt-4 flex justify-center items-center bg-slate-950 rounded-xl overflow-hidden min-h-[300px] relative">
            {modalType === "image" ? (
              (() => {
                const imageUrl = selectedAlarm.imagePath
                  ? `https://y.gpstracktech.com${selectedAlarm.imagePath.split(",")[0]}`
                  : "https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=600&auto=format&fit=crop";
                return (
                  <img
                    src={imageUrl}
                    alt="Alert Snapshot"
                    className="max-w-full max-h-[450px] object-contain"
                  />
                );
              })()
            ) : (
              (() => {
                const videoUrl = selectedAlarm.aviPath
                  ? `https://y.gpstracktech.com${selectedAlarm.aviPath}`
                  : null;
                return videoUrl ? (
                  <video
                    src={videoUrl}
                    className="w-full max-h-[450px]"
                    controls
                    autoPlay
                  />
                ) : (
                  <div className="text-white py-8 text-center text-sm">No video recording available</div>
                );
              })()
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TruckSection;
