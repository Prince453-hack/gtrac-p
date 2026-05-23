"use client";

import { Circle, InfoBox, Polygon } from "@/@react-google-maps/api";
import React, { Dispatch, useEffect, useState } from "react";
import { GetAllPoiListResponseList } from "./CustomGoogleMapInstance";
import { EditFilled } from "@ant-design/icons";
import { Button, Input, Modal, Tooltip } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useLazyEditPOIQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { Geofence } from "@/app/_globalRedux/dashboard/poiSlice";

const circleOptions = {
  content: "123",
  boxStyle: {
    border: "1px solid black",
    textAlign: "center",
    fontSize: "100pt",
    width: "50px",
  },
  fillColor: "#04A144",
  fillOpacity: 0.3,
  strokeWeight: 2,
  strokeColor: "#027832",
  clickable: false,
  editable: false,
  zIndex: 1,
};

export const PoiMarkers = ({
  bounds,
}: {
  bounds: {
    north: number | null;
    east: number | null;
    south: number | null;
    west: number | null;
  } | null;
}) => {
  const poiData = useSelector((state: RootState) => state.poiData);

  const [hover, setHover] = useState(-1);
  const [poiOpenIndex, setPoiIndex] = useState(-1);

  const togglePoiEditModal = (index: number) => {
    setPoiIndex(index);
  };

  // Filter only visible POIs
  const visiblePoi = poiData.poi.filter((item) => {
    if (
      !bounds ||
      !bounds.east ||
      !bounds.north ||
      !bounds.south ||
      !bounds.west
    )
      return true;
    return (
      item.gps_latitude <= bounds.north &&
      item.gps_latitude >= bounds.south &&
      item.gps_longitude <= bounds.east &&
      item.gps_longitude >= bounds.west
    );
  });

  const visibleGeofence = poiData.geofenceList.filter((item) => {
    return item.points.some((point) => {
      if (
        !bounds ||
        !bounds.east ||
        !bounds.north ||
        !bounds.south ||
        !bounds.west
      )
        return true;
      return (
        point.gps_latitude <= bounds.north &&
        point.gps_latitude >= bounds.south &&
        point.gps_longitude <= bounds.east &&
        point.gps_longitude >= bounds.west
      );
    });
  });

  return (
    <>
      {visiblePoi && visiblePoi.length ? (
        visiblePoi
          .filter(
            (item) =>
              poiData.selectedPOI.id === -1 ||
              item.id === poiData.selectedPOI.id
          )
          .map((item, index) => (
            <React.Fragment key={item.id}>
              <Circle
                center={{ lat: item.gps_latitude, lng: item.gps_longitude }}
                radius={item.gps_radius}
                options={circleOptions}
              />
              <InfoBox
                visible={true}
                position={
                  new google.maps.LatLng(item.gps_latitude, item.gps_longitude)
                }
                options={{
                  boxStyle: { overflow: "visible" },
                  disableAutoPan: true,
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    background: "#04A144",
                    padding: "4px",
                    borderRadius: "4px",
                    position: "absolute",
                    left: "-20px",
                    width: "fit-content",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer",
                    color: "#fff",
                  }}
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(-1)}
                >
                  <Tooltip
                    title={`Name: ${item.name || ""},\nRadius: ${
                      item.gps_radius
                    }`}
                    mouseEnterDelay={1}
                  >
                    <p>{item.name ? item.name.substring(0, 20) : ""}</p>
                  </Tooltip>
                  <Tooltip title="Edit POI" mouseEnterDelay={1}>
                    <div
                      style={{
                        opacity: index === hover ? 1 : 0,
                        transition: "opacity 0.3s",
                      }}
                      onClick={() => togglePoiEditModal(item.id)}
                    >
                      <EditFilled style={{ color: "#fff" }} />
                    </div>
                  </Tooltip>
                </div>
              </InfoBox>
              <EditPoi
                poiData={item}
                poiIndex={poiOpenIndex}
                setPoiIndex={setPoiIndex}
              />
            </React.Fragment>
          ))
      ) : (
        <></>
      )}

      {visibleGeofence && visibleGeofence.length ? (
        visibleGeofence
          .filter(
            (item) =>
              item.points.length > 0 &&
              (poiData.selectedPOI.id === -1 ||
                item.id === poiData.selectedPOI.id)
          )
          .map((item: Geofence, index) => {
            return (
              <>
                <Polygon
                  paths={item.points.map((point) => {
                    return new google.maps.LatLng({
                      lat: point.gps_latitude,
                      lng: point.gps_longitude,
                    });
                  })}
                  options={{
                    strokeColor: "#027832",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#027832",
                    fillOpacity: 0.35,
                    clickable: false,
                    editable: false,
                    zIndex: 1,
                  }}
                ></Polygon>
                <InfoBox
                  visible={true}
                  key={index}
                  position={
                    new google.maps.LatLng({
                      lat: item.points[0].gps_latitude,
                      lng: item.points[0].gps_longitude,
                    })
                  }
                  options={{
                    boxStyle: {
                      overflow: "visible",
                    },
                    disableAutoPan: true,
                  }}
                >
                  <>
                    <div
                      style={{
                        fontWeight: "700",
                        background: "#04A144",
                        padding: "4px",
                        borderRadius: "4px",
                        border: "0",
                        textWrap: "nowrap",
                        zIndex: 0,
                        position: "absolute",
                        left: "-20px",
                        width: "fit-content",
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "space-between",
                        gap: "5px",
                        cursor: "pointer",
                        color: "#fff",
                      }}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(-1)}
                    >
                      <Tooltip
                        title={`Name: ${
                          item.name ? item.name.substring(0, 20) : ""
                        }`}
                        mouseEnterDelay={1}
                      >
                        <p>{item.name ? item.name.substring(0, 20) : ""}</p>
                      </Tooltip>
                    </div>
                  </>
                </InfoBox>
              </>
            );
          })
      ) : (
        <></>
      )}
    </>
  );
};

