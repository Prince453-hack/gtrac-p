"use client";

import {
  useLazyConvertLatLngToAddressQuery,
  useLazyGetRawFuelWithDateQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { updateAlertParametersFromString2 } from "@/app/helpers/extraVehKmToData";
import { PushpinFilled } from "@ant-design/icons";
import { Progress, Spin, Tabs, TabsProps, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import TableN from "../alerts-dashboard/table";
import { FuelAndAdBlueTableInDetails } from "./fuelAdblue/FuelAndAdBlueTableInDetails";
import { computeMetrics, Point } from "./fuelAdblue/FuelAndAdblueTabs";
import { getGPSOrElock } from "./utils/getNormalOrControllerId";

const columns = (opts: {
  type: "fuel" | "adblue";
  event: "filled" | "theft";
}): ColumnsType<any> => [
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

  opts.event === "filled"
    ? {
        title: opts.type === "fuel" ? "Fuel Filled" : "AdBlue Filled",
        dataIndex: "amountFilled",
        render: (val: number | null) => (val != null ? val.toFixed(2) : "–"),
      }
    : {
        title: opts.type === "fuel" ? "Fuel Stolen" : "AdBlue Stolen",
        dataIndex: "amountStolen",
        render: (val: number | null) => (val != null ? val.toFixed(2) : "–"),
      },
  {
    title: "Location",
    dataIndex: "location",
    render: (val: string) => (
      <Tooltip title={val} className="w-full flex items-center justify-center">
        <PushpinFilled className="cursor-pointer" />
      </Tooltip>
    ),
  },
];

const CustomProgressbarFuelAndAblue = ({
  type,
  events,
  isLoading,
}: {
  type: "fuel" | "adblue";
  events: Point[];
  isLoading: boolean;
}) => {
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const { accessLabel } = useSelector((state: RootState) => state.auth);

  const filledPercentage =
    (type === "fuel"
      ? selectedVehicle.gpsDtl.fuel
      : selectedVehicle.gpsDtl.adblue) ?? 0;
  const capacity =
    (type === "fuel"
      ? selectedVehicle.vehicleFuelCapacity
      : selectedVehicle.vehicleAdblueCapacity) ?? 0;
  const actual = capacity * (filledPercentage / 100);

  return (
    <div className="max-h-[calc(100vh-480px)] overflow-y-auto">
      <div className="px-1">
        <p className="font-semibold text-base text-neutral-600">
          {type === "fuel" ? "Fuel" : "Adblue"}
        </p>
        <Progress
          percent={filledPercentage}
          status="active"
          strokeColor={{ from: "#108ee9", to: "#87d068" }}
          size={{ height: 8 }}
          showInfo={false}
        />
        <div className="flex gap-2 items-center mt-1 text-neutral-600">
          <p>{filledPercentage?.toFixed()}%</p>·<p>{actual?.toFixed()}L</p>·
          <p>{capacity?.toFixed()}L Capacity</p>·
          <p>
            {accessLabel === 6
              ? getGPSOrElock(selectedVehicle) === "GPS"
                ? selectedVehicle?.GPSInfo?.gpstime
                : selectedVehicle?.ELOCKInfo?.gpstime
              : selectedVehicle?.gpsDtl?.latLngDtl?.gpstime}
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Spin tip="Loading events..." />
        </div>
      ) : (
        <>
          <FuelAndAdBlueTableInDetails
            type={type}
            data={events.filter((row) => row.event === "filled")}
            title={`${type === "fuel" ? "Fuel" : "Adblue"} Filled Log`}
            columns={columns({ type, event: "filled" })}
            event="filled"
          />
          <FuelAndAdBlueTableInDetails
            type={type}
            data={events.filter((row) => row.event === "theft")}
            title={`${type === "fuel" ? "Fuel" : "Adblue"} Theft Log`}
            columns={columns({ type, event: "theft" })}
            event="theft"
          />
        </>
      )}
    </div>
  );
};

