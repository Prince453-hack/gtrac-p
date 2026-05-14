"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
} from "@/@react-google-maps/api";
import {
  setIsDashboardVehicleDetailsSearchTriggeredActive,
  setIsDashboardVehicleDetailsSearchTriggeredInActive,
} from "@/app/_globalRedux/dashboard/isDashboardVehicleDetailsSearchTriggered";
import { resetLiveVehicleItnaryWithPath } from "@/app/_globalRedux/dashboard/liveVehicleSlice";
import {
  setCenterOfMap,
  setZoomNo,
} from "@/app/_globalRedux/dashboard/mapSlice";
import { PathArrayItem } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { RootState } from "@/app/_globalRedux/store";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { SettingOutlined } from "@ant-design/icons";
import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { FloatButton } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import InfoBanner from "../common/InfoBanner";
import { HistoryReplaySlider, PoiToggle, PolygonToggle } from "./";
import { AlertMarkers } from "./AlertMarkers";
import { CheckInMarkers } from "./CheckInMarkers";
import { HistoryReplayMarker } from "./HistoryReplayMarker";
import MapTypeController from "./MapTypeController";
import { Markers } from "./Markers";
import PolygonDrawingOptions from "./PolygonDrawingOptions";
import { StartAndEndPointMarker } from "./StartAndEndPointMarker";
import { StoppageMarkers } from "./StoppageMarkers";
import { CreateTripOrPlanMarker } from "./nearbyVehicles/CreateTripOrPlanMarker";
import { NearbyVehiclesMarker } from "./nearbyVehicles/NearbyVehiclesMarkers";
import { PoiMarkers } from "./poiMarkers";
import { useMap } from "@vis.gl/react-google-maps";

export type GetAllPoiListResponse = {
  message: string;
  success: boolean;
  list: GetAllPoiListResponseList[];
};

export type GetAllPoiListResponseList = {
  sys_user_id: number;
  name: string;
  gps_latitude: number;
  gps_longitude: number;
  gps_radius: number;
  id: number;
};

