"use client";

import React, { useState, useEffect, useRef, useMemo, forwardRef, useCallback } from "react";
import { Kodchasan } from "next/font/google";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { BadgeIcon, DriverImage, TruckBlackIcon } from "@/public/assets/svgs/nav";
import { useGetVehiclesByStatusQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { setSelectedVehicleBySelectElement } from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { setOpenStoppageIndex } from "@/app/_globalRedux/dashboard/mapSlice";
import { setLiveVehicleItnaryWithPath } from "@/app/_globalRedux/dashboard/liveVehicleSlice";
import { setSelectedVehicleDeviceId } from "@/app/_globalRedux/dashboard/videoTelematics";
import { vehicleItnaryWithPathInitialState } from "@/app/_globalRedux/dashboard/vehicleItnaryWithPathSlice";
import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/_components/common/datePicker/datePicker.css";
import TruckSection from "./details-section";
import DriverBehaviour from "./driver-behaviour";
import DriverScorecard from "./driver-scorecard";
import GearSpeedDistribution from "./gear-speed-distribution";

const kodchasan = Kodchasan({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const View = () => {
  const dispatch = useDispatch();
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const markers = useSelector((state: RootState) => state.markers);
  const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

  const { data: vehicleData } = useGetVehiclesByStatusQuery(
    { token: groupId, userId, pUserId: userId, mode: "" },
    { skip: !groupId || !userId }
  );

  useEffect(() => {
    if (vehicleData?.list?.length) {
      dispatch(
        setAllMarkers(
          vehicleData.list.map((v) => ({
            ...v,
            visibility: true,
            isMarkerInfoWindowOpen: false,
          }))
        )
      );
    }
  }, [vehicleData, dispatch]);

  const allowedVehicles = useMemo(() => {
    const rawList = vehicleData?.list || markers || [];
    return rawList.filter((vehicle: any) => {
      return vehicle.gpsDtl?.fuel && vehicle.gpsDtl?.fuel <= 100;
    });
  }, [vehicleData?.list, markers]);

  const list = allowedVehicles;

  const selectVehicle = useCallback((vehicle: any) => {
    dispatch(setOpenStoppageIndex(-1));
    dispatch(
      setSelectedVehicleBySelectElement({
        ...vehicle,
        searchType: "",
        selectedVehicleHistoryTab: selectedVehicle?.selectedVehicleHistoryTab || "All",
        nearbyVehicles: [],
        prevVehicleSelected: selectedVehicle?.vId || 0,
      })
    );
    if (vehicle.gpsDtl?.model !== null) {
      dispatch(setSelectedVehicleDeviceId(vehicle.gpsDtl?.model));
    }
    dispatch(setLiveVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));
  }, [dispatch, selectedVehicle]);

  useEffect(() => {
    if (list.length > 0 && !selectedVehicle?.vehReg) {
      selectVehicle(list[0]);
    }
  }, [list, selectedVehicle, selectVehicle]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() => {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date();
    start.setDate(start.getDate() - 8);
    return [start, end];
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [driverScore, setDriverScore] = useState<number | null>(null);

  useEffect(() => {
    setDriverScore(null);
  }, [selectedVehicle?.vId, dateRange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredList = list.filter((v) =>
    v.vehReg?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const displayDateString = dateRange[0]
    ? `${formatDate(dateRange[0])}${dateRange[1] ? ` - ${formatDate(dateRange[1])}` : ""}`
    : "Select Dates";

  // Reusable Pill component acting as custom input trigger for react-datepicker
  const CustomPillInput = forwardRef<HTMLButtonElement, any>(
    ({ value, onClick }, ref) => (
      <button
        ref={ref}
        onClick={onClick}
        className="w-fit bg-white rounded-full pl-3 pr-4 py-1 flex items-center justify-between gap-4 shadow-sm border border-gray-100 transition-all duration-200 cursor-pointer select-none focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            {/* Solid Calendar SVG Icon matching mockup */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 flex-shrink-0 object-contain" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800 text-sm tracking-wide whitespace-nowrap">
            {displayDateString}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCalendarOpen ? "transform rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    )
  );
  CustomPillInput.displayName = "CustomPillInput";

  return (
    <div className={`bg-gradient-to-tr from-[#F1F3E8] to-[#E2F2FF] min-h-screen overflow-y-auto p-3 mb-6 ${kodchasan.className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="font-medium text-3xl mb-1">Driver Behaviour</h1>
            <p className="text-sm">Track Driver Behaviour and Performance</p>
          </div>
          <div className="relative mt-[-15px] select-none flex items-center justify-center">
            <Image src={BadgeIcon} alt="badge" width={90} height={90} draggable={false} />
            <div className="absolute inset-0 flex items-center justify-center pb-4">
              <span className="font-bold text-[15px] text-gray-800 tracking-tight select-none">
                {driverScore !== null ? `${((driverScore / 80) * 100).toFixed(1)}%` : "---%"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Pickers Group */}
        <div className="flex items-center space-x-4">
          {/* Custom Premium Vehicle Selector Dropdown */}
          <div className="relative w-[240px] font-sans" ref={dropdownRef}>
            {/* Pill Trigger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-white rounded-full pl-3 pr-4 py-1 flex items-center justify-between gap-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer select-none focus:outline-none"
            >
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                  <Image src={TruckBlackIcon} width={20} height={20} alt="truck" draggable={false} className="object-contain" />
                </div>
                <span className="font-semibold text-gray-800 text-sm tracking-wide">
                  {selectedVehicle?.vehReg || "Select Vehicle"}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100/80 z-50 overflow-hidden transition-all duration-200 origin-top">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search vehicle..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 text-gray-800"
                      autoFocus
                    />
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-2.5 p-0.5 hover:bg-gray-200 rounded-full transition-colors">
                        <svg className="w-3 h-3 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Vehicle List */}
                <div className="max-h-[200px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
                  {filteredList.length === 0 ? (
                    <div className="px-4 py-4 text-center text-xs text-gray-400 font-medium">No vehicles found</div>
                  ) : (
                    filteredList.map((v) => {
                      const isSelected = selectedVehicle?.vId === v.vId;
                      return (
                        <button
                          key={v.vId}
                          onClick={() => {
                            selectVehicle(v);
                            setIsOpen(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center space-x-3 text-left border-b border-gray-50 last:border-b-0 transition-colors duration-150 ${isSelected ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-gray-50"
                            }`}
                        >
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${isSelected ? "bg-blue-100/50" : "bg-gray-100/50"}`}>
                            <Image src={TruckBlackIcon} width={14} height={14} alt="truck" draggable={false} className="object-contain" />
                          </div>
                          <span className={`text-xs font-semibold tracking-wide flex-1 ${isSelected ? "text-blue-600" : "text-gray-700"}`}>
                            {v.vehReg}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Direct React Date Picker triggered by custom Pill input */}
          <div className="relative font-sans animate-fade-in z-50">
            <DatePicker
              selectsRange
              startDate={dateRange[0] || undefined}
              endDate={dateRange[1] || undefined}
              onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
              onCalendarOpen={() => setIsCalendarOpen(true)}
              onCalendarClose={() => setIsCalendarOpen(false)}
              customInput={<CustomPillInput />}
              popperPlacement="bottom-end"
            />
          </div>

          {selectedVehicle?.drivers?.driverName && selectedVehicle?.drivers?.driverName !== "NA" && (
            <div className="flex items-center space-x-3">
              <Image src={DriverImage} alt="Driver" width={40} height={40} draggable={false} />
              <div>
                <p className="text-white bg-black p-2 rounded-full">{selectedVehicle?.drivers?.driverName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Truck Details */}
      <TruckSection iemi={selectedVehicle?.gpsDtl?.model} vid={selectedVehicle?.vId} dateRange={dateRange} />

      {/* 3-Column Grid Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-10">
        <DriverBehaviour vid={selectedVehicle?.vId} vehReg={selectedVehicle?.vehReg} dateRange={dateRange} />
        <DriverScorecard vid={selectedVehicle?.vId} vehReg={selectedVehicle?.vehReg} dateRange={dateRange} onScoreCalculated={setDriverScore} />
        <GearSpeedDistribution vid={selectedVehicle?.vId} vehReg={selectedVehicle?.vehReg} dateRange={dateRange} />
      </div>
    </div>
  );
};

export default View;
