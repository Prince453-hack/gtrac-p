"use client";

import { RootState } from "@/app/_globalRedux/store";
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import MultipleVehicleMarkers from "./MultipleVehicleMarkers";
import { setOlMap } from "@/app/_globalRedux/dashboard/olMapSlice";
import SelectedVehicleMarker from "./SelectedVehicleMarker";
import Image from "next/image";
import SelectedVehiclePolyline from "./SelectedVehiclePolyline";
import StartAndEndMarkers from "./StartAndEndMarkers";
import { ReactLeafletHistoryReplaySlider } from "./ReactLeafletHistoryReplaySlider";
import { FloatButton } from "antd";
import { HistoryReplayToggle } from "../HistoryReplayToggle";
import { PoiToggle } from "../PoiToggle";
import { PolygonToggle } from "../PolygonToggle";
import NearbyVehiclesToggle from "../nearbyVehicles/NearbyVehiclesToggle";
import { ClusterToggle } from "../ClusterToggle";
import { SettingOutlined } from "@ant-design/icons";
import { ReactLeafletPoiMarkers } from "./ReactLeafletPoiMarkers";
import { ReactLeafletDrawing } from "./ReactLeafletDrawing";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { ReactLeafletStoppageMarkers } from "./ReactLeafletStoppageMarkers";
import { ReactLeafletCreateTripOrPlanMarker } from "./ReactLeafletCreateTripOrPlanMarker";
import { PathArrayItem } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { iconFactory } from "./utils/iconFactory";
import { ReactLeafletNearbyVehiclesMarker } from "./ReactLeafletNearbyVehiclesMarker";
import { ReactLeafletAlertMarkers } from "./ReactLeafletAlertMarkers";
import ReactLeafletMapController from "./ReactLeafletMapController";
import { Map } from "leaflet";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { ReactLeafletCheckInMarkers } from "./ReactLeafletCheckInMarkers";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";

