"use client";

import {
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
  Polyline,
} from "@/@react-google-maps/api";
import { setLiveVehicleItnaryWithPath } from "@/app/_globalRedux/dashboard/liveVehicleSlice";
import {
  setContainerStyle,
  setIsMapActive,
  setIsMapNotLoading,
  setOpenStoppageIndex,
} from "@/app/_globalRedux/dashboard/mapSlice";
import { setRadiusInKilometers } from "@/app/_globalRedux/dashboard/nearbyVehicleSlice";
import { setSelectedVehicleCustomRange } from "@/app/_globalRedux/dashboard/selectedVehicleCustomRangeSlice";
import {
  initialSelectedVehicleState,
  setNearbyVehicles,
  setSelectedVehicleStatus,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import {
  setVehicleItnaryWithPath,
  vehicleItnaryWithPathInitialState,
} from "@/app/_globalRedux/dashboard/vehicleItnaryWithPathSlice";
import {
  useGetConslidateByDateRangeDataAndVehicleNumberQuery,
  useGetConsolidateDateByRangeQuery,
  useGetConsolidateDetailQuery,
  useLazyGetConslidateByDateRangeDataAndVehicleNumberQuery,
  useLazyGetConsolidateDateByRangeQuery,
  useLazyGetConsolidateDetailQuery,
  useLazyGetItineraryvehIdBDateNwStQuery,
  useLazyGetpathwithDateDaignosticQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { PathArrayItem } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { RootState } from "@/app/_globalRedux/store";
import { operatorFilterFn } from "@/app/helpers/customTableFilterFns";
import getGoogleApiKey from "@/app/helpers/getGoogleMapKeys";
import { ArrowsAltOutlined, HeatMapOutlined } from "@ant-design/icons";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Button, Tooltip } from "antd";
import dayjs, { Dayjs } from "dayjs";
import moment from "moment";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CustomTableN, { DownloadReportTs } from "../../common/CustomTableN";
import {
  HistoryReplayMarker,
  HistoryReplaySlider,
  Markers,
  StartAndEndPointMarker,
  StoppageMarkers,
} from "../../dashboard";
import { AlertMarkers } from "../../dashboard/AlertMarkers";
import { Library } from "../../dashboard/GoogleMaps";
import { updateVehicleItnaryWithPath } from "../../dashboard/VehicleDetails";
import { ConsolidatedReportModal } from "./consolidated-report-modal";
import Header from "./Header";

interface TableRow {
  [key: string]: any;
}

const googleLibraries = ["places", "drawing"] as Library[];

type FormattedData = ConsolidatedReportResponse &
  ConsolidatedReportResponse["list"] & {
    Start_Time_formatted: string;
    End_Time_formatted: string;
  };

export const View = () => {
  const { groupId, userId, parentUser, extra } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch();

  const [downloadReport, setDownloadReport] = useState<
    DownloadReportTs | undefined
  >();
  const [formatedData, setFormatedData] = useState<FormattedData["list"]>([]);
  const [date, setDate] = useState<Dayjs>(dayjs().subtract(1, "days"));
  const [dateRange, setDateRange] = useState<Date[]>([
    dayjs().startOf("day").toDate(),
    dayjs().toDate(),
  ]);
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath,
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const [map, setMap] = useState<google.maps.Map>();
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicleOption, setSelectedVehicleOption] = useState<
    { label: string; value: number } | undefined
  >(undefined);
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [infoWindowState, setInfoWindowState] = useState({
    index: -1,
    lat: 0,
    lng: 0,
    state: false,
  });

  const [getConsolidateDetail, { isLoading: isConsolidateDetailLoading }] =
    useLazyGetConsolidateDetailQuery();
  const [
    getConsolidateDateByRange,
    { isLoading: isConsolidateDateByRangeLoading },
  ] = useLazyGetConsolidateDateByRangeQuery();
  const [
    getConslidateByDateRangeDataAndVehicleNumber,
    { isLoading: isGetConslidateByDateRangeDataAndVehicleNumberLoading },
  ] = useLazyGetConslidateByDateRangeDataAndVehicleNumberQuery();

  const { data, isLoading } = useGetConsolidateDetailQuery(
    {
      token: groupId,
      userId: userId,
      startDate: moment().subtract(1, "days").format("YYYY-MM-DD"),
    },
    {
      skip:
        !groupId ||
        !userId ||
        Number(userId) === 85380 ||
        Number(userId) === 83171,
    },
  );

  const {
    data: conslidateDetailByDateRangeData,
    isLoading: isConslidateDetailByDateRangeLoading,
  } = useGetConslidateByDateRangeDataAndVehicleNumberQuery(
    {
      token: groupId,
      vehId: selectedVehicleOption?.value || 0,
      userId: userId,
      startDate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm"),
      endDate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm"),
    },
    {
      skip:
        !groupId ||
        !userId ||
        Number(userId) !== 85380 ||
        selectedVehicleOption?.value === undefined ||
        selectedVehicleOption?.value === 0,
    },
  );

  const {
    data: conslidateByDateRangeDataAndVehicleNumber,
    isLoading: isConslidateByDateRangeDataAndVehicleNumberLoading,
  } = useGetConsolidateDateByRangeQuery(
    {
      token: groupId,
      userId: userId,
      startDate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm"),
      endDate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm"),
    },
    { skip: !groupId || !userId || Number(userId) !== 85380 },
  );
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const filterVehiclesBySelectedDate = (
    vehicles: ConsolidatedReportResponse["list"],
  ) => {
    if (!vehicles || vehicles.length === 0) return [];

    if (Number(userId) === 85380 || Number(userId) === 83171) {
      const [start, end] = dateRange;
      if (!start || !end) return vehicles;

      const startMoment = moment(start);
      const endMoment = moment(end);

      return vehicles.filter((vehicle) => {
        if (!vehicle.Start_Time) return false;
        const startTime = moment(vehicle.Start_Time);
        return startTime.isBetween(startMoment, endMoment, undefined, "[]");
      });
    }

    const selectedStart = moment(date.toDate()).startOf("day");

    return vehicles.filter((vehicle) => {
      if (!vehicle.Start_Time) return false;
      const startTime = moment(vehicle.Start_Time);
      return startTime.isSameOrAfter(selectedStart);
    });
  };

  useEffect(() => {
    if (Number(userId) === 85380) {
      if (
        conslidateDetailByDateRangeData &&
        conslidateDetailByDateRangeData.list &&
        Array.isArray(conslidateDetailByDateRangeData.list)
      ) {
        setFormatedData(
          filterVehiclesBySelectedDate(
            conslidateDetailByDateRangeData.list,
          ).map((vehicle) => ({
            ...vehicle,
            End_Location: vehicle.End_Location?.replaceAll("_", " "),
            Start_Location: vehicle.Start_Location?.replaceAll("_", " "),
            Start_Time_formatted: moment(vehicle.Start_Time).format(
              "DD-MM-YYYY HH:mm:ss",
            ),
            End_Time_formatted: moment(vehicle.End_Time).format(
              "DD-MM-YYYY HH:mm:ss",
            ),
          })),
        );
      }
    } else if (Number(userId) === 83171) {
      if (
        conslidateByDateRangeDataAndVehicleNumber &&
        conslidateByDateRangeDataAndVehicleNumber.list &&
        Array.isArray(conslidateByDateRangeDataAndVehicleNumber.list)
      ) {
        setFormatedData(
          filterVehiclesBySelectedDate(
            conslidateByDateRangeDataAndVehicleNumber.list,
          ).map((vehicle) => ({
            ...vehicle,
            End_Location: vehicle.End_Location?.replaceAll("_", " "),
            Start_Location: vehicle.Start_Location?.replaceAll("_", " "),
            Start_Time_formatted: moment(vehicle.Start_Time).format(
              "DD-MM-YYYY HH:mm:ss",
            ),
            End_Time_formatted: moment(vehicle.End_Time).format(
              "DD-MM-YYYY HH:mm:ss",
            ),
          })),
        );
      }
    } else {
      if (data && data.list && Array.isArray(data.list)) {
        setFormatedData(
          filterVehiclesBySelectedDate(data.list).map((vehicle) => ({
            ...vehicle,
            End_Location: vehicle.End_Location?.replaceAll("_", " "),
            Start_Location: vehicle.Start_Location?.replaceAll("_", " "),
            Start_Time_formatted: moment(vehicle.Start_Time).format(
              "DD-MM-YYYY HH:mm:ss",
            ),
            End_Time_formatted: moment(vehicle.End_Time).format(
              "DD-MM-YYYY HH:mm:ss",
            ),
          })),
        );
      }
    }
  }, [data]);

  const columns = useMemo(() => {
    const cols: ColumnDef<TableRow>[] = [
      {
        accessorKey: "vehicleNum",
        id: "vehicle_num",
        header: "Vehicle No",
        cell: ({ row }) => {
          return row.original?.vehicleNum?.replaceAll("()", "") ?? "";
        },
        footer: (props) => props.column.id,
        filterFn: (row, id, value) => operatorFilterFn(row, id, value),
      },
      {
        accessorKey: "Start_Time_formatted",
        id: "start_time",
        header: "Start Time",
        footer: (props) => props.column.id,
        filterFn: (row, id, value) => operatorFilterFn(row, id, value),
      },

      ...(Number(userId) !== 833193 &&
      Number(userId) !== 3212 &&
      Number(userId) !== 833129
        ? [
            {
              accessorKey: "Start_Location",
              id: "start_location",
              header: "Start Location",
              cell: ({ row }: { row: any }) => {
                return (
                  <div className="cursor-pointer">
                    <Tooltip
                      title={row.original.Start_Location}
                      mouseEnterDelay={1}
                    >
                      {row.original.Start_Location.slice(0, 40)}
                    </Tooltip>
                  </div>
                );
              },
              footer: (props: any) => props.column.id,
              filterFn: (row: any, id: any, value: any) =>
                operatorFilterFn(row, id, value),
            },
          ]
        : [
            {
              accessorKey: "timeDiff",
              id: "time_difference",
              header: "Time Difference",
              footer: (props: any) => props.column.id,
              filterFn: (row: any, id: any, value: any) =>
                operatorFilterFn(row, id, value),
            },
          ]),
      {
        accessorKey: "End_Time_formatted",
        id: "end_time",
        header: "End Time",

        footer: (props) => props.column.id,
        filterFn: (row, id, value) => operatorFilterFn(row, id, value),
      },
      ...(Number(userId) !== 833193 && Number(userId) !== 3212
        ? [
            {
              accessorKey: "End_Location",
              id: "end_location",
              header: "End Location",
              cell: ({ row }: { row: any }) => {
                return (
                  <div className="cursor-pointer">
                    <Tooltip
                      title={row.original.End_Location}
                      mouseEnterDelay={1}
                    >
                      {row.original.End_Location.slice(0, 40)}
                    </Tooltip>
                  </div>
                );
              },
              footer: (props: any) => props.column.id,
              filterFn: (row: any, id: any, value: any) =>
                operatorFilterFn(row, id, value),
            },
          ]
        : []),
      ...(Number(userId) !== 85380 && Number(userId) !== 3212
        ? [
            {
              accessorKey: "Total_KM",
              id: "total_km",
              header: "Total KM",
              footer: (props: any) => props.column.id,
              cell: ({ row }: { row: Row<TableRow> }) => {
                return <>{row.original.Total_KM.toFixed(2)}</>;
              },
              filterFn: (row: Row<TableRow>, id: string, value: string) =>
                operatorFilterFn(row, id, value),
            },
          ]
        : []),
      {
        accessorKey: "Running_Hours",
        id: "running_hrs",
        header: "Running Hrs",
        footer: (props) => props.column.id,
        filterFn: (row, id, value) => operatorFilterFn(row, id, value),
      },
      {
        accessorKey: "Idle_Hours",
        id: "idle_hrs",
        header: "Idle Hrs",
        footer: (props) => props.column.id,
        filterFn: (row, id, value) => operatorFilterFn(row, id, value),
      },
      ...(Number(userId) !== 85380 && Number(userId) !== 3212
        ? [
            {
              id: "history_replay",
              header: "History Replay",
              cell: ({ row }: { row: Row<TableRow> }) => {
                return (
                  <div
                    className="flex gap-2 items-center justify-center w-full cursor-pointer"
                    onClick={() => {
                      setIsVehicleModalOpen(true);
                      setSelectedData(row.original);
                    }}
                  >
                    <Tooltip title="History Replay" mouseEnterDelay={1}>
                      <HeatMapOutlined />
                    </Tooltip>
                  </div>
                );
              },
              footer: (props: any) => props.column.id,
            },
          ]
        : []),
    ];
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onDownloadBtnClick = (vehicles: FormattedData["list"]) => {
    const rows = vehicles.map((vehicle, index: number) => {
      const obj = {
        ["Vehicle No"]: vehicle.vehicleNum
          ? vehicle.vehicleNum.replaceAll("()", "")
          : "",
        ["Start Time"]: vehicle.Start_Time
          ? moment(vehicle.Start_Time).format("DD-MM-YYYY HH:mm:ss")
          : "",
        ["Start Location"]: vehicle.Start_Location,
        ["End Time"]: vehicle.End_Time
          ? moment(vehicle.End_Time).format("DD-MM-YYYY HH:mm:ss")
          : "",
        ["End Location"]: vehicle.End_Location,
        ["Total KM"]: vehicle.Total_KM,
        ["Running Hrs"]: vehicle.Running_Hours,
        ["Idle Hrs"]: vehicle.Idle_Hours,
      };

      const result: { [key: string]: any } = {};
      columns
        .filter((column) => column.header !== "History Replay")
        .forEach((column) => {
          if (column.header) {
            result[column.header.toString()] =
              obj[column.header.toString() as keyof typeof obj];
          }
        });
      return result;
    });

    const head = Object.keys(rows[0]);

    const body = rows.map((row) => Object.values(row));

    setDownloadReport({
      title: `Consolidated Detail Report`,
      excel: { title: `Consolidated Detail Report`, rows, footer: [] },
      pdf: {
        head: [head],
        body: body,
        title: `Consolidated Detail Report`,
        pageSize: "a3",
      },
    });
  };

  const onSubmit = async () => {
    setIsLocalLoading(true);
    setFormatedData([]);
    if (Number(userId) !== 85380 && Number(userId) !== 83171) {
      await getConsolidateDetail({
        token: groupId,
        userId: userId,
        startDate: date.format("YYYY-MM-DD"),
      }).then(({ data }) => {
        if (data && data.list && Array.isArray(data.list)) {
          setFormatedData(
            filterVehiclesBySelectedDate(data.list).map((vehicle) => ({
              ...vehicle,
              End_Location: vehicle.End_Location?.replaceAll("_", " "),
              Start_Location: vehicle.Start_Location?.replaceAll("_", " "),
              End_Time_formatted: moment(vehicle.End_Time).format(
                "DD-MM-YYYY HH:mm:ss",
              ),
              Start_Time_formatted: moment(vehicle.Start_Time).format(
                "DD-MM-YYYY HH:mm:ss",
              ),
            })),
          );
        }
      });
    } else if (Number(userId) === 83171 && selectedVehicleOption?.value) {
      await getConslidateByDateRangeDataAndVehicleNumber({
        token: groupId,
        userId: userId,
        vehId: selectedVehicleOption?.value || 0,
        startDate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm"),
        endDate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm"),
      }).then(({ data }) => {
        if (data && data.list && Array.isArray(data.list)) {
          setFormatedData(
            filterVehiclesBySelectedDate(data.list).map((vehicle) => ({
              ...vehicle,
              End_Location: vehicle.End_Location?.replaceAll("_", " "),
              Start_Location: vehicle.Start_Location?.replaceAll("_", " "),
              End_Time_formatted: moment(vehicle.End_Time).format(
                "DD-MM-YYYY HH:mm:ss",
              ),
              Start_Time_formatted: moment(vehicle.Start_Time).format(
                "DD-MM-YYYY HH:mm:ss",
              ),
            })),
          );
        }
      });
    } else if (Number(userId) === 85380) {
      await getConsolidateDateByRange({
        token: groupId,
        userId: userId,
        startDate: moment(dateRange[0]).format("YYYY-MM-DD HH:mm"),
        endDate: moment(dateRange[1]).format("YYYY-MM-DD HH:mm"),
      }).then(({ data }) => {
        if (data && data.list && Array.isArray(data.list)) {
          setFormatedData(
            filterVehiclesBySelectedDate(data.list).map((vehicle) => ({
              ...vehicle,
              End_Location: vehicle.End_Location?.replaceAll("_", " "),
              Start_Location: vehicle.Start_Location?.replaceAll("_", " "),
              End_Time_formatted: moment(vehicle.End_Time).format(
                "DD-MM-YYYY HH:mm:ss",
              ),
              Start_Time_formatted: moment(vehicle.Start_Time).format(
                "DD-MM-YYYY HH:mm:ss",
              ),
            })),
          );
        }
      });
    }

    setTimeout(() => {
      setIsLocalLoading(false);
    }, 2000);
  };
  const isPathWithDateDaignosticLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q &&
        q.endpointName === "getpathwithDateDaignostic" &&
        q.status === "pending",
    ),
  );
  const { containerStyle, centerOfMap, zoomNo, isMapNotLoading, isMapActive } =
    useSelector((state: RootState) => state.map);

  useEffect(() => {
    dispatch(
      setContainerStyle({
        ...containerStyle,
        height: "81.2vh",
        width: "calc(100vw - 900px)",
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const polylineRef = useRef<Polyline>(null);

  const anchor = { x: 4.05, y: 4.05, equals: () => false };

  const lineSymbol = {
    path: "M4.21032 0.0488281L8.00463 6.62076H0.416016L4.21032 0.0488281Z",
    strokeOpacity: 1,
    fillColor: "#000",
    fillOpacity: 2,
    scale: 1.5,
    anchor,
  };

  const polylineOptions = {
    strokeColor: "#0390fc",
    strokeOpacity: 2.8,
    strokeWeight: 4,
    fillColor: "#0390fc",
    fillOpacity: 1.35,
    optimized: false,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    radius: 30000,
    icons: [
      {
        icon: lineSymbol,
        fill: "#000",
        repeat: "150px",
      },
    ],
    path: vehicleItnaryWithPath.patharry,
    zIndex: 1,
  };

  const [getPathWithDateDaignostic] = useLazyGetpathwithDateDaignosticQuery();
  const [getVehicleListItinerary] = useLazyGetItineraryvehIdBDateNwStQuery();

  const getPathWithDateDaignosticAndGetVehicleListItinerary = async ({
    selectedVehicleId,
    startDate,
    endDate,
  }: {
    selectedVehicleId: number;
    startDate: string;
    endDate: string;
  }) => {
    getVehicleListItinerary({
      userId: userId,
      vId: selectedVehicleId,
      startDate: startDate,
      endDate: endDate,
      requestFor: 0,
    }).then(({ data: vehicleListDataArgs }) => {
      updateVehicleItnaryWithPath({
        vehicleListDataArgs: vehicleListDataArgs,
        pathwithDateDataArgs: undefined,
        vehicleItnaryWithPath,
        dispatch,
        userId,
        parentUser,
        extra,
      });

      getPathWithDateDaignostic({
        vId: selectedVehicleId,
        startDate: startDate,
        endDate: endDate,
        userId: userId,
      }).then(({ data: pathwithDateDataArgs }) => {
        updateVehicleItnaryWithPath({
          vehicleListDataArgs: vehicleListDataArgs,
          pathwithDateDataArgs: pathwithDateDataArgs,
          vehicleItnaryWithPath,
          dispatch,
          userId,
          parentUser,
          extra,
        });
      });
    });
  };

  useEffect(() => {
    if (map && vehicleItnaryWithPath.patharry.length > 0) {
      let bounds = new window.google.maps.LatLngBounds();

      for (var i = 0; i < vehicleItnaryWithPath.patharry.length; i++) {
        bounds.extend(
          new window.google.maps.LatLng(
            vehicleItnaryWithPath.patharry[i].lat,
            vehicleItnaryWithPath.patharry[i].lng,
          ),
        );
      }
      map.fitBounds(bounds);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedVehicle]);

  return (
    <div>
      <Header
        date={date}
        setDate={setDate}
        onSubmit={onSubmit}
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedVehicleOption={selectedVehicleOption}
        setSelectedVehicleOption={setSelectedVehicleOption}
      />
      {Number(userId) === 85380 || Number(parentUser) === 85380 ? (
        <div className="flex gap-4 px-5">
          <div
            style={{
              minWidth:
                containerStyle.width === "calc(100vw - 900px)"
                  ? "900px"
                  : "0px",
            }}
          >
            <CustomTableN
              columns={columns}
              data={
                (formatedData && formatedData.length > 0 && formatedData) || []
              }
              loading={
                isLocalLoading ||
                isConsolidateDetailLoading ||
                isLoading ||
                isConsolidateDateByRangeLoading ||
                isConslidateDetailByDateRangeLoading
              }
              height="max-h-[75vh]"
              onDownloadBtnClick={onDownloadBtnClick}
              downloadReport={downloadReport}
              setDownloadReport={setDownloadReport}
              fontSize={"12px"}
              densityProp="sm"
              onClick={(row) => {
                if (
                  isConsolidateDetailLoading === false ||
                  isLocalLoading === false ||
                  isConsolidateDateByRangeLoading == false ||
                  isConslidateDetailByDateRangeLoading === false
                ) {
                  dispatch(
                    setSelectedVehicleCustomRange({
                      dateRangeToDisplay: { startDate: "", endDate: "" },
                      dateRangeForDataFetching: { startDate: "", endDate: "" },
                      customRangeSelected: "Today",
                      previousDateRange: { startDate: "", endDate: "" },
                    }),
                  );
                  dispatch(
                    setVehicleItnaryWithPath(vehicleItnaryWithPathInitialState),
                  );
                  dispatch(
                    setLiveVehicleItnaryWithPath(
                      vehicleItnaryWithPathInitialState,
                    ),
                  );

                  dispatch(setOpenStoppageIndex(-1));
                  dispatch(
                    setSelectedVehicleStatus({
                      ...initialSelectedVehicleState,
                      searchType: "",
                      vId: row.veh_id,
                      selectedVehicleHistoryTab:
                        selectedVehicle.selectedVehicleHistoryTab,
                      nearbyVehicles: [],
                    }),
                  );
                  dispatch(setNearbyVehicles(undefined));
                  dispatch(setRadiusInKilometers(0));

                  getPathWithDateDaignosticAndGetVehicleListItinerary({
                    selectedVehicleId: row.veh_id,
                    startDate: moment(row.Start_Time).format(
                      "YYYY-MM-DD HH:mm",
                    ),
                    endDate: moment(row.End_Time).format("YYYY-MM-DD HH:mm"),
                  });
                }
              }}
            />
          </div>

          <div
            className="relative"
            style={{
              width: containerStyle.width,
              minWidth: containerStyle.minWidth,
              paddingInline: "10px",
            }}
          >
            <div
              className="absolute z-10 px-2 py-1 bg-neutral-100 rounded-full text-xl bottom-10 left-2"
              onClick={() => {
                if (containerStyle.width === "calc(100vw - 900px)") {
                  dispatch(
                    setContainerStyle({
                      ...containerStyle,
                      height: "81.2vh",
                      width: "100vw",
                    }),
                  );
                } else {
                  dispatch(
                    setContainerStyle({
                      ...containerStyle,
                      height: "81.2vh",
                      width: "calc(100vw - 900px)",
                    }),
                  );
                }
              }}
            >
              <ArrowsAltOutlined />
            </div>
            {isMapActive === false ? (
              <div
                className={`relative bg-white w-[calc(100vw-900px)] h-[calc(100vh-60px)] flex items-center justify-center`}
              >
                <div className="absolute z-20 right-0 top-0">
                  <Image
                    src="/assets/images/map/indiaMap.png"
                    width="2236"
                    height="1560"
                    alt="India Map"
                    className="object-cover h-screen blur-[2px]"
                  />
                </div>

                <Button
                  onClick={() => {
                    dispatch(setIsMapNotLoading(false));
                    dispatch(setIsMapActive(true));
                  }}
                  className="absolute z-30 right-0 top-0 font-bold"
                >
                  Show Map
                </Button>
              </div>
            ) : (
              <LoadScript
                googleMapsApiKey={getGoogleApiKey() || ""}
                libraries={googleLibraries}
                onLoad={() => {
                  dispatch(setIsMapNotLoading(true));
                }}
              >
                {isPathWithDateDaignosticLoading || !isMapNotLoading ? (
                  <>
                    <div
                      className={`relative bg-white w-[calc(100vw-900px)] h-[calc(100vh-60px)] flex items-center justify-center`}
                    >
                      <div className="absolute z-20 right-0 top-0">
                        <Image
                          src="/assets/images/map/indiaMap.png"
                          width="2236"
                          height="1560"
                          alt="India Map"
                          className="object-cover h-screen blur-[2px]"
                        />
                      </div>

                      <div className="absolute z-30 right-0 top-0">
                        <span className="loader"></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={centerOfMap}
                    zoom={zoomNo}
                    options={{
                      fullscreenControl: true,
                      draggable: true,
                    }}
                    onLoad={(map) => {
                      setMap(map);
                    }}
                  >
                    {formatedData.find(
                      (data) => data.veh_id === selectedVehicle.vId,
                    )?.Total_KM &&
                    (!isPathWithDateDaignosticLoading || isMapNotLoading) ? (
                      <div className="bg-white absolute right-20 top-2 p-2 z-30 rounded-md">
                        Total KM:{" "}
                        {formatedData
                          .find((data) => data.veh_id === selectedVehicle.vId)
                          ?.Total_KM.toFixed(2)}
                      </div>
                    ) : null}

                    {selectedVehicle.vId !== 0 &&
                    vehicleItnaryWithPath &&
                    vehicleItnaryWithPath.patharry &&
                    vehicleItnaryWithPath.patharry.length >= 2 &&
                    historyReplay.isHistoryReplayMode
                      ? vehicleItnaryWithPath.patharry.map((marker, index) => (
                          <Marker
                            key={index}
                            position={{ lat: marker.lat, lng: marker.lng }}
                            icon={{
                              url: "/assets/images/map/vehicles/vehicle-red.png",
                              scale: 1,
                              scaledSize: new window.google.maps.Size(60, 60),
                              anchor: { x: 30, y: 30, equals: () => false },
                            }}
                            onClick={(e) => {
                              if (e.latLng) {
                                setInfoWindowState({
                                  index: index,
                                  lat: e.latLng.lat(),
                                  lng: e.latLng.lng(),
                                  state: true,
                                });
                              }
                            }}
                            opacity={0}
                          >
                            {selectedVehicle.vId !== 0 &&
                            infoWindowState.index === index &&
                            infoWindowState.state ? (
                              <PolylineMouseOverInfoWindow
                                infoWindowState={infoWindowState}
                                marker={marker}
                              />
                            ) : null}
                          </Marker>
                        ))
                      : null}

                    <StartAndEndPointMarker />
                    <Polyline options={polylineOptions} ref={polylineRef} />
                    <AlertMarkers />
                    <StoppageMarkers />
                    <Markers />
                    <HistoryReplayMarker />
                    <HistoryReplaySlider />
                  </GoogleMap>
                )}
              </LoadScript>
            )}
          </div>
        </div>
      ) : (
        <div>
          <ConsolidatedReportModal
            selectedData={selectedData}
            setSelectedData={setSelectedData}
          />
          <CustomTableN
            columns={columns}
            data={
              (formatedData && formatedData.length > 0 && formatedData) || []
            }
            loading={
              isLocalLoading ||
              isConsolidateDetailLoading ||
              isLoading ||
              isConslidateDetailByDateRangeLoading ||
              isConsolidateDateByRangeLoading
            }
            height="max-h-[75vh]"
            onDownloadBtnClick={onDownloadBtnClick}
            downloadReport={downloadReport}
            setDownloadReport={setDownloadReport}
            fontSize={"12px"}
            densityProp="sm"
          />
        </div>
      )}
    </div>
  );
};

const PolylineMouseOverInfoWindow = ({
  infoWindowState,
  marker,
}: {
  infoWindowState: { index: number; lat: number; lng: number };
  marker: PathArrayItem;
}): JSX.Element => {
  return (
    <InfoWindow
      position={{ lat: infoWindowState.lat, lng: infoWindowState.lng }}
      options={{ pixelOffset: new google.maps.Size(0, -30) }}
    >
      <div className="text-xs text-gray-800 flex flex-col gap-1 max-w-80">
        <div className="absolute top-5">
          <p className="font-medium text-lg">Polyline Information</p>
        </div>

        <div className="grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal">
          <div className="col-span-2 font-medium text-neutral-700 ">
            Date Time:
          </div>{" "}
          <div className="col-span-3">{marker.datetime}</div>
          <div className="col-span-2 font-medium text-neutral-700 ">
            Distance:{" "}
          </div>{" "}
          <div className="col-span-3">{marker.distance.toFixed(2)} KM</div>
          <div className="col-span-2 font-medium text-neutral-700 ">
            Location:
          </div>{" "}
          <div className="col-span-3">
            {marker.lat.toFixed(4)} ⎪ {marker.lng.toFixed(4)}
          </div>
          <div className="col-span-2 font-medium text-neutral-700 ">Speed:</div>{" "}
          <div className="col-span-3">{marker.speed} Km/h</div>
        </div>
      </div>
    </InfoWindow>
  );
};
