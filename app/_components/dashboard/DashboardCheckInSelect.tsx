"use client";

import { RootState } from "@/app/_globalRedux/store";
import { Button, ConfigProvider, DropdownProps, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsLoadingScreenActive,
  setOpenStoppageIndex,
} from "@/app/_globalRedux/dashboard/mapSlice";
import {
  SelectedDashboardVehicleState,
  setDashboardSelectedVehicleStatus,
} from "@/app/_globalRedux/dashboard/dashboardVehicleDetailsSelect";
import React, { useEffect, useState } from "react";

import {
  trackingDashboard,
  useLazyGetTripVehiclesQuery,
  useLazyGetVehicleCurrentLocationQuery,
  useLazyGetVehiclesByStatusQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { removeSelectedVehicle } from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { setIsGetNearbyVehiclesActive } from "@/app/_globalRedux/dashboard/nearbyVehicleSlice";
import { resetLiveVehicleItnaryWithPath } from "@/app/_globalRedux/dashboard/liveVehicleSlice";
import updateMultiVehicleMovement from "@/app/helpers/updateMultiVehicleMovement";
import {
  setClusterActive,
  setClusterDiactive,
} from "@/app/_globalRedux/common/clusterSlice";
import { setIsDashboardVehicleDetailsSearchTriggeredActive } from "@/app/_globalRedux/dashboard/isDashboardVehicleDetailsSearchTriggered";
import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import moment from "moment";
import { getNormalOrControllerId } from "./utils/getNormalOrControllerId";

type SelectedStyles = {
  selectorBg: string;
  colorBorder: string;
  fontSize: number;
  optionFontSize: number;
  optionPadding: string;
  optionSelectedColor: string;
};

export const DashboardCheckInSelect = ({
  selectedStyles,
}: {
  selectedStyles: SelectedStyles;
}) => {
  const dispatch = useDispatch();

  const markers = useSelector((state: RootState) => state.markers);
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const { groupId, userId, extra, parentUser } = useSelector(
    (state: RootState) => state.auth
  );
  const auth = useSelector((state: RootState) => state.auth);

  const { accessLabel } = useSelector((state: RootState) => state.auth);

  const selectedVehicleListTab = useSelector(
    (state: RootState) => state.selectedVehicleListTab
  );
  const { type: VehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive
  );
  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive
  );
  const allVehicles = useSelector((state: RootState) => state.allVehicles);

  const [
    selectedDashboardVehicleLocalState,
    setDashboardSelectedVehicleLocalState,
  ] = useState<SelectedDashboardVehicleState[]>([...selectedDashboardVehicle]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advanceFilterValues, setAdvanceFilterValues] = useState<{
    running_hr_val: string;
    running_hr_val2: string;
    ideal_hr_val: string;
    ideal_hr_val2: string;
    km_val: string;
    km_val2: string;
    search_data: "overspeed" | "runninghour" | "idealhour" | "km" | "";
    over_speed_val: string;
  }>({
    running_hr_val: "",
    running_hr_val2: "",
    ideal_hr_val: "",
    ideal_hr_val2: "",
    km_val: "",
    km_val2: "",
    search_data: "",
    over_speed_val: "",
  });
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);

  const filterOption = (
    input: string,
    option?: { label: string; value: number }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const [customSelectOptions, setCustomSelectOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const tripData = trackingDashboard.endpoints.getTripVehicles.useQueryState({
    token: groupId,
    userId: userId,
    startDate: moment()
      .subtract(15, "days")
      .startOf("date")
      .format("YYYY-MM-DD HH:mm"),
    endDate: moment().format("YYYY-MM-DD HH:mm"),
    tripStatus: "On Trip",
    tripStatusBatch: "On Trip",
  });

  const toggleCluster = (str: string) => {
    if (str === "clear") {
      dispatch(setClusterActive());
    } else {
      dispatch(setClusterDiactive());
    }
  };
  let count = 0;
  const searchSelectedVehicles = () => {
    dispatch(setIsLoadingScreenActive(true));
    dispatch(setIsDashboardVehicleDetailsSearchTriggeredActive());

    toggleCluster("");
    count += 1;

    dispatch(
      setAllMarkers(
        markers.map((marker) =>
          selectedDashboardVehicleLocalState.some(
            (vehicle) => vehicle.vehicleData.vId === marker.vId
          )
            ? {
                ...marker,
                visibility: true,
              }
            : {
                ...marker,
                visibility: false,
              }
        )
      )
    );

    dispatch(setOpenStoppageIndex(-1));
    dispatch(
      setDashboardSelectedVehicleStatus(selectedDashboardVehicleLocalState)
    );

    // remove selected vehicle and close vehicle details
    dispatch(resetLiveVehicleItnaryWithPath());
    dispatch(resetLiveVehicleItnaryWithPath());

    dispatch(removeSelectedVehicle());
    dispatch(setIsGetNearbyVehiclesActive(false));

    setTimeout(() => dispatch(setIsLoadingScreenActive(false)), 1);
  };

  const handleOpenChange: DropdownProps["onOpenChange"] = (nextOpen, info) => {
    if (info.source === "trigger" || nextOpen) {
      setIsFilterOpen(nextOpen);
    }
  };

  const [getVehicleCurrentLocation] = useLazyGetVehicleCurrentLocationQuery();
  const [triggerRefetchOfVehicleListBasedOnTabSelected] =
    useLazyGetVehiclesByStatusQuery();
  const [triggerRefetchOfTripVehicleListBasedOnTabSelected] =
    useLazyGetTripVehiclesQuery();

  useEffect(() => {
    if (
      selectedDashboardVehicleLocalState.length === 0 &&
      selectedDashboardVehicle.length > 0
    ) {
      dispatch(setDashboardSelectedVehicleStatus([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDashboardVehicleLocalState]);

  useEffect(() => {
    if (
      selectedDashboardVehicle.length > 0 &&
      selectedVehicle.vId === 0 &&
      createTripOrPlanningTripActive === "" &&
      accessLabel !== 6
    ) {
      const intervalId = setInterval(() => {
        setCurrentVehicleIndex((prevCount) => prevCount + 1);
      }, 5000);
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDashboardVehicle.length]);

  useEffect(() => {
    if (allVehicles.length > 0 && allVehicles[0].id !== 0) {
      if (VehicleListType === "vehicle") {
        setCustomSelectOptions(
          allVehicles.map((vehicle: GetAllVehiclesListResponse["list"][0]) => ({
            label: vehicle.veh_reg,
            value: vehicle.id,
          }))
        );
      } else if (
        tripData.currentData &&
        tripData.currentData.list.length > 0 &&
        customSelectOptions.length !== tripData.currentData.list.length
      ) {
        setCustomSelectOptions(
          allVehicles
            .filter((vehicle) =>
              tripData?.currentData?.list.find(
                (trip) => trip.sys_service_id === vehicle.id
              )
                ? true
                : false
            )
            .map((vehicle) => ({ label: vehicle.veh_reg, value: vehicle.id }))
        );
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVehicles, VehicleListType, tripData.currentData]);

  useEffect(() => {
    if (
      currentVehicleIndex != 0 &&
      selectedVehicle.vId === 0 &&
      accessLabel !== 6
    ) {
      const index = currentVehicleIndex - 1;

      getVehicleCurrentLocation({
        userId: Number(auth.userId),
        vehId:
          accessLabel === 6
            ? getNormalOrControllerId(
                selectedDashboardVehicle[index].vehicleData
              )
            : selectedDashboardVehicle[index].vehicleData.vId,
      }).then(({ data: currentVehicleLocationData }) => {
        if (!currentVehicleLocationData) return;

        updateMultiVehicleMovement({
          dispatch,
          currentVehicleLocationData,
          markers,
        });
      });
    }
    if (currentVehicleIndex >= selectedDashboardVehicle.length) {
      setCurrentVehicleIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVehicleIndex]);

  const triggerRefetch = () => {
    if (
      VehicleListType === "trip" ||
      VehicleListType === "vehicle-allocation-trip"
    ) {
      triggerRefetchOfTripVehicleListBasedOnTabSelected({
        userId,
        token: groupId,
        startDate: moment()
          .subtract(15, "days")
          .startOf("day")
          .format("YYYY-MM-DD HH:mm"),
        endDate: moment().format("YYYY-MM-DD HH:mm"),
        tripStatus: "On Trip",
        tripStatusBatch: selectedVehicleListTab,
      }).then(() =>
        setTimeout(() => dispatch(setIsLoadingScreenActive(false), 1))
      );
    } else {
      triggerRefetchOfVehicleListBasedOnTabSelected({
        userId,
        token: groupId,
        pUserId: parentUser,
        mode:
          selectedVehicleListTab.toUpperCase() === "ALL"
            ? ""
            : selectedVehicleListTab.toUpperCase(),
      }).then(() =>
        setTimeout(() => dispatch(setIsLoadingScreenActive(false), 1))
      );
    }
  };
  return (
    <ConfigProvider
      theme={{
        components: {
          Button: { borderRadius: 0 },
          Select: {
            ...selectedStyles,
            paddingContentVertical: 0,
            borderRadius: 0,
          },
          Dropdown: {
            paddingBlock: 10,
          },
        },
        token: {
          colorTextPlaceholder: "#aaa",
        },
      }}
    >
      <div className="relative flex items-center  right-10">
        <div className="border border-[#468B8]">
          <Select
            value={
              selectedDashboardVehicleLocalState.length > 0
                ? selectedDashboardVehicleLocalState.map(
                    (marker) => marker.vehicleData.vId
                  )
                : []
            }
            className="w-[400px]"
            placeholder="Search Users"
            onSelect={(e) => {
              const vehicleSelectedByFilter = markers
                .filter((marker) => marker.vId === e)
                .map((marker) => ({
                  vehicleData: marker,
                  nearbyVehicles: undefined,
                }));

              if (vehicleSelectedByFilter.length > 0) {
                setDashboardSelectedVehicleLocalState((prev) => [
                  ...prev,
                  ...vehicleSelectedByFilter,
                ]);
              }
            }}
            onDeselect={(value) => {
              const vehicleSelectedByFilter = selectedDashboardVehicle.filter(
                (marker) => marker.vehicleData.vId === value
              );

              if (vehicleSelectedByFilter) {
                setDashboardSelectedVehicleLocalState((prev) =>
                  prev.filter((vehicle) => vehicle.vehicleData.vId !== value)
                );
              }
              if (selectedDashboardVehicleLocalState.length === 1) {
                dispatch(setIsLoadingScreenActive(true));
                setDashboardSelectedVehicleLocalState([]);
                toggleCluster("clear");

                triggerRefetch();
              }
            }}
            onClear={() => {
              dispatch(setIsLoadingScreenActive(true));
              setDashboardSelectedVehicleLocalState([]);
              toggleCluster("clear");

              triggerRefetch();
            }}
            maxTagCount="responsive"
            maxCount={55}
            allowClear={true}
            mode="multiple"
            options={customSelectOptions}
            disabled={isLoading}
            showSearch
            filterOption={filterOption}
            notFoundContent={"No Vehicles Found"}
            suffixIcon
          ></Select>
        </div>
        <div className="rounded-r-md overflow-hidden">
          <Button type="primary" onClick={searchSelectedVehicles}>
            Search
          </Button>
        </div>
      </div>
    </ConfigProvider>
  );
};
