"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useLazyGetAlertsByDateQuery } from "@/app/_globalRedux/services/trackingDashboard";
import moment from "moment";
import { Spin } from "antd";

interface DriverBehaviourProps {
  vid: string | number;
  vehReg: string;
  dateRange: [Date | null, Date | null];
}

interface AlertListItem {
  type: "Free Wheeling" | "Over Speed" | "Harsh Acceleration" | "Harsh Break";
  description: string;
  time: string;
  timestamp: number;
}

export default function DriverBehaviour({ vid, vehReg, dateRange }: DriverBehaviourProps) {
  const { userId, groupId: token } = useSelector((state: RootState) => state.auth);
  const [fetchAlerts, { isFetching }] = useLazyGetAlertsByDateQuery();

  const [alertData, setAlertData] = useState<{
    freewheeling: number;
    overspeed: number;
    harshacc: number;
    harshBreak: number;
  }>({
    freewheeling: 0,
    overspeed: 0,
    harshacc: 0,
    harshBreak: 0,
  });

  const [alertList, setAlertList] = useState<AlertListItem[]>([]);

  useEffect(() => {
    if (!vid || !userId || !token || !dateRange[0] || !dateRange[1]) return;

    const startStr = moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss");
    const endStr = moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss");

    const fetchAll = async () => {
      try {
        const alertTypes = ["OverSpeed", "harshBreaking", "harshAcceleration", "Freewheeling"];
        const promises = alertTypes.map((type) =>
          fetchAlerts({
            userId: userId.toString(),
            token: token.toString(),
            alertType: type,
            startDateTime: startStr,
            endDateTime: endStr,
            vehReg: type === "Freewheeling" ? "" : vehReg,
            vehId: type === "Freewheeling" ? 0 : Number(vid),
          }).unwrap()
        );

        const responses = await Promise.all(promises);

        let fCount = 0;
        let oCount = 0;
        let aCount = 0;
        let bCount = 0;

        const combinedList: AlertListItem[] = [];

        // Helper to check vehicle matching
        const isMatch = (v: string | number | null) => {
          if (!v) return false;
          const cleanV = v.toString().replace(/\s/g, "").toLowerCase();
          const cleanTarget = vehReg.replace(/\s/g, "").toLowerCase();
          return cleanV === cleanTarget;
        };

        // 1. OverSpeed
        const overSpeedRes = responses[0];
        if (overSpeedRes?.success && overSpeedRes.list?.[0]?.overspeed) {
          const list = overSpeedRes.list[0].overspeed.filter((item: any) => isMatch(item.vehicle_no));
          oCount = list.length;
          list.forEach((item: any) => {
            combinedList.push({
              type: "Over Speed",
              description: "Vehicle overspeeding",
              time: item.starttime || startStr,
              timestamp: item.starttime ? moment(item.starttime).valueOf() : 0,
            });
          });
        }

        // 2. harshBreaking (Harsh Break)
        const harshBreakRes = responses[1];
        if (harshBreakRes?.success && harshBreakRes.list?.[0]?.harshBreak) {
          const list = harshBreakRes.list[0].harshBreak.filter((item: any) => isMatch(item.vehicle_no));
          bCount = list.length;
          list.forEach((item: any) => {
            combinedList.push({
              type: "Harsh Break",
              description: "Harsh braking detected",
              time: item.starttime || startStr,
              timestamp: item.starttime ? moment(item.starttime).valueOf() : 0,
            });
          });
        }

        // 3. harshAcceleration (Harsh Acceleration)
        const harshAccRes = responses[2];
        if (harshAccRes?.success && harshAccRes.list?.[0]?.harshacc) {
          const list = harshAccRes.list[0].harshacc.filter((item: any) => isMatch(item.vehicle_no));
          aCount = list.length;
          list.forEach((item: any) => {
            combinedList.push({
              type: "Harsh Acceleration",
              description: "Harsh acceleration detected",
              time: item.starttime || startStr,
              timestamp: item.starttime ? moment(item.starttime).valueOf() : 0,
            });
          });
        }

        // 4. Freewheeling
        const freewheelRes = responses[3];
        if (freewheelRes?.success && freewheelRes.list?.[0]?.freewheeling) {
          const list = freewheelRes.list[0].freewheeling.filter((item: any) => isMatch(item.vehicle_no));
          fCount = list.length;
          list.forEach((item: any) => {
            combinedList.push({
              type: "Free Wheeling",
              description: "Vehicle doing Freewheeling",
              time: item.starttime || startStr,
              timestamp: item.starttime ? moment(item.starttime).valueOf() : 0,
            });
          });
        }

        // Sort descending by time
        combinedList.sort((a, b) => b.timestamp - a.timestamp);

        setAlertData({
          freewheeling: fCount,
          overspeed: oCount,
          harshacc: aCount,
          harshBreak: bCount,
        });

        setAlertList(combinedList.slice(0, 10)); // keep up to 10 for display
      } catch (err) {
        console.error("Error fetching driver behaviour alerts:", err);
      }
    };

    fetchAll();
  }, [vid, vehReg, dateRange, userId, token, fetchAlerts]);

  const totalAlerts = alertData.freewheeling + alertData.overspeed + alertData.harshacc + alertData.harshBreak;

  const fPercent = totalAlerts > 0 ? (alertData.freewheeling / totalAlerts) * 100 : 0;
  const oPercent = totalAlerts > 0 ? (alertData.overspeed / totalAlerts) * 100 : 0;
  const aPercent = totalAlerts > 0 ? (alertData.harshacc / totalAlerts) * 100 : 0;
  const bPercent = totalAlerts > 0 ? (alertData.harshBreak / totalAlerts) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 flex flex-col h-[352px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Driver Behaviour</h2>
      </div>

      {isFetching ? (
        <div className="flex-1 flex items-center justify-center">
          <Spin size="default" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Headers */}
            {totalAlerts > 0 ? (
              <div className="flex w-full text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 select-none">
                {fPercent > 0 && (
                  <div style={{ width: `${fPercent}%` }} className="text-left pl-1 truncate">
                    Free Wheeling
                  </div>
                )}
                {oPercent > 0 && (
                  <div style={{ width: `${oPercent}%` }} className="text-left pl-1 truncate">
                    Over Speed
                  </div>
                )}
                {aPercent > 0 && (
                  <div style={{ width: `${aPercent}%` }} className="text-left pl-1 truncate">
                    Harsh Accel
                  </div>
                )}
                {bPercent > 0 && (
                  <div style={{ width: `${bPercent}%` }} className="text-left pl-1 truncate">
                    Harsh Break
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 text-center select-none">
                <span>Free Wheeling</span>
                <span>Over Speed</span>
                <span>Harsh Accel</span>
                <span>Harsh Break</span>
              </div>
            )}

            {/* Segmented Progress Bar */}
            <div className="flex h-10 w-full rounded-lg overflow-hidden mb-6 border border-gray-50/50 shadow-inner">
              {totalAlerts === 0 ? (
                <div className="w-full bg-gray-50 text-gray-400 flex items-center justify-center text-xs font-semibold">
                  No alerts detected
                </div>
              ) : (
                <>
                  {fPercent > 0 && (
                    <div
                      style={{ width: `${fPercent}%` }}
                      className="bg-[#DDE2F8] text-[#4A5EAA] flex items-center justify-center font-bold text-xs transition-all duration-300"
                    >
                      {fPercent.toFixed(1)}%
                    </div>
                  )}
                  {oPercent > 0 && (
                    <div
                      style={{ width: `${oPercent}%` }}
                      className="bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs transition-all duration-300"
                    >
                      {oPercent.toFixed(1)}%
                    </div>
                  )}
                  {aPercent > 0 && (
                    <div
                      style={{ width: `${aPercent}%` }}
                      className="bg-[#F59E0B] text-white flex items-center justify-center font-bold text-xs transition-all duration-300"
                    >
                      {aPercent.toFixed(1)}%
                    </div>
                  )}
                  {bPercent > 0 && (
                    <div
                      style={{ width: `${bPercent}%` }}
                      className="bg-black text-white flex items-center justify-center font-bold text-xs transition-all duration-300"
                    >
                      {bPercent.toFixed(1)}%
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Alerts Table/List */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {alertList.length === 0 ? (
                <div className="text-center text-gray-400 py-10 text-xs font-semibold">
                  No behaviour events logged
                </div>
              ) : (
                alertList.map((alert, index) => {
                  let colorClass = "bg-[#DDE2F8]";
                  if (alert.type === "Over Speed") colorClass = "bg-[#3B82F6]";
                  if (alert.type === "Harsh Acceleration") colorClass = "bg-[#F59E0B]";
                  if (alert.type === "Harsh Break") colorClass = "bg-black";

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0 text-xs"
                    >
                      {/* Left: Dot & Name */}
                      <div className="flex items-center space-x-2.5 w-[35%] truncate">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`} />
                        <span className="font-semibold text-gray-700">{alert.type}</span>
                      </div>
                      {/* Right: Time */}
                      <div className="w-[25%] text-right text-gray-400 font-semibold tabular-nums">
                        {moment(alert.time).format("YYYY-MM-DD HH:mm:ss")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
