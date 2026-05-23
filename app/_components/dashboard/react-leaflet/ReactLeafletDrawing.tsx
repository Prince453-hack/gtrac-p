"use client";

import {
  setIsCreateOlPoiModalOpen,
  setOlCenter,
  setOlCoordinates,
  setOlName,
  setOlPoiShape,
  setOlRadius,
} from "@/app/_globalRedux/dashboard/createOlPoi";
import { setIsLoadingScreenActive } from "@/app/_globalRedux/dashboard/mapSlice";
import { setCenterOfMap } from "@/app/_globalRedux/dashboard/olMapSlice";
import { setGeoFence, setPoiData } from "@/app/_globalRedux/dashboard/poiSlice";
import {
  useCreateGeofenceMutation,
  useLazyCreatePOIQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { Button, Input, message, Modal } from "antd";
import { NoticeType } from "antd/es/message/interface";
import React from "react";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { useDispatch, useSelector } from "react-redux";

export const ReactLeafletDrawing = () => {
  const { isCreatePoi } = useSelector((state: RootState) => state.createPoi);
  const { isOlMapActive } = useSelector((state: RootState) => state.olMap);
  const dispatch = useDispatch();

  const onCreated = (e: any) => {
    if (e.layerType === "circle") {
      const circleBounds = e.layer.options.radius;
      dispatch(setIsCreateOlPoiModalOpen(true));

      dispatch(
        setOlCenter({
          lat: e.layer._latlng.lat || 0,
          lng: e.layer._latlng.lng || 0,
        })
      );
      dispatch(setOlRadius(circleBounds));
      dispatch(setOlPoiShape("circle"));
    } else if (e.layerType === "polygon") {
      dispatch(setIsCreateOlPoiModalOpen(true));

      const polygonBounds = e.layer.editing.latlngs[0][0];

      const bounds = [];
      for (var i = 0; i < polygonBounds.length; i++) {
        var point = {
          lat: polygonBounds[i].lat,
          lng: polygonBounds[i].lng,
        };
        bounds.push(point);
      }

      dispatch(setOlCoordinates(bounds));
      dispatch(setOlPoiShape("polygon"));
    }
  };

  return (
    <>
      {isCreatePoi && isOlMapActive ? (
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={onCreated}
            draw={{
              rectangle: false,
              marker: false,
              circlemarker: false,
              polyline: false,
            }}
          />
          <PolygonDrawingModal />
        </FeatureGroup>
      ) : null}
    </>
  );
};

const Subtitle = ({ title }: { title: string }) => (
  <h3 className="font-semibold">{title}</h3>
);
const DataSet = ({ title, dataSet }: { title: string; dataSet: any }) => (
  <div className="flex gap-3 items-center">
    <Subtitle title={title} />
    {dataSet}
  </div>
);

export const PolygonDrawingModal = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const createMessage = ({
    type,
    content,
  }: {
    type: NoticeType;
    content: string;
  }) => {
    messageApi.open({
      type: type,
      content,
    });
  };

  const poiData = useSelector((state: RootState) => state.poiData);
  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const {
    isCreateOlPoiModalOpen,
    shape,
    center,
    coordinates,
    radius,
    name,
    drawingManager,
  } = useSelector((state: RootState) => state.createOlPoi);
  const { poi, geofenceList } = useSelector(
    (state: RootState) => state.poiData
  );

  const dispatch = useDispatch();

  const [createGeofence, { isLoading: isCreateGeofenceLoading }] =
    useCreateGeofenceMutation();
  const [triggerCreatePOI, { isLoading: isCreatePOILoading }] =
    useLazyCreatePOIQuery();

  const [error, setError] = React.useState("");

  const cancelDrawingPoi = () => {
    dispatch(setCenterOfMap({ lat: 0, lng: 0 }));
    dispatch(setOlRadius(0));
    dispatch(setOlCoordinates([]));
    dispatch(setOlName(""));
    dispatch(setIsCreateOlPoiModalOpen(false));
  };

  const createPoi = async () => {
    try {
      if (shape === "polygon") {
        await createGeofence({
          userid: Number(userId),
          points: coordinates,
          radius: 1000,
          poi: name,
          lat: coordinates[0].lat,
          lng: coordinates[0].lng,
        });
        createMessage({
          type: "success",
          content: "POI created successfully!",
        });
        let tempCords = coordinates.map((item) => {
          return { gps_latitude: item.lat, gps_longitude: item.lng };
        });
        dispatch(
          setGeoFence({
            geofenceList: [
              ...geofenceList,
              {
                name: name,
                points: tempCords,
                id: Math.random() * 100,
                typeId: 24,
              },
            ],
          })
        );
      } else if (shape === "circle") {
        await triggerCreatePOI({
          poiName: name,
          radius: radius,
          lat: center.lat,
          long: center.lng,
          userId: userId,
          isGeofence: 0,
        });
        createMessage({
          type: "success",
          content: "POI created successfully!",
        });
        {
          poiData.poi.length > 0
            ? dispatch(
                setPoiData({
                  poi: [
                    ...poi,
                    {
                      name: name,
                      gps_latitude: center.lat,
                      gps_longitude: center.lng,
                      gps_radius: radius,
                      sys_user_id: Number(userId),
                      id: Math.random() * 100,
                    },
                  ],
                })
              )
            : null;
        }
      }

      cancelDrawingPoi();

      dispatch(setIsLoadingScreenActive(true));

      setTimeout(() => dispatch(setIsLoadingScreenActive(false)), 1);
    } catch (err) {
      createMessage({
        type: "error",
        content: "Something went wrong, please try again!",
      });
    }
  };
  return (
    <>
      {contextHolder}
      <Modal
        title={`Create ${
          (shape?.toUpperCase().split("")[0] ?? "") +
          (shape?.toLowerCase().slice(1) ?? "")
        }`}
        open={isCreateOlPoiModalOpen}
        onCancel={() => {
          cancelDrawingPoi();
        }}
        footer={null}
      >
        {shape === "polygon" ? (
          <div className="space-y-2">
            <div className="flex gap-3 items-center">
              <Subtitle title={"Name: "} />
              <div className="flex gap-5 items-center">
                <div className="border-b-[1px]  border-neutral-300 px-0.5">
                  <Input
                    type="text"
                    variant="borderless"
                    value={name}
                    onChange={(e) => dispatch(setOlName(e.target.value))}
                    styles={{ input: { padding: 0 } }}
                  />
                </div>
                {error ? (
                  <p className="text-red-500 text-xs">{error}</p>
                ) : (
                  <p className="text-red-500 text-xs"></p>
                )}
              </div>
            </div>
            <Subtitle title={"Coordinates: "} />
            {coordinates.map((coordinate) => {
              return (
                <div
                  key={coordinate.lat + coordinate.lng}
                  className="flex gap-5 items-center mb-2"
                >
                  <div className="w-[80px]">
                    <DataSet
                      title={"Lat: "}
                      dataSet={coordinate.lat?.toFixed(2)}
                    />
                  </div>
                  <div className="w-[80px]">
                    <DataSet
                      title={"Lng: "}
                      dataSet={coordinate.lng?.toFixed(2)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-3 items-center">
              <Subtitle title={"Name: "} />
              <div className="flex gap-5 items-center">
                <div className="border-b-[1px]  border-neutral-300 px-0.5">
                  <Input
                    type="text"
                    variant="borderless"
                    value={name}
                    onChange={(e) => dispatch(setOlName(e.target.value))}
                    styles={{ input: { padding: 0 } }}
                  />
                </div>
                {error ? (
                  <p className="text-red-500 text-xs">{error}</p>
                ) : (
                  <p className="text-red-500 text-xs"></p>
                )}
              </div>
            </div>

            <Subtitle title={"Center: "} />

            <div className="flex gap-2 items-center">
              <div className="w-[80px]">
                <DataSet title={"Lat: "} dataSet={center.lat?.toFixed(2)} />
              </div>
              <div className="w-[80px]">
                <DataSet title={"Lng: "} dataSet={center.lng?.toFixed(2)} />
              </div>
            </div>
            <DataSet title={"Radius: "} dataSet={radius} />
          </div>
        )}
        <div className="space-x-3 flex justify-end mt-5">
          <Button onClick={() => cancelDrawingPoi()}>Close</Button>

          <Button
            type="primary"
            onClick={() => {
              if (name === "") {
                setError("Name is required");
              } else {
                createPoi();
              }
            }}
            loading={isCreatePOILoading || isCreateGeofenceLoading}
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
};
