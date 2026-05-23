"use client";

import React, { useState } from "react";
import { Tabs } from "antd";
import { Trips, PlannedTrips, TripHeader } from "./index";
import ListAndTableViewToggle from "./listAndTableViewToggle";
import { RootState } from "@/app/_globalRedux/store";
import { useSelector } from "react-redux";
import { TripHeader2 } from "./tripHeader2";
import moment from "moment";
import {
  useGetGatewayTripHistoryQuery,
  useGetTripVehiclesQuery,
  useGetVehiclesByStatusQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { Trips2History } from "./trips2-histroy";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { GatewayRailCurrentTrip } from "@/app/_globalRedux/services/types/gatewayRailCurrentTripsResponse";
import { isSinghTransportAccount } from "@/app/helpers/isSinghTransport";

export const ViewContext = React.createContext<"LIST" | "TABLE">("TABLE");

export const TripReportAndPlanningToggle = () => {
  const { userId, parentUser, groupId } = useSelector(
    (state: RootState) => state.auth
  );

  const [customDateRange, setCustomDateRange] = useState<Date[]>([
    moment().subtract(5, "days").startOf("date").toDate(),
    new Date(),
  ]);

  const {
    isLoading: isTripLoading,
    data: tripHistory,
    refetch,
  } = useGetTripVehiclesQuery(
    {
      userId,
      token: groupId,
      startDate: moment(customDateRange[0]).format("YYYY-MM-DD HH:mm"),
      endDate: moment(customDateRange[1]).format("YYYY-MM-DD HH:mm"),
      tripStatus: "On Trip",
      tripStatusBatch: "On Trip",
    },
    {
      skip: !groupId || !userId || Number(userId) === 5275,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
    }
  );

  const {
    isLoading: isGatewayTripsLoading,
    data: gatewayTripsData,
    refetch: refetchGatewayTripData,
  } = useGetGatewayTripHistoryQuery(
    {
      startDate: moment(customDateRange[0]).format("YYYY-MM-DD"),
      endDate: moment(customDateRange[1]).format("YYYY-MM-DD"),
    },
    {
      skip: Number(userId) !== 5275,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
    }
  );

  const { isLoading: isVehicleLoading, data: vehicleData } =
    useGetVehiclesByStatusQuery(
      {
        userId,
        token: groupId,
        pUserId: parentUser,
        mode: "",
      },
      {
        skip: Number(userId) !== 5275,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
      }
    );

  const vehicleLocationMap = vehicleData?.list?.reduce((map, vehicle) => {
    map[vehicle.vehReg] = vehicle;
    return map;
  }, {} as Record<string, VehicleData>);

  const enhancedTrips = gatewayTripsData?.list?.map((trip) => ({
    ...trip,
    currentLocation: vehicleLocationMap?.[trip.vehicle_no],
  }));

  const [activeView, setActiveView] = React.useState<"LIST" | "TABLE">("TABLE");
  return (
    <ViewContext.Provider value={activeView}>
      <div className="pb-4 relative">
        <div className="flex gap-4 items-start">
          {isSinghTransportAccount(userId) ||
          Number(userId) === 5275 ||
          Number(userId) === 80933 ||
          Number(userId) === 6347 ||
          Number(userId) === 3183 ? (
            <TripHeader2
              setCustomDateRange={setCustomDateRange}
              refetch={
                Number(userId) === 5275 ? refetchGatewayTripData : refetch
              }
              isLoading={
                Number(userId) === 5275 ? isGatewayTripsLoading : isTripLoading
              }
            />
          ) : (
            <TripHeader />
          )}
          <ListAndTableViewToggle setActiveView={setActiveView} />
        </div>

        {Number(userId) === 5275 ? (
          <Trips2History
            isTripsLoading={isGatewayTripsLoading || isVehicleLoading}
            tripsHistory={
              enhancedTrips as
                | (GatewayRailCurrentTrip & {
                    currentLocation: VehicleData | undefined;
                  })[]
                | undefined
            }
          />
        ) : (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                label: "Trips",
                key: "trips",
                children: (
                  <Trips
                    tripHistory={tripHistory}
                    isTripLoading={isTripLoading}
                    refetch={refetch}
                  />
                ),
              },
              {
                label: "Planned Trips",
                key: "planned trips",
                children: <PlannedTrips />,
              },
            ]}
          />
        )}
      </div>
    </ViewContext.Provider>
  );
};
