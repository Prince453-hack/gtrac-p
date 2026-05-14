"use client";

export const revalidate = 0;

import { LegacyRef, ReactNode, useEffect, useState } from "react";
import {
  useGetTripVehiclesQuery,
  useGetVehicleCurrentLocationQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { useInView } from "react-intersection-observer";
import {
  GetListVehiclesMobResponse,
  VehicleData,
} from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { Skeleton, Tooltip } from "antd";
import { RootState } from "@/app/_globalRedux/store";
import { useDispatch, useSelector } from "react-redux";
import { DownloadOutlined } from "@ant-design/icons";
import moment from "moment";
import { exportXlsx } from "@/app/helpers/exportXlsx";
import { TripVehicleOverviewCard } from "./TripVehicleOverviewCard";
import { TripVehicleOverviewCardSkeleton } from "./TripVehicleOverviewCardSkeleton";

import {
  setAllMarkers,
  updateMarkersBasedOnStatus,
} from "@/app/_globalRedux/dashboard/markersSlice";
import { convertToGetListVehiclesMobResponse } from "@/app/helpers/convertToGetListVehiclesMobResponse";

export const TripList = ({
  selectedVehicleStatus,
}: {
  selectedVehicleStatus: string;
}) => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const markers = useSelector((state: RootState) => state.markers);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle
  );
  const { mapYourVehicleIndex, driverInfoIndex, createPOIIndex } = useSelector(
    (state: RootState) => state.vehicleOverviewOptions
  );
  const { type: vehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive
  );
  const isTripVehiclesLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (query) =>
        query &&
        query.endpointName === "getAllVehicles" &&
        query.status === "pending"
    )
  );

  const [currentPage, setCurrentPage] = useState(10);
  const [delayTrip, setDelayTrip] = useState<VehicleData[]>([]);
  const [data, setData] = useState<GetListVehiclesMobResponse>();

  const dispatch = useDispatch();

  const [ref, inView] = useInView({
    threshold: 0,
  });

  const {
    isFetching,
    data: tripData,
    isSuccess,
    isLoading: isTripDataLoading,
  } = useGetTripVehiclesQuery(
    {
      userId,
      token: groupId,
      startDate: moment()
        .subtract(15, "days")
        .startOf("date")
        .format("YYYY-MM-DD HH:mm"),
      endDate: moment().format("YYYY-MM-DD HH:mm"),
      tripStatus: "On Trip",
      tripStatusBatch: selectedVehicleStatus,
    },
    {
      skip:
        !groupId ||
        !userId ||
        selectedDashboardVehicle.length > 0 ||
        mapYourVehicleIndex !== -1 ||
        driverInfoIndex !== -1 ||
        createPOIIndex !== -1 ||
        vehicleListType === "vehicle"
          ? true
          : false,
      pollingInterval: 3000000,
    }
  );

  const {
    data: currentVehicleLocationData,
    isLoading,
    isFetching: isFetchingCurrentVehicleLocation,
  } = useGetVehicleCurrentLocationQuery(
    {
      userId: Number(userId),
      vehId: selectedVehicle.vId,
    },
    {
      skip:
        selectedVehicle?.vehicleTrip?.sys_service_id === 0 ||
        historyReplay?.isHistoryReplayMode,
      pollingInterval: 30000,
    }
  );

  useEffect(() => {
    if (inView) {
      setTimeout(() => setCurrentPage((prev) => prev + 10), 2000);
    }
  }, [inView]);

  useEffect(() => {
    if (tripData && tripData.message !== "Something wrong happend") {
      setData(convertToGetListVehiclesMobResponse(tripData));
    }
  }, [tripData, isTripVehiclesLoading]);

  useEffect(() => {
    if (selectedDashboardVehicle.length > 0 && tripData) {
      const filteredList = tripData.list.filter((vehicle) =>
        selectedDashboardVehicle.some(
          (searchedVehicle) =>
            searchedVehicle.vehicleData.vId === vehicle.sys_service_id
        )
      );

      const newData = convertToGetListVehiclesMobResponse({
        ...tripData,
        list: filteredList,
      });

      if (JSON.stringify(newData) !== JSON.stringify(data)) {
        setData(newData);
      }
    } else if (tripData && JSON.stringify(tripData) !== JSON.stringify(data)) {
      setData(convertToGetListVehiclesMobResponse(tripData));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDashboardVehicle]);

  useEffect(() => {
    if (
      selectedVehicle &&
      selectedVehicle.vehicleTrip &&
      selectedVehicle?.vehicleTrip?.sys_service_id !== 0
    ) {
      if (
        !isLoading &&
        !isFetchingCurrentVehicleLocation &&
        !historyReplay.isHistoryReplayMode
      ) {
        if (
          currentVehicleLocationData?.success === true &&
          data &&
          data.list.length > 1
        ) {
          dispatch(
            setAllMarkers(
              data.list.map((vehicle) =>
                Number(vehicle.vId) ===
                Number(currentVehicleLocationData.list.vehid)
                  ? {
                      ...vehicle,
                      visibility: true,
                      isMarkerInfoWindowOpen: false,
                      gpsDtl: {
                        ...vehicle.gpsDtl,
                        latLngDtl: currentVehicleLocationData.list.latLngDtl,
                      },
                    }
                  : {
                      ...vehicle,
                      visibility: false,
                      isMarkerInfoWindowOpen: false,
                    }
              )
            )
          );
        }
      }
    } else if (
      isTripDataLoading === false &&
      isSuccess &&
      data &&
      data.list.length > 1 &&
      markers.length === 0
    ) {
      dispatch(
        setAllMarkers(
          data.list.map((vehicle) => ({
            ...vehicle,
            visibility: true,
            isMarkerInfoWindowOpen: false,
          }))
        )
      );
    } else if (
      isTripDataLoading === false &&
      isSuccess &&
      data &&
      data.list.length > 1 &&
      markers.length > 0
    ) {
      dispatch(
        updateMarkersBasedOnStatus(
          data.list.map((vehicle) =>
            markers.find((marker) => marker.vId === vehicle.vId)
              ? { ...vehicle, visibility: true, isMarkerInfoWindowOpen: false }
              : { ...vehicle, visibility: false, isMarkerInfoWindowOpen: false }
          )
        )
      );
    } else if (
      isTripDataLoading === false &&
      isSuccess &&
      data &&
      data.list.length === 0 &&
      markers.length > 0
    ) {
      dispatch(
        setAllMarkers(
          markers.map((vehicle) => ({
            ...vehicle,
            visibility: false,
            isMarkerInfoWindowOpen: false,
          }))
        )
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVehicleLocationData, tripData]);

  useEffect(() => {
    if (data && data.list.length && markers.length === 0) {
      dispatch(
        setAllMarkers(
          data.list.map((vehicle) => ({
            ...vehicle,
            visibility: true,
            isMarkerInfoWindowOpen: false,
          }))
        )
      );
    } else if (data && data.list.length && markers.length) {
      dispatch(
        updateMarkersBasedOnStatus(
          data.list.map((vehicle) => ({
            ...vehicle,
            visibility: true,
            isMarkerInfoWindowOpen: false,
          }))
        )
      );
    }
    if (data)
      setDelayTrip(
        data.list.filter((vehicleData) => vehicleData.vehicleTrip.delay)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isFetching && !data) {
    return (
      <WrapperComponent refs={ref} isFetching={isFetching}>
        <TripVehicleOverviewCardSkeleton />
      </WrapperComponent>
    );
  }

  return (
    <WrapperComponent
      refs={ref}
      currentPage={currentPage}
      list={
        (data && selectedVehicleStatus !== "Delay" ? data.list : delayTrip) ||
        []
      }
      isFetching={isFetching}
    >
      {selectedVehicle.searchType !== "GLOBAL" ? (
        data && selectedVehicleStatus !== "Delay" ? (
          data.list.slice(0, currentPage).map((vehicle) => (
            <span key={vehicle.vehicleTrip.sys_service_id}>
              <TripVehicleOverviewCard vehicleData={vehicle} />
            </span>
          ))
        ) : (
          data &&
          data.list
            .filter((vehicleData) => vehicleData.vehicleTrip.delay)
            .slice(0, currentPage)
            .map((vehicle) => (
              <span key={vehicle.vehicleTrip.sys_service_id}>
                <TripVehicleOverviewCard vehicleData={vehicle} />
              </span>
            ))
        )
      ) : (
        <TripVehicleOverviewCard vehicleData={selectedVehicle} />
      )}
    </WrapperComponent>
  );
};

const WrapperComponent = ({
  children,
  refs,
  currentPage,
  list,
  isFetching,
}: {
  children: ReactNode;
  refs: LegacyRef<HTMLDivElement>;
  currentPage?: number;
  list?: VehicleData[] | [];
  isFetching: boolean;
}) => {
  const collapseVehicleStatusToggle = useSelector(
    (state: RootState) => state.collapseTripStatusToggle
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const [updateDate, setUpdateDate] = useState("0");
  useEffect(() => {
    if (isFetching) {
      setUpdateDate(moment().format("HH:mm:ss"));
    }
  }, [isFetching]);
  return (
    <div className="bg-white relative">
      <div className="flex items-center justify-between mb-3 absolute -top-7 left-[15px]  w-[calc(100%-38px)]">
        <p className=" text-gray-600 font-semibold pl-2 text-[13px]">
          Vehicles Count: {list && list.length}
        </p>

        <div className="flex items-center pr-2">
          <div className="text-[13px] text-gray-600 font-semibold flex">
            <div>Updated At: </div>
            {isFetching || updateDate === "0" ? (
              <div className="w-[65px] pl-[5px]">
                <div className="lds-ring ml-[2.5px]">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ) : (
              <div className="w-[65px] text-nowrap ml-[3px]"> {updateDate}</div>
            )}
          </div>
          <div
            className={`bg-gray-600 h-[22px] w-[22px] flex justify-center items-center rounded-full  ${
              isFetching || updateDate === "0"
                ? "cursor-progress"
                : "cursor-pointer"
            }`}
          >
            <Tooltip
              title={`Download Selected Vehicle Report`}
              mouseEnterDelay={1}
            >
              <DownloadOutlined
                style={{ color: "#F2F5F3" }}
                disabled={isFetching || updateDate === "0"}
                onClick={() => {
                  if (list && list.length > 0) {
                    const rows = list.map((item, index) => ({
                      "Vehicle No.": item.vehReg,
                      "Serial No.": index + 1,
                      Lat: item.gpsDtl.latLngDtl.lat,
                      Long: item.gpsDtl.latLngDtl.lng,
                      Address: item.gpsDtl.latLngDtl.addr?.replaceAll("_", " "),
                      Time: item.gpsDtl.latLngDtl.gpstime,
                      Speed: item.gpsDtl.speed,
                      "Idle Time":
                        item.gpsDtl.modeTime === "01 Jan 1970 05:30:00"
                          ? ""
                          : item.gpsDtl.modeTime,
                      Mode: item.gpsDtl.mode,
                    }));
                    exportXlsx(rows, "Vehicle Report", "Vehicle Report.xlsx");
                  }
                }}
              />
            </Tooltip>
          </div>
        </div>
      </div>
      <div
        className={`h-[calc(100vh-185px)] bg-white top-0 p-4 pt-0 scrollbar-thumb-thumb-green scrollbar-w-2  scrollbar-thumb-rounded-md scrollbar overflow-visible ${
          collapseVehicleStatusToggle ? "opacity-0" : "overflow-y-scroll"
        } mt-7`}
      >
        {children}
        {currentPage && list && selectedVehicle.searchType !== "GLOBAL" ? (
          <div className=" w-full px-4 my-4" ref={refs}>
            {currentPage < list.length ? (
              <Skeleton className="pt-5" active />
            ) : (
              ""
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
