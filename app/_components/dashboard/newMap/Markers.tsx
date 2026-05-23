"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import {
  MarkerClusterer as GoogleMarkerClusterer,
  GridAlgorithm,
} from "@googlemaps/markerclusterer";
import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "antd";
import { RootState } from "@/app/_globalRedux/store";
import { Markers as MarkersType } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import {
  resetIsMarkerInfoWindowOpen,
  setIsMarkerInfoWindowOpen,
} from "@/app/_globalRedux/dashboard/markerInfoWindow";
import { getAbbreviation } from "@/app/helpers/getAbbreviation";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { getLatestGPSTime } from "../utils/getLatestGPSTime";
import checkIfIgnitionOnOrOff from "@/app/helpers/checkIfIgnitionOnOrOff";
import updateSingleVehicleMovement from "@/app/helpers/updateSingleVehicleMovement";
import { useGetVehicleCurrentLocationQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { getNormalOrControllerId } from "../utils/getNormalOrControllerId";
import { setCreatePoi } from "@/app/_globalRedux/dashboard/createPoi";

const customRenderer = {
  render: ({
    count,
    position,
  }: {
    count: number;
    position: google.maps.LatLng;
  }) => {
    let color;
    let ringColors;
    let textColor = "black";

    // Color scheme based on count
    if (count <= 100) {
      color = "#008CFF"; // Bright blue
      ringColors = [
        "rgba(66, 133, 244)",
        "rgba(66, 133, 244, 0.5)",
        "rgba(66, 133, 244, 0.3)",
        "rgba(66, 133, 244, 0.1)",
      ];
    } else if (count <= 200) {
      color = "#FEBF00"; // Yellow/Gold
      textColor = "black";
      ringColors = [
        "rgba(251, 188, 5)",
        "rgba(251, 188, 5, 0.5)",
        "rgba(251, 188, 5, 0.3)",
        "rgba(251, 188, 5, 0.1)",
      ];
    } else {
      color = "#FF0000"; // Red
      ringColors = [
        "rgba(234, 67, 53)",
        "rgba(234, 67, 53, 0.5)",
        "rgba(234, 67, 53, 0.3)",
        "rgba(234, 67, 53, 0.1)",
      ];
    }

    // Calculate the number of digits in count
    const digits = count.toString().length;
    // Set icon size: 55px for 1-2 digits, increase by 5px for each additional digit
    const size = 50 + Math.max(0, digits - 2) * 5;

    // SVG for the icon (without text)
    const svg = `
		  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
			<!-- Concentric rings -->
			<circle cx="15" cy="15" r="13" fill="${ringColors[3]}"/>
			<circle cx="15" cy="15" r="11" fill="${ringColors[2]}"/>
			<circle cx="15" cy="15" r="9" fill="${ringColors[1]}"/>
			<circle cx="15" cy="15" r="7" fill="${ringColors[0]}"/>
			
			<!-- Central circle -->
			<circle cx="15" cy="15" r="5" fill="${color}"/>
		  </svg>
		`;
    const url = `data:image/svg+xml;base64,${btoa(svg)}`;

    return new google.maps.Marker({
      position,
      icon: {
        url,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2), // Center the marker
      },
      label: {
        text: count.toString(),
        color: textColor,
        fontSize: "11px", // Fixed font size
        fontWeight: "600",
        fontFamily: "-apple-system, 'Segoe UI', Roboto, sans-serif",
      },
      zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
    });
  },
};

