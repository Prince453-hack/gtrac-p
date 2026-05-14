"use client";

import {
  useLazyConvertLatLngToAddressQuery,
  useLazyGetKuberFuelFillingAndTheftQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  ConfigProvider,
  Empty,
  InputNumber,
  Modal,
  Spin,
  Tabs,
  TabsProps,
  Tooltip,
  Image,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { useSelector } from "react-redux";

// Local type interface for raw data
interface GetRawDataWithoutLocationApiResponse {
  rawdata: any[];
}
import moment from "moment";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FuelChart, AdblueChart } from "./FuelAndAdBlueChart";
import {
  AdblueAndFuelTable,
  AdblueAndFuelTableKuber,
  NewFuelTrackingTable,
} from "./FuelAndAdBlueTable";
import "leaflet/dist/leaflet.css";

// Custom marker icon using divIcon (more reliable)
let CustomMarkerIcon: any;
if (typeof window !== "undefined") {
  const L = require("leaflet");

  CustomMarkerIcon = L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #3b82f6;
        "></div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -34],
  });
}

// Dynamic import for React Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

export type Point = {
  odometer: string;
  fuel: number;
  adblue: number;
  time: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  location: string;
  event: "filled" | "theft" | null;
  amountFilled: number | null;
  amountStolen: number | null;
  distanceSinceLastFill: number | null;
};

export type FillTheftLogPoint = {
  sys_service_id: number;
  type: string;
  latitude: number;
  longitude: number;
  typeId: string;
  value: string;
  fillingTime: string;
  event_address: string;
};

export function computeMetrics(
  data: Point[],
  key: "fuel" | "adblue",
  threshold: number,
  distanceWindow: number = 10,
  timeWindow: number = 10 * 60 * 1000,
) {
  if (data.length === 0) return [];

  const fillEvents: {
    index: number;
    amountFilled: number;
    distanceSinceLastFill: number;
  }[] = [];
  let lastFillOdometer = data[0]?.odometer ?? "0";

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const diff = curr[key] - prev[key];
    if (diff > threshold) {
      const distanceSinceLastFill =
        Number(curr.odometer) - Number(lastFillOdometer);
      fillEvents.push({ index: i, amountFilled: diff, distanceSinceLastFill });
      lastFillOdometer = curr.odometer;
    }
  }

  const buckets = groupIntoBuckets(data, 5);

  const theftEvents: { index: number; amountStolen: number }[] = [];
  for (const bucket of buckets) {
    if (bucket.length >= 2) {
      const first = bucket[0];
      const last = bucket[bucket.length - 1];
      const diff = last[key] - first[key];
      if (diff < -threshold) {
        const index = data.indexOf(last);
        theftEvents.push({ index, amountStolen: -diff });
      }
    }
  }

  const hasNearbyTheft = (fillIndex: number) => {
    return theftEvents.some((theft) => {
      const timeDiff =
        new Date(data[fillIndex].time).getTime() -
        new Date(data[theft.index].time).getTime();
      const distance = Math.abs(
        Number(data[fillIndex].odometer) - Number(data[theft.index].odometer),
      );
      return (
        theft.index < fillIndex &&
        timeDiff <= timeWindow &&
        distance <= distanceWindow
      );
    });
  };

  const hasNearbyFill = (theftIndex: number) => {
    return fillEvents.some((fill) => {
      const timeDiff =
        new Date(data[fill.index].time).getTime() -
        new Date(data[theftIndex].time).getTime();
      const distance = Math.abs(
        Number(data[fill.index].odometer) - Number(data[theftIndex].odometer),
      );
      return (
        fill.index > theftIndex &&
        timeDiff <= timeWindow &&
        distance <= distanceWindow
      );
    });
  };

  return data.map((point, index) => {
    const fillEvent = fillEvents.find((e) => e.index === index);
    const theftEvent = theftEvents.find((e) => e.index === index);

    if (fillEvent && !hasNearbyTheft(index)) {
      return {
        ...point,
        event: "filled",
        amountFilled: fillEvent.amountFilled,
        distanceSinceLastFill: fillEvent.distanceSinceLastFill,
        amountStolen: null,
      };
    } else if (theftEvent && !hasNearbyFill(index)) {
      return {
        ...point,
        event: "theft",
        amountStolen: theftEvent.amountStolen,
        amountFilled: null,
        distanceSinceLastFill: null,
      };
    } else {
      return {
        ...point,
        event: null,
        amountFilled: null,
        amountStolen: null,
        distanceSinceLastFill: null,
      };
    }
  });
}