const ParameterTable = () => {
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const tableParametersHeader = ["Type", "Value"];

  const [alertParameterData, setAlertParameters] = useState([
    { type: "Add blue (DEF) Level", value: "" },
    { type: "Engine Fuel rate", value: "" },
    { type: "Engine Total Fuel Used", value: "" },
    { type: "Engine Total Idle Fuel Used", value: "" },
    { type: "Engine Total Idle Hrs", value: "" },
    { type: "Engine Total Hrs of Operation", value: "" },
    { type: "Engine Oil Pressure", value: "" },
    { type: "Engine Oil Temperature", value: "" },
    { type: "Engine Coolant Temperature", value: "" },
    { type: "Engine Intake Manifold 1 Temperature", value: "" },
    { type: "Engine Intake Manifold 1 Pressure", value: "" },
    { type: "Accelerator Padel Position", value: "" },
    { type: "Total Vehicle Distance", value: "" },
  ]);

  useEffect(() => {
    if (selectedVehicle) {
      updateAlertParametersFromString2(
        selectedVehicle.gpsDtl.extraVhlparameter,
        setAlertParameters
      );
    }
  }, [selectedVehicle]);

  return (
    <div className="max-h-[350px] overflow-y-auto">
      <TableN
        tableHead={tableParametersHeader}
        tableData={alertParameterData}
        isStripped={false}
        type="para"
      />
    </div>
  );
};

const handleTabClick = (activeKey: string) => {
  // Handle tab change if needed
};

