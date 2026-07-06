"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  useLazyGetVehicleReportQuery,
  useLazyGetAlertsByDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { useLazyGetRawGearDataByVehicleAndDateQuery } from "@/app/_globalRedux/services/gearDetails";
import moment from "moment";
import { Spin } from "antd";

interface DriverScorecardProps {
  vid: string | number;
  vehReg: string;
  dateRange: [Date | null, Date | null];
  onScoreCalculated?: (score: number) => void;
}

export default function DriverScorecard({ vid, vehReg, dateRange, onScoreCalculated }: DriverScorecardProps) {
  const { userId, groupId: token } = useSelector((state: RootState) => state.auth);

  const [getVehicleReport, { isFetching: isReportLoading }] = useLazyGetVehicleReportQuery();
  const [getGearData, { isFetching: isGearLoading }] = useLazyGetRawGearDataByVehicleAndDateQuery();
  const [fetchAlerts, { isFetching: isAlertsLoading }] = useLazyGetAlertsByDateQuery();

  const [reportData, setReportData] = useState<any>(null);
  const [gearData, setGearData] = useState<any>(null);
  const [alertCounts, setAlertCounts] = useState({
    overspeed: 0,
    harshBreak: 0,
    harshacc: 0,
    freewheeling: 0,
  });

  useEffect(() => {
    if (!vid || !userId || !token || !dateRange[0] || !dateRange[1]) return;

    const startStr = moment(dateRange[0]).format("YYYY-MM-DD");
    const endStr = moment(dateRange[1]).format("YYYY-MM-DD");

    const fetchAll = async () => {
      try {
        // 1. Fetch Vehicle Report
        const reportRes = await getVehicleReport({
          vId: Number(vid),
          startdate: startStr,
          enddate: endStr,
          requestfor: parseInt(token || "59872"),
          userid: parseInt(userId || "833105"),
        }).unwrap();
        setReportData(reportRes?.list?.[0] || null);

        // 2. Fetch Gear Data
        const gearRes = await getGearData({
          vId: Number(vid),
          startdate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
          enddate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
          requestfor: parseInt(token || "59872"),
          userid: userId.toString(),
          interval: 120,
        }).unwrap();
        setGearData(gearRes || null);

        // 3. Fetch Alert Counts
        const alertTypes = ["OverSpeed", "harshBreaking", "harshAcceleration", "Freewheeling"];
        const alertPromises = alertTypes.map((type) =>
          fetchAlerts({
            userId: userId.toString(),
            token: token.toString(),
            alertType: type,
            startDateTime: moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
            endDateTime: moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
            vehReg: type === "Freewheeling" ? "" : vehReg,
            vehId: type === "Freewheeling" ? 0 : Number(vid),
          }).unwrap()
        );

        const alertResponses = await Promise.all(alertPromises);

        const isMatch = (v: string | number | null) => {
          if (!v) return false;
          return v.toString().replace(/\s/g, "").toLowerCase() === vehReg.replace(/\s/g, "").toLowerCase();
        };

        const oCount = alertResponses[0]?.list?.[0]?.overspeed?.filter((item: any) => isMatch(item.vehicle_no)).length || 0;
        const bCount = alertResponses[1]?.list?.[0]?.harshBreak?.filter((item: any) => isMatch(item.vehicle_no)).length || 0;
        const aCount = alertResponses[2]?.list?.[0]?.harshacc?.filter((item: any) => isMatch(item.vehicle_no)).length || 0;
        const fCount = alertResponses[3]?.list?.[0]?.freewheeling?.filter((item: any) => isMatch(item.vehicle_no)).length || 0;

        setAlertCounts({
          overspeed: oCount,
          harshBreak: bCount,
          harshacc: aCount,
          freewheeling: fCount,
        });
      } catch (err) {
        console.error("Error fetching score card details:", err);
      }
    };

    fetchAll();
  }, [vid, vehReg, dateRange, userId, token, getVehicleReport, getGearData, fetchAlerts]);

  // Scoring Logic Helper
  const getDays = () => {
    if (!dateRange[0] || !dateRange[1]) return 7;
    return moment(dateRange[1]).diff(moment(dateRange[0]), "days") + 1;
  };

  const getDistanceScore = () => {
    if (!reportData?.total_km) return 0;
    const avg = parseFloat(reportData.total_km) / getDays();
    return avg < 500 ? 5 : 10;
  };

  const getMileageScore = () => {
    if (!reportData?.avg_mileage) return 0;
    const mileage = parseFloat(reportData.avg_mileage);
    if (mileage < 3) return 5;
    if (mileage >= 3 && mileage < 4.5) return 7.5;
    return 10;
  };

  const getFuelConsumedScore = () => {
    if (!reportData?.idle_fuel_consumed || !reportData?.total_km) return 10;
    const idleFuel = parseFloat(reportData.idle_fuel_consumed);
    const totalKm = parseFloat(reportData.total_km);
    if (totalKm === 0) return 10;
    const fuelPer500 = (idleFuel / totalKm) * 500;
    if (fuelPer500 < 5) return 10;
    if (fuelPer500 >= 5 && fuelPer500 < 10) return 5;
    return 0;
  };

  const getCountScore = (count: number) => {
    if (count < 2) return 10;
    if (count >= 2 && count <= 5) return 5;
    return 0;
  };

  const getOptimalGearScore = () => {
    if (!gearData?.rawdata || gearData.rawdata.length === 0) return 0;
    const valid = gearData.rawdata.filter((item: any) => item.gear !== 0);
    if (valid.length === 0) return 0;
    const optimal = valid.filter((item: any) => item.gear === 5 || item.gear === 6 || item.gear === 7);
    const utilization = (optimal.length / valid.length) * 100;
    if (utilization > 70) return 10;
    if (utilization >= 60 && utilization <= 70) return 5;
    return 0;
  };

  const distanceScore = getDistanceScore();
  const mileageScore = getMileageScore();
  const fuelScore = getFuelConsumedScore();
  const freewheelScore = getCountScore(alertCounts.freewheeling);
  const harshAccScore = getCountScore(alertCounts.harshacc);
  const overspeedScore = getCountScore(alertCounts.overspeed);
  const harshBrakeScore = getCountScore(alertCounts.harshBreak);
  const gearScore = getOptimalGearScore();

  const totalScore =
    distanceScore + mileageScore + fuelScore + freewheelScore + harshAccScore + overspeedScore + harshBrakeScore + gearScore;

  const scoreDetails = [
    { name: "Total Distance Coverd", score: distanceScore },
    { name: "Mileage", score: mileageScore },
    { name: "Fuel Consumed (idle)", score: fuelScore },
    { name: "Free wheeling", score: freewheelScore },
    { name: "Harsh acceleration", score: harshAccScore },
    { name: "Over speeding", score: overspeedScore },
    { name: "Harsh Brake", score: harshBrakeScore },
    { name: "Optimal gear", score: gearScore },
  ];

  // SVG Gauge calculations
  const strokeDash = 157; // semi circle circumference
  const fillAmount = (totalScore / 80) * strokeDash;

  const isLoading = isReportLoading || isGearLoading || isAlertsLoading;

  useEffect(() => {
    if (onScoreCalculated && !isLoading) {
      onScoreCalculated(totalScore);
    }
  }, [totalScore, isLoading, onScoreCalculated]);

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 flex flex-col h-[352px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Driver Score Card</h2>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spin size="default" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between items-center">
          {/* Donut / Gauge SVG */}
          <div className="relative w-48 h-[105px] flex justify-center items-end mt-1 overflow-hidden select-none">
            <svg className="w-52 h-[105px]" viewBox="0 0 120 70">
              <path
                d="M 15 65 A 45 45 0 0 1 105 65"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 15 65 A 45 45 0 0 1 105 65"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash}`}
                strokeDashoffset={`${strokeDash - fillAmount}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 select-none">
              <span className="text-[7px] text-gray-600 font-bold uppercase tracking-wider">Total Score</span>
              <span className="text-3xl font-extrabold text-gray-800 leading-none">{totalScore}</span>
            </div>
          </div>

          {/* Subscores Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-2">
            {scoreDetails.map(({ name, score }) => {
              // Color coding logic
              let pillClass = "bg-green-50 text-green-600 border-green-200";
              if (score <= 2.5) {
                pillClass = "bg-red-50 text-red-600 border-red-200";
              } else if (score <= 7.4) {
                pillClass = "bg-orange-50 text-orange-600 border-orange-200";
              }

              return (
                <div key={name} className="flex justify-between items-center text-[11px] font-medium text-gray-600">
                  <span className="truncate pr-1">{name}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${pillClass}`}>
                    {score}/10
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
