"use client";

import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { Card } from "antd";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";

import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import { setOpenStoppageIndex } from "@/app/_globalRedux/dashboard/mapSlice";
import { setRadiusInKilometers } from "@/app/_globalRedux/dashboard/nearbyVehicleSlice";
import { setSelectedVehicleCustomRange } from "@/app/_globalRedux/dashboard/selectedVehicleCustomRangeSlice";
import {
  initialSelectedVehicleState,
  setNearbyVehicles,
  setSelectedVehicleBySelectElement,
  setSelectedVehicleStatus,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { useLazyGetSearchVhlDataQuery } from "@/app/_globalRedux/services/getSearchData/index";
import { calculateTravelTimeFromDistance } from "@/app/helpers/calculateTravelTime";
import checkIfIgnitionOnOrOff from "@/app/helpers/checkIfIgnitionOnOrOff";
import { ETAIcon, LocationIcon, TruckTrip } from "@/public/assets/svgs/nav";
import { LeftCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import { MouseEvent, useEffect, useMemo, useState } from "react";

export const TripVehicleOverviewCard = ({
  vehicleData,
}: {
  vehicleData: VehicleData;
}) => {
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const auth = useSelector((state: RootState) => state.auth);

  const dispatch = useDispatch();

  const [overviewSliderStyle, setOverviewSliderStyle] = useState(0);

  // Search API hook to get live location
  const [getSearchVhlData, { data: searchData, isLoading: isSearchLoading }] =
    useLazyGetSearchVhlDataQuery();

  useEffect(() => {
    if (vehicleData?.vehicleTrip?.lorry_no && auth.groupId && auth.userId) {
      getSearchVhlData({
        token: auth.groupId,
        vehreg: vehicleData.vId.toString(),
        userid: auth.userId.toString(),
      });
    }
  }, [
    vehicleData?.vehicleTrip?.lorry_no,
    auth.groupId,
    auth.userId,
    getSearchVhlData,
  ]);

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

  const activeItemsCount = useMemo(() => {
    let count = 3;

    if (auth.isAc) count++;
    if (auth.isTemp) count++;
    if (auth.isEveVehicle) count++;
    if (auth.isMarketVehicle || auth.isPadlock || auth.isEveVehicle) count++;
    if (auth.isOdometer || auth.isEveVehicle) count++;

    return count;
  }, [auth]);

  const maxSliderValue = useMemo(
    () => activeItemsCount * 80,
    [activeItemsCount]
  );

  const containerWidth = 260;

  const estimatedTravelTime = useMemo(() => {
    const tripDistanceKm =
      parseFloat(vehicleData.vehicleTrip.totaltripkmbygoogle) || 0;
    const averageSpeed = 40;
    return calculateTravelTimeFromDistance(tripDistanceKm, averageSpeed);
  }, [vehicleData.vehicleTrip.totaltripkmbygoogle]);

  const handleRightClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOverviewSliderStyle((prev) => {
      const remainingScrollSpace = maxSliderValue + prev - containerWidth;

      if (remainingScrollSpace > 0) {
        return prev - 100;
      } else {
        return prev;
      }
    });
  };

  const handleLeftClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOverviewSliderStyle((prev) => {
      if (overviewSliderStyle === 0) {
        return prev;
      } else {
        return prev + 100;
      }
    });
  };

  return (
    <div className="relative select-none">
      <div className="mb-2">
        <Card
          className={`text-wrap overflow-clip shadow-xl shadow-s-dark text-sm rounded-3xl cursor-pointer`}
          styles={{
            body: {
              borderRadius: ".5rem",
              border:
                selectedVehicle.vId === vehicleData.vehicleTrip.sys_service_id
                  ? "1.5px solid #478C83"
                  : "1.5px solid transparent",
            },
          }}
          onClick={() => {
            dispatch(
              setSelectedVehicleCustomRange({
                dateRangeToDisplay: { startDate: "", endDate: "" },
                dateRangeForDataFetching: { startDate: "", endDate: "" },
                customRangeSelected: "Today",
                previousDateRange: { startDate: "", endDate: "" },
              })
            );
            dispatch(setOpenStoppageIndex(-1));

            dispatch(setNearbyVehicles(undefined));
            dispatch(setRadiusInKilometers(0));

            dispatch(
              setSelectedVehicleStatus({
                ...vehicleData,
                searchType: "",
                selectedVehicleHistoryTab:
                  selectedVehicle.selectedVehicleHistoryTab,
                nearbyVehicles: [],
                prevVehicleSelected: selectedVehicle.prevVehicleSelected,
              })
            );

            selectedVehicle.vId === vehicleData.vehicleTrip.sys_service_id
              ? (() => {
                  // trip system state update
                  dispatch(
                    setSelectedVehicleBySelectElement(
                      initialSelectedVehicleState
                    )
                  );
                  dispatch(setCreateTripOrTripPlanningActive({ type: "" }));
                })()
              : null;
          }}
        >
          <div className="flex flex-col items-baseline gap-0.5 overflow-hidden pr-2">
            <div className="flex justify-between items-center w-full mb-2">
              <div>
                <p className="font-extrabold text-base -mt-1 flex flex-col">
                  {" "}
                  {vehicleData.vehicleTrip.lorry_no} -{" "}
                  {vehicleData.vehicleTrip.trip_status_batch || "Transit"}
                </p>
                <p className="text-xs text-primary-green font-semibold">
                  Updated At : {vehicleData.gpsDtl.latLngDtl?.gpstime || "No GPS Time Available"}
                </p>
              </div>

              <div className="flex items-center gap-2 ">
                <div className="px-2 py-1 rounded-md font-bold text-xs text-red-700 bg-red-100 mt-1 line-clamp-1">
                  {vehicleData.vehicleTrip.delay?.toFixed(1) || "0.0"} Hours
                </div>
              </div>
            </div>

            <div className="m-1 border border-gray-200 rounded-md w-full py-2">
              <div className="flex flex-row">
                <div className="flex items-center justify-between w-full px-2">
                  <p className="text-primary-green text-xs">Start Location</p>
                  <p className="text-primary-red text-xs">End Location</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-2 relative">
                <div className="border border-gray-300 rounded-full p-1">
                  <div className="size-3 bg-primary-green rounded-full" />
                </div>

                {(() => {
                  const totalKm =
                    parseFloat(vehicleData.vehicleTrip.totaltripkmbygoogle) ||
                    1;
                  const travelledKm =
                    vehicleData.vehicleTrip.kmTravelled ||
                    parseFloat(vehicleData.vehicleTrip.KM) ||
                    0;
                  const isCompleted =
                    vehicleData.vehicleTrip.trip_status === "Trip Completed";

                  if (isCompleted) {
                    // Trip completed - show full green line
                    return (
                      <div
                        className="absolute left-9 top-1/2 h-1 border-t-2 border-primary-green -translate-y-1/2"
                        style={{ width: `calc(100% - 72px)` }}
                      ></div>
                    );
                  }

                  // Ongoing trip
                  const actualProgressPercent = (travelledKm / totalKm) * 100;
                  const displayProgressPercent = Math.min(
                    actualProgressPercent,
                    85
                  ); // Cap at 85%

                  if (actualProgressPercent <= 2) {
                    // Very little progress - just show dashed line
                    return (
                      <div
                        className="absolute left-9 top-1/2 h-1 border-t-2 border-dashed border-gray-400 -translate-y-1/2"
                        style={{ width: `calc(100% - 72px)` }}
                      ></div>
                    );
                  }

                  // Normal progress - show green line up to truck, then dashed line
                  return (
                    <>
                      {/* Green progress line - only up to truck position */}
                      <div
                        className="absolute left-9 top-1/2 h-1 border-t-2 border-primary-green -translate-y-1/2"
                        style={{
                          width: `${
                            displayProgressPercent * 0.01 * (100 - 18)
                          }%`,
                        }}
                      ></div>

                      {/* Remaining dashed line - from truck to end */}
                      <div
                        className="absolute top-1/2 h-1 border-t-2 border-dashed border-gray-400 -translate-y-1/2"
                        style={{
                          left: `calc(36px + ${
                            displayProgressPercent * 0.01 * (100 - 18)
                          }% + 8px)`,
                          width: `calc(100% - 36px - ${
                            displayProgressPercent * 0.01 * (100 - 18)
                          }% - 44px)`,
                        }}
                      ></div>

                      {/* Truck with flag */}
                      <div
                        className="absolute z-10 flex items-center overflow-visible"
                        style={{
                          left: `calc(36px + ${
                            displayProgressPercent * 0.01 * (100 - 18)
                          }% - 10px)`,
                          top: "50%",
                          transform: "translateY(-50%)",
                          maxWidth: "calc(100% - 60px)",
                        }}
                      >
                        <div className="bg-blue-50 border border-blue-500 text-black px-1 py-0.5 rounded mr-1 text-[9px] whitespace-nowrap">
                          {Math.round(travelledKm)}km
                        </div>
                        <div className="bg-white flex-shrink-0">
                          <Image
                            src={TruckTrip}
                            alt="Truck Trip"
                            width={18}
                            height={18}
                            draggable={false}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* End location - show truck with flag if completed, otherwise red dot */}
                {vehicleData.vehicleTrip.trip_status === "Trip Completed" ? (
                  <div className="flex items-center z-20 relative">
                    <div className="bg-green-50 border border-green-500 text-black px-1 py-0.5 rounded mr-1 text-[9px] whitespace-nowrap">
                      {Math.round(
                        parseFloat(
                          vehicleData.vehicleTrip.totaltripkmbygoogle
                        ) || 0
                      )}
                      km
                    </div>
                    <div className="bg-white flex-shrink-0">
                      <Image
                        src={TruckTrip}
                        alt="Trip Completed"
                        width={18}
                        height={18}
                        draggable={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-full p-1">
                    <div className="size-3 bg-primary-red rounded-full" />
                  </div>
                )}
              </div>

              <div className="px-2 grid grid-cols-2 gap-2 w-full items-center">
                <p className="text-left text-xs truncate">
                  {vehicleData.vehicleTrip.station_from_location?.replaceAll(
                    "_",
                    " "
                  )}
                </p>
                <p className="text-right text-xs truncate">
                  {vehicleData.vehicleTrip.station_to_location?.replaceAll(
                    "_",
                    " "
                  )}
                </p>
              </div>

              <div className="w-full border border-gray-200" />

              {/* Live Location and ETA Section */}
              <div className="px-2 flex items-center justify-between py-1.5">
                <div className="flex items-start gap-2 py-2">
                  <div className="mt-1">
                    <Image
                      src={LocationIcon}
                      alt="Location"
                      width={15}
                      height={15}
                      draggable={false}
                    />
                  </div>
                  <div>
                    <p className="text-primary-green text-xs">Live Location</p>
                    <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[150px]">
                      {isSearchLoading ? "Loading..." : liveLocationAddress}
                    </p>
                  </div>
                </div>

                <div className="w-px h-14 bg-gray-200 mx-1"></div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div className="flex items-center gap-1">
                      <Image
                        src={ETAIcon}
                        alt="ETA"
                        width={15}
                        height={15}
                        draggable={false}
                      />
                      <span className="text-gray-600 text-xs font-medium">
                        ETA
                      </span>
                    </div>
                    <div className="bg-gray-100 border border-gray-500 px-2 py-1 rounded text-xs font-medium text-gray-700">
                      {(() => {
                        // Get start time and calculate ETA
                        const sourceOut = vehicleData.vehicleTrip.SourceOut;
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
                          if (vehicleData.vehicleTrip.departure_date) {
                            startMoment = moment(
                              vehicleData.vehicleTrip.departure_date
                            );
                          }
                        }

                        if (!startMoment || !startMoment.isValid()) {
                          return `${estimatedTravelTime.toFixed(0)} Hours`;
                        }

                        // Add estimated travel time to start time
                        const etaDateTime = startMoment
                          .clone()
                          .add(estimatedTravelTime, "hours");
                        return etaDateTime.format("DD MMM HH:mm");
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-600 text-xs font-medium">
                      Total KM
                    </span>
                    <div className="bg-blue-50 border border-blue-500 px-2 py-1 rounded text-xs font-medium text-blue-700">
                      {parseFloat(
                        vehicleData.vehicleTrip.totaltripkmbygoogle
                      )?.toFixed(2) || "0.00"}{" "}
                      km
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex mt-4 w-full text-center overflow-hidden relative">
              <div className="flex items-center bg-white h-[84px] mr-2 z-10">
                <div
                  className={`hover:opacity-50 ${
                    overviewSliderStyle === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-100 cursor-pointer"
                  }transition-opacity duration-300`}
                  onClick={(e) => {
                    handleLeftClick(e);
                  }}
                >
                  <LeftCircleOutlined />
                </div>
              </div>

              <div id="items">
                <div
                  className="flex gap-4 text-center overflow-hidden w-[100%] relative"
                  style={{
                    transform: `${
                      maxSliderValue <= 260
                        ? "translateX(0px)"
                        : `translateX(${overviewSliderStyle}px)`
                    }`,
                    transition: "transform 0.3s ease",
                  }}
                >
                  <a
                    href={`https://www.google.com/maps/search/${vehicleData.gpsDtl.latLngDtl.lat},${vehicleData.gpsDtl.latLngDtl.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="z-20 relative"
                  >
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-semibold">
                        {vehicleData.gpsDtl.latLngDtl.lat.toFixed(4)}{" "}
                        {vehicleData.gpsDtl.latLngDtl.lng.toFixed(4)}
                      </div>
                      <div className="mt-1">Lat | Lng</div>
                    </div>
                  </a>

                  <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                    <div className="font-semibold">
                      {checkIfIgnitionOnOrOff({
                        ignitionState:
                          vehicleData.gpsDtl.ignState.toLowerCase() as
                            | "off"
                            | "on",
                        speed: vehicleData.gpsDtl.speed,
                        mode: vehicleData.gpsDtl.mode,
                      }) === "On"
                        ? vehicleData.gpsDtl.speed
                        : 0}{" "}
                      km/h
                    </div>
                    <div className="mt-1">Speed</div>
                  </div>
                  <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                    <div className="font-semibold">
                      {checkIfIgnitionOnOrOff({
                        ignitionState:
                          vehicleData.gpsDtl.ignState.toLowerCase() as
                            | "off"
                            | "on",
                        speed: vehicleData.gpsDtl.speed,
                        mode: vehicleData.gpsDtl.mode,
                      })}
                    </div>
                    <div className="mt-1">Ignition</div>
                  </div>

                  {auth.isAc ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-semibold">
                        {vehicleData.gpsDtl.acState}
                      </div>
                      <div className="mt-1">AC</div>
                    </div>
                  ) : null}

                  {auth.isTemp ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs min-w-20 h-[84px]">
                      <div className="font-semibold">
                        {vehicleData.gpsDtl.temperature?.toFixed(2)} °C
                      </div>
                      <div className="mt-1">Temp</div>
                    </div>
                  ) : null}

                  {auth.isEveVehicle ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-semibold">
                        {vehicleData.gpsDtl.tel_rfid} km
                      </div>
                      <div className="mt-1">Distance to Empty</div>
                    </div>
                  ) : null}

                  {auth.isMarketVehicle ||
                  auth.isPadlock ||
                  auth.isEveVehicle ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-semibold">
                        {vehicleData.gpsDtl.main_powervoltage
                          ? vehicleData.gpsDtl.main_powervoltage.toFixed(2)
                          : "0"}
                        %
                      </div>
                      <div className="mt-1">Battery Status</div>
                    </div>
                  ) : null}

                  {auth.isOdometer || auth.isEveVehicle ? (
                    <div className="border border-gray-300 px-2 py-3 rounded-lg text-xs w-20 h-[84px] min-w-[80px]">
                      <div className="font-semibold">
                        {vehicleData.gpsDtl.tel_odometer
                          ? vehicleData.gpsDtl.tel_odometer.toFixed(2)
                          : "0.00"}{" "}
                        km
                      </div>
                      <div className="mt-1">Odometer</div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center bg-white h-[84px] z-10 absolute right-0">
                <div
                  className={`hover:opacity-50 ${
                    overviewSliderStyle + maxSliderValue - containerWidth <= 0
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-100 cursor-pointer"
                  }transition-opacity duration-300`}
                  onClick={(e) => {
                    handleRightClick(e);
                  }}
                >
                  <RightCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
