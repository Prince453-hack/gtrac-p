"use client";

import React, { useEffect, useState, useRef } from "react";
// import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Modal, Spin, message } from "antd";
// import "../App.css";
import Vector from "./icons/Vector.png";
import Export from "./icons/Group.png";
import balla from "./icons/balla.png";
import Ahmedabad from "./icons/Ahmedabadchm12.png";
import Chennai from "./icons/chennai.jpeg";
import Cochin from "./icons/chennai.jpeg";
import Delhi from "./icons/delhi.png";
import Mumbai from "./icons/Mumbai.png";
import Pune from "./icons/Pune.png";
import Surat from "./icons/Surat.png";
import Hyderabad from "./icons/hyderabad.jpeg";
import Kolkata from "./icons/Kolkata.png";
import Bhubaneshwar from "./icons/Bhubaneshwar.png";
import Guwahati from "./icons/Guwahati.png";
import bangalore from "./icons/banglore.png";
import lucknow from "./icons/lucknow.jpeg";
import derabassi from "./icons/derabassi.png";
import jaipur from "./icons/jaipur.png";
import Siliguri from "./icons/Siliguri Chamber.png";
import Krishnapatnam from "./icons/Krishnapatnam.jpeg";
import Vizag from "./icons/Vizag.jpeg";
import Coimbatore from "./icons/Coimbatore.jpeg";
import kundli from "./icons/kundli.png";

import TicketForm from "./TicketForm";
import type { StaticImageData } from "next/image";

// ⭐ TypeScript Interfaces
interface GPSDetails {
  gpsStatus?: number;
  temperature?: number | string;
  setchamberTemp?: string;
  temprange?: string;
}

interface VehicleItem {
  vId: string | number;
  vehReg: string;
  gpsDtl?: GPSDetails;
  tempRange?: string;
}

interface RegionChamber {
  name: string;
  tokenid: string;
  sysUserid: string;
  within: number;
  below: number;
  above: number;
  total: number;
  // image can be static import (StaticImageData) or string (public path)
  img?: StaticImageData | string;
}

interface ChamberDataType {
  South: RegionChamber[];
  North: RegionChamber[];
  East: RegionChamber[];
  West: RegionChamber[];
}

// Strongly-typed region key
type RegionKey = keyof ChamberDataType;