const calculateBearing = (
  prevLat: number,
  prevLng: number,
  currLat: number,
  currLng: number
): number => {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const toDegrees = (radians: number) => radians * (180 / Math.PI);

  const φ1 = toRadians(prevLat);
  const φ2 = toRadians(currLat);
  const λ1 = toRadians(prevLng);
  const λ2 = toRadians(currLng);

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const bearing = toDegrees(Math.atan2(y, x));

  return (bearing + 360) % 360;
};
const getMarkerPosition = (marker: any, accessLabel: number | null) => {
  const isElock = accessLabel === 6 && getLatestGPSTime(marker) === "ELOCK";

  if (isElock) {
    const elockLat = marker.ELOCKInfo?.lat;
    const elockLng = marker.ELOCKInfo?.lng;
    if (elockLat && elockLng && elockLat !== 0 && elockLng !== 0) {
      return {
        lat: elockLat,
        lng: elockLng,
      };
    }
    return {
      lat: marker.gpsDtl.latLngDtl.lat,
      lng: marker.gpsDtl.latLngDtl.lng,
    };
  } else {
    return {
      lat: marker.gpsDtl.latLngDtl.lat,
      lng: marker.gpsDtl.latLngDtl.lng,
    };
  }
};
const getInfoWindowPosition = (marker: any, accessLabel: number | null) => {
  if (marker.vehicleTrip.trip_id) {
    return {
      lat: Number(marker.vehicleTrip.gps.latLngDtl.lat),
      lng: Number(marker.vehicleTrip.gps.latLngDtl.lng),
    };
  } else {
    return getMarkerPosition(marker, accessLabel);
  }
};