export const CustomGoogleMapInstance = ({
  centerOfMap,
  zoomNo,
  mode,
}: {
  centerOfMap: {
    lat: number;
    lng: number;
  };
  zoomNo: number;
  mode: "Trip System" | "Dashboard";
  dispatch: Dispatch<UnknownAction>;
}) => {
  const dispatch = useDispatch();
  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive
  );
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath
  );
  const liveVehicleItnaryWithPath = useSelector(
    (state: RootState) => state.liveVehicleData
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const selectedDashboardVehicle = useSelector(
    (state: RootState) => state.selectedDashboardVehicle
  );
  const isVehicleDetailsCollapsed = useSelector(
    (state: RootState) => state.isVehicleDetailsCollapsedSlice
  );
  const markers = useSelector((state: RootState) => state.markers);
  const poiData = useSelector((state: RootState) => state.poiData);

  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const { isLoadingScreenActive, containerStyle, selectedMapTypeId } =
    useSelector((state: RootState) => state.map);
  const isDashboardVehicleDetailsSearchTriggered = useSelector(
    (state: RootState) => state.isDashboardVehicleDetailsSearchTriggered
  );
  const checkInData = useSelector((state: RootState) => state.checkIndData);

  const { isGetNearbyVehiclesActive } = useSelector(
    (state: RootState) => state.nearbyVehicles
  );
  const { userId, parentUser } = useSelector((state: RootState) => state.auth);

  const isGetVehicleCurrentLocationLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q &&
        q.endpointName === "getVehicleCurrentLocation" &&
        q.status === "pending"
    )
  );

  const isPathWithDateDaignosticLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q &&
        q.endpointName === "getpathwithDateDaignostic" &&
        q.status === "pending"
    )
  );

  const { type } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive
  );

  const [loadingStartDate, setLoadingStartDate] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [poiUpdating, setPoiUpdating] = useState(false);
  const [map, setMap] = useState<google.maps.Map>();
  const [bounds, setBounds] = useState<{
    north: number | null;
    east: number | null;
    south: number | null;
    west: number | null;
  } | null>(null);
  const polylineRef = useRef<Polyline>(null);
  const livePolylineRef = useRef<Polyline>(null);
  const [prevSelectedVehicleVid, setPrevSelectedVehicleVid] = useState(0);
  const [isFloatSettingButtons, setIsFloatSettingButtons] = useState(false);

  const [manualReRenderMapLoader, setManualReRenderMapLoader] = useState(false);

  const [checked, setChecked] = useState("");
  const [infoWindowState, setInfoWindowState] = useState({
    index: -1,
    lat: 0,
    lng: 0,
    state: false,
  });

  useEffect(() => {
    if (checked === "loading") {
      setLoading(true);
      setLoadingStartDate(Date.now());
      setChecked("");
    } else {
      setLoading(true);
      const timeElapsed = Date.now() - loadingStartDate;
      if (timeElapsed <= 500) {
        setTimeout(() => setLoading(false), 1);
      } else if (timeElapsed <= 1000) {
        setTimeout(() => setLoading(false), 1);
      } else if (timeElapsed <= 1500) {
        setTimeout(() => setLoading(false), 1);
      } else if (timeElapsed <= 2000) {
        setTimeout(() => setLoading(false), 1);
      } else {
        setLoading(false);
      }
      setLoadingStartDate(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, selectedVehicle]);

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

  const livePolylineOptions = {
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
    path: liveVehicleItnaryWithPath.patharry,
    zIndex: 1,
  };

  useEffect(() => {
    if (map) {
      const poiLatLng = {
        lat: 28.596511840820312,
        lng: 77.41309356689453,
      };

      const timeout = setTimeout(() => {
        map.setCenter(poiLatLng);
        map.panTo(poiLatLng);
        map.setZoom(16);

        dispatch(setCenterOfMap(poiLatLng));
        dispatch(setZoomNo(16));
      }, 500); // Delay to ensure map is mounted

      return () => clearTimeout(timeout);
    }
  }, [map, dispatch]);

  useEffect(() => {
    let bounds = new window.google.maps.LatLngBounds();
    if (createTripOrPlanningTripActive === "") {
      if (map && selectedDashboardVehicle.length === 0) {
        if (selectedVehicle.vId === 0) {
          if (markers.length > 0) {
            for (var i = 0; i < markers.length; i++) {
              bounds.extend(
                new window.google.maps.LatLng(
                  markers[i].gpsDtl.latLngDtl.lat,
                  markers[i].gpsDtl.latLngDtl.lng
                )
              );
            }
            map.fitBounds(bounds);
          } else {
            map.panTo({ lat: 21.7679, lng: 78.8718 });
          }
        } else if (selectedVehicle.vId !== 0) {
          if (!isGetVehicleCurrentLocationLoading) {
            if (isCheckInAccount(Number(userId))) {
              if (checkInData.length > 0) {
                for (var i = 0; i < checkInData.length; i++) {
                  bounds.extend(
                    new window.google.maps.LatLng(
                      checkInData[i].gps_latitude,
                      checkInData[i].gps_longitude
                    )
                  );
                }
                map.fitBounds(bounds);
              }
            } else if (historyReplay.isHistoryReplayMode) {
              if (vehicleItnaryWithPath.patharry.length > 0) {
                for (
                  var i = 0;
                  i < vehicleItnaryWithPath.patharry.length;
                  i++
                ) {
                  bounds.extend(
                    new window.google.maps.LatLng(
                      vehicleItnaryWithPath.patharry[i].lat,
                      vehicleItnaryWithPath.patharry[i].lng
                    )
                  );
                }
                map.fitBounds(bounds);
              }
            } else {
              const filteredMarker = markers.find(
                (marker) => marker.vId === selectedVehicle.vId
              );
              if (!filteredMarker) return;
              const { lat, lng } = filteredMarker.gpsDtl.latLngDtl;

              map.setCenter({ lat, lng });
              map.panTo({ lat, lng });
              map.setZoom(16);
              dispatch(setCenterOfMap({ lat, lng }));
              dispatch(setZoomNo(16));
            }
          }
        }
      } else if (map) {
        if (selectedVehicle.vId === 0) {
          if (selectedDashboardVehicle.length === 1) {
            const filteredMarker = markers.find(
              (marker) =>
                marker.vId === selectedDashboardVehicle[0].vehicleData.vId
            );
            if (!filteredMarker) return;
            const { lat, lng } = filteredMarker.gpsDtl.latLngDtl;

            map.setCenter({ lat, lng });
            map.panTo({ lat, lng });
            map.setZoom(16);
            dispatch(setCenterOfMap({ lat, lng }));
            dispatch(setZoomNo(16));
          } else if (selectedDashboardVehicle.length > 1) {
            for (var i = 0; i < selectedDashboardVehicle.length; i++) {
              const currentMarker = markers.find(
                (marker) =>
                  marker.vId === selectedDashboardVehicle[i].vehicleData.vId
              );
              if (!currentMarker) return;
              bounds.extend(
                new window.google.maps.LatLng(
                  currentMarker.gpsDtl.latLngDtl.lat,
                  currentMarker.gpsDtl.latLngDtl.lng
                )
              );
            }
            map.fitBounds(bounds);
            isDashboardVehicleDetailsSearchTriggered <= 1
              ? dispatch(setIsDashboardVehicleDetailsSearchTriggeredActive())
              : dispatch(setIsDashboardVehicleDetailsSearchTriggeredInActive());
          } else if (markers.length > 0) {
            const filteredMarker = markers.find(
              (marker) =>
                marker.vId === selectedDashboardVehicle[0].vehicleData.vId
            );
            if (!filteredMarker) return;
            const { lat, lng } = filteredMarker.gpsDtl.latLngDtl;

            map.setCenter({ lat, lng });
            map.panTo({ lat, lng });
            dispatch(setCenterOfMap({ lat, lng }));
          } else {
            map.setCenter({ lat: 21.7679, lng: 78.8718 });
            map.panTo({ lat: 21.7679, lng: 78.8718 });
            dispatch(setCenterOfMap({ lat: 21.7679, lng: 78.8718 }));
          }
        } else if (selectedVehicle.vId !== 0) {
          if (!isGetVehicleCurrentLocationLoading) {
            const filteredMarker = markers.find(
              (marker) => marker.vId === selectedVehicle.vId
            );
            if (!filteredMarker) return;
            const { lat, lng } = filteredMarker.gpsDtl.latLngDtl;

            map.setCenter({ lat, lng });
            map.panTo({ lat, lng });
            dispatch(setCenterOfMap({ lat, lng }));
            historyReplay.isHistoryReplayMode ? null : dispatch(setZoomNo(16));
            historyReplay.isHistoryReplayMode ? null : map.setZoom(16);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedVehicle, selectedDashboardVehicle, type, checkInData]);

  useEffect(() => {
    if (
      selectedVehicle &&
      selectedVehicle?.vId &&
      selectedVehicle.vId !== 0 &&
      createTripOrPlanningTripActive !== "" &&
      map
    ) {
      map?.setCenter({
        lat: selectedVehicle.gpsDtl.latLngDtl.lat,
        lng: selectedVehicle.gpsDtl.latLngDtl.lng,
      });
      dispatch(
        setCenterOfMap({
          lat: selectedVehicle.gpsDtl.latLngDtl.lat,
          lng: selectedVehicle.gpsDtl.latLngDtl.lng,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle]);

  useEffect(() => {
    if (prevSelectedVehicleVid !== selectedVehicle.vId) {
      if (isPathWithDateDaignosticLoading) {
        setManualReRenderMapLoader(true);
      } else if (!isPathWithDateDaignosticLoading) {
        setManualReRenderMapLoader(false);
        setPrevSelectedVehicleVid(selectedVehicle.vId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPathWithDateDaignosticLoading]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    const trafficLayer = new window.google.maps.TrafficLayer();

    trafficLayer.setMap(map);
    setMap(map);
  }, []);

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
    if (historyReplay.isHistoryReplayMode) {
      dispatch(resetLiveVehicleItnaryWithPath());
    }
    setPoiUpdating(true);

    setTimeout(() => setPoiUpdating(false), 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyReplay.isHistoryReplayMode]);

  useEffect(() => {
    if (
      createTripOrPlanningTripActive === "" &&
      selectedDashboardVehicle.length === 0 &&
      selectedVehicle.vId === 0
    ) {
      setPoiUpdating(true);
      setTimeout(() => setPoiUpdating(false), 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiData.selectedPOI, selectedVehicle, markers]);

  return (
    <>
      {mode === "Dashboard" ? (
        <GoogleMap
          mapContainerStyle={{
            ...containerStyle,
            width: containerStyle.width,
          }}
          center={centerOfMap}
          onIdle={onIdle}
          zoom={zoomNo}
          onLoad={onLoad}
          options={{
            mapTypeControl: false,
            mapTypeId: selectedMapTypeId,
            fullscreenControl: true,
            draggable: true,
          }}
        >
          <InfoBanner />
          <MapTypeController />

          {isGetNearbyVehiclesActive &&
          selectedVehicle.nearbyVehicles &&
          selectedVehicle.nearbyVehicles.length > 0 ? (
            <NearbyVehiclesMarker />
          ) : createTripOrPlanningTripActive !== "" ? (
            <CreateTripOrPlanMarker />
          ) : (
            <Markers />
          )}

          {isCheckInAccount(Number(userId)) ? (
            <>{selectedVehicle.vId === 0 ? null : <CheckInMarkers />}</>
          ) : (
            <>
              {selectedVehicle.vId &&
              vehicleItnaryWithPath.patharry &&
              vehicleItnaryWithPath.patharry.length >= 2 &&
              !isGetNearbyVehiclesActive ? (
                <>
                  <StartAndEndPointMarker />
                  {historyReplay.isHistoryReplayMode ? (
                    <Polyline options={polylineOptions} ref={polylineRef} />
                  ) : (
                    <Polyline
                      options={livePolylineOptions}
                      ref={livePolylineRef}
                    />
                  )}
                </>
              ) : null}

              <PoiMarkers bounds={bounds} />

              {!isGetNearbyVehiclesActive &&
              selectedVehicle.selectedVehicleHistoryTab === "Alerts" ? (
                <AlertMarkers />
              ) : null}

              {!isGetNearbyVehiclesActive &&
              (selectedVehicle.selectedVehicleHistoryTab === "All" ||
                selectedVehicle.selectedVehicleHistoryTab === "Stoppages" ||
                selectedVehicle.selectedVehicleHistoryTab === "Running" ||
                selectedVehicle.selectedVehicleHistoryTab === "Diagnostic") ? (
                <StoppageMarkers />
              ) : null}

              {/* Marker on polyline hover for amanbus, kmt, kmtggn, mehtas and girirajtours */}
              {(Number(userId) === 3356 ||
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

              <HistoryReplayMarker />
              <HistoryReplaySlider />

              <PolygonDrawingOptions map={map} />

              <FloatButton.Group
                open={isFloatSettingButtons}
                trigger="click"
                onClick={() => setIsFloatSettingButtons(!isFloatSettingButtons)}
                style={{ insetInlineEnd: 10, insetBlockEnd: 200 }}
                icon={<SettingOutlined />}
              >
                {/* <HistoryReplayToggle /> */}
                <PoiToggle checked={checked} setChecked={setChecked} />
                <PolygonToggle />
                {/* {selectedVehicle.vId !== 0 ? <NearbyVehiclesToggle /> : null} */}
                {/* {selectedVehicle.vId === 0 ? <ClusterToggle setLoading={setManualReRenderMapLoader} /> : null} */}
              </FloatButton.Group>
            </>
          )}
        </GoogleMap>
      ) : (
        <></>
      )}
    </>
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