function VehicleHealthTabs() {
  const { userId } = useSelector((state: RootState) => state.auth);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const customRange = useSelector((state: RootState) => state.customRange);
  const [convertToLocation] = useLazyConvertLatLngToAddressQuery();
  const [getRawFuelData] = useLazyGetRawFuelWithDateQuery();
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath
  );
  const isVehicleItnaryWithPathLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getpathwithDateDaignostic" &&
        query.status === "pending"
    )
  );

  const isRawFuelDataLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getRawFuelWithDate" &&
        query.status === "pending"
    )
  );

  const [fuelData, setFuelData] = useState<Point[]>([]);
  const [adblueData, setAdblueData] = useState<Point[]>([]);
  const [fuelEvents, setFuelEvents] = useState<Point[]>([]);
  const [adblueEvents, setAdblueEvents] = useState<Point[]>([]);
  const [isFuelProcessing, setIsFuelProcessing] = useState(false);
  const [isAdblueProcessing, setIsAdblueProcessing] = useState(false);
  const [rawFuelData, setRawFuelData] = useState<any>(null);

  const fuelThreshold = Number(userId) === 833193 ? 10 : 50;
  const adblueThrreshold = 5;

  // Use the same logic as the chart for fuel events
  const chartFuelEvents = useMemo(() => {
    if (Number(userId) === 833193) {
      return fuelData.length > 0 ? computeMetrics(fuelData, "fuel", 50) : [];
    }
    // For other users: same logic as chart
    if (fuelData.length === 0) return [];
    const threshold = 50;
    const result: any[] = [];
    let baseline = Number(fuelData[0]?.fuel ?? 0);

    for (let i = 0; i < fuelData.length; i++) {
      const curr = fuelData[i];
      const currFuel = Number(curr.fuel ?? 0);

      if (currFuel < baseline) {
        baseline = currFuel;
      }

      const cumulativeRise = currFuel - baseline;
      const isFilled = cumulativeRise >= threshold;

      result.push({
        ...curr,
        event: isFilled ? "filled" : null,
        amountFilled: isFilled ? cumulativeRise : null,
        amountStolen: null,
        distanceSinceLastFill: null,
      });

      if (isFilled) {
        baseline = currFuel;
      }
    }
    return result;
  }, [fuelData, userId]);

  useEffect(() => {
    setFuelEvents([]);
    setAdblueEvents([]);
  }, [
    selectedVehicle.vId,
    customRange.dateRangeForDataFetching.startDate,
    customRange.dateRangeForDataFetching.endDate,
  ]);

  useEffect(() => {
    if (selectedVehicle.vId && userId) {
      let startDate: string;
      let endDate: string;

      if (
        customRange.dateRangeForDataFetching.startDate &&
        customRange.dateRangeForDataFetching.endDate
      ) {
        startDate = moment(
          customRange.dateRangeForDataFetching.startDate
        ).format("YYYY-MM-DD HH:mm");
        endDate = moment(customRange.dateRangeForDataFetching.endDate).format(
          "YYYY-MM-DD HH:mm"
        );
      } else {
        startDate = moment().startOf("day").format("YYYY-MM-DD HH:mm");
        endDate = moment().endOf("day").format("YYYY-MM-DD HH:mm");
      }

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 20000)
      );

      Promise.race([
        getRawFuelData({
          userId: Number(userId),
          vehId: selectedVehicle.vId,
          startDate: startDate,
          endDate: endDate,
          interval: "30",
        }),
        timeout,
      ])
        .then((result: any) => {
          if (result && result.data) {
            setRawFuelData(result.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching raw fuel data:", error);
          setRawFuelData(null);
        });
    }
  }, [
    selectedVehicle.vId,
    customRange.dateRangeForDataFetching.startDate,
    customRange.dateRangeForDataFetching.endDate,
    userId,
    getRawFuelData,
  ]);

  useEffect(() => {
    if (!rawFuelData?.rawdata || rawFuelData.rawdata.length === 0) {
      setFuelData([]);
      setAdblueData([]);
      return;
    }

    // Use the same mapping logic as the chart - no filtering by fuel > 0 or time
    const mapped: Point[] = rawFuelData.rawdata
      ?.filter((pt: any) => pt.tel_fuel !== undefined && pt.tel_fuel !== null)
      ?.map((item: any) => ({
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
      ?.sort(
        (a: Point, b: Point) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
      );

    // Use all mapped data for fuel (same as chart), but filter adblue >= 1 and <= 50
    setFuelData(mapped);
    setAdblueData(mapped?.filter((pt) => pt.adblue <= 50 && pt.adblue >= 1));
  }, [rawFuelData]);

  useEffect(() => {
    const processAdblueEvents = async () => {
      if (adblueData.length === 0) {
        setAdblueEvents([]);
        return;
      }

      setIsAdblueProcessing(true);
      try {
        const enriched = computeMetrics(
          adblueData,
          "adblue",
          adblueThrreshold
        ).filter((pt) => pt.event !== null);

        const resolved = await Promise.all(
          enriched.map(async (pt) => {
            try {
              if (pt.gps_latitude != null && pt.gps_longitude != null) {
                const timeout = new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Location API timeout")),
                    20000
                  )
                );

                const locationPromise = convertToLocation({
                  userId: Number(userId),
                  latitude: pt.gps_latitude,
                  longitude: pt.gps_longitude,
                });

                const result = (await Promise.race([
                  locationPromise,
                  timeout,
                ])) as any;

                const addressData = result?.data;

                return {
                  ...pt,
                  location:
                    addressData?.loc.replaceAll("_", " ") ?? "Unknown Location",
                } as Point;
              }
            } catch {}
            return { ...pt, location: "Unknown Location" } as Point;
          })
        );
        setAdblueEvents(resolved);
      } finally {
        setIsAdblueProcessing(false);
      }
    };

    const processFuelEvents = async () => {
      if (chartFuelEvents.length === 0) {
        setFuelEvents([]);
        return;
      }

      setIsFuelProcessing(true);
      try {
        const enriched = chartFuelEvents.filter((pt: any) => pt.event !== null);

        const resolved = await Promise.all(
          enriched.map(async (pt: any) => {
            try {
              if (pt.gps_latitude != null && pt.gps_longitude != null) {
                const timeout = new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Location API timeout")),
                    20000
                  )
                );

                const locationPromise = convertToLocation({
                  userId: Number(userId),
                  latitude: pt.gps_latitude,
                  longitude: pt.gps_longitude,
                });
                const result = (await Promise.race([
                  locationPromise,
                  timeout,
                ])) as any;

                const addressData = result?.data;

                return {
                  ...pt,
                  location:
                    addressData?.loc.replaceAll("_", " ") ?? "Unknown Location",
                } as Point;
              }
            } catch {}
            return { ...pt, location: "Unknown Location" } as Point;
          })
        );
        setFuelEvents(resolved);
      } finally {
        setIsFuelProcessing(false);
      }
    };

    processFuelEvents();
    processAdblueEvents();
  }, [chartFuelEvents, adblueData, convertToLocation, userId]);

  const items: TabsProps["items"] = [
    {
      key: "fuel",
      label: "Fuel",
      children: (
        <CustomProgressbarFuelAndAblue
          type="fuel"
          events={fuelEvents}
          isLoading={
            isVehicleItnaryWithPathLoading ||
            isFuelProcessing ||
            isRawFuelDataLoading
          }
        />
      ),
    },
    {
      key: "adblue",
      label: "Adblue",
      children: (
        <CustomProgressbarFuelAndAblue
          type="adblue"
          events={adblueEvents}
          isLoading={isVehicleItnaryWithPathLoading || isAdblueProcessing}
        />
      ),
    },
    {
      key: "parameters",
      label: "Parameters",
      children: <ParameterTable />,
    },
  ];

  return (
    <Tabs
      items={items}
      onChange={(activeKey: any) => handleTabClick(activeKey)}
    />
  );
}

export default VehicleHealthTabs;