type MarkersProps = {
  openSetting?: () => void;
  isSettingOpen?: boolean;
};
export const Markers = ({ openSetting, isSettingOpen }: MarkersProps) => {
  const map = useMap();
  const dispatch = useDispatch();
  const markers = useSelector((state: RootState) => state.markers);
  const auth = useSelector((state: RootState) => state.auth);
  const cluster = useSelector((state: RootState) => state.cluster);
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath
  );
  const liveVehicleItnaryWithPath = useSelector(
    (state: RootState) => state.liveVehicleData
  );
  const { type: vehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive
  );
  const isMarkerInfoWindowOpen = useSelector(
    (state: RootState) => state.isMarkerInfoWindowOpen
  );
  const { isGetNearbyVehiclesActive } = useSelector(
    (state: RootState) => state.nearbyVehicles
  );
  const [clusterer, setClusterer] = useState<GoogleMarkerClusterer | null>(
    null
  );
  const [prevPosition, setPrevPosition] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [rotation, setRotation] = useState<number>(0);
  const [vehicleVar, setVehicleVar] = useState<string>("");
  const [currentBounds, setCurrentBounds] =
    useState<google.maps.LatLngBounds | null>(null);
  const selectedVehicleListTab = useSelector(
    (state: RootState) => state.selectedVehicleListTab
  );
  const [individualMarkers, setIndividualMarkers] = useState<
    google.maps.Marker[]
  >([]);
  const [firstMapRender, setFirstMapRender] = useState(true);
  const {
    data: currentVehicleLocationData,
    isLoading,
    isFetching: isFetchingCurrentVehicleLocation,
  } = useGetVehicleCurrentLocationQuery(
    {
      userId: Number(auth.userId),
      vehId:
        auth.accessLabel === 6
          ? getNormalOrControllerId(selectedVehicle)
          : selectedVehicle.vId,
    },
    {
      skip: selectedVehicle.vId === 0 || historyReplay.isHistoryReplayMode,
      pollingInterval: 10000,
    }
  );

  const isGetVehiclesByStatusLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q && q.endpointName === "getVehiclesByStatus" && q.status === "pending"
    )
  );

  const getIconUrl = useCallback(
    (marker: MarkersType["gpsDtl"]): string => {
      return isCheckInAccount(Number(auth.userId))
        ? `/assets/images/map/vehicles/checkin.png`
        : Number(auth.userId) === 85182
        ? `/assets/images/map/vehicles/${vehicleVar}-black.png`
        : marker.notworkingHrs >= 24
        ? `/assets/images/map/vehicles/${vehicleVar}-black.png`
        : checkIfIgnitionOnOrOff({
            ignitionState: marker.ignState.toLowerCase() as "off" | "on",
            speed: marker.speed,
            mode: marker.mode,
          }) === "On"
        ? `/assets/images/map/vehicles/${vehicleVar}-green.png`
        : `/assets/images/map/vehicles/${vehicleVar}-red.png`;
    },
    [auth, vehicleVar]
  );

  // Set vehicle type
  useEffect(() => {
    if (auth) {
      let tempVehicleVar = auth.vehicleType?.toLowerCase() || "";
      if (tempVehicleVar === "camera") {
        setVehicleVar("bus");
      } else if (tempVehicleVar === "cab") {
        setVehicleVar("car");
      } else if (!tempVehicleVar) {
        setVehicleVar("truck");
      } else {
        setVehicleVar(tempVehicleVar);
      }
    }
  }, [auth]);

  // Update vehicle movement
  useEffect(
    () => {
      if (
        !isLoading &&
        !isFetchingCurrentVehicleLocation &&
        !historyReplay.isHistoryReplayMode &&
        currentVehicleLocationData?.success &&
        markers
      ) {
        if (currentVehicleLocationData.list.mode !== "NOT WORKING") {
          updateSingleVehicleMovement({
            dispatch,
            vehicleItnaryWithPath,
            currentVehicleLocationData,
            liveVehicleItnaryWithPath,
            markers,
            selectedVehicle,
          });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentVehicleLocationData, isLoading, isFetchingCurrentVehicleLocation]
  );

  // Calculate rotation for selected vehicle
  useEffect(
    () => {
      if (
        selectedVehicle &&
        selectedVehicle.gpsDtl.latLngDtl.lat !== 0 &&
        selectedVehicle.gpsDtl.latLngDtl.lng !== 0
      ) {
        const currentLat = selectedVehicle.gpsDtl.latLngDtl.lat;
        const currentLng = selectedVehicle.gpsDtl.latLngDtl.lng;

        if (prevPosition.lat !== null && prevPosition.lng !== null) {
          const bearing = calculateBearing(
            prevPosition.lat,
            prevPosition.lng,
            currentLat,
            currentLng
          );
          setRotation(bearing);
        }

        setPrevPosition({ lat: currentLat, lng: currentLng });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedVehicle]
  );

  // Initialize clusterer
  useEffect(() => {
    if (map) {
      const algorithm = new GridAlgorithm({ gridSize: 70 });
      const newClusterer = new GoogleMarkerClusterer({
        map,
        renderer: customRenderer,
        algorithm,
      });

      setClusterer(newClusterer);
    }
  }, [map]);
  // Update bounds when map idles
  useEffect(() => {
    if (map) {
      const updateBounds = () => {
        setCurrentBounds(map.getBounds() || null);
      };
      updateBounds(); // Initial bounds
      const idleListener = map.addListener("idle", updateBounds);
      return () => {
        google.maps.event.removeListener(idleListener);
      };
    }
  }, [map]);

  const firstRender = useRef(0);
  const prevSelectedDashboardVehicleLength = useRef(0);
  const fromSelectedTONone = useRef(false);
  const [prevSelectedVehicleListTab, setPrevSelectedVehicleListTab] =
    useState("ALL");

  useEffect(
    () => {
      if (
        !map ||
        !clusterer ||
        markers.length === 0 ||
        isGetVehiclesByStatusLoading ||
        isGetNearbyVehiclesActive === true
      )
        return;

      if (
        selectedDashboardVehicle.length === 0 &&
        selectedDashboardVehicle.length !==
          prevSelectedDashboardVehicleLength.current
      ) {
        firstRender.current = 0;
        fromSelectedTONone.current = true;
      }

      if (prevSelectedVehicleListTab !== selectedVehicleListTab) {
        firstRender.current = 1;
        fromSelectedTONone.current = true;
      }
      // Use a ref to track the initial render

      if (firstRender.current === 0) {
        firstRender.current += 1;
        prevSelectedDashboardVehicleLength.current =
          selectedDashboardVehicle.length;
        return;
      } else if (firstRender.current === 1) {
        firstRender.current += 1;

        if (fromSelectedTONone.current) {
          setPrevSelectedVehicleListTab(selectedVehicleListTab);
          fromSelectedTONone.current = false;
          return;
        }
      } else {
        clusterer?.clearMarkers();
        individualMarkers.forEach((marker) => marker.setMap(null));
        setIndividualMarkers([]);
      }

      if (
        historyReplay.isHistoryReplayMode === false &&
        selectedVehicle.vId !== 0
      ) {
        clusterer.clearMarkers();
        individualMarkers.forEach((marker) => marker.setMap(null));
        setIndividualMarkers([]);
      }

      // Initialize markersToShow with all visible markers by default
      let markersToShow = markers.filter((marker) => marker.visibility);

      // Adjust markersToShow based on history replay and selected vehicle
      if (
        historyReplay.isHistoryReplayMode === false ||
        selectedVehicle.vId === 0
      ) {
        markersToShow =
          selectedVehicle.vId !== 0
            ? markers.filter(
                (marker) =>
                  marker.vId === selectedVehicle.vId && marker.visibility
              )
            : markers.filter((marker) => marker.visibility);
      } else {
        markersToShow = [];
      }

      if (cluster) {
        // Clustering enabled: Add all visible markers to the clusterer
        const validMarkers = markersToShow.filter((marker) => {
          const position = getMarkerPosition(marker, auth.accessLabel);
          return position.lat !== 0 && position.lng !== 0;
        });

        const googleMarkers = validMarkers.map((marker) => {
          const position = getMarkerPosition(marker, auth.accessLabel);
          const googleMarker = new google.maps.Marker({
            position,
            icon: {
              url: getIconUrl(marker.gpsDtl),
              scaledSize: new google.maps.Size(60, 60),
              anchor: new google.maps.Point(30, 30),
            },
            title: marker.vehReg,
            label: {
              text:
                vehicleListType === "trip" ||
                vehicleListType === "vehicle-allocation-trip"
                  ? `${getAbbreviation(
                      marker.vehicleTrip.station_from_location
                    )}-${getAbbreviation(
                      marker.vehicleTrip.station_to_location
                    )}\n${marker.vehReg}`
                  : `${marker.vehReg}`,
              color: "#000",
              className: "custom-label",
              fontSize: "10px",
            },
          });

          googleMarker.addListener("click", () => {
            dispatch(setIsMarkerInfoWindowOpen(marker.vId));
          });

          return googleMarker;
        });
        if (firstMapRender) {
          setTimeout(() => {
            clusterer?.addMarkers(googleMarkers);
            setFirstMapRender(false);
          }, 2000);
        } else {
          clusterer?.addMarkers(googleMarkers);
        }
      } else {
        // Clustering disabled: Add individual markers within current bounds
        if (currentBounds) {
          markersToShow = markersToShow.filter((marker) => {
            const position = getMarkerPosition(marker, auth.accessLabel);
            return currentBounds.contains(
              new google.maps.LatLng(position.lat, position.lng)
            );
          });
        }

        const newIndividualMarkers = markersToShow.map((marker) => {
          const position = getMarkerPosition(marker, auth.accessLabel);
          const googleMarker = new google.maps.Marker({
            position,
            map, // Attach directly to the map

            icon: {
              url: getIconUrl(marker.gpsDtl),
              scaledSize: new google.maps.Size(60, 60),
              anchor: new google.maps.Point(30, 30),
            },
            label: {
              text:
                vehicleListType === "trip" ||
                vehicleListType === "vehicle-allocation-trip"
                  ? `${getAbbreviation(
                      marker.vehicleTrip.station_from_location
                    )}-${getAbbreviation(
                      marker.vehicleTrip.station_to_location
                    )}\n${marker.vehReg}`
                  : `${marker.vehReg}`,
              color: "#000",
              className: "custom-label",
              fontSize: "10px",
            },
          });

          googleMarker.addListener("click", () => {
            dispatch(setIsMarkerInfoWindowOpen(marker.vId));
          });

          return googleMarker;
        });

        setIndividualMarkers(newIndividualMarkers);
      }

      prevSelectedDashboardVehicleLength.current =
        selectedDashboardVehicle.length;
      setPrevSelectedVehicleListTab(selectedVehicleListTab);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      map,
      clusterer,
      cluster,
      markers,
      selectedVehicle,
      currentBounds,
      auth,
      dispatch,
      getIconUrl,
      vehicleListType,
      historyReplay.isHistoryReplayMode,
      isGetVehiclesByStatusLoading,
    ]
  );

  // Rest of the component remains unchanged
  const infoWindowMarker = markers.find(
    (m) => m.vId === isMarkerInfoWindowOpen
  );
  const infoWindowPosition = infoWindowMarker
    ? getInfoWindowPosition(infoWindowMarker, auth.accessLabel)
    : null;

  return (
    <>
      {(selectedVehicle.vId !== 0 &&
        !historyReplay.isHistoryReplayMode &&
        selectedVehicle.gpsDtl.latLngDtl.lat &&
        selectedVehicle.gpsDtl.latLngDtl.lng) ||
        (selectedVehicle.vId !== 0 &&
          !historyReplay.isHistoryReplayMode &&
          selectedVehicle.ELOCKInfo.lng &&
          selectedVehicle.ELOCKInfo.lat && (
            <AdvancedMarker
              position={getMarkerPosition(selectedVehicle, auth.accessLabel)}
              onClick={() =>
                dispatch(setIsMarkerInfoWindowOpen(selectedVehicle.vId))
              }
            >
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center",
                }}
              >
                <img
                  src={getIconUrl(selectedVehicle.gpsDtl)}
                  alt="Selected Vehicle"
                  width={60}
                  height={60}
                />
              </div>
            </AdvancedMarker>
          ))}
      {infoWindowMarker &&
        infoWindowPosition &&
        infoWindowPosition.lat &&
        infoWindowPosition.lng && (
          <InfoWindow
            position={infoWindowPosition}
            onCloseClick={() => dispatch(resetIsMarkerInfoWindowOpen())}
          >
            <MarkersCustomInfoWindow
              marker={infoWindowMarker}
              openSetting={openSetting}
              isSettingOpen={isSettingOpen}
            />
          </InfoWindow>
        )}
    </>
  );
};

