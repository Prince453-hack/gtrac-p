"use client";

import {
  setCreatePoi,
  setPoiShape,
} from "@/app/_globalRedux/dashboard/createPoi";
import {
  initialPOIDropDownState,
  setGeoFence,
  setPoiData,
  setSelectedPOIList,
} from "@/app/_globalRedux/dashboard/poiSlice";
import { PathArrayItem } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { RootState } from "@/app/_globalRedux/store";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { SettingOutlined } from "@ant-design/icons";
import { InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import { FloatButton } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import InfoBanner from "../../common/InfoBanner";
import { ClusterToggle } from "../ClusterToggle";
import { HistoryReplaySlider } from "../HistoryReplaySlider";
import { HistoryReplayToggle } from "../HistoryReplayToggle";
import MapTypeController from "../MapTypeController";
import NearbyVehiclesToggle from "../nearbyVehicles/NearbyVehiclesToggle";
import { PoiToggle } from "../PoiToggle";
import PolygonDrawingOptions from "../PolygonDrawingOptions";
import { PolygonToggle } from "../PolygonToggle";
import SearchLocationPOI from "../SearchLocationPOI";
import { getLatestGPSTime } from "../utils/getLatestGPSTime";
import { AlertMarkersImperative } from "./AlertMarkers";
import { CreateTripOrPlanMarker } from "./CreateTripOrPlanMarker";
import CustomPolyline from "./CustomPolyline";
import { HistoryReplayMarker } from "./HistoryReplayMarker";
import { Markers } from "./Markers";
import { NearbyMarkers } from "./NearbyMarkers";
import PoiMarkersImperative from "./PoiMarkers";
import { StartAndEndPointMarker } from "./StartAndEndPointMarker";
import { StoppageMarkersImperative } from "./StoppageMarkers";

const getMarkerPosition = (marker: any, auth: any) => {
  if (auth.accessLabel === 6 && getLatestGPSTime(marker) === "ELOCK") {
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

export const CustomGoogleMapInstance = () => {
  const map = useMap();
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    const loadDrawingLibrary = async () => {
      if (window.google?.maps?.importLibrary) {
        await window.google.maps.importLibrary("drawing");
      }
    };

    loadDrawingLibrary();
  }, []);

  const [bounds, setBounds] = useState<{
    north: number | null;
    east: number | null;
    south: number | null;
    west: number | null;
  } | null>(null);
  const [isFloatSettingButtons, setIsFloatSettingButtons] = useState(false);
  const { isLoadingScreenActive } = useSelector(
    (state: RootState) => state.map,
  );
  const [checked, setChecked] = useState("");
  const [availablePOIs, setAvailablePOIs] = useState<any[]>([]);

  const [pathInfoWindowState, setPathInfoWindowState] = useState({
    index: -1,
    lat: 0,
    lng: 0,
    state: false,
  });

  const { containerStyle, zoomNo, centerOfMap, selectedMapTypeId } =
    useSelector((state: RootState) => state.map);
  const { userId, accessLabel, parentUser, isPadlock } = useSelector(
    (state: RootState) => state.auth,
  );
  const { isCreatePoi } = useSelector((state: RootState) => state.createPoi);
  const { isOlMapActive } = useSelector((state: RootState) => state.olMap);
  const markers = useSelector((state: RootState) => state.markers);
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath,
  );
  const { isGetNearbyVehiclesActive } = useSelector(
    (state: RootState) => state.nearbyVehicles,
  );
  const liveVehicleItnaryWithPath = useSelector(
    (state: RootState) => state.liveVehicleData,
  );
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle,
  );
  const selectedPOI = useSelector(
    (state: RootState) => state.poiData.selectedPOI,
  );

  const selectedPOIList = useSelector(
    (state: RootState) => state.poiData.selectedPOIList,
  );
  const { isTrafficLayerVisible } = useSelector(
    (state: RootState) => state.traffic,
  );

  const dispatch = useDispatch();

  const poiList = useSelector((state: RootState) => state.poiData.poi);
  const geofenceList = useSelector(
    (state: RootState) => state.poiData.geofenceList,
  );

  const isGetVehiclesByStatusLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q && q.endpointName === "getVehiclesByStatus" && q.status === "pending",
    ),
  );

  const isGetCurrentLocationPending = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q &&
        q.endpointName === "getVehicleCurrentLocation" &&
        q.status === "pending",
    ),
  );

  useEffect(
    () => {
      if (!map) return;
      if (isLoadingScreenActive === true) return;

      if (selectedVehicle.vId !== 0) {
        if (historyReplay.isHistoryReplayMode) {
          if (vehicleItnaryWithPath.patharry?.length > 0) {
            const pathBounds = new google.maps.LatLngBounds();
            vehicleItnaryWithPath.patharry.forEach((point) => {
              if (point.lat !== 0 && point.lng !== 0) {
                pathBounds.extend({ lat: point.lat, lng: point.lng });
              }
            });
            if (!pathBounds.isEmpty()) {
              map.fitBounds(pathBounds);
            }
          }
        } else {
          if (isGetCurrentLocationPending === false) {
            const position = getMarkerPosition(selectedVehicle, {
              accessLabel,
            });
            if (position.lat !== 0 && position.lng !== 0) {
              map.setCenter(position);
              map.setZoom(15);
            }
          }
        }
      } else {
        if (isGetVehiclesByStatusLoading === false) {
          const latLngBounds = new google.maps.LatLngBounds();
          let visibleMakers = 0;
          markers.forEach((marker) => {
            if (marker.visibility) {
              visibleMakers++;
              const position = getMarkerPosition(marker, { accessLabel });
              if (position.lat !== 0 && position.lng !== 0) {
                latLngBounds.extend(position);
              }
            }
          });

          if (!latLngBounds.isEmpty()) {
            map.fitBounds(latLngBounds);
            if (visibleMakers === 1) {
              google.maps.event.addListenerOnce(map, "idle", () => {
                map.setZoom((map.getZoom() ?? 15) - 8);
              });
            }
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      map,
      selectedVehicle,
      historyReplay.isHistoryReplayMode,
      vehicleItnaryWithPath.patharry,
      isLoadingScreenActive,
      accessLabel,
      selectedDashboardVehicle,
      isGetVehiclesByStatusLoading,
    ],
  );

  const onIdle = () => {
    if (map) {
      const b = map.getBounds();
      setBounds({
        north: b?.getNorthEast().lat() ?? null,
        east: b?.getNorthEast().lng() ?? null,
        south: b?.getSouthWest().lat() ?? null,
        west: b?.getSouthWest().lng() ?? null,
      });
    }
  };

  useEffect(() => {
    const checkPOIAvailability = async () => {
      try {
        const res = await axios.get(
          process.env.NEXT_PUBLIC_DASH_URL +
            `/getAllPoiList?userid=${userId}&puserid=${parentUser}`,
        );

        setAvailablePOIs(res.data.list || []);
      } catch (error) {
        console.error("Error checking POI availability:", error);
        setAvailablePOIs([]);
      }
    };

    if (userId && parentUser) {
      checkPOIAvailability();
    }
  }, [userId, parentUser]);

  // Traffic layer control effect
  useEffect(() => {
    if (!map) return;

    if (isTrafficLayerVisible) {
      if (!trafficLayer) {
        const newTrafficLayer = new google.maps.TrafficLayer();
        newTrafficLayer.setMap(map);
        setTrafficLayer(newTrafficLayer);
      }
    } else {
      if (trafficLayer) {
        trafficLayer.setMap(null);
        setTrafficLayer(null);
      }
    }

    return () => {
      if (trafficLayer) {
        trafficLayer.setMap(null);
      }
    };
  }, [map, isTrafficLayerVisible, trafficLayer]);

  useEffect(() => {
    if (!map || markers.length === 0 || isGetVehiclesByStatusLoading) return;

    let pathMarkers: any = [];

    if (
      (Number(userId) === 3356 ||
        Number(parentUser) === 3356 ||
        Number(userId) === 87470 ||
        Number(parentUser) === 87470 ||
        Number(userId) === 82815 ||
        Number(parentUser) === 82815 ||
        Number(userId) === 85380 ||
        Number(userId) === 6265 ||
        Number(userId) === 6264 ||
        Number(userId) === 83213) &&
      selectedVehicle.vId !== 0 &&
      vehicleItnaryWithPath &&
      vehicleItnaryWithPath.patharry &&
      vehicleItnaryWithPath.patharry.length >= 2 &&
      historyReplay.isHistoryReplayMode
    ) {
      pathMarkers = vehicleItnaryWithPath.patharry.map((marker, index) => {
        const position = {
          lat: marker.lat,
          lng: marker.lng,
        };
        const googleMarker = new google.maps.Marker({
          position,
          map,
          opacity: 0,
          icon: {
            url: "/assets/images/map/vehicles/vehicle-red.png",
            scaledSize: new google.maps.Size(60, 60),
            anchor: new google.maps.Point(30, 30),
          },
          cursor: "pointer",
        });

        googleMarker.addListener("click", () => {
          setPathInfoWindowState({
            index: index,
            lat: marker.lat,
            lng: marker.lng,
            state: true,
          });
        });

        return googleMarker;
      });
    }

    return () => {
      pathMarkers.forEach((marker: any) => marker.setMap(null));
    };
  }, [
    map,
    markers,
    isGetVehiclesByStatusLoading,
    userId,
    parentUser,
    selectedVehicle.vId,
    vehicleItnaryWithPath,
    historyReplay.isHistoryReplayMode,
  ]);

  useEffect(() => {
    if (
      !map ||
      ((poiList?.length || 0) === 0 && (geofenceList?.length || 0) === 0)
    )
      return;

    if (selectedPOIList.length === 1) {
      // First check in regular POI list
      const poi = poiList?.find((p) => p.id === selectedPOIList[0]);

      if (poi && !isNaN(poi.gps_latitude) && !isNaN(poi.gps_longitude)) {
        // Regular POI - zoom to center point
        map.setCenter({ lat: poi.gps_latitude, lng: poi.gps_longitude });
        map.setZoom(16);
      } else {
        // Check in geofence list for polygon POIs
        const geofence = geofenceList?.find((g) => g.id === selectedPOIList[0]);

        if (geofence && geofence.points && geofence.points.length > 0) {
          // Polygon POI - fit bounds to all points
          const bounds = new window.google.maps.LatLngBounds();

          geofence.points.forEach((point) => {
            if (!isNaN(point.gps_latitude) && !isNaN(point.gps_longitude)) {
              bounds.extend({
                lat: point.gps_latitude,
                lng: point.gps_longitude,
              });
            }
          });

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            // Add some padding around the polygon
            google.maps.event.addListenerOnce(map, "idle", () => {
              const currentZoom = map.getZoom();
              if (currentZoom && currentZoom > 2) {
                map.setZoom(currentZoom - 1);
              }
            });
          }
        }
      }
    } else if (selectedPOIList.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();

      selectedPOIList.forEach((id) => {
        // Check regular POI
        const poi = poiList?.find((p) => p.id === id);
        if (poi && !isNaN(poi.gps_latitude) && !isNaN(poi.gps_longitude)) {
          bounds.extend({ lat: poi.gps_latitude, lng: poi.gps_longitude });
        } else {
          // Check geofence POI
          const geofence = geofenceList?.find((g) => g.id === id);
          if (geofence && geofence.points && geofence.points.length > 0) {
            geofence.points.forEach((point) => {
              if (!isNaN(point.gps_latitude) && !isNaN(point.gps_longitude)) {
                bounds.extend({
                  lat: point.gps_latitude,
                  lng: point.gps_longitude,
                });
              }
            });
          }
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      } else {
        map.setZoom(5);
        map.setCenter({ lat: 22.9734, lng: 78.6569 });
      }
    } else {
      map.setZoom(5);
      map.setCenter({ lat: 22.9734, lng: 78.6569 });
    }
  }, [map, selectedPOIList, poiList, geofenceList]);

  return (
    <>
      {isCreatePoi && !isOlMapActive && map && (
        <div className="absolute top-2 z-[1000] right-8 mr-6 p-2">
          <SearchLocationPOI map={map} />
        </div>
      )}

      <Map
        defaultCenter={centerOfMap}
        defaultZoom={zoomNo}
        style={{ ...containerStyle }}
        onIdle={onIdle}
        mapTypeControl={false}
        mapTypeId={selectedMapTypeId}
      >
        <InfoBanner />

        <MapTypeController />
        {isCheckInAccount(Number(userId)) ? (
          <>{/* Check-in specific markers if needed */}</>
        ) : (
          <>
            {selectedVehicle.vId &&
            vehicleItnaryWithPath.patharry &&
            vehicleItnaryWithPath.patharry.length >= 2 &&
            !isGetNearbyVehiclesActive ? (
              <>
                <StartAndEndPointMarker />
                <CustomPolyline
                  path={
                    historyReplay.isHistoryReplayMode
                      ? vehicleItnaryWithPath.patharry
                      : []
                  }
                />
              </>
            ) : null}

            {selectedVehicle.vId &&
            liveVehicleItnaryWithPath.patharry &&
            !isGetNearbyVehiclesActive &&
            isPadlock === 0 ? (
              <>
                <StartAndEndPointMarker />
                <CustomPolyline
                  path={
                    !historyReplay.isHistoryReplayMode
                      ? liveVehicleItnaryWithPath.patharry
                      : []
                  }
                />
              </>
            ) : null}

            <Markers
              openSetting={() => setIsFloatSettingButtons((prev) => !prev)}
              isSettingOpen={isFloatSettingButtons}
            />

            {!isGetNearbyVehiclesActive &&
            selectedVehicle.selectedVehicleHistoryTab === "Alerts" ? (
              <AlertMarkersImperative />
            ) : null}

            {!isGetNearbyVehiclesActive &&
            (selectedVehicle.selectedVehicleHistoryTab === "All" ||
              selectedVehicle.selectedVehicleHistoryTab === "Stoppages" ||
              selectedVehicle.selectedVehicleHistoryTab === "Running" ||
              selectedVehicle.selectedVehicleHistoryTab === "Diagnostic") ? (
              <StoppageMarkersImperative />
            ) : null}

            {/* <PolylineMarkersImperative /> */}

            <NearbyMarkers />

            <HistoryReplaySlider />
            <HistoryReplayMarker />
            <PolygonDrawingOptions map={map} />
            <PoiMarkersImperative bounds={bounds} />

            <CreateTripOrPlanMarker />

            {/* Custom icon in bottom right corner */}

            <FloatButton.Group
              open={isFloatSettingButtons}
              trigger="click"
              onClick={() => {
                const newState = !isFloatSettingButtons;
                setIsFloatSettingButtons(newState);

                if (newState === false) {
                  if (isCreatePoi) {
                    dispatch(setCreatePoi(false));
                    dispatch(setPoiShape(null));
                  }
                  if (checked === "POI") {
                    dispatch(setPoiData({ poi: initialPOIDropDownState.poi }));
                    dispatch(
                      setGeoFence({
                        geofenceList: initialPOIDropDownState.geofenceList,
                      }),
                    );
                    dispatch(setSelectedPOIList([]));
                    setChecked("loading");
                  }
                }
              }}
              style={{ insetInlineEnd: 10, insetBlockEnd: 200 }}
              icon={<SettingOutlined />}
            >
              <HistoryReplayToggle />
              <PoiToggle
                checked={checked}
                setChecked={setChecked}
                geofenceList={geofenceList}
                availablePOIs={availablePOIs}
              />
              <PolygonToggle />
              {selectedVehicle.vId !== 0 ? <NearbyVehiclesToggle /> : null}
              {selectedVehicle.vId === 0 ? <ClusterToggle /> : null}
            </FloatButton.Group>

            {pathInfoWindowState.state &&
              pathInfoWindowState.index >= 0 &&
              pathInfoWindowState.index <
                vehicleItnaryWithPath.patharry.length && (
                <PolylineMouseOverInfoWindow
                  infoWindowState={pathInfoWindowState}
                  marker={
                    vehicleItnaryWithPath.patharry[pathInfoWindowState.index]
                  }
                  onClose={() =>
                    setPathInfoWindowState((prev) => ({
                      ...prev,
                      state: false,
                    }))
                  }
                />
              )}
          </>
        )}
      </Map>
    </>
  );
};

const PolylineMouseOverInfoWindow = ({
  infoWindowState,
  marker,
  onClose,
}: {
  infoWindowState: { index: number; lat: number; lng: number };
  marker: PathArrayItem;
  onClose: () => void;
}): JSX.Element => {
  return (
    <InfoWindow
      position={{ lat: infoWindowState.lat, lng: infoWindowState.lng }}
      onClose={onClose}
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
