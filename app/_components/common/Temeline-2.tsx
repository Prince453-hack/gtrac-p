import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import {
  useLazyGetItineraryvehIdBDateNwStQuery,
  useLazyGetKmtAlertVehicleWiseQuery,
  useLazyGetpathwithDateDaignosticQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import moment from "moment";
import {
  AlertDetails,
  KMTAlertsResponse,
} from "@/app/_globalRedux/services/types/alerts";
import { Button, Popover, Modal } from "antd";
import Image from "next/image";
import Vehicles from "@/public/assets/svgs/map/cluster-off.svg";
import CarIcon from "@/public/assets/images/map/vehicles/vehicle-green.svg";
import paths from "../../_assets/stoppagesPaths";
import { MergedGatewayRailTrip } from "@/app/helpers/mergeGatewayRailTrips";
import { getEtaJourneyHrsKm } from "@/app/helpers/api/getEtaHoursKm";
import { getJourneyHours } from "@/app/helpers/api";
import { GetItnaryWithMapResponse } from "@/app/_globalRedux/services/types";
import CustomTableN, { DownloadReportTs } from "./CustomTableN";
import { ColumnDef } from "@tanstack/react-table";
import { BellOutlined } from "@ant-design/icons";

export const parseDate = (dateString: string): number => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date.getTime() : new Date().getTime();
  } catch {
    return new Date().getTime();
  }
};

const ifInvalidDateReturnNotReached = (date: string) => {
  return moment(date).format("Do MMM, YYYY HH:mm") === "Invalid date"
    ? "Not Reached"
    : moment(date).format("Do MMM, YYYY HH:mm");
};

const calculatePosition = (
  eventTime: string,
  startTime: number,
  endTime: number
): number => {
  const eventTimestamp = parseDate(eventTime);
  if (startTime >= endTime) return 0;

  const position = ((eventTimestamp - startTime) / (endTime - startTime)) * 90;
  return Math.min(Math.max(position, 0), 100);
};

const convertIconToSVG = (index: number): React.ReactNode => {
  const basePath =
    "M43.6392 22.0002C43.6392 33.9484 33.9533 43.6343 22.0051 43.6343C10.057 43.6343 0.371094 33.9484 0.371094 22.0002C0.371094 10.0521 10.057 0.366211 22.0051 0.366211C33.9533 0.366211 43.6392 10.0521 43.6392 22.0002Z";
  const extraPath = paths?.[index] || "";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={25}
      height={25}
      viewBox="0 0 25.5 25.5"
    >
      <path
        d={`${basePath}${extraPath}`}
        fill="#FC7873"
        fillOpacity={1}
        stroke="white"
        strokeOpacity={1}
        strokeWidth={0.7}
        transform="scale(0.6)"
      />
    </svg>
  );
};

const StoppagePopoverContent = ({
  stoppage,
}: {
  stoppage: PathwithDateDaignosticData;
}) => (
  <div className="max-w-[300px]">
    <p>
      <strong>Location:</strong>{" "}
      {stoppage.startLocation
        ? stoppage.startLocation?.replaceAll("_", " ")
        : " "}
    </p>
    <p>
      <strong>Time:</strong> {stoppage.fromTime}
    </p>
    <p>
      <strong>Duration:</strong> {(stoppage.totalTimeInMIN / 60).toFixed(2)} HRS
    </p>
  </div>
);

const AlertPopoverContent = ({ alert }: { alert: AlertDetails }) => (
  <div className="max-w-[300px]">
    <p>
      <strong>Type:</strong> {alert.exception_type}
    </p>
    <p>
      <strong>Start Time:</strong>{" "}
      {moment(alert.starttime).format("Do MMM, YYYY HH:mm")}
    </p>
  </div>
);

const LegPopoverContent = ({
  item,
}: {
  item: MergedGatewayRailTrip["legs"][0];
}) =>
  item ? (
    <div className="max-w-[300px]">
      <p className="text-sm">Location: {item.location?.replaceAll("_", " ")}</p>
      <p className="text-sm">
        Inbound: {ifInvalidDateReturnNotReached(item.inboundTime ?? "")}
      </p>
      <p className="text-sm">
        Outbound: {ifInvalidDateReturnNotReached(item.outboundTime ?? "")}
      </p>
    </div>
  ) : null;