function groupIntoBuckets(points: Point[], intervalMinutes: number) {
  const buckets: { [key: number]: Point[] } = {};
  const referenceTime = new Date(points[0].time).getTime();

  points.forEach((point) => {
    const timeDiff = new Date(point.time).getTime() - referenceTime;
    const intervalIndex = Math.floor(timeDiff / (intervalMinutes * 60 * 1000));
    if (!buckets[intervalIndex]) {
      buckets[intervalIndex] = [];
    }
    buckets[intervalIndex].push(point);
  });

  return Object.values(buckets);
}

export const FuelAdblueTabs = ({
  data,
  rawData,
  fuelTrackingData,
  isLoading,
  error,
  startDate,
  endDate,
}: {
  data: VehicleData;
  rawData: GetRawDataWithoutLocationApiResponse | undefined;
  fuelTrackingData: any;
  isLoading: boolean;
  error: FetchBaseQueryError | SerializedError | undefined;
  startDate: Date;
  endDate: Date;
}) => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const [convertToLocation] = useLazyConvertLatLngToAddressQuery();
  const [getFuelFilledTheftKuberTrigger] =
    useLazyGetKuberFuelFillingAndTheftQuery();

  const [fuelData, setFuelData] = useState<Point[]>([]);
  const [adblueData, setAdblueData] = useState<Point[]>([]);
  const [fuelEvents, setFuelEvents] = useState<Point[]>([]);
  const [adblueEvents, setAdblueEvents] = useState<Point[]>([]);
  const [fuelFillingEvents, setFuelFillingEvents] = useState<
    FillTheftLogPoint[]
  >([]);
  const [fuelTheftEvents, setFuelTheftEvents] = useState<FillTheftLogPoint[]>(
    [],
  );

  // New fuel tracking data processing
  const [newFuelFillingEvents, setNewFuelFillingEvents] = useState<any[]>([]);
  const [newFuelTheftEvents, setNewFuelTheftEvents] = useState<any[]>([]);
  const [manualFillings, setManualFillings] = useState<{
    [key: string]: number;
  }>({});

  // Map Modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const fuelThreshold = Number(userId) === 833193 ? 10 : 50;
  const adblueThrreshold = 10;

  const deduplicateFuelEvents = (
    fillingEvents: FillTheftLogPoint[],
    theftEvents: FillTheftLogPoint[],
  ): {
    filteredFillingEvents: FillTheftLogPoint[];
    filteredTheftEvents: FillTheftLogPoint[];
  } => {
    if (Number(userId) !== 833193) {
      return {
        filteredFillingEvents: fillingEvents,
        filteredTheftEvents: theftEvents,
      };
    }

    const groups: { [key: string]: FillTheftLogPoint[] } = {};

    // Combine both filling and theft events
    const allEvents = [...fillingEvents, ...theftEvents];

    // Group by date and whole number value (ignore decimals)
    allEvents.forEach((record) => {
      const date = moment(record.fillingTime).format("YYYY-MM-DD");
      const wholeValue = Math.floor(Number(record.value));
      const key = `${date}-${wholeValue}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    const filteredFillingEvents: FillTheftLogPoint[] = [];
    const filteredTheftEvents: FillTheftLogPoint[] = [];

    Object.values(groups).forEach((group) => {
      if (group.length === 1) {
        const event = group[0];
        if (event.type === "Fuel Filling") {
          filteredFillingEvents.push(event);
        } else {
          filteredTheftEvents.push(event);
        }
      } else {
        // Check if we have both Fuel Filling and Fuel Theft
        const hasFilling = group.some((r) => r.type === "Fuel Filling");
        const hasTheft = group.some((r) => r.type === "Fuel Theft");

        if (hasFilling && hasTheft) {
          // Sort by time
          const sorted = group.sort((a, b) =>
            moment(a.fillingTime).diff(moment(b.fillingTime)),
          );

          // Check if within 12 hours
          const timeDiff = Math.abs(
            moment(sorted[0].fillingTime).diff(
              moment(sorted[sorted.length - 1].fillingTime),
              "hours",
              true,
            ),
          );

          if (timeDiff <= 12) {
            // Keep only the first one (deduplicate)
            const firstEvent = sorted[0];
            if (firstEvent.type === "Fuel Filling") {
              filteredFillingEvents.push(firstEvent);
            } else {
              filteredTheftEvents.push(firstEvent);
            }
          } else {
            // Outside 12 hour window, keep both
            group.forEach((event) => {
              if (event.type === "Fuel Filling") {
                filteredFillingEvents.push(event);
              } else {
                filteredTheftEvents.push(event);
              }
            });
          }
        } else {
          // Only one type or multiple of same type, keep all
          group.forEach((event) => {
            if (event.type === "Fuel Filling") {
              filteredFillingEvents.push(event);
            } else {
              filteredTheftEvents.push(event);
            }
          });
        }
      }
    });

    return { filteredFillingEvents, filteredTheftEvents };
  };

  // Function to open Map modal
  const openMapView = (lat: number, lng: number, address: string) => {
    // Clear previous location first to ensure clean state
    setMapLocation(null);
    setIsMapModalOpen(false);

    setTimeout(() => {
      setMapLocation({ lat, lng, address });
      setIsMapModalOpen(true);
    }, 50);
  };

  // Map Modal Component
  const MapModal = () => {
    if (!mapLocation) return null;

    const { lat, lng, address } = mapLocation;

    return (
      <Modal
        title={`Location - ${address}`}
        open={isMapModalOpen}
        onCancel={() => setIsMapModalOpen(false)}
        footer={null}
        width={800}
        height={600}
        centered
        destroyOnClose={true}
      >
        <div style={{ height: "500px", width: "100%" }}>
          {typeof window !== "undefined" && (
            <MapContainer
              key={`${lat}-${lng}-${Date.now()}`} // Force re-render with timestamp
              center={[lat, lng]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              whenReady={() => {
                // Force tile refresh after map is ready
                setTimeout(() => {
                  window.dispatchEvent(new Event("resize"));
                }, 100);
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                key={`tiles-${lat}-${lng}`} // Force tile layer refresh
              />
              {CustomMarkerIcon ? (
                <Marker position={[lat, lng]} icon={CustomMarkerIcon}>
                  <Popup>{address}</Popup>
                </Marker>
              ) : (
                <Marker position={[lat, lng]}>
                  <Popup>{address}</Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>
      </Modal>
    );
  };

  const MIN_TIME_DIFF_MINUTES = 10;

  const fuelFilledPercentage = data.gpsDtl.fuel ?? 0;
  const fuelCapacity = data.vehicleFuelCapacity ?? 0;

  const getLastFuelFromData = () => {
    const isSpecialUser = Number(userId) === 833193;

    if (fuelTrackingData?.list && isSpecialUser) {
      const fuelLevelEntries = fuelTrackingData.list
        .filter(
          (item: any) =>
            item.fueltype === "Fuel" &&
            item.rv !== undefined &&
            item.rv !== null &&
            item.rv > 5,
        )
        .sort((a: any, b: any) => Number(a.odometer) - Number(b.odometer));

      if (fuelLevelEntries.length > 0) {
        // Get the last item (highest odometer) - same as chart logic
        const lastDataPoint = fuelLevelEntries[fuelLevelEntries.length - 1];
        return lastDataPoint?.rv || 0;
      }
    }

    if (!isSpecialUser) {
      if (fuelData.length === 0) {
        return 0;
      }

      const sortedByOdometer = [...fuelData].sort(
        (a, b) => Number(b.odometer) - Number(a.odometer),
      );

      for (let i = 0; i < sortedByOdometer.length; i++) {
        const dataPoint = sortedByOdometer[i];
        const fuelValue = Number(dataPoint?.fuel);
        if (dataPoint?.fuel && fuelValue > 0) {
          return fuelValue;
        }
      }
    } else {
      // For user 833193 fallback: use fuelData
      if (fuelData.length === 0) return 0;
      const sortedFuelData = [...fuelData].sort(
        (a, b) => Number(b.odometer) - Number(a.odometer),
      );
      const lastDataPoint = sortedFuelData[0];
      return Number(lastDataPoint?.fuel) || 0;
    }

    // If no data found, return 0
    return 0;
  };

  const actualFuel = getLastFuelFromData();

  const adblueFilledPercentage = data.gpsDtl.adblue ?? 0;
  const adblueCapacity = data.vehicleAdblueCapacity ?? 0;
  const actualadblue =
    Number(userId) == 833193
      ? adblueCapacity
      : adblueCapacity * (adblueFilledPercentage / 100);

  const checkIfFuelOrAblueFilledOrStolen = ({
    points,
    pt,
    type,
    i,
  }: {
    points: Point[];
    pt: Point;
    type: "adblue" | "fuel";
    i: number;
  }) => {
    if (!points[i - 1]) return;

    const prevValue = points[i - 1][type];
    const currValue = pt[type];
    const diff = currValue - prevValue;
    const threshold = type === "adblue" ? 20 : 50;

    if (diff > threshold) {
      return true;
    } else if (prevValue - currValue > threshold) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (!rawData?.rawdata) {
      setFuelData([]);
      setAdblueData([]);
      return;
    }

    // Raw mapping (no filters, no sorting) to ensure every data point is rendered
    const mappedRaw: Point[] = rawData.rawdata.map((item: any) => ({
      odometer:
        item.tel_odometer?.toFixed(0) ?? item.jny_distance?.toFixed(0) ?? "",
      fuel: item.tel_fuel,
      adblue: item.adblue,
      time: item.gps_time || item.gpstimeformatted,
      gps_latitude: item.gps_latitude ?? null,
      gps_longitude: item.gps_longitude ?? null,
      location: "Unknown Location",
      event: null,
      amountFilled: null,
      amountStolen: null,
      distanceSinceLastFill: null,
    }));

    // Filtered+sampled mapping (kept for AdBlue and for user 833193)
    const mappedForFilter: Point[] = rawData.rawdata
      .filter((p: any) => p.tel_fuel !== undefined && p.tel_fuel !== null)
      .map((item: any) => ({
        odometer:
          item.tel_odometer?.toFixed(0) ?? item.jny_distance?.toFixed(0) ?? "",
        fuel: item.tel_fuel,
        adblue: item.adblue,
        time: item.gps_time || item.gpstimeformatted,
        gps_latitude: item.gps_latitude ?? null,
        gps_longitude: item.gps_longitude ?? null,
        location: "Unknown Location",
        event: null,
        amountFilled: null,
        amountStolen: null,
        distanceSinceLastFill: null,
      }))
      .sort(
        (a: Point, b: Point) =>
          new Date(a.time).getTime() - new Date(b.time).getTime(),
      );

    const filterByTime = (points: Point[]) => {
      const filtered: Point[] = [];

      // For userId 833193, use simpler time-based filtering without event detection
      if (Number(userId) === 833193) {
        points.forEach((pt) => {
          if (filtered.length === 0) {
            filtered.push(pt);
          } else if (
            moment(pt.time).diff(
              moment(filtered[filtered.length - 1].time),
              "minutes",
            ) >= MIN_TIME_DIFF_MINUTES
          ) {
            filtered.push(pt);
          }
        });
        return filtered;
      }

      // Original logic for other users (used for AdBlue only)
      points.forEach((pt, i) => {
        const ifAdblueFilledOrStolen = checkIfFuelOrAblueFilledOrStolen({
          points,
          pt,
          i,
          type: "adblue",
        });
        const ifFuelFilledOrStolen = checkIfFuelOrAblueFilledOrStolen({
          points,
          pt,
          i,
          type: "fuel",
        });

        if (filtered.length === 0) {
          filtered.push(pt);
        } else if (ifAdblueFilledOrStolen || ifFuelFilledOrStolen) {
          filtered.push(pt);
        } else if (
          moment(pt.time).diff(
            moment(filtered[filtered.length - 1].time),
            "minutes",
          ) >= MIN_TIME_DIFF_MINUTES
        ) {
          filtered.push(pt);
        }
      });
      return filtered;
    };

    if (Number(userId) !== 833193) {
      // Fuel: raw, unsampled; AdBlue: filtered sampling retained + filter adblue >= 1
      setFuelData(mappedRaw);
      setAdblueData(
        filterByTime(
          mappedForFilter.filter((pt) => pt.adblue <= 50 && pt.adblue >= 1),
        ),
      );
    } else {
      // 833193: keep filtered sampling for both
      setFuelData(
        filterByTime(
          mappedForFilter.filter(
            (pt) => typeof pt.fuel === "number" && pt.fuel > 0,
          ),
        ),
      );
      setAdblueData(
        filterByTime(
          mappedForFilter.filter((pt) => pt.adblue <= 50 && pt.adblue >= 1),
        ),
      );
    }
  }, [rawData, userId]);

  useEffect(() => {
    if (Number(userId) !== 833193) {
      const process = async (
        points: Point[],
        key: "fuel" | "adblue",
        setter: React.Dispatch<React.SetStateAction<Point[]>>,
      ) => {
        const enriched = computeMetrics(
          points,
          key,
          key === "adblue" ? adblueThrreshold : fuelThreshold,
        ).filter((pt) => pt.event !== null);

        const resolved = await Promise.all(
          enriched.map(async (pt) => {
            try {
              if (pt.gps_latitude != null && pt.gps_longitude != null) {
                const { data: addressData } = await convertToLocation({
                  userId: Number(userId),
                  latitude: pt.gps_latitude,
                  longitude: pt.gps_longitude,
                });
                return {
                  ...pt,
                  location:
                    addressData?.loc.replaceAll("_", " ") ?? "Unknown Location",
                  event: pt.event as "filled" | "theft" | null,
                };
              }
            } catch {}
            return {
              ...pt,
              location: "Unknown Location",
              event: pt.event as "filled" | "theft" | null,
            };
          }),
        );
        setter(resolved);
      };

      if (fuelData.length > 0) process(fuelData, "fuel", setFuelEvents);
      if (adblueData.length > 0) process(adblueData, "adblue", setAdblueEvents);
    }
  }, [fuelData, adblueData, convertToLocation, userId]);

  useEffect(() => {
    if (Number(userId) === 833193) {
      getFuelFilledTheftKuberTrigger({
        userId: Number(userId),
        vehId: data.vId,
        startDate: moment(startDate).format("YYYY-MM-DD HH:mm"),
        endDate: moment(endDate).format("YYYY-MM-DD HH:mm"),
        type: 1,
      }).then(({ data }) => {
        if (data) {
          data.list &&
            Array.isArray(data.list) &&
            setFuelFillingEvents(data.list);
        }
      });

      getFuelFilledTheftKuberTrigger({
        userId: Number(userId),
        vehId: data.vId,
        startDate: moment(startDate).format("YYYY-MM-DD HH:mm"),
        endDate: moment(endDate).format("YYYY-MM-DD HH:mm"),
        type: 3,
      }).then(({ data }) => {
        if (data) {
          data.list &&
            Array.isArray(data.list) &&
            setFuelTheftEvents(data.list);
        }
      });
    }
  }, [userId, startDate, endDate]);

  // Apply deduplication to Kuber fuel events
  useEffect(() => {
    if (Number(userId) === 833193) {
      const { filteredFillingEvents, filteredTheftEvents } =
        deduplicateFuelEvents(fuelFillingEvents, fuelTheftEvents);
      setFuelFillingEvents(filteredFillingEvents);
      setFuelTheftEvents(filteredTheftEvents);
    }
  }, []);

  // Process new fuel tracking data
  useEffect(() => {
    if (fuelTrackingData?.list && Number(userId) === 833193) {
      // Process fuel filling events (only "Fuel Filling" entries)
      const fillingEvents = fuelTrackingData.list
        .filter((item: any) => item.fueltype === "Fuel Filling")
        .map((item: any) => ({
          gps_time: item.gps_time,
          odometer: item.odometer,
          fillingtheftaddress: item.fillingtheftaddress,
          filling: item.filling,
          fueltype: item.fueltype,
        }));

      // Apply deduplication for new fuel tracking data
      const groups: { [key: string]: typeof fillingEvents } = {};

      fillingEvents.forEach((record: any) => {
        const date = moment(record.gps_time).format("YYYY-MM-DD");
        const wholeValue = Math.floor(Number(record.filling));
        const key = `${date}-${wholeValue}`;

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(record);
      });

      const deduplicatedFillingEvents: typeof fillingEvents = [];

      Object.values(groups).forEach((group) => {
        if (group.length === 1) {
          deduplicatedFillingEvents.push(group[0]);
        } else {
          // Keep only the first one (by time)
          const sorted = group.sort(
            (a: any, b: any) =>
              moment(a.gps_time).toDate().getTime() -
              moment(b.gps_time).toDate().getTime(),
          );
          deduplicatedFillingEvents.push(sorted[0]);
        }
      });

      setNewFuelFillingEvents(deduplicatedFillingEvents);

      // For theft events, we're not showing anything as per requirement
      setNewFuelTheftEvents([]);
    }
  }, [fuelTrackingData, userId]);

  // Define interfaces outside the function for better TypeScript support
  interface ManualFillingRecord {
    time: string;
    odometer: string;
    amountFilled: number | null;
  }

  const columns = (opts: {
    type: "fuel" | "adblue";
    event: "filled" | "theft";
  }): ColumnsType<any> => {
    const baseColumns: any[] = [
      {
        title: "Time",
        dataIndex: "time",
        render: (val: string) => moment(val).format("DD MMM, YYYY HH:mm"),
      },
      {
        title: "Odometer",
        dataIndex: "odometer",
        render: (val: string) => Number(val).toLocaleString(),
      },
      {
        title: "Location",
        dataIndex: "location",
        render: (val: string, record: any) => (
          <div
            className="cursor-pointer underline underline-offset-1"
            onClick={() => {
              if (record.gps_latitude && record.gps_longitude) {
                openMapView(record.gps_latitude, record.gps_longitude, val);
              }
            }}
          >
            <Tooltip title={val.length > 25 ? val : ""}>
              {val.slice(0, 25)}
            </Tooltip>
          </div>
        ),
      },
      opts.event === "filled"
        ? {
            title: opts.type === "fuel" ? "Fuel Filled" : "AdBlue Filled",
            dataIndex: "amountFilled",
            render: (val: number | null) =>
              val != null ? val.toFixed(2) : "–",
          }
        : {
            title: opts.type === "fuel" ? "Fuel Stolen" : "AdBlue Stolen",
            dataIndex: "amountStolen",
            render: (val: number | null) =>
              val != null ? val.toFixed(2) : "–",
          },
    ];

    if (opts.type === "fuel" && opts.event === "filled") {
      baseColumns.push(
        {
          title: "Manual Filling",
          key: "manualFilling",
          width: 120,
          render: (_: any, record: ManualFillingRecord) => {
            const recordKey = `${record.time}_${record.odometer}`;
            return (
              <InputNumber
                size="small"
                min={0}
                precision={2}
                placeholder="0"
                value={manualFillings[recordKey]}
                onChange={(value: number | null) => {
                  setManualFillings((prev) => ({
                    ...prev,
                    [recordKey]: value || 0,
                  }));
                }}
                style={{ width: 80 }}
              />
            );
          },
        },
        {
          title: "Fuel Accuracy",
          key: "fuelAccuracy",
          width: 120,
          render: (_: any, record: ManualFillingRecord) => {
            const recordKey = `${record.time}_${record.odometer}`;
            const fuelFilled: number = record.amountFilled || 0;
            const manualFilled = manualFillings[recordKey];
            const tankCapacity: number = fuelCapacity || 1;

            if (
              manualFilled === null ||
              manualFilled === undefined ||
              String(manualFilled) === "" ||
              isNaN(manualFilled)
            ) {
              return (
                <span style={{ color: "#888", fontWeight: "bold" }}>N/A</span>
              );
            }

            const accuracy: number =
              100 - (Math.abs(fuelFilled - manualFilled) / tankCapacity) * 100;

            return (
              <span
                style={{
                  color:
                    accuracy >= 90
                      ? "#478c83"
                      : accuracy >= 70
                        ? "#faad14"
                        : "#ff4d4f",
                  fontWeight: "bold",
                }}
              >
                {accuracy.toFixed(1)}%
              </span>
            );
          },
        },
      );
    }

    return baseColumns;
  };

  const columnsKuber = (opts: {
    type: "fuel" | "adblue";
    event: "filled" | "theft";
  }): ColumnsType<any> => [
    {
      title: "Time",
      dataIndex: "fillingTime",
      render: (val: string) => moment(val).format("DD MMM, YYYY HH:mm"),
    },
    {
      title: "Location",
      dataIndex: "event_address",
      render: (val: string, record: any) => (
        <div
          className="cursor-pointer text-blue-600 hover:text-blue-800 underline"
          onClick={() => {
            if (record.latitude && record.longitude) {
              openMapView(record.latitude, record.longitude, val);
            }
          }}
        >
          <Tooltip title={val?.length > 25 ? val : ""}>
            {val?.slice(0, 25)}
          </Tooltip>
        </div>
      ),
    },

    {
      title: opts.event === "filled" ? "Fill Value" : "Theft Value",
      dataIndex: "value",
      render: (val: number | null) => (val != null ? val : "–"),
    },
  ];

  // New columns for fuel tracking data
  const newFuelTrackingColumns = (): ColumnsType<any> => [
    {
      title: "Time",
      dataIndex: "gps_time",
      render: (val: string) => moment(val).format("DD MMM, YYYY HH:mm"),
    },
    {
      title: "Odometer",
      dataIndex: "odometer",
      render: (val: number) => val || "–",
    },
    {
      title: "Location",
      dataIndex: "fillingtheftaddress",
      render: (val: string, record: any) => (
        <div
          className="cursor-pointer text-blue-600 hover:text-blue-800 underline"
          onClick={() => {
            if (record.gps_latitude && record.gps_longitude) {
              openMapView(record.gps_latitude, record.gps_longitude, val);
            }
          }}
        >
          <Tooltip title={val?.length > 25 ? val : ""}>
            {val?.slice(0, 25) || "–"}
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Fuel Filled",
      dataIndex: "filling",
      render: (val: number) => (val ? val.toFixed(2) : "–"),
    },
    {
      title: "Manual Filling",
      key: "manualFilling",
      width: 120,
      render: (_, record: any) => {
        const recordKey = `${record.gps_time}_${record.odometer}`;
        return (
          <InputNumber
            size="small"
            min={0}
            precision={2}
            placeholder="0"
            value={manualFillings[recordKey]}
            onChange={(value) => {
              setManualFillings((prev) => ({
                ...prev,
                [recordKey]: value || 0,
              }));
            }}
            style={{ width: 80 }}
          />
        );
      },
    },
    {
      title: "Fuel Accuracy",
      key: "fuelAccuracy",
      width: 120,
      render: (_, record: any) => {
        const recordKey = `${record.gps_time}_${record.odometer}`;
        const fuelFilled = record.filling || 0;
        const manualFilled = manualFillings[recordKey] || 0;
        const tankCapacity = fuelCapacity || 1; // Prevent division by zero

        const accuracy =
          100 - (Math.abs(fuelFilled - manualFilled) / tankCapacity) * 100;

        return (
          <span
            style={{
              color:
                accuracy >= 90
                  ? "#478c83"
                  : accuracy >= 70
                    ? "#faad14"
                    : "#ff4d4f",
              fontWeight: "bold",
            }}
          >
            {accuracy.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  const TheftAndFilledLegends = ({ type }: { type: "adblue" | "fuel" }) => {
    return (
      <div className="flex items-center justify-between mr-8">
        <div className="w-1 h-1"></div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-rose-500 rounded-md" />
            Theft
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-teal-500 rounded-md" />
            Filled
          </div>
        </div>

        <div>
          {type === "fuel" ? (
            <div className="bg-black text-white shadow-inner py-1.5 px-2 rounded-sm">
              Fuel:{" "}
              {actualFuel &&
              (typeof actualFuel === "number" || !isNaN(Number(actualFuel)))
                ? Number(actualFuel).toFixed(0)
                : 0}{" "}
              L
            </div>
          ) : (
            <div className="bg-black text-white shadow-inner py-1.5 px-2 rounded-sm">
              Adblue: {actualadblue ? actualadblue.toFixed(0) : 0} L
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = (type: "fuel" | "adblue", events: Point[]) => (
    <div className="max-h-[60vh] overflow-scroll space-y-6 relative">
      {(type === "fuel" && fuelData.length === 0) ||
      (type === "adblue" && adblueData.length === 0) ? (
        <Empty
          description={`No ${type === "fuel" ? "Fuel" : "AdBlue"} Events Found`}
          className="mt-10"
        />
      ) : (
        <>
          <TheftAndFilledLegends type={type} />
          {type === "fuel" ? (
            <FuelChart data={data} rawData={fuelData} />
          ) : (
            <AdblueChart data={data} rawData={adblueData} />
          )}

          <AdblueAndFuelTable
            type={type}
            data={events.filter((row) => row.event === "filled")}
            title={`${type === "fuel" ? "Fuel" : "AdBlue"} Filled Log`}
            columns={columns({ type, event: "filled" })}
            event="filed"
          />

          <AdblueAndFuelTable
            type={type}
            data={events.filter((row) => row.event === "theft")}
            title={`${type === "fuel" ? "Fuel" : "AdBlue"} Theft Log`}
            columns={columns({ type, event: "theft" })}
            event="theft"
          />
        </>
      )}
    </div>
  );

  const renderTabContentKuber = (
    type: "fuel" | "adblue",
    fillEvents: FillTheftLogPoint[],
    theftEvents: FillTheftLogPoint[],
  ) => (
    <div className="max-h-[60vh] overflow-scroll space-y-6 relative">
      {(type === "fuel" && fuelData.length === 0) ||
      (type === "adblue" && adblueData.length === 0) ? (
        <Empty
          description={`No ${type === "fuel" ? "Fuel" : "AdBlue"} Events Found`}
          className="mt-10"
        />
      ) : (
        <>
          <TheftAndFilledLegends type={type} />
          {type === "fuel" ? (
            <FuelChart data={data} rawData={fuelData} />
          ) : (
            <AdblueChart data={data} rawData={adblueData} />
          )}

          <AdblueAndFuelTableKuber
            type={type}
            data={fillEvents}
            title={`${type === "fuel" ? "Fuel" : "AdBlue"} Filled Log`}
            columns={columnsKuber({ type, event: "filled" })}
            event="filed"
          />

          <AdblueAndFuelTableKuber
            type={type}
            data={theftEvents}
            title={`${type === "fuel" ? "Fuel" : "AdBlue"} Theft Log`}
            columns={columnsKuber({ type, event: "theft" })}
            event="theft"
          />
        </>
      )}
    </div>
  );

  // New render function for fuel tracking data
  const renderNewFuelTrackingContent = () => {
    // For userId 833193, ensure raw fuel data has no events to prevent double dots
    const cleanRawData = fuelData.map((point) => ({
      ...point,
      event: null,
      amountFilled: null,
      amountStolen: null,
      distanceSinceLastFill: null,
    }));

    return (
      <div className="max-h-[60vh] overflow-scroll space-y-6 relative">
        {newFuelFillingEvents.length === 0 &&
        newFuelTheftEvents.length === 0 ? (
          <Empty description="No Fuel Events Found" className="mt-10" />
        ) : (
          <>
            <TheftAndFilledLegends type="fuel" />
            <FuelChart
              data={data}
              rawData={cleanRawData}
              fuelFillingEvents={newFuelFillingEvents}
              fuelTheftEvents={newFuelTheftEvents}
              fuelTrackingRawData={fuelTrackingData}
            />

            <NewFuelTrackingTable
              type="fuel"
              data={newFuelFillingEvents}
              title="Fuel Filled Log"
              columns={newFuelTrackingColumns()}
              event="filed"
            />

            <NewFuelTrackingTable
              type="fuel"
              data={newFuelTheftEvents}
              title="Fuel Theft Log"
              columns={newFuelTrackingColumns()}
              event="theft"
            />
          </>
        )}
      </div>
    );
  };

  const items: TabsProps["items"] = [
    {
      key: "fuel",
      label: "Fuel",
      children: isLoading ? (
        <div className="flex justify-center items-center py-5">
          <Spin spinning size="large" />
        </div>
      ) : Number(userId) === 833193 ? (
        fuelTrackingData?.list ? (
          renderNewFuelTrackingContent()
        ) : (
          renderTabContentKuber("fuel", fuelFillingEvents, fuelTheftEvents)
        )
      ) : (
        renderTabContent("fuel", fuelEvents)
      ),
    },
    ...(Number(userId) === 833193
      ? []
      : [
          {
            key: "adblue",
            label: "AdBlue",
            children: isLoading ? (
              <div className="flex justify-center items-center py-5">
                <Spin spinning size="large" />
              </div>
            ) : (
              renderTabContent("adblue", adblueEvents)
            ),
          },
        ]),
  ];

  return (
    <ConfigProvider theme={{ components: { Tabs: { titleFontSizeSM: 16 } } }}>
      <Tabs
        defaultActiveKey="fuel"
        items={items}
        size="small"
        tabBarStyle={{ fontWeight: 400, fontSize: 16, marginLeft: 24 }}
      />
      <MapModal />
    </ConfigProvider>
  );
};
