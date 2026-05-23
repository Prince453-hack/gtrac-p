import React, { useEffect, useState, useTransition } from "react";
import { ViewContext } from "./tripReportAndPlanningToggle";
import CustomTableN, { DownloadReportTs } from "../../common/CustomTableN";
import { TripList2 } from "./trip-list-2";
import { downloadTripReport3 } from "./getTripColumns4";
import { GatewayRailCurrentTrip } from "@/app/_globalRedux/services/types/gatewayRailCurrentTripsResponse";
import { Spin, Modal, Button, Space, Tag } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useLazyGetKmtAlertVehicleWiseQuery } from "@/app/_globalRedux/services/trackingDashboard";
import {
  AlertDetails,
  KMTAlertsResponse,
} from "@/app/_globalRedux/services/types/alerts";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import {
  MergedGatewayRailTrip,
  mergeRailTrips,
} from "@/app/helpers/mergeGatewayRailTrips";
import { parseDate } from "../../common/Temeline-2";
import { operatorFilterFn } from "@/app/helpers/customTableFilterFns";
import { HeaderContext, Row } from "@tanstack/react-table";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";

interface TableRow extends MergedGatewayRailTrip {}

function hasValidCoordinates(alert: AlertDetails): boolean {
  return (
    (alert.endlat !== 0 && alert.endLong !== 0) ||
    (alert.startlat !== 0 && alert.startLong !== 0)
  );
}