// MarkersCustomInfoWindow component remains unchanged
const MarkersCustomInfoWindow: React.FC<{
  marker: MarkersType;
  openSetting?: () => void;
  isSettingOpen?: boolean;
}> = ({ marker, openSetting, isSettingOpen }) => {
  const dispatch = useDispatch();
  const map = useMap();
  const createPoi = useSelector((state: RootState) => state.createPoi);
  const auth = useSelector((state: RootState) => state.auth);

  const handlePoiToggle = () => {
    dispatch(setCreatePoi(!createPoi.isCreatePoi));
  };

  return (
    <div className="text-gray-800 flex flex-col gap-1 max-w-80">
      <div className="absolute top-5">
        <span className="font-medium text-lg mr-10">Vehicle Information</span>
        <button
          onClick={() => {
            const next = !createPoi.isCreatePoi;
            dispatch(setCreatePoi(next));

            // Zoom to marker location when enabling POI drawing
            if (next && map) {
              const markerLat = marker.vehicleTrip.trip_id
                ? Number(marker.vehicleTrip.gps.latLngDtl.lat)
                : marker.gpsDtl.latLngDtl.lat;
              const markerLng = marker.vehicleTrip.trip_id
                ? Number(marker.vehicleTrip.gps.latLngDtl.lng)
                : marker.gpsDtl.latLngDtl.lng;

              if (markerLat !== 0 && markerLng !== 0) {
                map.setCenter({ lat: markerLat, lng: markerLng });
                map.setZoom(16);
              }
            }

            if (next) {
              dispatch(resetIsMarkerInfoWindowOpen());
            }
            if (next && openSetting) openSetting();
            if (!next && isSettingOpen && openSetting) openSetting();
          }}
          className={`p-1 rounded-full transition mt-0.5 ${
            createPoi.isCreatePoi
              ? "bg-blue-200 hover:bg-blue-300"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          title={
            createPoi.isCreatePoi ? "Disable POI Drawing" : "Enable POI Drawing"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="16"
            viewBox="0 0 24 24"
            width="16"
            fill="currentColor"
            className={
              createPoi.isCreatePoi ? "text-blue-600" : "text-gray-600"
            }
          >
            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal">
        <div className="col-span-2 font-medium text-neutral-700">
          Vehicle Number:
        </div>
        <div className="col-span-3">
          {marker.vehicleTrip.trip_id
            ? marker.vehicleTrip.lorry_no
            : marker.vehReg}
        </div>
        <div className="col-span-2 font-medium text-neutral-700">Lat | Lng</div>
        <div className="col-span-3">
          {marker.vehicleTrip.trip_id
            ? `${Number(marker.vehicleTrip.gps.latLngDtl.lat).toFixed(
                2
              )} | ${Number(marker.vehicleTrip.gps.latLngDtl.lng).toFixed(2)}`
            : `${marker.gpsDtl.latLngDtl.lat.toFixed(
                2
              )} | ${marker.gpsDtl.latLngDtl.lng.toFixed(2)}`}
        </div>
        <div className="col-span-2 font-medium text-neutral-700">Address:</div>
        <div className="col-span-3 cursor-pointer">
          {marker.vehicleTrip.trip_id ? (
            <Tooltip
              title={marker.gpsDtl.latLngDtl.addr?.replaceAll("_", " ")}
              mouseEnterDelay={1}
            >
              {marker.gpsDtl.latLngDtl.addr?.replaceAll("_", " ").slice(0, 45)}
              {marker.gpsDtl.latLngDtl.addr?.length > 45 ? "..." : ""}
            </Tooltip>
          ) : marker.gpsDtl.latLngDtl.addr ? (
            <Tooltip
              title={marker.gpsDtl.latLngDtl.addr?.replaceAll("_", " ")}
              mouseEnterDelay={1}
            >
              {marker.gpsDtl.latLngDtl.addr?.replaceAll("_", " ").slice(0, 45)}
              {marker.gpsDtl.latLngDtl.addr?.length > 45 ? "..." : ""}
            </Tooltip>
          ) : null}
        </div>
        <div className="col-span-2 font-medium text-neutral-700">
          Destination:
        </div>
        <div className="col-span-3">
          {marker.vehicleTrip.trip_id ? (
            ""
          ) : marker.gpsDtl.veh_destinationShow ? (
            <Tooltip
              title={marker.gpsDtl.veh_destinationShow?.replaceAll("_", " ")}
              mouseEnterDelay={1}
            >
              {marker.gpsDtl.veh_destinationShow
                ?.replaceAll("_", " ")
                .slice(0, 45)}
              {marker.gpsDtl.veh_destinationShow?.length > 45 ? "..." : ""}
            </Tooltip>
          ) : null}
        </div>
        <div className="col-span-2 font-medium text-neutral-700">
          Last Update:
        </div>
        <div className="col-span-3">
          {marker.vehicleTrip.trip_id ? "" : marker.gpsDtl.latLngDtl.gpstime}
        </div>
        <div className="col-span-2 font-medium text-neutral-700">
          Idle Time:
        </div>
        <div className="col-span-3">
          {marker.gpsDtl.hatledSince === "01 Jan 1970 05:30:00"
            ? ""
            : marker.gpsDtl.hatledSince}
        </div>
        <div className="col-span-2 font-medium text-neutral-700">Speed:</div>
        <div className="col-span-3">
          {marker.vehicleTrip.trip_id ? "" : marker.gpsDtl.speed} kmph
        </div>
      </div>
    </div>
  );
};