function getLegIntervals({
  legs,
  currentTime,
}: {
  legs: MergedGatewayRailTrip["legs"];
  currentTime: number;
}) {
  const intervals = [];

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    let start = null;
    let end = null;

    const nextLeg = legs[i + 1];
    if (nextLeg) {
      if (leg.inboundTime) {
        start = new Date(leg.inboundTime).getTime();
      }

      if (start !== null) {
        if (nextLeg.inboundTime) {
          end = new Date(nextLeg.inboundTime).getTime();
        } else {
          end = currentTime;
        }
      }
    }

    intervals.push(start && end ? { start, end } : null);
  }

  return intervals;
}

// Filter alerts with valid coordinates
function hasValidCoordinates(alert: AlertDetails): boolean {
  return (
    (alert.endlat !== 0 && alert.endLong !== 0) ||
    (alert.startlat !== 0 && alert.startLong !== 0)
  );
}

export function filterKmtAlerts(
  kmtAlerts: KMTAlertsResponse["list"]
): AlertDetails[] {
  const alert = kmtAlerts[0];
  if (!alert) {
    return [];
  }

  const filteredAlert = [
    ...(alert.harshBreak?.filter(hasValidCoordinates) || []),
    ...(alert.harshacc?.filter(hasValidCoordinates) || []),
    ...(alert.mainpower?.filter(hasValidCoordinates) || []),
    ...(alert.internalPower?.filter(hasValidCoordinates) || []),
    ...(alert.overspeed?.filter(hasValidCoordinates) || []),
    ...(alert.overspeedKMT?.filter(hasValidCoordinates) || []),
    ...(alert.freewheeling?.filter(hasValidCoordinates) || []),
    ...(alert.contineousDrive?.filter(hasValidCoordinates) || []),
    ...(alert.nightdrive?.filter(hasValidCoordinates) || []),
    ...(alert.highenginetemperature?.filter(hasValidCoordinates) || []),
    ...(alert.idle?.filter(hasValidCoordinates) || []),
    ...(alert.lowengineoilpressure?.filter(hasValidCoordinates) || []),
    ...(alert.overSpeed?.filter(hasValidCoordinates) || []),
    ...(alert.panic?.filter(hasValidCoordinates) || []),
    ...(alert.services?.filter(hasValidCoordinates) || []),
    ...(alert.document?.filter(hasValidCoordinates) || []),
    ...(alert.transitdelay?.filter(hasValidCoordinates) || []),
    ...(alert.unlockonmove?.filter(hasValidCoordinates) || []),
  ];
  return filteredAlert;
}

interface Leg {
  location: string;
  inboundTime?: string;
  outboundTime?: string;
  legUpdateTime?: string;
  haltAtSource?: string;
  haltAtDestination?: string;
  line_no: number;
  transitTime: number;
  actualTransitTime: string;
  lat: number;
  lng: number;
}

interface UpdateItemsWithStoppages extends Leg {
  stoppages: PathwithDateDaignosticData[];
}

interface EtaInfo {
  km: number;
  hours: number;
  legIndex: number;
}