function filterKmtAlerts(kmtAlerts: KMTAlertsResponse["list"]): AlertDetails[] {
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

const alertColumns: ColumnDef<AlertDetails>[] = [
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
];

export const Trips2History = ({
  tripsHistory,
  isTripsLoading,
}: {
  tripsHistory:
    | (GatewayRailCurrentTrip & { currentLocation: VehicleData | undefined })[]
    | undefined;
  isTripsLoading: boolean;
}) => {
  const [downloadReport, setDownloadReport] = React.useState<
    DownloadReportTs | undefined
  >(undefined);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] =
    useState<GatewayRailCurrentTrip | null>(null);
  const [alertsData, setAlertsData] = useState<AlertDetails[]>([]);
  const [isAlertLoading, setIsAlertLoading] = useState(false);
  const { userId } = useSelector((state: RootState) => state.auth);
  const [getKmtAlertVehicleTrigger] = useLazyGetKmtAlertVehicleWiseQuery();
  const [isPending, startTransition] = useTransition();

  const activeView = React.useContext(ViewContext);
  const [manualLoader, setManualLoader] = useState(false);
  const [mergedTrips, setMergedTrips] = useState<MergedGatewayRailTrip[]>([]);
  const [selectedBaseLocation, setSelectedBaseLocation] =
    useState<string>("ALL");
  const [selectedBaseLocationUi, setSelectedBaseLocationUi] =
    useState<string>("ALL");

  const baseLocations = [
    { value: "ALL", label: "All Locations" },
    { value: "SNL", label: "SNL" },
    { value: "GRFV", label: "GRFV" },
    { value: "KASHIPUR", label: "KASHIPUR" },
    { value: "PIYALA", label: "PIYALA" },
    { value: "GHH", label: "GHH" },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;
    if (isTripsLoading) {
      setManualLoader(true);
    } else {
      timer = setTimeout(() => {
        setManualLoader(false);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [isTripsLoading]);

  useEffect(() => {
    if (!tripsHistory?.length) return;

    setManualLoader(true);

    const tempMergedData = mergeRailTrips(tripsHistory);
    setMergedTrips(tempMergedData);

    const timer = setTimeout(() => {
      setManualLoader(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [tripsHistory]);

  const fetchAlerts = async (trip: MergedGatewayRailTrip) => {
    if (!trip || !trip.vehId) return;

    setAlertsData([]);

    try {
      const items = trip.legs;
      const currentTime = new Date().getTime();

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

      const { data } = await getKmtAlertVehicleTrigger({
        userId: userId,
        vehReg: trip.vehicle_no,
        vehId: trip.vehId,
        startDateTime: moment(T_start).format("YYYY-MM-DD HH:mm:ss"),
        endDateTime: moment(T_end).format("YYYY-MM-DD HH:mm:ss"),
      });

      if (data && data.list) {
        const filteredAlerts = filterKmtAlerts(data.list);
        setAlertsData(filteredAlerts);
      }
    } finally {
      setIsAlertLoading(false);
    }
  };

  const handleAlertsClick = (trip: MergedGatewayRailTrip) => {
    setSelectedTrip(trip as any);
    setIsAlertsModalOpen(true);
    setIsAlertLoading(true);
    setTimeout(() => {
      fetchAlerts(trip);
    }, 1000);
  };

  const fields = [
    { key: "vehicle_no", header: "Vehicle No" },
    { key: "Driver_name", header: "Driver Name" },
    { key: "driver_contact_no", header: "Driver Number" },
    { key: "gr_no", header: "GR No" },
    { key: "locationToCheckTheToAgainst", header: "Status" },
    { key: "billing_party_name", header: "Billing Party Name" },
    { key: "Importer NAME", header: "Importer Name" },
    { key: "container_no", header: "Container No" },
    { key: "size", header: "size" },
    { key: "segment", header: "Segment" },
    { key: "Container Combination", header: "Container Combination" },
    { key: "route", header: "Route" },
    { key: "shipping_line_name", header: "Shipping Line" },
    { key: "document_no", header: "Trip No" },
    { key: "TripStartDate", header: "Trip Start Date" },
    { key: "legs[0].location", header: "Start Location" },
    { key: "legs[0].inboundTime", header: "Start In Time" },
    { key: "legs[0].outboundTime", header: "Start Out Time" },
    ...Array.from({ length: 3 }, (_, index) => {
      const legIndex = index + 1;
      return [
        {
          key: `legs[${legIndex}].location`,
          header: `Via-${legIndex} Location`,
        },
        {
          key: `legs[${legIndex}].inboundTime`,
          header: `Via-${legIndex} In Time`,
        },
        {
          key: `legs[${legIndex}].outboundTime`,
          header: `Via-${legIndex} Out Time`,
        },
      ];
    }).flat(),
    ...(Number(userId) === 5275
      ? [
          {
            key: "gps Site parking IN DATE TIME",
            header: "Parking In",
          },
          {
            key: "gps Site parking OUT DATE TIME",
            header: "Parking Out",
          },
        ]
      : []),
    {
      key: "lastLeg.location",
      header: "Destination",
      accessorFn: (row: MergedGatewayRailTrip) => {
        const lastLeg = row.legs[row.legs.length - 1];
        return lastLeg?.location;
      },
    },
    {
      key: "lastLeg.inboundTime",
      header: "Destination In Time",
      accessorFn: (row: MergedGatewayRailTrip) => {
        const lastLeg = row.legs[row.legs.length - 1];
        const startInTime = row.legs[0]?.inboundTime;
        const destinationInTime = lastLeg?.inboundTime;

        if (
          startInTime &&
          destinationInTime &&
          startInTime === destinationInTime
        ) {
          return "-";
        }

        return destinationInTime;
      },
    },
    { key: "currentLocation", header: "Current Location" },
    { key: "currentTime", header: "Current Time" },
  ];

  const getTripsColumns3 = (): ColumnDef<TableRow>[] => {
    return fields.map((field) => {
      if (field.key.includes("legs[") || field.key.includes("lastLeg.")) {
        const isLastLeg = field.key.includes("lastLeg.");
        const [part, property] = field.key.split(".");
        const legIndex = isLastLeg
          ? -1
          : parseInt(part.match(/\d+/)?.[0] || "0", 10);

        return {
          id: field.key,
          header: field.header,
          accessorFn:
            field.accessorFn ||
            ((row: MergedGatewayRailTrip) => {
              const legs = row.legs;
              if (isLastLeg) {
                const lastLeg = legs[legs.length - 1];
                return lastLeg
                  ? lastLeg[property as keyof typeof lastLeg]
                  : undefined;
              }
              if (legs && legs[legIndex] && legIndex < legs.length - 1) {
                return legs[legIndex][property as keyof (typeof legs)[0]];
              }
              return undefined;
            }),
          cell: (info) => {
            const value = info.getValue();
            if (property === "inboundTime" || property === "outboundTime") {
              // Handle the case where accessorFn returns "-" for same times
              if (value === "-") {
                return "-";
              }
              return value ? moment(value).format("YYYY-MM-DD HH:mm") : "-";
            }
            return value || "-";
          },
          filterFn: (row: Row<TableRow>, id: string, value: any) =>
            operatorFilterFn(row, id, value),
        };
      } else {
        return {
          accessorKey: field.key,
          header: field.header,
          footer: (props: HeaderContext<TableRow, unknown>) => props.column.id,
          filterFn: (row: Row<TableRow>, id: string, value: any) =>
            operatorFilterFn(row, id, value),
          cell: (info) => {
            const value = info.getValue();

            if (
              field.key === "site_reporting_time" ||
              field.key === "TripStartDate" ||
              field.key === "timeupdate"
            ) {
              return value ? moment(value).format("YYYY-MM-DD HH:mm") : "-";
            }
            if (field.key === "locationToCheckTheToAgainst") {
              if (
                typeof value === "string" &&
                [
                  "ghh",
                  "piyala",
                  "snl",
                  "hsr",
                  "ksp",
                  "grfv",
                  "ptli",
                  "asr",
                ].includes(value.toLowerCase())
              ) {
                return (
                  <div className="flex justify-start">
                    <div className="px-3 py-1 bg-green-50 text-green-700 w-fit rounded-2xl">
                      Inward
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex justify-start">
                    <div className="px-3 py-1 bg-red-50 text-red-700 w-fit rounded-2xl">
                      Outward
                    </div>
                  </div>
                );
              }
            }
            if (field.key === "currentLocation") {
              return (
                <p className="text-primary-green font-semibold">
                  {(value as string) ?? ""}
                </p>
              );
            }
            if (field.key === "currentTime") {
              return (
                <p className="text-primary-green font-semibold">
                  {(value as string) ?? ""}
                </p>
              );
            }
            if (field.key === "segment") {
              return value == 1
                ? "Export"
                : value == 0
                ? "Import"
                : value == 3
                ? "Empty"
                : value == 2
                ? "Domestic"
                : "Unknown";
            }
            if (field.key === "Container Combination") {
              return value == 1
                ? "1x20"
                : value == 3
                ? "1x40"
                : value == 2
                ? "2x20"
                : "Unknown";
            }
            if (
              field.key === "gps Site parking IN DATE TIME" ||
              field.key === "gps Site parking OUT DATE TIME"
            ) {
              return value ? moment(value).format("YYYY-MM-DD HH:mm") : "-";
            }
            return value;
          },
        };
      }
    });
  };

  const handleDownloadAlertsClick = () => {
    if (!alertsData.length) return;

    const rows = alertsData.map((alert: AlertDetails) => {
      return {
        Type: alert.exception_type,
        Start: moment(alert.starttime).format("YYYY-MM-DD HH:mm"),
        Message: alert.msg || "",
      };
    });

    const head = Object.keys(rows[0] || {});
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

  const getColumnsWithAlerts = () => {
    const columns = getTripsColumns3();

    columns.push({
      id: "alerts",
      header: "Alerts",
      cell: ({ row }: { row: any }) => (
        <Button
          icon={<BellOutlined />}
          onClick={() => handleAlertsClick(row.original)}
          type="text"
          className="text-primary-green hover:text-primary-green-dark"
        ></Button>
      ),
    });
    return columns;
  };

  const getFilteredTrips = () => {
    if (selectedBaseLocation === "ALL") {
      return mergedTrips;
    }

    return mergedTrips.filter((trip) => {
      const startLocation = trip.legs?.[0]?.location;
      return (
        startLocation &&
        startLocation.toUpperCase() === selectedBaseLocation.toUpperCase()
      );
    });
  };

  const getFilteredTripsHistory = () => {
    if (selectedBaseLocation === "ALL") {
      return tripsHistory;
    }

    return tripsHistory?.filter((trip) => {
      const startLocation = trip["FROM Location"];
      return (
        startLocation &&
        startLocation.toUpperCase() === selectedBaseLocation.toUpperCase()
      );
    });
  };

  const filteredTrips = getFilteredTrips();
  const filteredTripsHistory = getFilteredTripsHistory();

  return (
    <div className="flex flex-col gap-4 py-4 w-full font-proxima text-xs relative">
      {(isTripsLoading || manualLoader || isPending) && (
        <div className="w-full h-full flex justify-center items-center bg-[#F5F8F6] absolute top-0 left-0 right-0 z-50 text-primary-green">
          <Spin spinning size="large" />
        </div>
      )}
      {activeView === "TABLE" ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Filter by Base Location:
            </span>
            <Space wrap>
              {baseLocations.map((location) => (
                <Tag.CheckableTag
                  key={location.value}
                  checked={selectedBaseLocationUi === location.value}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedBaseLocationUi(location.value);
                      startTransition(() => {
                        setSelectedBaseLocation(location.value);
                      });
                    }
                  }}
                  className={`px-5 py-2 border rounded-full cursor-pointer transition-all ${
                    selectedBaseLocationUi === location.value
                      ? "bg-primary-green text-white border-primary-green"
                      : "bg-white text-gray-700 border-gray-300 hover:border-primary-green"
                  }`}
                >
                  {location.label}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>

          <CustomTableN
            columns={getColumnsWithAlerts()}
            data={filteredTrips}
            loading={isTripsLoading || manualLoader || isPending}
            onDownloadBtnClick={() => {
              downloadTripReport3({
                data: filteredTrips,
                setDownloadReport,
                userId,
              });
            }}
            downloadReport={downloadReport}
            setDownloadReport={setDownloadReport}
            width="200%"
            height="max-h-[calc(100vh-290px)]"
            fontSize="12px"
          />
        </>
      ) : (
        <TripList2
          type="planning"
          tripData={filteredTripsHistory}
          isLoading={isTripsLoading}
        />
      )}

      <Modal
        title={`Vehicle Alerts${
          selectedTrip ? ` - ${selectedTrip.vehicle_no}` : ""
        }`}
        open={isAlertsModalOpen}
        onCancel={() => setIsAlertsModalOpen(false)}
        style={{ top: 20 }}
        styles={{ body: { background: "#F5F8F6" } }}
        footer={null}
        width={800}
      >
        <div>
          <CustomTableN
            columns={alertColumns}
            data={alertsData}
            lazyLoad
            loading={isAlertLoading}
            onDownloadBtnClick={handleDownloadAlertsClick}
            downloadReport={downloadReport}
            setDownloadReport={setDownloadReport}
            showDownloadBtn={true}
          />
        </div>
      </Modal>
    </div>
  );
};