function ReactLeaflet() {
  const dispatch = useDispatch();
  const mapRef = useRef<Map | null>(null);

  const { containerStyle, centerOfMap, zoomNo } = useSelector(
    (state: RootState) => state.map,
  );
  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive,
  );
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath,
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const { isGetNearbyVehiclesActive } = useSelector(
    (state: RootState) => state.nearbyVehicles,
  );
  const { userId, parentUser } = useSelector((state: RootState) => state.auth);

  const { isLoadingScreenActive } = useSelector(
    (state: RootState) => state.map,
  );

  const isPathWithDateDaignosticLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q &&
        q.endpointName === "getpathwithDateDaignostic" &&
        q.status === "pending",
    ),
  );
  const isGetVehicleCurrentLocationLoading = useSelector((state: RootState) =>
    Object.values(state.allTripApi.queries).some(
      (q) =>
        q &&
        q.endpointName === "getVehicleCurrentLocation" &&
        q.status === "pending",
    ),
  );

  const isgetVehicleCurrentLocationFulfilledTimetampUndefined = useSelector(
    (state: RootState) =>
      Object.values(state.allTripApi.queries).some(
        (q) =>
          q &&
          q.endpointName === "getVehicleCurrentLocation" &&
          q.fulfilledTimeStamp === undefined,
      ),
  );

  const [manualReRenderMapLoader, setManualReRenderMapLoader] = useState(false);
  const [isFloatSettingButtons, setIsFloatSettingButtons] = useState(false);
  const [checked, setChecked] = useState("");

  const [poiUpdating, setPoiUpdating] = useState(false);

  useEffect(() => {
    dispatch(setOlMap(mapRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerStyle]);

  useEffect(() => {
    if (
      createTripOrPlanningTripActive !== "create-trip" &&
      createTripOrPlanningTripActive !== "trip-planning"
    ) {
      setPoiUpdating(true);

      setTimeout(() => setPoiUpdating(false), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerStyle.width]);

  const [prevSelectedVehicle, setPrevSelectedVehicle] =
    useState<VehicleData | null>(null);

  useEffect(
    () => {
      if (
        prevSelectedVehicle?.vId !== selectedVehicle.vId &&
        !isGetVehicleCurrentLocationLoading
      ) {
        setPrevSelectedVehicle(selectedVehicle);
        setManualReRenderMapLoader(true);
        setTimeout(() => setManualReRenderMapLoader(false), 3000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedVehicle, isGetVehicleCurrentLocationLoading],
  );

  return (
    <>
      {manualReRenderMapLoader ||
      isPathWithDateDaignosticLoading ||
      isLoadingScreenActive ||
      isgetVehicleCurrentLocationFulfilledTimetampUndefined ||
      (poiUpdating &&
        createTripOrPlanningTripActive !== "create-trip" &&
        createTripOrPlanningTripActive !== "trip-planning") ? (
        <div
          style={{
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            objectFit: "cover",
            position: containerStyle.position,
            float: containerStyle.float,
            height: containerStyle.height,
            width: containerStyle.width,
          }}
        >
          <Image
            src="/assets/images/map/indiaMap.png"
            width="2236"
            height="1560"
            alt="India Map"
            className="object-cover h-screen blur-[2px]"
          />
          <div className="absolute flex items-center justify-center">
            <span className="loader"></span>
          </div>
        </div>
      ) : (
        <div style={{ ...containerStyle, width: containerStyle.width }}>
          <MapContainer
            center={[centerOfMap.lat, centerOfMap.lng]}
            zoom={zoomNo}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
            fadeAnimation={true}
            ref={(ref) => {
              if (!mapRef.current) mapRef.current = ref;
            }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
            />
            (
            <>
              {isGetNearbyVehiclesActive &&
              selectedVehicle.nearbyVehicles &&
              selectedVehicle.nearbyVehicles.length > 0 ? (
                <ReactLeafletNearbyVehiclesMarker />
              ) : createTripOrPlanningTripActive !== "" ? (
                <ReactLeafletCreateTripOrPlanMarker />
              ) : (
                <>
                  <MultipleVehicleMarkers />
                  <SelectedVehicleMarker />
                </>
              )}
              <ReactLeafletMapController />

              {isCheckInAccount(Number(userId)) ? (
                <>
                  {selectedVehicle.vId === 0 ? null : (
                    <ReactLeafletCheckInMarkers />
                  )}
                </>
              ) : (
                <>
                  <StartAndEndMarkers />
                  <SelectedVehiclePolyline />
                  <ReactLeafletHistoryReplaySlider />
                  <ReactLeafletPoiMarkers />
                  <ReactLeafletDrawing />

                  {!isGetNearbyVehiclesActive &&
                  selectedVehicle.selectedVehicleHistoryTab === "Alerts" ? (
                    <ReactLeafletAlertMarkers />
                  ) : null}

                  {!isGetNearbyVehiclesActive &&
                  (selectedVehicle.selectedVehicleHistoryTab === "All" ||
                    selectedVehicle.selectedVehicleHistoryTab === "Stoppages" ||
                    selectedVehicle.selectedVehicleHistoryTab === "Running" ||
                    selectedVehicle.selectedVehicleHistoryTab ===
                      "Diagnostic") ? (
                    <ReactLeafletStoppageMarkers />
                  ) : null}
                </>
              )}

              {isCheckInAccount(Number(userId)) ? null : (
                <>
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
                          icon={iconFactory(
                            "/assets/images/map/vehicles/vehicle-red.png",
                          )}
                          opacity={0}
                        >
                          <PolylineMouseOverInfoWindow
                            infoWindowState={{
                              index,
                              lat: marker.lat,
                              lng: marker.lng,
                            }}
                            marker={marker}
                          />
                        </Marker>
                      ))
                    : null}

                  {
                    <FloatButton.Group
                      open={isFloatSettingButtons}
                      trigger="click"
                      onClick={() =>
                        setIsFloatSettingButtons(!isFloatSettingButtons)
                      }
                      style={{ insetInlineEnd: 10, insetBlockEnd: 50 }}
                      icon={<SettingOutlined />}
                    >
                      <HistoryReplayToggle />
                      <PoiToggle checked={checked} setChecked={setChecked} />
                      <PolygonToggle />
                      {selectedVehicle.vId !== 0 ? (
                        <NearbyVehiclesToggle />
                      ) : null}
                      {selectedVehicle.vId === 0 ? <ClusterToggle /> : null}
                    </FloatButton.Group>
                  }
                </>
              )}
            </>
          </MapContainer>
        </div>
      )}
    </>
  );
}

export default ReactLeaflet;

const PolylineMouseOverInfoWindow = ({
  infoWindowState,
  marker,
}: {
  infoWindowState: { index: number; lat: number; lng: number };
  marker: PathArrayItem;
}): JSX.Element => {
  return (
    <Popup position={{ lat: infoWindowState.lat, lng: infoWindowState.lng }}>
      <div className="text-xs text-gray-800 flex flex-col gap-1 w-80">
        <div className="mb-2 font-medium text-lg">Polyline Information</div>

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
    </Popup>
  );
};