export function Dashboard() {
  const [openChambers, setOpenChambers] = useState<Record<RegionKey, boolean>>({
    South: true, // open by default
    North: false,
    East: false,
    West: false,
  });
  const [chamberworkbutton, setChamberworkbutton] = useState(true);

  const [toggleexport, Settoggleexport] = useState(false);
  const [dataVehReg, SetdataVehReg] = useState<any[]>([]);
  const [graphView, SetGraphView] = useState<any[]>([]);
  const [isGraphLoading, setIsGraphLoading] = useState(false);

  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const [selectedVehReg, setSelectedVehReg] = useState("");

  const [isTicketOpen, setIsTicketOpen] = useState(false);

  const [Selectedchamber, setSelectedchamber] = useState<any[]>([]);

  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const [dynamicChamberData, setDynamicChamberData] = useState<
    Record<RegionKey, RegionChamber[]>
  >({
    South: [],
    North: [],
    East: [],
    West: [],
  });
  const [regionLoading, setRegionLoading] = useState<
    Record<RegionKey, boolean>
  >({
    South: false,
    North: false,
    East: false,
    West: false,
  });
  const [counts, setCounts] = useState({
    green: 0,
    orange: 0,
    red: 0,
  });

  const [headerTotal, setHeaderTotal] = useState(0);
  const [vehicleRanges, setVehicleRanges] = useState<any[]>([]);

  const [nonWorkingCount, setNonWorkingCount] = useState(0); // State for non-working count

  function getTemperatureClass(temperature: any, setChamberTemp: any) {
    const temp = parseFloat(temperature as any);

    if (isNaN(temp)) return "invalid_temperature";
    if (!setChamberTemp) return "ignore";

    const s = String(setChamberTemp).trim();
    if (
      s.toLowerCase() === "dry" ||
      s === "Dry##Dry" ||
      s.toLowerCase() === "dry##dry" ||
      s.toLowerCase() === "dry to dry" ||
      s.toLowerCase() === "dry,dry"
    ) {
      return "green";
    }

    if (
      s.toLowerCase() === "empty" ||
      s === "Empty##Empty" ||
      s.toLowerCase() === "empty##empty" ||
      s.toLowerCase() === "empty to empty" ||
      s.toLowerCase() === "emptytoempty" ||
      s.toLowerCase() === "empty,empty"
    ) {
      return "green";
    }

    if (
      s.toLowerCase() === "off" ||
      s === "OFF##OFF" ||
      s.toLowerCase() === "off##off" ||
      s.toLowerCase() === "off to off" ||
      s.toLowerCase() === "off,off"
    ) {
      return "green";
    }

    if (
      s.toLowerCase() === "ambient" ||
      s === "Ambient##Ambient" ||
      s.toLowerCase() === "ambient##ambient" ||
      s.toLowerCase() === "ambient to ambient" ||
      s.toLowerCase() === "ambient,ambient"
    ) {
      return "green";
    }

    let fromStr: string, toStr: string;

    if (s.includes("##")) [fromStr, toStr] = s.split("##");
    else if (s.includes(" to ")) [fromStr, toStr] = s.split(" to ");
    else if (s.includes(",")) [fromStr, toStr] = s.split(",");
    else {
      fromStr = s;
      toStr = s;
    }

    const fromtemp = parseFloat(fromStr);
    const Totemp = parseFloat(toStr);

    if (isNaN(fromtemp) || isNaN(Totemp)) return "ignore";

    const adjFrom = fromtemp >= 0 ? fromtemp - 3 : fromtemp + 3;
    const adjTo = Totemp >= 0 ? Totemp + 3 : Totemp - 3;

    if (
      (temp <= adjFrom && temp >= adjTo) ||
      (temp >= adjFrom && temp <= adjTo)
    ) {
      return "green";
    }

    // Below range (4 cases)
    if (adjFrom >= 0 && temp < adjFrom) {
      return "orange";
    }

    if (adjTo < 0 && temp < adjTo) {
      return "orange";
    }

    // Above range (4 cases)
    if (adjTo >= 0 && temp > adjTo) {
      return "red";
    }

    if (adjFrom < 0 && temp > adjFrom) {
      return "red";
    }

    // -------------------------------------------------------
    // END PHP LOGIC
    // -------------------------------------------------------

    return "ignore";
  }

  const [count, Setcount] = useState(0);

  const allbutton = () => {
    Setcount((prev) => prev + 1);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDashboardLoading(true);
        const res = await fetch(
          "https://www.carsathi.in/trackingdashboard/getListVehiclesmob?token=7202&userid=7300&mode=&groupid=7202"
        );
        const data = await res.json();
        SetdataVehReg(data.list || []);
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      } finally {
        setIsDashboardLoading(false);
      }
    };
    fetchData();
    Rendersidebar("7202", "7300");
  }, [count]);

  useEffect(() => {
    const countNonWorkingVehicles = () => {
      const count = dataVehReg.filter(
        (item) => !isGpstimeRecent(item, 48)
      ).length;
      setNonWorkingCount(count);
    };

    countNonWorkingVehicles();
  }, [dataVehReg]); // Re-run when dataVehReg changes

  useEffect(() => {
    if (!Selectedchamber || Selectedchamber.length === 0) {
      setCounts({ green: 0, orange: 0, red: 0 });
      setVehicleRanges([]);
      return;
    }

    let green = 0;
    let orange = 0;
    let red = 0;

    const rangesArray = Selectedchamber.map((item) => {
      const temp = item?.gpsDtl?.temperature;
      const setTemp = item?.gpsDtl?.setchamberTemp;
      const range = getTemperatureClass(temp, setTemp);

      if (range === "green") green++;
      else if (range === "orange") orange++;
      else if (range === "red") red++;

      return {
        vId: item.vId,
        vehReg: item.vehReg,
        range,
      };
    });

    setCounts({ green, orange, red });
    setVehicleRanges(rangesArray);
  }, [Selectedchamber]);

  const Rendersidebar = async (tokenid: string, sysUserid: string) => {
    setIsDashboardLoading(true);
    const res = await fetch(
      `https://www.carsathi.in/trackingdashboard/getListVehiclesmob?token=${tokenid}&sys_user_id=${sysUserid}&mode=&groupid=${tokenid}`
    );
    const cdata = await res.json();
    const list = cdata.list || [];
    setSelectedchamber(list);
    setIsDashboardLoading(false);
  };

  const rendergraphView = async (vId: any) => {
    const now = new Date();

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    const startDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 00:00`;

    const endDate = formatDate(now);

    try {
      const res = await fetch(
        `https://gtrac.in:8089/trackingDashboard/getTempwithDate?vId=${vId}&startdate=${encodeURIComponent(
          startDate
        )}&enddate=${encodeURIComponent(
          endDate
        )}&requestfor=0&userid=7300&interval=60`
      );

      const data = await res.json();
      const rawArray = data.rawdata;
      if (Array.isArray(rawArray) && rawArray.length > 0) {
        SetGraphView(rawArray);
        setIsGraphOpen(true);
        setIsGraphLoading(false);
      } else {
        SetGraphView([]);
        setIsGraphLoading(false);
        message.warning("No temperature data available for this vehicle");
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
      SetGraphView([]);
      setIsGraphLoading(false);
      message.error("Failed to load graph data. Please try again.");
    }
  };

  const chartData = graphView.map((item) => ({
    time: item.gps_time,
    temperature:
      typeof item.tel_temperature !== "undefined" &&
      !isNaN(Number(item.tel_temperature))
        ? Number(item.tel_temperature)
        : null,
  }));

  const computeCountsFromList = (list: any[] = []) => {
    let within = 0,
      below = 0,
      above = 0;
    list.forEach((item) => {
      const temp = item?.gpsDtl?.temperature;
      const setTemp = item?.gpsDtl?.setchamberTemp;
      if (typeof temp !== "undefined" && typeof setTemp !== "undefined") {
        const cls = getTemperatureClass(
          parseFloat(temp as any),
          String(setTemp)
        );
        if (cls === "green") within++;
        else if (cls === "orange") below++;
        else if (cls === "red") above++;
      } else {
        const range = (item.gpsDtl?.temprange || "")
          .toString()
          .trim()
          .toLowerCase();
        if (["green", "blue", "within", "inrange"].includes(range)) within++;
        else if (["orange", "yellow", "below"].includes(range)) below++;
        else if (["red", "above", "outofrange"].includes(range)) above++;
      }
    });
    return { within, below, above, total: list.length || 0 };
  };

  const callApi = async (regionKey: RegionKey) => {
    const chambers = chamberData[regionKey] || [];
    setDynamicChamberData((p) => ({ ...p, [regionKey]: [] }));
    setRegionLoading((r) => ({ ...r, [regionKey]: true }));

    for (const ch of chambers) {
      try {
        const res = await fetch(
          `https://www.carsathi.in/trackingdashboard/getListVehiclesmob?token=${encodeURIComponent(
            ch.tokenid
          )}&sys_user_id=${encodeURIComponent(
            ch.sysUserid
          )}&mode=&groupid=${encodeURIComponent(ch.tokenid)}`
        );
        const json = await res.json();
        const list = json.list || [];
        const counts = computeCountsFromList(list);
        const item = { ...ch, ...counts };

        setDynamicChamberData((prev) => {
          const prevArr = prev[regionKey] || [];
          const merged = [...prevArr, item];
          const seen = new Set();
          const deduped = merged.filter((it) => {
            const key = String(it?.tokenid || it?.name || "");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return { ...prev, [regionKey]: deduped };
        });
      } catch (err) {
        console.error("callApi error for", ch.name, err);
        const item = { ...ch, within: 0, below: 0, above: 0, total: 0 };
        setDynamicChamberData((prev) => {
          const prevArr = prev[regionKey] || [];
          const merged = [...prevArr, item];
          const seen = new Set();
          const deduped = merged.filter((it) => {
            const key = String(it?.tokenid || it?.name || "");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return { ...prev, [regionKey]: deduped };
        });
      }
    }

    setRegionLoading((r) => ({ ...r, [regionKey]: false }));
    return chambers.length;
  };

  const fetchAllChambers = async (regionKey: RegionKey | "all" = "South") => {
    try {
      if (regionKey === "all") {
        const regions = Object.keys(chamberData) as RegionKey[];
        let total = 0;
        for (const r of regions) {
          total += await callApi(r);
        }
        return total;
      }
      return await callApi(regionKey as RegionKey);
    } catch (err) {
      console.error("fetchAllChambers error:", err);
      return 0;
    }
  };

  const refreshIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const expected = chamberData["South"]?.length || 0;
      const loaded = await fetchAllChambers("South");

      if (!mounted) return;
      if (loaded >= expected) return;

      if (!refreshIntervalRef.current) {
        refreshIntervalRef.current = window.setInterval(async () => {
          const done = await fetchAllChambers("South");
          if (done >= expected && refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
          }
        }, 10000);
      }
    })();

    return () => {
      mounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleChamber = async (chamberKey: RegionKey) => {
    const isOpen = openChambers[chamberKey];
    const nextOpen = !isOpen;
    setOpenChambers((prev) => ({ ...prev, [chamberKey]: nextOpen }));

    if (!nextOpen) return;

    if ((dynamicChamberData[chamberKey] || []).length > 0) return;

    await fetchAllChambers(chamberKey);
  };

  const chamberData: ChamberDataType = {
    South: [
      {
        name: "Bangalore",
        tokenid: "50483",
        sysUserid: "78541",
        within: 11,
        below: 0,
        above: 3,
        total: 14,
        img: bangalore,
      },
      {
        name: "Cochin",
        tokenid: "50493",
        sysUserid: "78551",
        within: 5,
        below: 4,
        above: 3,
        total: 12,
        img: Cochin,
      },
      {
        name: "Chennai",
        tokenid: "50494",
        sysUserid: "78552",
        within: 0,
        below: 0,
        above: 0,
        total: 0,
        img: Chennai,
      },
      {
        name: "Hyderabad",
        tokenid: "50496",
        sysUserid: "78554",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Hyderabad,
      },
      {
        name: "Krishnapatnam",
        tokenid: "50497",
        sysUserid: "78555",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Krishnapatnam,
      },
      {
        name: "Vizag",
        tokenid: "50540",
        sysUserid: "78597",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Vizag,
      },
      {
        name: "Coimbatore",
        tokenid: "55511",
        sysUserid: "83337",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Coimbatore,
      },
    ],
    North: [
      {
        name: "Ballabgarh",
        tokenid: "50492",
        sysUserid: "78550",
        within: 11,
        below: 0,
        above: 3,
        total: 14,
        img: balla,
      },
      {
        name: "Derabassi",
        tokenid: "50495",
        sysUserid: "78553",
        within: 5,
        below: 4,
        above: 3,
        total: 12,
        img: derabassi,
      },
      {
        name: "Kundli Snowman",
        tokenid: "54979",
        sysUserid: "82822",
        within: 0,
        below: 0,
        above: 0,
        total: 0,
        img: kundli,
      },
      {
        name: "All India AMZ",
        tokenid: "55642",
        sysUserid: "83464",
        within: 8,
        below: 2,
        above: 4,
        total: 14,
        img: Delhi,
      },
      {
        name: "BlLucknow",
        tokenid: "59384",
        sysUserid: "87156",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: lucknow,
      },
    ],
    East: [
      {
        name: "Kolkata",
        tokenid: "50539",
        sysUserid: "78596",
        within: 11,
        below: 0,
        above: 3,
        total: 14,
        img: Kolkata,
      },
      {
        name: "Bhubaneshwar",
        tokenid: "50681",
        sysUserid: "78734",
        within: 5,
        below: 4,
        above: 3,
        total: 12,
        img: Bhubaneshwar,
      },
      {
        name: "Siliguri Chamber",
        tokenid: "55206",
        sysUserid: "83045",
        within: 0,
        below: 0,
        above: 0,
        total: 0,
        img: Siliguri,
      },
      {
        name: "Guwahati",
        tokenid: "58619",
        sysUserid: "86405",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Guwahati,
      },
    ],
    West: [
      {
        name: "Mumbai",
        tokenid: "50479",
        sysUserid: "78537",
        within: 11,
        below: 0,
        above: 3,
        total: 14,
        img: Mumbai,
      },
      {
        name: "Pune",
        tokenid: "50491",
        sysUserid: "78549",
        within: 5,
        below: 4,
        above: 3,
        total: 12,
        img: Pune,
      },
      {
        name: "Jaipur",
        tokenid: "50499",
        sysUserid: "78557",
        within: 0,
        below: 0,
        above: 0,
        total: 0,
        img: jaipur,
      },
      {
        name: "Surat",
        tokenid: "50559",
        sysUserid: "78612",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Surat,
      },
      {
        name: "Ahmedabadchm",
        tokenid: "50680",
        sysUserid: "78733",
        within: 17,
        below: 1,
        above: 3,
        total: 21,
        img: Ahmedabad,
      },
    ],
  };

  const renderWorking = (data: any[]) => {
    const filteredData = data
      .filter((item) => {
        // new behaviour: decide working/not-working by last gpstime within 48 hours
        const recent = isGpstimeRecent(item, 48);
        return chamberworkbutton ? recent : !recent;
      })
      .sort((a, b) => {
        const nameA = (a.vehReg || "").toUpperCase();
        const nameB = (b.vehReg || "").toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

    return (
      <div className="overflow-x-auto h-[500px] overflow-y-auto">
        {isDashboardLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-blue-600 font-medium">
              Loading table...
            </span>
          </div>
        ) : (
          <table className="min-w-full border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-600 text-xs">
              {[
                "S.No.",
                "Cold Room",
                "Date",
                "Current Temp",
                "Set Temp",
                "Range",
                "Door Sensor 1",
                "Door Sensor 2",
                "Graph View",
                "Ticket",
                "Status",
              ].map((head, i) => (
                <th
                  key={i}
                  className="p-1 border border-slate-300 font-semibold"
                >
                  {head}
                </th>
              ))}
            </thead>
            <tbody className="border border-slate-300">
              {filteredData.length > 0 ? (
                filteredData.map((item, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-100 border border-slate-300 cursor-pointer transition text-xs duration-200"
                  >
                    <td className="py-1 px-3 text-center">{rowIndex + 1}</td>
                    <td className="py-1 px-1 border text-center">
                      {item.vehReg || "N/A"}
                    </td>
                    <td className="py-3 px-3 border text-center">
                      {item.gpsDtl?.latLngDtl?.gpstime || "N/A"}
                    </td>
                    <td className="py-2 px-3 border text-white text-center">
                      <button
                        className={`bg-[#5CBD5C] text-white w-18 px-3 py-1 rounded-md`}
                      >
                        {item.gpsDtl?.temperature === null ||
                        item.gpsDtl?.temperature === undefined ||
                        item.gpsDtl?.temperature === ""
                          ? "N/A"
                          : parseFloat(item.gpsDtl.temperature).toFixed(2)}
                      </button>
                    </td>
                    <td className="py-2 px-5 border text-center">
                      {item.gpsDtl?.setchamberTemp?.replace("##", " to ") ||
                        "N/A"}
                    </td>
                    <td className="py-2 px-3 border text-center">
                      {(() => {
                        const currentTemp = item?.gpsDtl?.temperature;
                        const setTemp = item?.gpsDtl?.setchamberTemp;

                        const range = getTemperatureClass(currentTemp, setTemp);

                        return range === "ignore" ? (
                          <span className="text-gray-500">ignore</span>
                        ) : (
                          <button
                            className={`px-1 py-1 w-20 rounded-md ${
                              range === "green"
                                ? "bg-green-100 text-green-700"
                                : range === "orange"
                                ? "bg-orange-100 text-orange-700"
                                : range === "red"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {range}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-3 border text-center">
                      {item.doorSensor1 || "N/A"}
                    </td>
                    <td className="py-2 px-3 border text-center">
                      {item.doorSensor2 || "N/A"}
                    </td>
                    <td className="py-2 px-3 border text-blue-600 text-center">
                      <button
                        className="text-blue-700 hover:underline px-3 py-1 rounded-md w-full"
                        onClick={() => {
                          setSelectedVehReg(item.vehReg);
                          setIsGraphOpen(true);
                          setIsGraphLoading(true);
                          rendergraphView(item.vId);
                        }}
                      >
                        Graph View
                      </button>
                    </td>
                    <td className="py-2 px-3 border text-center">
                      <button
                        className="bg-[#5CBD5C] text-white w-24 px-3 py-1 rounded-md"
                        onClick={() => {
                          setSelectedVehReg(item.vehReg);
                          setIsTicketOpen(true);
                        }}
                      >
                        Raise Ticket
                      </button>
                    </td>
                    <td className="py-2 px-3 border text-center">
                      {item.gpsDtl?.gpsStatus === 1 ? "active" : "not-active"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    No vehicle data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {isGraphOpen &&
          ((chartData && chartData.length > 0) || isGraphLoading) && (
            <Modal
              title={`Temperature Graph — ${selectedVehReg || "Loading..."}`}
              open={true}
              onCancel={() => setIsGraphOpen(false)}
              footer={null}
              width={800}
              destroyOnClose
            >
              {isGraphLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" tip="Loading graph data..." />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(time: string) =>
                        time ? String(time).slice(11, 16) : ""
                      }
                    />
                    <YAxis unit="°C" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Modal>
          )}

        <TicketForm
          vehicleNo={selectedVehReg}
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
        />
      </div>
    );
  };

  const renderTable = (
    title: string,
    data: RegionChamber[],
    chamberKey: RegionKey
  ) => (
    <div className="bg-white mb-2 w-full border-b border-slate-200">
      <table className="w-30 px-2 font-sm">
        <thead>
          <tr
            className="py-2 text-gray-700 cursor-pointer"
            onClick={() => handleToggleChamber(chamberKey)}
          >
            <th className="py-2 font-sans px-3 text-left">{title}</th>
            <th className="py-2 px-3 font-normal font-sans text-[12px] text-[#29B24D]">
              Within Range
            </th>
            <th className="py-2 px-3 font-normal font-sans text-[12px] text-[#DD9C5F]">
              Below Range
            </th>
            <th className="py-2 px-3 font-normal font-sans text-[12px] text-[#F6646E]">
              Above Range
            </th>
            <th className="py-2 px-3 font-normal font-sans text-[12px] text-[#005CBF]">
              Total Range
            </th>
            <th>
              {openChambers[chamberKey] ? (
                <button onClick={() => handleToggleChamber(chamberKey)}>
                  {/* <KeyboardArrowUpIcon /> */}
                </button>
              ) : (
                <button onClick={() => handleToggleChamber(chamberKey)}>
                  {/* <KeyboardArrowDownIcon /> */}
                </button>
              )}
            </th>
          </tr>
        </thead>

        {openChambers[chamberKey] && (
          <tbody>
            {regionLoading[chamberKey] ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading {title}...</span>
                  </div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-100 cursor-pointer transition duration-200 text-xs"
                  onClick={() => {
                    Settoggleexport(true);
                    Rendersidebar(row.tokenid, row.sysUserid);
                  }}
                >
                  <td className="py-3 text-sm">
                    <div className="flex items-center">
                      <img
                        src={getImageSrc(row.img)}
                        alt={row.name || "icon"}
                        className="rounded-3xl h-6 mr-2 w-6 object-cover"
                        draggable={false}
                      />
                      {row.name}
                    </div>
                  </td>
                  <td className="py-2 px-6 text-xs">
                    <button className="bg-green-100 text-[#29B27D] font-bold px-3 py-1 rounded-md transition duration-300 w-full">
                      {row.within}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-xs">
                    <button className="bg-yellow-100 text-[#DD9C5F] font-bold px-4 py-1 rounded-md transition duration-300 w-full">
                      {row.below}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-xs">
                    <button className="bg-red-100 text-[#F6646E] font-bold px-4 py-1 rounded-md transition duration-300 w-full">
                      {row.above}
                    </button>
                  </td>
                  <td className="py-2 text-xs px-2">
                    {toggleexport ? (
                      <button className="text-blue-700 text-sm font-bold px-3 py-1 rounded-md hover:bg-blue-600 transition duration-300 w-full">
                        {row.total}
                      </button>
                    ) : (
                      <button className="text-white text-xs bg-blue-500 font-bold px-3 py-1 rounded-md hover:bg-blue-600 transition duration-300 w-full">
                        {row.total}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-4 text-gray-500 text-sm"
                >
                  No chamber data available
                </td>
              </tr>
            )}
          </tbody>
        )}
      </table>
    </div>
  );

  const dedupeChambers = (list: any[] = []) => {
    const seen = new Set();
    return (list || []).filter((item) => {
      const key = String(
        item?.tokenid || item?.name || item?.vehReg || JSON.stringify(item)
      );
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    const sourceList =
      Selectedchamber && Selectedchamber.length > 0
        ? Selectedchamber
        : dataVehReg || [];
    const countsObj = computeCountsFromList(sourceList);
    setCounts({
      green: countsObj.within || 0,
      orange: countsObj.below || 0,
      red: countsObj.above || 0,
    });
    setHeaderTotal(countsObj.total || sourceList.length || 0);
  }, [Selectedchamber, dataVehReg]);

  return (
    <div className="flex font-sans">
      <aside className="border border-b-0 min-w-[410px] border-slate-300 p-1 px-2 overflow-y-auto max-h-screen" style={{scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 #f1f5f9'}}>
        <div className="mb-4 mt-2">
          <button
            onClick={() => {
              allbutton();
            }}
            className="bg-[#144E8C] p-3 transition duration-300 hover:bg-blue-400 border hover:border-blue-500 hover:text-black flex items-center rounded-lg w-28"
          >
            <img
              src={getImageSrc(Vector)}
              alt="Vector not found"
              className="h-5 mr-5 ml-1 w-5"
              draggable={false}
            />
            <span className="text-white font-medium">All</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 ">
          {(Object.entries(chamberData) as [RegionKey, RegionChamber[]][]).map(
            ([key, value]) => {
              const source =
                dynamicChamberData[key] && dynamicChamberData[key].length > 0
                  ? dynamicChamberData[key]
                  : value;
              const dataToRender = dedupeChambers(source);
              return renderTable(`${key} Chamber`, dataToRender, key);
            }
          )}
        </div>
      </aside>

      <main className="w-full border border-l-0 border-b-0 border-slate-300 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-300">
          <div className="flex items-center space-x-2">
            <span className=" text-xl font-semibold">Ballabgarh Warehouse</span>
            <span className="text-xs font-extralight text-slate-400">
              / List View
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button className="bg-[#005CBF]  p-2  transition duration-300 border border-slate-300 text-white rounded-lg px-5 py-2 flex flex-col items-start">
              <span className="text-xl font-sans font-semibold leading-none">
                {headerTotal}
              </span>
              <div className="flex mt-4 items-center">
                <div className="bg-green-50 rounded-3xl h-1 w-1 mr-2"></div>
                <span className="text-xs">Total Range</span>
              </div>
            </button>

            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
              <div className=" flex px-4 py-1 flex-col items-start justify-center">
                <span className="text-xl font-semibold">{counts.green}</span>
                <div className="flex mt-2 items-center">
                  <div className="bg-[#29B24D] h-1 w-1 mr-2 rounded-3xl"></div>
                  <span className="text-xs text-[#29B27D]">Within range</span>
                </div>
              </div>
              <div className="p-2 flex px-4 py-2 flex-col items-start justify-center border-l border-slate-300">
                <span className="text-xl font-semibold">{counts.orange}</span>
                <div className="flex mt-2 items-center">
                  <div className="h-1 w-1 bg-[#DD9C5F] mr-2 rounded-3xl"></div>
                  <span className="text-xs text-[#DD9C5F]">Below range</span>
                </div>
              </div>
              <div className="p-2 px-4 py-2 flex flex-col items-start justify-center border-l border-slate-300">
                <span className="text-xl font-semibold">{counts.red}</span>
                <div className="flex mt-2 items-center">
                  <div className="bg-[#F6646E] rounded-3xl h-1 mr-2 w-1"></div>
                  <span className="text-xs text-[#F6646E]">Above range</span>
                </div>
              </div>
              <div className="p-2 px-4 py-2 flex flex-col items-start justify-center border-l border-slate-300">
                <span className="text-xl font-semibold">{nonWorkingCount}</span>
                <div className="flex mt-2 items-center">
                  <div className="bg-[#201f20] rounded-3xl h-1 mr-2 w-1"></div>
                  <span className="text-xs text-[rgb(46,44,44)]">
                    Not Working
                  </span>
                </div>
              </div>
              {/* <div className="p-2 px-4 py-2 flex flex-col items-start justify-center border-l border-slate-300">
                <span className="text-xl font-semibold">{counts.red}</span>
                <div className="flex mt-2 items-center">
                  <div className="bg-[#F6646E] rounded-3xl h-1 mr-2 w-1"></div>
                  <span className="text-xs text-[#F6646E]">Above range</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div className="flex mt-5 mb-3 px-7 items-center justify-between">
          <div className="flex">
            <button
              className={`font-bold text-xs px-7 py-3 transition duration-200 ${
                chamberworkbutton
                  ? "bg-white text-black border border-slate-300 rounded-l-md"
                  : "bg-slate-300 text-slate-500 border border-slate-300 rounded-l-md border-r-0"
              }`}
              onClick={() => setChamberworkbutton(true)}
            >
              Chamber-Working
            </button>

            <button
              className={`font-bold text-xs px-7 py-3 transition duration-200 ${
                !chamberworkbutton
                  ? "bg-white text-black border border-slate-300 rounded-r-md"
                  : "bg-slate-300 text-slate-500 border border-slate-300 rounded-r-md border-l-0"
              }`}
              onClick={() => setChamberworkbutton(false)}
            >
              Chamber-Not-Working
            </button>
          </div>

          {toggleexport ? (
            <button className="flex items-center gap-2 border-2 rounded-lg px-6 py-2 text-[#107C41] border-[#107C41]]">
              <img src={getImageSrc(Export)} alt="Export not found" />
              <span>Export</span>
            </button>
          ) : null}
        </div>

        <div className="font-medium px-7 rounded-sm p-2">
          {renderWorking(Selectedchamber)}
        </div>
      </main>
    </div>
  );
}

// Add default export so `import View from ".../View"` works:
export default Dashboard;

// helper: safely get string src from StaticImageData or string, with fallback
const getImageSrc = (
  img?: StaticImageData | string,
  fallback = "/icons/balla.png"
) =>
  typeof img === "string"
    ? img
    : (img && (img as StaticImageData).src) || fallback;

// helper: parse common gps time strings to Date, returns null if invalid
const parseGpsTime = (raw?: string | number | null): Date | null => {
  if (!raw && raw !== 0) return null;
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(raw).trim();
  // try builtin parser first
  const t = Date.parse(s);
  if (!isNaN(t)) return new Date(t);
  // fallback: replace '-' with '/' to support some browsers/locales
  const t2 = Date.parse(s.replace(/-/g, "/"));
  if (!isNaN(t2)) return new Date(t2);
  return null;
};

// returns true if item's last gpstime is within `hours` hours from now
const isGpstimeRecent = (item: any, hours = 48) => {
  const raw =
    item?.gpsDtl?.latLngDtl?.gpstime ||
    item?.gps_time ||
    item?.last_gps_time ||
    null;
  const d = parseGpsTime(raw);
  if (!d) return false;
  const diffMs = Date.now() - d.getTime();
  return diffMs <= hours * 3600 * 1000;
};
