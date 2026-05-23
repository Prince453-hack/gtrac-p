"use client";

import { useEffect } from "react";
import {
  setCenter,
  setCircle,
  setCoordinates,
  setDrawingManager,
  setIsCreatePoiModalOpen,
  setName,
  setPolygon,
  setRadius,
} from "@/app/_globalRedux/dashboard/createPoi";
import { setIsLoadingScreenActive } from "@/app/_globalRedux/dashboard/mapSlice";
import { setGeoFence, setPoiData } from "@/app/_globalRedux/dashboard/poiSlice";
import {
  useCreateGeofenceMutation,
  useLazyCreatePOIQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { Button, Input, message, Modal } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

// Helper function to call geosync endpoint
const callGeosyncRadius = async (userId: string | number) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/callGeosyncradis?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn(
        "Geosync call failed:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Geosync call successful");
    }
  } catch (error) {
    console.error("Error calling geosync:", error);
  }
};

function PolygonDrawingOptions({ map }: { map: any }) {
  const { shape, isCreatePoi, isCreatePoiModalOpen } = useSelector(
    (state: RootState) => state.createPoi
  );
  const dispatch = useDispatch();
  const drawingManagerRef =
    React.useRef<google.maps.drawing.DrawingManager | null>(null);

  useEffect(() => {
    if (!map) return;

    if (isCreatePoi) {
      if (!drawingManagerRef.current) {
        const dm = new google.maps.drawing.DrawingManager({
          drawingControl: false,
          polygonOptions: {
            editable: false,
            strokeColor: "#478C81",
            strokeWeight: 3,
            fillColor: "#478C81",
            fillOpacity: 0.3,
          },
          circleOptions: {
            editable: false,
            strokeColor: "#478C81",
            strokeWeight: 3,
            fillColor: "#478C81",
            fillOpacity: 0.3,
          },
        });
        dm.setMap(map);

        drawingManagerRef.current = dm;
        dispatch(setDrawingManager(dm));
      }
      drawingManagerRef.current.setDrawingMode(shape);

      const onOverlayComplete = (event: any) => {
        const overlay = event.overlay;
        if (event.type === "polygon") {
          const path = overlay.getPath().getArray();
          const coordinates = path.map((latLng: any) => ({
            lat: latLng.lat(),
            lng: latLng.lng(),
          }));
          dispatch(setCoordinates(coordinates));
          dispatch(setPolygon(overlay));
        } else if (event.type === "circle") {
          const center = overlay.getCenter();
          const radius = overlay.getRadius();
          dispatch(setCenter({ lat: center.lat(), lng: center.lng() }));
          dispatch(setRadius(radius));
          dispatch(setCircle(overlay));
        }
        dispatch(setIsCreatePoiModalOpen(true));
        drawingManagerRef.current &&
          drawingManagerRef.current.setDrawingMode(null);
      };

      google.maps.event.addListener(
        drawingManagerRef.current,
        "overlaycomplete",
        onOverlayComplete
      );

      return () => {
        drawingManagerRef.current &&
          google.maps.event.clearListeners(
            drawingManagerRef.current,
            "overlaycomplete"
          );
      };
    } else {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
    }
  }, [isCreatePoi, shape, map, dispatch]);

  useEffect(() => {
    if (isCreatePoi && !isCreatePoiModalOpen && drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(shape);
    }
  }, [isCreatePoi, isCreatePoiModalOpen, shape]);

  return (
    <div>
      {isCreatePoi ? (
        <>
          <PolygonDrawingModal />
        </>
      ) : null}
    </div>
  );
}

export default PolygonDrawingOptions;

const Subtitle = ({ title }: { title: any }) => (
  <h3 className="font-semibold">{title}</h3>
);
const DataSet = ({
  title,
  dataSet,
}: {
  title: string;
  dataSet: number | string;
}) => (
  <div className="flex gap-3 items-center">
    <Subtitle title={title} />
    {dataSet}
  </div>
);

const PolygonDrawingModal = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const createMessage = ({ type, content }: { type: any; content: string }) => {
    messageApi.open({
      type: type,
      content,
    });
  };

  const { userId, groupId } = useSelector((state: RootState) => state.auth);
  const {
    isCreatePoiModalOpen,
    shape,
    center,
    coordinates,
    radius,
    name,
    circle,
    polygon,
  } = useSelector((state: RootState) => state.createPoi);
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
    dispatch(setCenter({ lat: 0, lng: 0 }));
    dispatch(setRadius(0));
    dispatch(setCoordinates([]));
    dispatch(setName(""));
    circle?.setVisible(false);
    polygon?.setVisible(false);
    dispatch(setPolygon(null));
    dispatch(setCircle(null));
    dispatch(setIsCreatePoiModalOpen(false));
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

        // Call geosync endpoint after successful polygon POI creation
        await callGeosyncRadius(userId);

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

        // Also add to regular POI list with center coordinates
        dispatch(
          setPoiData({
            poi: [
              ...poi,
              {
                name: name,
                gps_latitude: coordinates[0].lat,
                gps_longitude: coordinates[0].lng,
                gps_radius: 1000,
                sys_user_id: Number(userId),
                id: Math.random() * 100,
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

        // Call geosync endpoint after successful circle POI creation
        await callGeosyncRadius(userId);

        dispatch(
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
        );
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
        open={isCreatePoiModalOpen}
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
                    onChange={(e) => dispatch(setName(e.target.value))}
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
                    onChange={(e) => dispatch(setName(e.target.value))}
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
            <div className="flex gap-3 items-center">
              <Subtitle title={"Radius: "} />
              <div className="flex gap-5 items-center">
                <div className="border-b-[1px]  border-neutral-300 px-0.5">
                  <Input
                    type="number"
                    variant="borderless"
                    value={radius}
                    onChange={(e) =>
                      dispatch(setRadius(Number(e.target.value)))
                    }
                    styles={{ input: { padding: 0 } }}
                    min={1}
                  />
                </div>
                <span className="text-sm text-gray-500">meters</span>
              </div>
            </div>
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