const EditPoi = ({
  poiData,
  poiIndex,
  setPoiIndex,
}: {
  poiData: GetAllPoiListResponseList;
  poiIndex: number;
  setPoiIndex: Dispatch<React.SetStateAction<number>>;
}) => {
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const [triggerEditPoi] = useLazyEditPOIQuery();

  const [promiseLoading, setPromiseLoading] = useState(false);
  const [radius, setRadius] = useState(0);
  const [poiName, setPoiName] = useState("");
  const [latLng, setLatLng] = useState({
    lat: poiData.gps_latitude.toFixed(2),
    lng: poiData.gps_longitude.toFixed(2),
  });

  useEffect(() => {
    setPoiName(poiData.name);
    setRadius(poiData.gps_radius);
  }, [poiData]);

  const onFinish = () => {
    setPromiseLoading(true);
    triggerEditPoi({
      userId,
      poiName,
      radius,
      lat: Number(latLng.lat),
      lng: Number(latLng.lng),
      poiId: poiData.id,
    }).then(() => {
      setPromiseLoading(false);
      setPoiIndex(-1);
    });
  };

  return (
    <Modal
      title="Edit POI"
      open={poiIndex === poiData.id}
      onCancel={() => setPoiIndex(-1)}
      width={400}
      footer={null}
    >
      <div
        style={{
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
        className="select-none"
      >
        <div className="text-sm text-neutral-800 flex flex-col gap-2 mt-3 overflow-clip rounded-lg font-medium">
          <div className=" pb-3 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="font-bold">Name :</div>
              <div className="col-span-2">
                <Input
                  placeholder="Enter POI's Name"
                  value={poiName}
                  onChange={(e) => setPoiName(e.target.value)}
                />
              </div>

              <div className="font-bold">Radius :</div>
              <div className="col-span-2">
                <Input
                  placeholder="Enter Radius in KM"
                  value={radius}
                  onChange={(e) =>
                    !isNaN(Number(e.target.value)) &&
                    setRadius(Number(e.target.value))
                  }
                />
              </div>

              <div className="font-bold">Latitude :</div>
              <div className="col-span-2">
                <Input
                  value={latLng.lat}
                  onChange={(e) =>
                    setLatLng({ ...latLng, lat: e.target.value })
                  }
                />
              </div>

              <div className="font-bold">Longitude :</div>
              <div className="col-span-2">
                <Input
                  value={latLng.lng}
                  onChange={(e) =>
                    setLatLng({ ...latLng, lng: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="primary"
            onClick={() => onFinish()}
            loading={promiseLoading}
            disabled={
              !poiName && !radius && !latLng.lat && !latLng.lng && !userId
            }
          >
            Submit
          </Button>

          <Button onClick={() => setPoiIndex(-1)}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};
