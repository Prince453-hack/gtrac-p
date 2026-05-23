import { operatorFilterFn } from "@/app/helpers/customTableFilterFns";
import { isSinghTransportAccount } from "@/app/helpers/isSinghTransport";
import { isSnowmanAccount } from "@/app/helpers/isSnowmanAccount";
import { calculateTravelTimeFromDistance } from "@/app/helpers/calculateTravelTime";
import { HeatMapOutlined } from "@ant-design/icons";
import { Cell, ColumnDef, HeaderContext, Row } from "@tanstack/react-table";
import { Tooltip } from "antd";
import moment from "moment";
import { useLazyGetSearchVhlDataQuery } from "@/app/_globalRedux/services/getSearchData/index";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useEffect, useMemo, useRef } from "react";
import { DownloadReportTs } from "../../common/CustomTableN";

interface TableRow {
  [key: string]: any;
}

const fetchedVehicles = new Set<string>();

// Component for live location cell
const LiveLocationCell = ({ vehicleData }: { vehicleData: any }) => {
  const auth = useSelector((state: RootState) => state.auth);

  // Search API hook to get live location
  const [getSearchVhlData, { data: searchData, isLoading: isSearchLoading }] =
    useLazyGetSearchVhlDataQuery();

  useEffect(() => {
    if (vehicleData?.lorry_no && auth.groupId && auth.userId) {
      const vehicleId = vehicleData?.vId || vehicleData?.sys_service_id;
      const cacheKey = `${vehicleId}`;

      if (vehicleId && !fetchedVehicles.has(cacheKey)) {
        fetchedVehicles.add(cacheKey);
        getSearchVhlData({
          token: auth.groupId,
          vehreg: vehicleId.toString(),
          userid: auth.userId.toString(),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get live location address from search data
  const liveLocationAddress = useMemo(() => {
    if (searchData?.success && searchData.list?.length > 0) {
      const addr = searchData.list[0]?.gpsDtl?.latLngDtl?.addr;
      if (addr) {
        // Clean up the address by replacing underscores with spaces
        return addr.replace(/_/g, " ");
      }
    }
    return "Location not available";
  }, [searchData]);

  return (
    <div className="text-center max-w-[200px]">
      <div className="text-xs font-semibold leading-tight break-words">
        {isSearchLoading ? "Loading..." : liveLocationAddress}
      </div>
    </div>
  );
};

export const getTripsColumns = ({
  data,
  userId,
  setTripEndModal,
  isTripHistory = false,
  setSelectedData,
  currentLocationData,
}: {
  data: getTripVehiclesResponse | undefined;
  userId: string;
  setTripEndModal?: React.Dispatch<
    React.SetStateAction<PlannedTrips | undefined>
  >;
  isTripHistory?: boolean;
  setSelectedData?: React.Dispatch<React.SetStateAction<any>>;
  currentLocationData?: any;
}) => {
  let additionalColKeys: string[] = [];
  if (data && data.list && data.list[0]?.extraInfo !== null) {
    const additionalColKeysInJSON = JSON.parse(
      localStorage.getItem("auth-session") || "-",
    ).extraInfo;
    additionalColKeys = JSON.parse(additionalColKeysInJSON || "[]");
  }

  const cols: ColumnDef<TableRow>[] = [
    {
      accessorKey: "lorry_no",
      header: "Vehicle Number",
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "departure_date",
      header: `${
        Number(userId) === 6347 ? "Trip Start Date" : "Departure Date"
      }`,
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "party_name",
      header: "Party Name",
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "station_from_location",
      header: "Start Location",
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "SourceOut",
      header: "Start Time",
      cell: ({
        row,
      }: {
        cell: Cell<TableRow, unknown>;
        row: Row<TableRow>;
      }) => {
        const sourceOut = row.original?.SourceOut;
        if (
          sourceOut &&
          !sourceOut.includes("aN") &&
          !sourceOut.includes("undefined") &&
          !sourceOut.includes("NaN")
        ) {
          const momentDate = moment(sourceOut);
          if (momentDate.isValid()) {
            return momentDate.format("DD MMM YYYY HH:mm");
          }
        }
        return row.original?.departure_date || "-";
      },
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "station_to_location",
      header: "End Location",
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "trip_complted_datebysystem",
      header: "End Time",
      cell: ({ row }: { cell: Cell<TableRow, unknown>; row: Row<TableRow> }) =>
        row.original?.trip_complted_datebysystem
          ? moment(
              row.original.trip_complted_datebysystem,
              "YYYY-MM-DD HH:mm:ss",
            ).format("DD MMM YYYY HH:mm")
          : "-",
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "totaltripkmbygoogle",
      header: "Total KM",
      cell: ({
        row,
      }: {
        cell: Cell<TableRow, unknown>;
        row: Row<TableRow>;
      }) => {
        const totalKmValue = Number(row.original?.totaltripkmbygoogle || 0);
        return totalKmValue > 0 ? `${totalKmValue.toFixed(2)} km` : "-";
      },
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "eta",
      header: "ETA",
      cell: ({
        row,
      }: {
        cell: Cell<TableRow, unknown>;
        row: Row<TableRow>;
      }) => {
        const estimateHour = row.original?.estimateHour || 0;
        const departureDate = row.original?.departure_date;

        if (!estimateHour || !departureDate) {
          return "-";
        }

        const departureMoment = moment(departureDate);
        if (!departureMoment.isValid()) {
          return "-";
        }

        const etaDateTime = departureMoment.clone().add(estimateHour, "hours");

        return (
          <div className="text-center text-xs">
            <div>{etaDateTime.format("DD MMM YYYY HH:mm")}</div>
          </div>
        );
      },
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "delay",
      header: "Delayed Hours",
      cell: ({
        row,
      }: {
        cell: Cell<TableRow, unknown>;
        row: Row<TableRow>;
      }) => {
        const endTime = row.original?.trip_complted_datebysystem;
        const estimateHour = row.original?.estimateHour || 0;
        const departureDate = row.original?.departure_date;

        // If end time is available, calculate delay as endTime - ETA
        if (endTime && estimateHour && departureDate) {
          const endMoment = moment(endTime, "YYYY-MM-DD HH:mm:ss");
          const departureMoment = moment(departureDate);

          if (endMoment.isValid() && departureMoment.isValid()) {
            const etaDateTime = departureMoment
              .clone()
              .add(estimateHour, "hours");
            const delayInHours = endMoment.diff(etaDateTime, "hours", true);

            if (delayInHours > 0) {
              return (
                <div className="text-center text-red-600">
                  {delayInHours.toFixed(1)} hrs
                </div>
              );
            }
            return "-";
          }
        }

        const actualDelay = row.original?.delay || 0;

        if (actualDelay <= 0) return "-";

        const delayHours = actualDelay.toFixed(1);

        return <div className="text-center text-red-600">{delayHours} hrs</div>;
      },
      footer: (props: any) => props.column.id,
      filterFn: (row: any, id: any, value: any) =>
        operatorFilterFn(row, id, value),
    },
    ...(additionalColKeys.length > 0
      ? additionalColKeys.map((key) => {
          return {
            header: key,
            cell: ({
              cell,
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.extraInfo
                ? JSON.parse(row.original.extraInfo)[key]
                : "-",
            footer: (props: HeaderContext<TableRow, unknown>) =>
              props.column.id,
          };
        })
      : []),
    ...(isSinghTransportAccount(userId)
      ? [
          {
            accessorKey: "from_temp",
            header: "Temp Range From",
            footer: (props: any) => props.column.id,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey: "To_temp",
            header: "Temp Range To",
            footer: (props: any) => props.column.id,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey: "lorry_type",
            header: "LR Number",
            cell: ({
              cell,
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.lorry_type !== "Ref" &&
              row.original.lorry_type !== "Non ref" &&
              row.original.lorry_type !== "normal"
                ? row.original.lorry_type
                : "-",
            footer: (props: any) => props.column.id,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey: "createdBy",
            header: "Created By",
            cell: ({
              cell,
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) => (row.original.createdBy ? row.original.createdBy : "-"),
            footer: (props: any) => props.column.id,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          ...(Number(userId) !== 7344
            ? [
                {
                  accessorKey: "createdAt",
                  header: "Created At",
                  cell: ({
                    cell,
                    row,
                  }: {
                    cell: Cell<TableRow, unknown>;
                    row: Row<TableRow>;
                  }) =>
                    row.original?.createdAt
                      ? moment(row.original.createdAt).format(
                          "DD MMM YYYY HH:mm",
                        )
                      : "-",
                  footer: (props: any) => props.column.id,
                  filterFn: (row: any, id: any, value: any) =>
                    operatorFilterFn(row, id, value),
                },
              ]
            : []),
          ...(isTripHistory
            ? []
            : [
                {
                  accessorKey: "-",
                  header: "Close Trip",
                  footer: (props: any) => props.column.id,
                  cell: ({ row }: { row: Row<TableRow> }) => (
                    <div
                      className="flex justify-center items-center text-primary-green font-proxima font-medium cursor-pointer hover:text-[#58a89d] transition-colors duration-300"
                      onClick={() => {
                        if (setTripEndModal)
                          setTripEndModal(row.original as any);
                      }}
                    >
                      Close Trip ({row.original.trip_id})
                    </div>
                  ),
                },
              ]),
        ]
      : [
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiOne"
                : "viaOne",
            header: "Vai 1",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              Number(userId) === 80933 || Number(userId) === 6347
                ? row.original.vaiOne
                : row.original.viaOne,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiOneInTime"
                : "viaOneInTime",
            header: "Vai 1 in-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiOneInTime &&
              row.original.vaiOneInTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiOneInTime}`
                : row.original.viaOneInTime &&
                    row.original.viaOneInTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaOneInTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiOneOutTime"
                : "viaOneOutTime",
            header: "Vai 1 out-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiOneOutTime &&
              row.original.vaiOneOutTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiOneOutTime}`
                : row.original.viaOneOutTime &&
                    row.original.viaOneOutTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaOneOutTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiTwo"
                : "viaTwo",
            header: "Vai 2",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              Number(userId) === 80933 || Number(userId) === 6347
                ? row.original.vaiTwo
                : row.original.viaTwo,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiTwoInTime"
                : "viaTwoInTime",
            header: "Vai 2 in-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiTwoInTime &&
              row.original.vaiTwoInTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiTwoInTime}`
                : row.original.viaTwoInTime &&
                    row.original.viaTwoInTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaTwoInTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiTwoOutTime"
                : "viaTwoOutTime",
            header: "Vai 2 out-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiTwoOutTime &&
              row.original.vaiTwoOutTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiTwoOutTime}`
                : row.original.viaTwoOutTime &&
                    row.original.viaTwoOutTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaTwoOutTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiThree"
                : "viaThree",
            header: "Vai 3",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              Number(userId) === 80933 || Number(userId) === 6347
                ? row.original.vaiThree
                : row.original.viaThree,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiThreeInTime"
                : "viaThreeInTime",
            header: "Vai 3 in-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiThreeInTime &&
              row.original.vaiThreeInTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiThreeInTime}`
                : row.original.viaThreeInTime &&
                    row.original.viaThreeInTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaThreeInTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiThreeOutTime"
                : "viaThreeOutTime",
            header: "Vai 3 out-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiThreeOutTime &&
              row.original.vaiThreeOutTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiThreeOutTime}`
                : row.original.viaThreeOutTime &&
                    row.original.viaThreeOutTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaThreeOutTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiFour"
                : "viaFour",
            header: "Vai 4",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              Number(userId) === 80933 || Number(userId) === 6347
                ? row.original.vaiFour
                : row.original.viaFour,
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiFourInTime"
                : "viaFourInTime",
            header: "Vai 4 in-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiFourInTime &&
              row.original.vaiFourInTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiFourInTime}`
                : row.original.viaFourInTime &&
                    row.original.viaFourInTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaFourInTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          {
            accessorKey:
              Number(userId) === 80933 || Number(userId) === 6347
                ? "vaiFourOutTime"
                : "viaFourOutTime",
            header: "Vai 4 out-time",
            footer: (props: any) => props.column.id,
            cell: ({
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.vaiFourOutTime &&
              row.original.vaiFourOutTime !== "01 Jan 1970 05:30:00" &&
              (Number(userId) === 80933 || Number(userId) === 6347)
                ? `${row.original.vaiFourOutTime}`
                : row.original.viaFourOutTime &&
                    row.original.viaFourOutTime !== "01 Jan 1970 05:30:00"
                  ? `${row.original.viaFourOutTime}`
                  : "-",
            filterFn: (row: any, id: any, value: any) =>
              operatorFilterFn(row, id, value),
          },
          ...(Number(userId) === 6347 ||
          (Number(userId) === 3183 && !isTripHistory)
            ? [
                {
                  accessorKey: "-",
                  header: "Close Trip",
                  footer: (props: any) => props.column.id,
                  cell: ({ row }: { row: Row<TableRow> }) => (
                    <div
                      className="flex justify-center items-center text-primary-green font-proxima font-medium cursor-pointer hover:text-[#58a89d] transition-colors duration-300"
                      onClick={() => {
                        if (setTripEndModal)
                          setTripEndModal(row.original as any);
                      }}
                    >
                      Close Trip ({row.original.trip_id})
                    </div>
                  ),
                },
                ...(Number(userId) === 6347
                  ? [
                      {
                        id: "trip_status",
                        header: "Trip Status",
                        cell: ({ row }: { row: Row<TableRow> }) => {
                          const status = row.original.trip_status || "Unknown";

                          return (
                            <div className="flex justify-center">
                              <p className="text-center">{status}</p>
                            </div>
                          );
                        },
                        footer: (props: any) => props.column.id,
                      },
                      {
                        id: "path",
                        header: "Path",
                        cell: ({ row }: { row: Row<TableRow> }) => {
                          return (
                            <div
                              className="w-full flex items-center justify-center cursor-pointer"
                              onClick={() => {
                                if (setSelectedData) {
                                  if (
                                    row.original.trip_complted_datebysystem &&
                                    row.original.trip_complted_datebysystem !==
                                      null
                                  ) {
                                    setSelectedData({
                                      ...row.original,
                                    });
                                  } else {
                                    setSelectedData({
                                      ...row.original,
                                      trip_complted_datebysystem:
                                        moment().format("DD MMM YYYY HH:mm:ss"),
                                    });
                                  }
                                }
                              }}
                            >
                              <Tooltip title="show path" mouseEnterDelay={1}>
                                <HeatMapOutlined />
                              </Tooltip>
                            </div>
                          );
                        },
                        footer: (props: any) => props.column.id,
                      },
                    ]
                  : []),
              ]
            : []),
        ]),
  ];

  // Add GPS columns for Snowman accounts before Trip Status
  if (isSnowmanAccount({ userId: Number(userId) })) {
    cols.push(
      {
        accessorKey: "gps_current_time",
        header: "GPS Current Time",
        cell: ({
          row,
        }: {
          cell: Cell<TableRow, unknown>;
          row: Row<TableRow>;
        }) => {
          const currentDateTime = row?.original?.gps_time;
          return (
            <div className="text-center text-xs">
              <div className="text-primary-green font-semibold">
                {currentDateTime}
              </div>
            </div>
          );
        },
        footer: (props: any) => props.column.id,
        filterFn: (row: any, id: any, value: any) =>
          operatorFilterFn(row, id, value),
      },
      {
        accessorKey: "current_location",
        header: "Current Location",
        cell: ({
          row,
        }: {
          cell: Cell<TableRow, unknown>;
          row: Row<TableRow>;
        }) => {
          return (
            <div className="text-primary-green">
              <LiveLocationCell vehicleData={row.original} />
            </div>
          );
        },
        footer: (props: any) => props.column.id,
        filterFn: (row: any, id: any, value: any) =>
          operatorFilterFn(row, id, value),
      },
      {
        accessorKey: "trip_status",
        header: "Trip Status",
        cell: ({
          row,
        }: {
          cell: Cell<TableRow, unknown>;
          row: Row<TableRow>;
        }) => {
          const status = row.original.trip_status || "Unknown";
          return (
            <div className="text-center">
              <p className="text-center">{status}</p>
            </div>
          );
        },
        footer: (props: any) => props.column.id,
        filterFn: (row: any, id: any, value: any) =>
          operatorFilterFn(row, id, value),
      },
    );
  } else {
    // Only add these columns if not Snowman account
    cols.push(
      {
        accessorKey: "gps_current_time",
        header: "GPS Current Time",
        cell: ({
          row,
        }: {
          cell: Cell<TableRow, unknown>;
          row: Row<TableRow>;
        }) => {
          const currentDateTime = row?.original?.gps_time;
          return (
            <div className="text-center text-xs">
              <div className="text-primary-green font-semibold">
                {currentDateTime}
              </div>
            </div>
          );
        },
        footer: (props: any) => props.column.id,
        filterFn: (row: any, id: any, value: any) =>
          operatorFilterFn(row, id, value),
      },
      {
        accessorKey: "current_location",
        header: "Current Location",
        cell: ({
          row,
        }: {
          cell: Cell<TableRow, unknown>;
          row: Row<TableRow>;
        }) => {
          return (
            <div className="text-primary-green">
              <LiveLocationCell vehicleData={row.original} />
            </div>
          );
        },
        footer: (props: any) => props.column.id,
        filterFn: (row: any, id: any, value: any) =>
          operatorFilterFn(row, id, value),
      },
      {
        accessorKey: "trip_status",
        header: "Trip Status",
        cell: ({
          row,
        }: {
          cell: Cell<TableRow, unknown>;
          row: Row<TableRow>;
        }) => {
          const status = row.original.trip_status || "Unknown";
          return (
            <div className="text-center">
              <p className="text-center">{status}</p>
            </div>
          );
        },
        footer: (props: any) => props.column.id,
        filterFn: (row: any, id: any, value: any) =>
          operatorFilterFn(row, id, value),
      },
    );
  }

  // Add Path column specifically for user 3183 at the end
  if (Number(userId) === 3183 && !isTripHistory) {
    cols.push({
      id: "path",
      header: "Path",
      cell: ({ row }: { row: Row<TableRow> }) => {
        return (
          <div
            className="w-full flex items-center justify-center cursor-pointer"
            onClick={() => {
              if (setSelectedData) {
                if (
                  row.original.trip_complted_datebysystem &&
                  row.original.trip_complted_datebysystem !== null
                ) {
                  setSelectedData({
                    ...row.original,
                  });
                } else {
                  setSelectedData({
                    ...row.original,
                    trip_complted_datebysystem: moment().format(
                      "DD MMM YYYY HH:mm:ss",
                    ),
                  });
                }
              }
            }}
          >
            <Tooltip title="show path" mouseEnterDelay={1}>
              <HeatMapOutlined />
            </Tooltip>
          </div>
        );
      },
      footer: (props: any) => props.column.id,
    });
  }

  return cols;
};

export const downloadTripReport = ({
  data,
  setDownloadReport,
  userId,
  currentLocationData,
}: {
  data: getTripVehiclesResponse | undefined;
  userId: string;
  setDownloadReport: React.Dispatch<
    React.SetStateAction<DownloadReportTs | undefined>
  >;
  currentLocationData?: any;
}) => {
  if (!data) return;

  let additionalColKeys: string[] = [];
  if (data && data.list && data.list[0].extraInfo !== null) {
    // todo make the keys dependent on a field in auth
    const additionalColKeysInJSON = JSON.parse(
      localStorage.getItem("auth-session") || "-",
    ).extraInfo;
    additionalColKeys = JSON.parse(additionalColKeysInJSON || "[]");
  }

  let rows: any[] = data.list.map((item, index) => ({
    ["Vehicle Number"]: item.lorry_no,
    ["Departure Date"]: item.departure_date,
    ["Party Name"]: item.party_name,
    ["Start Location"]: item.station_from_location,
    ["Start Time"]: (() => {
      const sourceOut = item.SourceOut;
      if (
        sourceOut &&
        !sourceOut.includes("aN") &&
        !sourceOut.includes("undefined") &&
        !sourceOut.includes("NaN")
      ) {
        const momentDate = moment(sourceOut);
        if (momentDate.isValid()) {
          return momentDate.format("DD MMM YYYY HH:mm");
        }
      }
      return item.departure_date || "-";
    })(),
    ["End Location"]: item.station_to_location,
    ["End Time"]: item.trip_complted_datebysystem
      ? moment(item.trip_complted_datebysystem, "YYYY-MM-DD HH:mm:ss").format(
          "DD MMM YYYY HH:mm",
        )
      : "-",
    ["Total KM"]: (() => {
      const totalKm = item.totaltripkmbygoogle || 0;
      return totalKm > 0 ? `${totalKm.toFixed(2)} km` : "-";
    })(),
    ["ETA"]: (() => {
      const tripDistanceKm = item.totaltripkmbygoogle || 0;
      const averageSpeed = 40;
      const estimatedTravelTime = calculateTravelTimeFromDistance(
        tripDistanceKm,
        averageSpeed,
      );

      if (estimatedTravelTime <= 0) return "-";

      // Get start time and calculate ETA for export
      const sourceOut = item.SourceOut;
      let startMoment = null;

      if (
        sourceOut &&
        !sourceOut.includes("aN") &&
        !sourceOut.includes("undefined") &&
        !sourceOut.includes("NaN")
      ) {
        startMoment = moment(sourceOut);
      }

      if (!startMoment || !startMoment.isValid()) {
        // Try departure_date as fallback
        if (item.departure_date) {
          startMoment = moment(item.departure_date);
        }
      }

      if (!startMoment || !startMoment.isValid()) {
        return "-";
      }

      // Add estimated travel time to start time
      const etaDateTime = startMoment.clone().add(estimatedTravelTime, "hours");

      return `${etaDateTime.format(
        "DD MMM YYYY HH:mm",
      )} (${estimatedTravelTime.toFixed(1)} hrs)`;
    })(),
    ["Delayed Hours"]: (() => {
      const tripDistanceKm = item.totaltripkmbygoogle || 0;
      const averageSpeed = 40;
      const estimatedTravelTime = calculateTravelTimeFromDistance(
        tripDistanceKm,
        averageSpeed,
      );
      const actualDelay = item.delay || 0;

      if (actualDelay <= 0) return "-";

      return `${actualDelay.toFixed(1)} hrs`;
    })(),
    ["Current Time"]: moment().format("DD MMM YYYY HH:mm"),
    ["Current Location"]: (() => {
      const locationData = currentLocationData?.[item.lorry_no];
      return locationData?.location || "Live location - check online";
    })(),
    ["Trip Status"]: item.trip_status || "Unknown",
    ...(additionalColKeys.length > 0
      ? additionalColKeys.map((key) => {
          return {
            [key]: item.extraInfo ? JSON.parse(item.extraInfo)[key] : "-",
          };
        })
      : null),

    ...(isSinghTransportAccount(userId)
      ? {
          ["Temnp Range From"]: item.from_temp,
          ["Temp Range To"]: item.To_temp,
          ["LR Number"]:
            item.lorry_type !== "Ref" &&
            item.lorry_type !== "Non ref" &&
            item.lorry_type !== "normal"
              ? item.lorry_type
              : "-",
          ["Created By"]: item.createdBy ? item.createdBy : "",
          ["Created At"]: item.createdAt
            ? moment(item.createdAt).format("DD MMM YYYY HH:mm")
            : "",
        }
      : {}),

    ...(isSinghTransportAccount(userId)
      ? {}
      : {
          ["Vai 1"]: item.vaiOne ?? "-",
          ["Vai 1 In Time"]:
            item.vaiOneInTime !== "01 Jan 1970 05:30:00"
              ? item.vaiOneInTime
              : "-",
          ["Vai 1 Out Time"]:
            item.vaiOneOutTime !== "01 Jan 1970 05:30:00"
              ? item.vaiOneOutTime
              : "-",
          ["Vai 2"]: item.vaiTwo ?? "-",
          ["Vai 2 In Time"]:
            item.vaiTwoInTime !== "01 Jan 1970 05:30:00"
              ? item.vaiTwoInTime
              : "-",
          ["Vai 2 Out Time"]:
            item.vaiTwoOutTime !== "01 Jan 1970 05:30:00"
              ? item.vaiTwoOutTime
              : "-",
          ["Vai 3"]: item.vaiThree ?? "-",
          ["Vai 3 In Time"]:
            item.vaiThreeInTime !== "01 Jan 1970 05:30:00"
              ? item.vaiThreeInTime
              : "-",
          ["Vai 3 Out Time"]:
            item.vaiThreeOutTime !== "01 Jan 1970 05:30:00"
              ? item.vaiThreeOutTime
              : "-",
          ["Vai 4"]: item.vaiFour ?? "-",
          ["Vai 4 In Time"]:
            item.vaiFourInTime !== "01 Jan 1970 05:30:00"
              ? item.vaiFourInTime
              : "-",
          ["Vai 4 Out Time"]:
            item.vaiFourOutTime !== "01 Jan 1970 05:30:00"
              ? item.vaiFourOutTime
              : "-",
        }),
  }));

  const head = Object.keys(rows[0]);

  const body = rows.map((row) => Object.values(row));

  let columnsStyles: any = {};

  body[0].map((value: any, index) => {
    columnsStyles[index] = {
      cellWidth: value.toString().length > 10 ? 50 : 20,
    };
  });

  setDownloadReport({
    title: "Trip Report",
    excel: { title: "Trip Report", rows, footer: [] },
    pdf: {
      head: [head],
      body: body,
      title: "Trip Report",
      pageSize: "a3",
      userOptions: {
        columnStyles: columnsStyles,
      },
    },
  });
};
