"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useLazyGetRawGearDataByVehicleAndDateQuery } from "@/app/_globalRedux/services/gearDetails";
import moment from "moment";
import { Spin } from "antd";

interface GearSpeedDistributionProps {
  vid: string | number;
  vehReg: string;
  dateRange: [Date | null, Date | null];
}

export default function GearSpeedDistribution({ vid, vehReg, dateRange }: GearSpeedDistributionProps) {
  const { userId, groupId: token } = useSelector((state: RootState) => state.auth);
  const [getGearData, { isFetching }] = useLazyGetRawGearDataByVehicleAndDateQuery();
  const [gearStats, setGearStats] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
  });

  useEffect(() => {
    if (!vid || !userId || !token || !dateRange[0] || !dateRange[1]) return;

    const fetchAll = async () => {
      try {
        const gearRes = await getGearData({
          vId: Number(vid),
          startdate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss"),
          enddate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss"),
          requestfor: parseInt(token || "59872"),
          userid: userId.toString(),
          interval: 120,
        }).unwrap();

        if (!gearRes || !gearRes.rawdata || gearRes.rawdata.length === 0) {
          setGearStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 });
          return;
        }

        const validGearData = gearRes.rawdata.filter((item: any) => item.gear !== 0);
        const totalRecords = validGearData.length;

        if (totalRecords === 0) {
          setGearStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 });
          return;
        }

        // Initialize count
        const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        validGearData.forEach((item: any) => {
          const gear = item.gear;
          if (gear >= 1 && gear <= 7) {
            counts[gear]++;
          }
        });

        // Compute percentages
        const percentages: { [key: number]: number } = {};
        for (let g = 1; g <= 7; g++) {
          percentages[g] = Math.round((counts[g] / totalRecords) * 100);
        }

        // Apply gear percentage adjustment logic from View.tsx
        const maxGear = percentages[6] >= percentages[7] ? 6 : 7;
        const maxGearValue = percentages[maxGear];

        if (percentages[1] <= 2 && maxGearValue > 0) {
          const addAmount = Math.round((3 / 100) * maxGearValue);
          if (percentages[maxGear] >= addAmount) {
            percentages[maxGear] -= addAmount;
            percentages[1] = addAmount;
          }
        }

        if (percentages[2] <= 2 && maxGearValue > 0) {
          const addAmount = Math.round((5 / 100) * maxGearValue);
          if (percentages[maxGear] >= addAmount) {
            percentages[maxGear] -= addAmount;
            percentages[2] = addAmount;
          }
        }

        if (percentages[3] <= 2 && maxGearValue > 0) {
          const addAmount = Math.round((7 / 100) * maxGearValue);
          if (percentages[maxGear] >= addAmount) {
            percentages[maxGear] -= addAmount;
            percentages[3] = addAmount;
          }
        }

        setGearStats(percentages);
      } catch (err) {
        console.error("Error fetching gear distribution:", err);
      }
    };

    fetchAll();
  }, [vid, dateRange, userId, token, getGearData]);

  const romanGears = [
    { label: "VII", value: gearStats[7] },
    { label: "VI", value: gearStats[6] },
    { label: "V", value: gearStats[5] },
    { label: "IV", value: gearStats[4] },
    { label: "III", value: gearStats[3] },
    { label: "II", value: gearStats[2] },
    { label: "I", value: gearStats[1] },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 flex flex-col h-[352px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Gear Specific Engine Speed Distribution</h2>
      </div>

      {isFetching ? (
        <div className="flex-1 flex items-center justify-center">
          <Spin size="default" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col space-y-5 pl-2 ml-8 border-l border-gray-200 py-1 relative">
            {romanGears.map(({ label, value }) => (
              <div key={label} className="flex items-center text-xs relative">
                {/* Y-Axis Label (Roman Numeral) */}
                <span className="absolute left-[-42px] w-8 text-right pr-2.5 font-semibold text-gray-500 select-none">
                  {label}
                </span>

                {/* Progress bar container */}
                <div
                  className="h-3.5 w-full relative overflow-hidden"
                  style={{
                    background: "repeating-linear-gradient(to right, #F3F4F6, #F3F4F6 3px, #FFFFFF 3px, #FFFFFF 6px)"
                  }}
                >
                  {value > 0 && (
                    <div
                      style={{
                        width: `${value}%`,
                        background: "repeating-linear-gradient(to right, #0066FF, #0066FF 3px, #FFFFFF 3px, #FFFFFF 6px)"
                      }}
                      className="h-full transition-[width] duration-500 ease-out"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* X-Axis labels at the bottom */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-8 mt-2 select-none border-t border-gray-300 pt-2">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>
      )}
    </div>
  );
}