export const Timeline2 = ({
  items,
  vehId,
  vehReg,
}: {
  items: Leg[];
  vehId: number;
  vehReg: string;
}) => {
  const { userId, groupId, extra } = useSelector(
    (state: RootState) => state.auth
  );
  const [getPathWithDateDaignostic] = useLazyGetpathwithDateDaignosticQuery();
  const [getKmtAlertVehicleTrigger] = useLazyGetKmtAlertVehicleWiseQuery();
  const [getVehicleListItinerary] = useLazyGetItineraryvehIdBDateNwStQuery();

  const dateFetched = React.useRef(false);
  const isLoading = React.useRef(false);
  const [updatedItemsWithStoppages, setUpdatedItemsWithStoppages] = useState<
    UpdateItemsWithStoppages[]
  >(items.map((item) => ({ ...item, stoppages: [] })));
  const [allAlerts, setAllAlerts] = useState<AlertDetails[]>([]);
  const [etaInfo, setEtaInfo] = useState<EtaInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [downloadReport, setDownloadReport] = useState<
    DownloadReportTs | undefined
  >(undefined);

  const currentTime = new Date().getTime();
  const legIntervals = getLegIntervals({ legs: items, currentTime }).filter(
    (interval) => interval !== null
  );

  const [locationData, setLocationData] = useState<GetItnaryWithMapResponse>();

  const T_start = items[0].outboundTime
    ? parseDate(items[0].outboundTime)
    : items[0].inboundTime
    ? parseDate(items[0].inboundTime)
    : currentTime;
  const lastLeg = items[items.length - 1];
  const T_end = lastLeg.inboundTime
    ? parseDate(lastLeg.inboundTime)
    : lastLeg.outboundTime
    ? parseDate(lastLeg.outboundTime)
    : currentTime;

  const startTimeStr = useMemo(() => {
    const startTime =
      items[0].outboundTime || items[0].inboundTime || new Date().toString();
    return moment(startTime).format("YYYY-MM-DD HH:mm:ss");
  }, [items]);

  const isJourneyCompleted = !!items[items.length - 1].inboundTime;
  const fixedEndTimeStr = useMemo(() => {
    if (isJourneyCompleted) {
      return moment(items[items.length - 1].inboundTime).format(
        "YYYY-MM-DD HH:mm:ss"
      );
    }
    return null;
  }, [items, isJourneyCompleted]);

  const totalKm = useMemo(
    () => etaInfo.reduce((sum, eta) => sum + eta.km, 0),
    [etaInfo]
  );

  const distanceCoveredPercentage = useMemo(() => {
    if (
      totalKm > 0 &&
      locationData &&
      typeof locationData.totalRunningDistanceKM === "number"
    ) {
      const distanceCovered = Math.min(
        (locationData.totalRunningDistanceKM / totalKm) * 100,
        100
      );
      return distanceCovered;
    }
    return null;
  }, [locationData, totalKm]);

  // Define columns for alerts table
  const alertColumns: ColumnDef<AlertDetails>[] = useMemo(
    () => [
      {
        header: "Type",
        accessorKey: "exception_type",
        cell: (info) => info.getValue(),
      },
      {
        header: "Start",
        accessorKey: "starttime",
        cell: (info) =>
          moment(info.getValue() as string).format("Do MMM, YYYY HH:mm"),
      },
      {
        header: "Message",
        accessorKey: "msg",
      },
    ],
    []
  );

  // Handle download button click for alerts
  const handleDownloadAlertsClick = (alerts: AlertDetails[]) => {
    const rows = alerts.map((alert: AlertDetails) => {
      return {
        Type: alert.exception_type,
        Start: moment(alert.starttime).format("Do MMM, YYYY HH:mm"),
        Message: alert.msg,
      };
    });

    const head = Object.keys(rows[0]);
    const body = rows.map((row) => Object.values(row));

    setDownloadReport({
      title: `Vehicle Alerts Report`,
      excel: { title: `Vehicle Alerts`, rows, footer: [] },
      pdf: {
        head: [head],
        body: body,
        title: `Vehicle Alerts Report`,
        pageSize: "a3",
      },
    });
  };

  useEffect(() => {
    if (dateFetched.current || items.length <= 1) return;
    dateFetched.current = true;
    isLoading.current = true;

    if (items[0].outboundTime || items[0].inboundTime) {
      getVehicleListItinerary({
        userId: userId,
        vId: vehId,
        startDate: moment(items[0].outboundTime ?? items[0].inboundTime).format(
          "YYYY-MM-DD HH:mm"
        ),
        endDate: moment(
          items[items.length - 1].inboundTime ??
            items[items.length - 1].outboundTime ??
            new Date().toString()
        ).format("YYYY-MM-DD HH:mm"),
        requestFor: 0,
      }).then(({ data: vehicleListDataArgs }) => {
        setLocationData(vehicleListDataArgs);
      });
    }

    // Get ETA information for each leg segment
    const etaPromises = [];
    for (let i = 0; i < items.length - 1; i++) {
      const currentLeg = items[i];
      const nextLeg = items[i + 1];

      let promise;
      if (currentLeg.lat && currentLeg.lng && nextLeg.lat && nextLeg.lng) {
        promise = getEtaJourneyHrsKm({
          userId: Number(userId),
          groupId,
          extra: "",
          sourceLat: currentLeg.lat.toString(),
          sourceLong: currentLeg.lng.toString(),
          destinationLat: nextLeg.lat.toString(),
          destinationlong: nextLeg.lng.toString(),
        }).then((res) => {
          if (res) {
            const [km, hours] = res.split("##").map(Number);
            return { km, hours, legIndex: i };
          }
          return { km: 0, hours: 0, legIndex: i };
        });
      } else if (currentLeg.location && nextLeg.location) {
        promise = getJourneyHours({
          userId: Number(userId),
          source: currentLeg.location,
          destination: nextLeg.location,
          via: false,
          viaOne: "",
          viaTwo: "",
          viaThree: "",
          viaFour: "",
          routeType: "",
          viaOneHaltHr: "",
          viaTwoHaltHr: "",
          viaThreeHaltHr: "",
          viaFourHaltHr: "",
          groupId: groupId,
          extra: extra,
        }).then((res) => {
          if (res) {
            const [km, hours] = res.split("##").map(Number);
            return { km, hours, legIndex: i };
          }
          return { km: 0, hours: 0, legIndex: i };
        });
      } else {
        promise = Promise.resolve({ km: 0, hours: 0, legIndex: i });
      }
      etaPromises.push(promise);
    }

    const stoppagePromises = legIntervals.map((interval, index) => {
      return getPathWithDateDaignostic({
        vId: vehId,
        startDate: moment(interval.start).format("YYYY-MM-DD HH:mm"),
        endDate: moment(interval.end).format("YYYY-MM-DD HH:mm"),
        userId: userId,
      }).then(({ data: pathwithDateDataArgs }) => {
        if (pathwithDateDataArgs && pathwithDateDataArgs.data) {
          const stoppages = pathwithDateDataArgs.data.filter(
            (item: PathwithDateDaignosticData) => item.mode === "Idle"
          );
          return { index, stoppages };
        }
        return { index, stoppages: [] };
      });
    });

    const alertsPromise = getKmtAlertVehicleTrigger({
      vehReg: vehReg,
      userId: userId,
      vehId: vehId,
      startDateTime: moment(T_start).format("YYYY-MM-DD HH:mm:ss"),
      endDateTime: moment(T_end).format("YYYY-MM-DD HH:mm:ss"),
    }).then(({ data }) => {
      if (data && data.list) {
        return filterKmtAlerts(data.list);
      }
      return [];
    });

    Promise.all([...etaPromises, ...stoppagePromises, alertsPromise])
      .then((results) => {
        const etaResults = results.slice(0, items.length - 1) as EtaInfo[];
        const stoppageResults = results.slice(
          items.length - 1,
          items.length - 1 + legIntervals.length
        ) as {
          index: number;
          stoppages: PathwithDateDaignosticData[];
        }[];
        const alerts = results[results.length - 1] as AlertDetails[];

        setEtaInfo(etaResults);
        const newUpdatedItems = [...updatedItemsWithStoppages];
        stoppageResults.forEach(({ index, stoppages }) => {
          newUpdatedItems[index] = { ...newUpdatedItems[index], stoppages };
        });

        setUpdatedItemsWithStoppages(newUpdatedItems);
        setAllAlerts(alerts);
      })
      .finally(() => {
        isLoading.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, vehId, vehReg, userId, groupId, legIntervals, T_start, T_end]);

  const legPositions = useMemo(() => {
    if (totalKm === 0) {
      return items.map((_, index) => (index / (items.length - 1)) * 100);
    } else {
      const cumulativeKms = [0];
      for (let i = 0; i < etaInfo.length; i++) {
        cumulativeKms.push(cumulativeKms[i] + etaInfo[i].km);
      }
      return cumulativeKms.map((cumKm) => (cumKm / totalKm) * 100);
    }
  }, [items, etaInfo, totalKm]);

  const calculatePositionBasedOnDistance = (T: number) => {
    if (totalKm === 0) {
      return calculatePosition(String(T), T_start, T_end);
    }
    let i = 0;
    while (i < legIntervals.length && T >= legIntervals[i].end) {
      i++;
    }
    if (i >= legIntervals.length) {
      return 100;
    }
    if (T < legIntervals[0].start) {
      return 0;
    }
    const cumulativeKm = etaInfo
      .slice(0, i)
      .reduce((sum, eta) => sum + eta.km, 0);
    const segmentStart = legIntervals[i].start;
    const segmentEnd = legIntervals[i].end;
    if (segmentEnd === segmentStart) {
      return (cumulativeKm / totalKm) * 100;
    }
    const fraction = (T - segmentStart) / (segmentEnd - segmentStart);
    const distanceInSegment = fraction * etaInfo[i].km;
    const totalDistanceUpToT = cumulativeKm + distanceInSegment;
    return (totalDistanceUpToT / totalKm) * 100;
  };

  const allStoppages = updatedItemsWithStoppages
    .flatMap((item) => item.stoppages)
    .sort((a, b) => parseDate(a.fromTime) - parseDate(b.fromTime));

  const effectiveEndTime = isJourneyCompleted ? T_end : currentTime;

  const stoppagePositions =
    distanceCoveredPercentage !== null
      ? allStoppages
          .filter(
            (stoppage) => parseDate(stoppage.fromTime) <= effectiveEndTime
          )
          .map((stoppage) => {
            const T_event = parseDate(stoppage.fromTime);
            const timeFraction =
              effectiveEndTime - T_start > 0
                ? (T_event - T_start) / (effectiveEndTime - T_start)
                : 0;
            const position = Math.min(
              Math.max(timeFraction * distanceCoveredPercentage, 0),
              distanceCoveredPercentage
            );
            return { position, stoppage };
          })
          .filter(
            (item) => item.stoppage.totalTimeInMIN >= 30 && item.position >= 0.5
          )
      : allStoppages
          .map((stoppage) => {
            const T = parseDate(stoppage.fromTime);
            const position = calculatePositionBasedOnDistance(T);
            return { position, stoppage };
          })
          .filter(
            (item) => item.stoppage.totalTimeInMIN >= 30 && item.position >= 0.5
          );

  const sortedAlerts = allAlerts.sort(
    (a, b) => parseDate(a.starttime) - parseDate(b.starttime)
  );

  const alertPositions =
    distanceCoveredPercentage !== null
      ? sortedAlerts
          .filter((alert) => parseDate(alert.starttime) <= effectiveEndTime)
          .map((alert) => {
            const T_event = parseDate(alert.starttime);
            const timeFraction =
              effectiveEndTime - T_start > 0
                ? (T_event - T_start) / (effectiveEndTime - T_start)
                : 0;
            const position = Math.min(
              Math.max(timeFraction * distanceCoveredPercentage, 0),
              distanceCoveredPercentage
            );
            return { position, alert };
          })
      : sortedAlerts.map((alert) => {
          const T = parseDate(alert.starttime);
          const position = calculatePositionBasedOnDistance(T);
          return { position, alert };
        });

  return (
    <>
      {isLoading.current === true ? (
        <div className="relative w-full min-h-[190px] py-8 overflow-hidden">
          <div className="absolute left-0 right-0 top-[30px] h-[10px] bg-neutral-200 animate-pulse" />

          <div className="flex gap-2 mt-10">
            <div className="bg-neutral-200 animate-pulse p-2 rounded-full min-w-10"></div>
            <div className="bg-neutral-200 animate-pulse p-2 rounded-full min-w-10"></div>
          </div>
        </div>
      ) : (
        <div>
          <div className={`relative w-full min-h-[190px] py-8 overflow-hidden`}>
            <div className="absolute left-0 right-0 top-[30px] h-[2px] bg-primary-green" />

            <div className="relative w-full mx-[60px] left-0 right-0">
              {items.map((leg, index) => {
                const position = legPositions[index];
                return (
                  <Popover
                    key={`leg-${index}`}
                    content={<LegPopoverContent item={leg} />}
                    title="Location Details"
                  >
                    <div
                      className="absolute"
                      style={{
                        left: `${
                          position === 100 ? 90 : position === 0 ? 5 : position
                        }%`,
                        top: "-0px",
                      }}
                    >
                      <div
                        className="absolute flex flex-col justify-center items-start"
                        style={{ transform: "translateX(-50%)" }}
                        key={`leg-inner-${index}`}
                      >
                        <div className="h-[30px] w-[2px] bg-neutral-400 ml-[18px]"></div>
                        <div className="flex flex-col items-start justify-center">
                          <div
                            className={`w-10 h-10 bg-white border-2 rounded-full overflow-hidden shadow-md flex items-center justify-center`}
                          >
                            <Image
                              src={Vehicles}
                              alt="Leg"
                              width={30}
                              height={30}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-start justify-center text-center mt-2 gap-1">
                          <p className="text-xs text-neutral-600 text-nowrap">
                            {leg.location}
                          </p>
                          <p className="text-xs text-neutral-600 text-nowrap">
                            <strong>In:</strong>{" "}
                            {leg.inboundTime
                              ? moment(leg.inboundTime).format(
                                  "Do MMM, YYYY HH:mm"
                                )
                              : "Not Reached"}
                          </p>
                          <p className="text-xs text-neutral-600 text-nowrap">
                            <strong>Out:</strong>{" "}
                            {leg.outboundTime
                              ? moment(leg.outboundTime).format(
                                  "Do MMM, YYYY HH:mm"
                                )
                              : "Not Reached"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Popover>
                );
              })}

              {stoppagePositions.map(({ position, stoppage }, index) => (
                <Popover
                  key={`stoppage-${index}`}
                  content={<StoppagePopoverContent stoppage={stoppage} />}
                  title="Stoppage Details"
                >
                  <div
                    className="absolute"
                    style={{
                      left: `${position === 100 ? 90 : position}%`,
                      top: "-12px",
                    }}
                  >
                    {convertIconToSVG(index)}
                  </div>
                </Popover>
              ))}

              {alertPositions.map(({ position, alert }, index) => (
                <Popover
                  key={`alert-${index}`}
                  content={<AlertPopoverContent alert={alert} />}
                  title="Alert Details"
                >
                  <div
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${position === 100 ? 90 : position}%`,
                      top: "-6px",
                    }}
                  >
                    <div className="w-3 h-3 bg-red-600 rounded-full" />
                    <div className="w-3 h-3 bg-red-800 rounded-full hover:animate-pulse absolute z-10 top-0 left-0 right-0 bottom-0" />
                  </div>
                </Popover>
              ))}

              {distanceCoveredPercentage !== null && (
                <Popover
                  content={() => (
                    <div className="flex-col gap-1">
                      <div>
                        <p>
                          <strong>Stoppage Time:</strong>{" "}
                          {locationData?.stoppageTime}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Running Time:</strong>{" "}
                          {locationData?.runningTime}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Location:</strong>{" "}
                          {locationData &&
                          locationData.data[locationData.data.length - 1]
                            .startLocation
                            ? locationData.data[
                                locationData.data.length - 1
                              ].startLocation.replaceAll("_", " ")
                            : "Not Reached"}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Pin:</strong>{" "}
                          <Button
                            type="text"
                            onClick={() => setIsModalOpen(true)}
                          >
                            📍
                          </Button>
                        </p>
                      </div>
                    </div>
                  )}
                  title="Vehicle Position"
                >
                  <div
                    className="absolute"
                    style={{
                      left: `${
                        distanceCoveredPercentage === 100
                          ? 90
                          : distanceCoveredPercentage
                      }%`,
                      top: "-18px",
                    }}
                  >
                    <Image
                      src={CarIcon}
                      alt="Current Position"
                      width={40}
                      height={40}
                    />
                  </div>
                </Popover>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="bg-yellow-200 p-2 rounded-full">
              Total Distance: {totalKm?.toFixed(2)} KM
            </div>
            <div className="bg-green-200 p-2 rounded-full">
              Distance Covered: {locationData?.totalDistance ?? "0 KM"}
            </div>
            <Button
              className="bg-red-100 hover:bg-red-200 p-2 rounded-full flex items-center"
              onClick={() => setIsAlertsModalOpen(true)}
              icon={<BellOutlined />}
            >
              Alerts ({sortedAlerts.length})
            </Button>
          </div>
          <Modal
            title="Vehicle Path"
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            width={800}
          >
            <iframe
              src={`https://gtrac.in/newtracking/reports/snailmapmyindia.php?vid=${vehId}&startTime=${startTimeStr}&Endtime=${
                isJourneyCompleted
                  ? fixedEndTimeStr
                  : moment().format("YYYY-MM-DD HH:mm:ss")
              }&token=${groupId}&userid=${userId}&extra=${extra}`}
              width="100%"
              height="600"
              frameBorder="0"
            />
          </Modal>
          <Modal
            title={`Vehicle Alerts (${sortedAlerts.length})`}
            open={isAlertsModalOpen}
            onCancel={() => setIsAlertsModalOpen(false)}
            style={{ top: 20, position: "relative" }}
            styles={{ body: { background: "#F5F8F6" } }}
            footer={null}
            height={500}
            width={1000}
          >
            <div>
              <CustomTableN
                columns={alertColumns}
                data={sortedAlerts}
                loading={false}
                onDownloadBtnClick={handleDownloadAlertsClick}
                downloadReport={downloadReport}
                setDownloadReport={setDownloadReport}
                showDownloadBtn={true}
              />
            </div>
          </Modal>
        </div>
      )}
    </>
  );
};
