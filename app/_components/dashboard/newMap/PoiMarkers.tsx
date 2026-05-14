"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { useDebounceObj } from "@/app/hooks/useDebounce";
import { Button, Input, Modal, message, Table } from "antd";
import { GetAllPoiListResponseList } from "../CustomGoogleMapInstance";
import {
  useLazyEditPOIQuery,
  useUpdateGeofenceMutation,
} from "@/app/_globalRedux/services/trackingDashboard";
import { AppDispatch } from "@/app/_globalRedux/store";
import { isPointInsidePOI } from "@/lib/utils";
import { useDispatch } from "react-redux";
import {
  deleteCirclePoiThunk,
  deleteGeofencePoiThunk,
  deleteGeofencePointsOnlyThunk,
} from "@/app/_globalRedux/dashboard/deletePOI";
import {
  setPoiData,
  setGeoFence,
  setManualEditMode,
  setEditingPOI,
  initialPOIDropDownState,
} from "@/app/_globalRedux/dashboard/poiSlice";
import { setIsLoadingScreenActive } from "@/app/_globalRedux/dashboard/mapSlice";

// Helper function to call geosync endpoint
const callGeosyncRadius = async (userId: string | number) => {
  try {
    const response = await fetch(
      `https://gtrac.in:8089/trackingDashboard/callGeosyncradis?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.warn(
        "Geosync call failed:",
        response.status,
        response.statusText,
      );
    } else {
      console.log("Geosync call successful");
    }
  } catch (error) {
    console.error("Error calling geosync:", error);
  }
};

// Custom hook for POI data refresh
const usePoiRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPoiData = async () => {
    try {
      const state = (dispatch as any).getState();
      const userId = state.auth.userId;
      const parentUser = state.auth.parentUser;

      dispatch(setPoiData(initialPOIDropDownState));
      dispatch(setGeoFence(initialPOIDropDownState));
      dispatch(setIsLoadingScreenActive(true));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DASH_URL}/getAllPoiList?userid=${userId}&puserid=${parentUser}`,
      );
      const data = await res.json();

      dispatch(setPoiData({ poi: data.list || [] }));
      dispatch(setGeoFence({ geofenceList: data.geofenceList || [] }));

      setTimeout(() => {
        dispatch(setIsLoadingScreenActive(false));
        setRefreshKey((prev) => prev + 1);
      }, 100);
    } catch (err) {
      console.error("Failed to refresh POI data", err);
      dispatch(setIsLoadingScreenActive(false));
    }
  };

  return { refreshPoiData, refreshKey };
};

const createHtmlLabelMarker = (
  position: google.maps.LatLngLiteral,
  labelText: string,
  map: google.maps.Map,
  poi: GetAllPoiListResponseList,
  setSelectedPoiMarker: Dispatch<
    SetStateAction<GetAllPoiListResponseList | null>
  >,
  setShowHelloModal: Dispatch<SetStateAction<boolean>>,
  vehicleCount: number,
) => {
  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.cursor = "pointer";
  div.style.background = "#027832";
  div.style.color = "#fff";
  div.style.padding = "3px 9px";
  div.style.borderRadius = "6px";
  div.style.fontSize = "11px";
  div.style.fontWeight = "600";
  div.style.transform = "translate(-50%, -100%)";
  div.style.fontFamily = "-apple-system, 'Segoe UI', Roboto, sans-serif";
  div.className = "marker-label";

  // Text span
  const textSpan = document.createElement("span");
  textSpan.textContent = labelText;
  textSpan.style.marginRight = "4px";
  textSpan.onclick = (e) => {
    e.stopPropagation();
    setSelectedPoiMarker(poi);
  };

  // Pencil span
  const pencilSpan = document.createElement("span");
  pencilSpan.innerHTML = "⛶";
  pencilSpan.style.cursor = "pointer";
  pencilSpan.onclick = (e) => {
    e.stopPropagation();
    setShowHelloModal(true);
  };

  div.appendChild(textSpan);
  div.appendChild(pencilSpan);

  const overlay = new google.maps.OverlayView();
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes && panes.overlayMouseTarget) {
      panes.overlayMouseTarget.appendChild(div);
    }
  };
  overlay.draw = function () {
    const projection = this.getProjection();
    const pos = projection.fromLatLngToDivPixel(
      new google.maps.LatLng(position.lat, position.lng),
    );
    if (pos) {
      div.style.left = pos.x + "px";
      div.style.top = pos.y + "px";
      div.style.position = "absolute";
      div.style.transform = "translate(-50%, -100%)";
      div.style.zIndex = "10";
    }
  };
  overlay.onRemove = function () {
    if (div.parentNode) div.parentNode.removeChild(div);
  };
  overlay.setMap(map);

  return overlay;
};

const createGeofenceLabelMarker = (
  position: google.maps.LatLngLiteral,
  labelText: string,
  map: google.maps.Map,
  geofence: any,
  setSelectedPoiMarker: Dispatch<
    SetStateAction<GetAllPoiListResponseList | null>
  >,
  setShowHelloModal: Dispatch<SetStateAction<boolean>>,
  vehicleCount: number,
) => {
  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.cursor = "pointer";
  div.style.background = "#027832";
  div.style.color = "#fff";
  div.style.padding = "3px 9px";
  div.style.borderRadius = "6px";
  div.style.fontSize = "11px";
  div.style.fontWeight = "600";
  div.style.transform = "translate(-50%, -100%)";
  div.style.fontFamily = "-apple-system, 'Segoe UI', Roboto, sans-serif";
  div.className = "marker-label";

  // Text span
  const textSpan = document.createElement("span");
  textSpan.textContent = `${labelText} (${vehicleCount})`;
  textSpan.style.marginRight = "4px";
  textSpan.onclick = (e) => {
    e.stopPropagation();

    const poiFormat = {
      ...geofence,
      gps_latitude: geofence.points[0]?.gps_latitude ?? 0,
      gps_longitude: geofence.points[0]?.gps_longitude ?? 0,
      gps_radius: 0,
    };
    setSelectedPoiMarker(poiFormat);
  };

  // Pencil span for edit
  const pencilSpan = document.createElement("span");
  pencilSpan.innerHTML = "⛶";
  pencilSpan.style.cursor = "pointer";
  pencilSpan.onclick = (e) => {
    e.stopPropagation();
    setShowHelloModal(true);
  };

  div.appendChild(textSpan);
  div.appendChild(pencilSpan);

  const overlay = new google.maps.OverlayView();
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes && panes.overlayMouseTarget) {
      panes.overlayMouseTarget.appendChild(div);
    }
  };
  overlay.draw = function () {
    const projection = this.getProjection();
    const pos = projection.fromLatLngToDivPixel(
      new google.maps.LatLng(position.lat, position.lng),
    );
    if (pos) {
      div.style.left = pos.x + "px";
      div.style.top = pos.y + "px";
      div.style.position = "absolute";
      div.style.transform = "translate(-50%, -100%)";
      div.style.zIndex = "10";
    }
  };
  overlay.onRemove = function () {
    if (div.parentNode) div.parentNode.removeChild(div);
  };
  overlay.setMap(map);

  return overlay;
};

const PoiMarkersImperative = ({ bounds }: { bounds: any }) => {
  const [selectedPoiMarker, setSelectedPoiMarker] = useState<
    (GetAllPoiListResponseList & { points?: any[] }) | null
  >(null);
  const [poiForDetailsModal, setPoiForDetailsModal] = useState<
    (GetAllPoiListResponseList & { points?: any[] }) | null
  >(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHelloModal, setShowHelloModal] = useState(false);
  const [poiForVehicleModal, setPoiForVehicleModal] =
    useState<(GetAllPoiListResponseList & { points?: any[] }) | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { refreshPoiData, refreshKey } = usePoiRefresh();

  const poiData = useSelector((state: RootState) => state.poiData);
  const { userId } = useSelector((state: RootState) => state.auth);
  const selectedPOIIds = poiData.selectedPOIList || [];
  const { isManualEditMode, editingPOI } = poiData;

  const markers = useSelector((state: RootState) => state.markers);

  const allCoordinates = markers.map((vehicle) => {
    // @ts-ignore - addr property exists in runtime but not in type definition
    const address = vehicle.gpsDtl.latLngDtl.addr || "N/A";
    return {
      lat: vehicle.gpsDtl.latLngDtl.lat,
      lng: vehicle.gpsDtl.latLngDtl.lng,
      vehicleNumber: vehicle.vehReg,
      mode: vehicle.gpsDtl.mode,
      modeTime: vehicle.gpsDtl.modeTime,
      speed: vehicle.gpsDtl.speed,
      address,
    };
  });

  const vehiclesInsideSelectedPOIs = useMemo(() => {
    if (!window.google || !selectedPOIIds.length) return [];

    const circlePOIs = poiData.poi;

    const polygonPOIs = poiData?.geofenceList?.map((geo) => ({
      ...geo,
      gps_latitude: geo.points[0]?.gps_latitude ?? 0,
      gps_longitude: geo.points[0]?.gps_longitude ?? 0,
      gps_radius: 0,
    }));

    const selectedPOIs = [...circlePOIs, ...polygonPOIs].filter((poi) =>
      selectedPOIIds.includes(poi.id),
    );

    return allCoordinates.filter((vehicle) =>
      selectedPOIs.some((poi) => isPointInsidePOI(vehicle, poi)),
    );
  }, [selectedPOIIds, poiData, allCoordinates]);

  const vehiclesInsideModalPOI = useMemo(() => {
    if (!window.google || !poiForVehicleModal) return [];

    return allCoordinates.filter((vehicle) =>
      isPointInsidePOI(vehicle, poiForVehicleModal as any),
    );
  }, [poiForVehicleModal, allCoordinates]);

  const visiblePoi = useMemo(() => {
    return poiData?.poi?.filter((item) => {
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
  }, [poiData.poi, bounds]);

  const debouncePoi = useDebounceObj(visiblePoi, 500);
  const map = useMap();

  const visibleGeofence = useMemo(() => {
    return (
      poiData?.geofenceList?.filter((item) => {
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
      }) || []
    ); // Return empty array if geofenceList is undefined
  }, [poiData.geofenceList, bounds]);

  const debounceGeofence = useDebounceObj(visibleGeofence, 500);

  useEffect(() => {
    if (!map) return;

    // Don't render normal POIs when in manual edit mode
    if (isManualEditMode) return;

    const circles: google.maps.Circle[] = [];
    const geofenceMarkers: google.maps.Polygon[] = [];
    const markers: (google.maps.Marker | google.maps.OverlayView)[] = [];

    const circleOptions = {
      strokeColor: "#027832",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#027832",
      fillOpacity: 0.35,
      clickable: false,
      editable: false,
      zIndex: 1,
    };

    debouncePoi
      ?.filter((item) => {
        if (selectedPOIIds.length === 0) return true;
        return selectedPOIIds.includes(item.id);
      })
      .forEach((item) => {
        const circle = new google.maps.Circle({
          ...circleOptions,
          map,
          center: { lat: item.gps_latitude, lng: item.gps_longitude },
          radius: item.gps_radius,
        });
        circles.push(circle);

        const labelText = item.name?.substring(0, 20) || "Unnamed POI";
        const position = { lat: item.gps_latitude, lng: item.gps_longitude };

        const vehiclesInPOI = allCoordinates.filter((vehicle) =>
          isPointInsidePOI(vehicle, item),
        ).length;

        const labelMarker = createHtmlLabelMarker(
          position,
          labelText,
          map,
          item,
          setPoiForDetailsModal,
          (show) => {
            setPoiForVehicleModal(item);
            setShowHelloModal(show);
          },
          vehiclesInPOI,
        );
        markers.push(labelMarker);
      });

    debounceGeofence
      ?.filter((item) => {
        if (item.points.length === 0) return false;
        if (selectedPOIIds.length === 0) return true;
        return selectedPOIIds.includes(item.id);
      })
      .forEach((item) => {
        const polygon = new google.maps.Polygon({
          paths: item.points.map((p) => ({
            lat: p.gps_latitude,
            lng: p.gps_longitude,
          })),
          strokeColor: "#027832",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#027832",
          fillOpacity: 0.35,
          clickable: false,
          editable: false,
          zIndex: 1,
          map,
        });
        geofenceMarkers.push(polygon);

        const firstPoint = item.points[0];
        const labelText = item.name?.substring(0, 20) || "Unnamed Geofence";
        const position = {
          lat: firstPoint.gps_latitude,
          lng: firstPoint.gps_longitude,
        };

        const poiFormat = {
          ...item,
          gps_latitude: firstPoint.gps_latitude,
          gps_longitude: firstPoint.gps_longitude,
          gps_radius: 0,
        };
        const vehiclesInGeofence = allCoordinates.filter((vehicle) =>
          isPointInsidePOI(vehicle, poiFormat),
        ).length;

        const labelMarker = createGeofenceLabelMarker(
          position,
          labelText,
          map,
          item,
          setPoiForDetailsModal,
          (show) => {
            setPoiForVehicleModal({
              ...(item as any),
              sys_user_id: item.id ?? 0,
              id: item.id,
              name: item.name,
              gps_latitude: firstPoint.gps_latitude,
              gps_longitude: firstPoint.gps_longitude,
              gps_radius: 0,
            });
            setShowHelloModal(show);
          },
          vehiclesInGeofence,
        );
        markers.push(labelMarker);
      });

    // Cleanup function
    return () => {
      markers.forEach((marker) => {
        if ("setMap" in marker) marker.setMap(null);
        if ("onRemove" in marker) marker.onRemove();
      });
      circles.forEach((circle) => circle.setMap(null));
      geofenceMarkers.forEach((polygon) => polygon.setMap(null));
    };
  }, [
    map,
    debouncePoi,
    debounceGeofence,
    poiData,
    isManualEditMode,
    refreshKey,
  ]);

  return (
    <>
      {poiForDetailsModal && (
        <PoiDetailsModal
          poiData={poiForDetailsModal}
          onCancel={() => setPoiForDetailsModal(null)}
          onEdit={() => {
            setSelectedPoiMarker(poiForDetailsModal);
            setPoiForDetailsModal(null);
          }}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}
      {showDeleteModal && (
        <Modal
          title="Are you sure you want to delete this POI?"
          open={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          footer={[
            <div key="footer" className="flex justify-end w-full gap-2">
              <Button
                key="delete"
                style={{ background: "#d32f2f", color: "#fff", border: "none" }}
                loading={deleteLoading}
                onClick={async () => {
                  if (!poiForDetailsModal) return;
                  setDeleteLoading(true);
                  let success = false;
                  try {
                    if (
                      !poiForDetailsModal.points ||
                      poiForDetailsModal.points.length === 0
                    ) {
                      // @ts-ignore
                      await dispatch(
                        deleteCirclePoiThunk({
                          userid: poiForDetailsModal.sys_user_id,
                          poiid: poiForDetailsModal.id,
                        }),
                      ).unwrap();
                      success = true;
                    } else {
                      await dispatch(
                        deleteGeofencePoiThunk({
                          userid: poiForDetailsModal.sys_user_id,
                          poiid: poiForDetailsModal.id,
                        }),
                      ).unwrap();
                      success = true;
                    }
                  } catch (err) {
                    Modal.error({
                      title: "Delete Failed",
                      content: "Could not delete POI. Please try again.",
                    });
                  }
                  setDeleteLoading(false);
                  if (success) {
                    setShowDeleteModal(false);
                    setPoiForDetailsModal(null);
                    dispatch({
                      type: "poiData/setSelectedPOIList",
                      payload: [],
                    });
                    refreshPoiData();
                    message.success("Delete Successfully");

                    // Call geosync endpoint after successful delete
                    await callGeosyncRadius(
                      poiForDetailsModal.sys_user_id || userId,
                    );
                  }
                }}
              >
                Delete
              </Button>
              <Button key="cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>,
          ]}
        />
      )}
      {selectedPoiMarker !== null ? (
        <EditPoi
          poiData={selectedPoiMarker}
          setSelectedPoiMarker={setSelectedPoiMarker}
        />
      ) : null}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingRight: "40px",
            }}
          >
            <span>{`Vehicles in POI: ${poiForVehicleModal?.name || ""}`}</span>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                // Parse mode time string to minutes for sorting
                const parseDurationToMinutes = (modeTime: string): number => {
                  if (!modeTime || modeTime === "N/A") return 0;
                  const timeStr = modeTime.toLowerCase();
                  let totalMinutes = 0;

                  const daysMatch = timeStr.match(/(\d+)\s*days?/);
                  if (daysMatch)
                    totalMinutes += parseInt(daysMatch[1]) * 24 * 60;

                  const hoursMatch = timeStr.match(/(\d+)\s*hrs?/);
                  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;

                  const minutesMatch = timeStr.match(/(\d+)\s*min/);
                  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);

                  return totalMinutes;
                };

                // Sort vehicles by mode time (longest first)
                const sortedVehicles = [...vehiclesInsideModalPOI].sort(
                  (a, b) => {
                    const aMinutes = parseDurationToMinutes(a.modeTime || "");
                    const bMinutes = parseDurationToMinutes(b.modeTime || "");
                    return bMinutes - aMinutes;
                  },
                );

                // Create CSV content
                const headers = [
                  "Sr. No",
                  "Vehicle No",
                  "Mode",
                  "Mode Time",
                  "Location",
                ];
                const csvContent = [
                  headers.join(","),
                  ...sortedVehicles.map((v, index) =>
                    [
                      index + 1,
                      `"${v.vehicleNumber || "Unknown Vehicle"}"`,
                      `"${v.mode || "N/A"}"`,
                      `"${v.modeTime || "N/A"}"`,
                      `"${v.address.split("_").join(" ") || "N/A"}"`,
                    ].join(","),
                  ),
                ].join("\n");

                // Create and download file
                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                  "download",
                  `vehicles_in_${poiForVehicleModal?.name || "poi"}_${new Date().toISOString().split("T")[0]}.csv`,
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                message.success("Data exported successfully!");
              }}
              disabled={vehiclesInsideModalPOI.length === 0}
            >
              Export
            </Button>
          </div>
        }
        open={showHelloModal}
        onCancel={() => {
          setShowHelloModal(false);
          setPoiForVehicleModal(null);
        }}
        footer={null}
        width={850}
        style={{ top: 60 }}
      >
        <div style={{ padding: "5px 0" }}>
          {poiForVehicleModal ? (
            vehiclesInsideModalPOI.length > 0 ? (
              (() => {
                // Parse mode time string to minutes for sorting
                const parseDurationToMinutes = (modeTime: string): number => {
                  if (!modeTime || modeTime === "N/A") return 0;
                  const timeStr = modeTime.toLowerCase();
                  let totalMinutes = 0;

                  const daysMatch = timeStr.match(/(\d+)\s*days?/);
                  if (daysMatch)
                    totalMinutes += parseInt(daysMatch[1]) * 24 * 60;

                  const hoursMatch = timeStr.match(/(\d+)\s*hrs?/);
                  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;

                  const minutesMatch = timeStr.match(/(\d+)\s*min/);
                  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);

                  return totalMinutes;
                };

                // Sort vehicles by mode time (longest first)
                const sortedVehicles = [...vehiclesInsideModalPOI].sort(
                  (a, b) => {
                    const aMinutes = parseDurationToMinutes(a.modeTime || "");
                    const bMinutes = parseDurationToMinutes(b.modeTime || "");
                    return bMinutes - aMinutes;
                  },
                );

                const columns = [
                  {
                    title: "Sr. No",
                    key: "srNo",
                    width: 80,
                    render: (_: any, __: any, index: number) => index + 1,
                  },
                  {
                    title: "Vehicle No",
                    dataIndex: "vehicleNumber",
                    key: "vehicleNumber",
                    width: 150,
                    render: (text: string) => (
                      <span style={{ fontWeight: 500 }}>
                        {text || "Unknown Vehicle"}
                      </span>
                    ),
                  },
                  {
                    title: "Mode",
                    dataIndex: "mode",
                    key: "mode",
                    width: 100,
                    render: (mode: string) => (
                      <span
                        style={{
                          color:
                            mode?.toLowerCase() === "idle"
                              ? "#f59e0b"
                              : mode?.toLowerCase() === "running"
                                ? "#10b981"
                                : "#666",
                          fontWeight: 500,
                        }}
                      >
                        {mode || "N/A"}
                      </span>
                    ),
                  },
                  {
                    title: "Mode Time",
                    dataIndex: "modeTime",
                    key: "modeTime",
                    width: 120,
                    render: (text: string) => text || "N/A",
                  },
                  {
                    title: "Location",
                    key: "location",
                    render: (_: any, record: any) => (
                      <span style={{ fontSize: 12 }}>
                        {record.address.split("_").join(" ") || "N/A"}
                      </span>
                    ),
                  },
                ];

                return (
                  <Table
                    columns={columns}
                    dataSource={sortedVehicles}
                    rowKey={(record) => record.vehicleNumber || Math.random()}
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                  />
                );
              })()
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#888",
                  fontSize: 13,
                  padding: "20px",
                }}
              >
                No vehicles inside selected POIs.
              </div>
            )
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#888",
                fontSize: 13,
                padding: "20px",
              }}
            >
              No POI selected.
            </div>
          )}
        </div>
      </Modal>
      <ManualEditPOI />
    </>
  );
};

// Manual Edit Component for Polygon POIs
const ManualEditPOI = () => {
  const map = useMap();
  const dispatch = useDispatch<AppDispatch>();
  const { refreshPoiData } = usePoiRefresh();
  const { userId, mobileAppToken, parentUser } = useSelector(
    (state: RootState) => state.auth,
  );
  const { isManualEditMode, editingPOI } = useSelector(
    (state: RootState) => state.poiData,
  );
  const [updateGeofence] = useUpdateGeofenceMutation();
  const [triggerEditPoi] = useLazyEditPOIQuery();
  const [editedPoints, setEditedPoints] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editablePolygon, setEditablePolygon] =
    useState<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map || !isManualEditMode || !editingPOI) {
      return;
    }

    // Check if it's a geofence (has points)
    const geofence = editingPOI as any;
    if (!geofence.points || !Array.isArray(geofence.points)) {
      return;
    }

    // Create editable polygon
    const polygon = new google.maps.Polygon({
      paths: geofence.points.map((p: any) => ({
        lat: p.gps_latitude,
        lng: p.gps_longitude,
      })),
      strokeColor: "#027832",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#027832",
      fillOpacity: 0.35,
      editable: true,
      draggable: false,
      map,
    });

    setEditablePolygon(polygon);

    // Add listeners for path changes
    const path = polygon.getPath();
    const insertListener = google.maps.event.addListener(
      path,
      "insert_at",
      () => {
        updateEditedPoints(polygon);
      },
    );
    const setAtListener = google.maps.event.addListener(path, "set_at", () => {
      updateEditedPoints(polygon);
    });
    const removeAtListener = google.maps.event.addListener(
      path,
      "remove_at",
      () => {
        updateEditedPoints(polygon);
      },
    );

    // Initial points
    updateEditedPoints(polygon);

    return () => {
      polygon.setMap(null);
      google.maps.event.removeListener(insertListener);
      google.maps.event.removeListener(setAtListener);
      google.maps.event.removeListener(removeAtListener);
      setEditablePolygon(null);
    };
  }, [map, isManualEditMode, editingPOI]);

  const updateEditedPoints = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const points: { lat: number; lng: number }[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const vertex = path.getAt(i);
      points.push({
        lat: vertex.lat(),
        lng: vertex.lng(),
      });
    }

    setEditedPoints(points);
  };

  const handleSave = async () => {
    if (!editingPOI || editedPoints.length < 3) {
      message.error("Polygon must have at least 3 points");
      return;
    }

    setIsSaving(true);
    try {
      const geofence = editingPOI as any;

      await triggerEditPoi({
        userId: String(userId),
        poiName: editingPOI.name,
        radius: 1000,
        lat: editedPoints[0].lat,
        lng: editedPoints[0].lng,
        poiId: editingPOI.id,
      });

      if (geofence.points && geofence.points.length > 0) {
        await dispatch(
          deleteGeofencePointsOnlyThunk({
            poiid: editingPOI.id,
          }),
        );
      }

      const updateGeofencePayload = {
        name: editingPOI.name,
        radius: 1000,
        userId: String(userId),
        token: mobileAppToken,
        points: editedPoints,
        poiid: editingPOI.id,
      };

      try {
        const updateResult = await updateGeofence(
          updateGeofencePayload,
        ).unwrap();

        if (!updateResult.status) {
          throw new Error(updateResult.message || "Failed to save geofence");
        }
      } catch (updateError) {
        console.error("Update geofence error:", updateError);
        throw updateError;
      }

      message.success("POI updated successfully!");

      // Use unified refresh function
      await refreshPoiData();

      // Call geosync endpoint after successful manual edit save
      await callGeosyncRadius(userId);

      // Exit edit mode
      handleCancel();
    } catch (error) {
      console.error("Failed to update POI:", error);

      // Better error message handling
      let errorMessage = "Failed to update POI";
      if (error && typeof error === "object") {
        if ("message" in error) {
          errorMessage += ": " + error.message;
        } else if (
          "data" in error &&
          error.data &&
          typeof error.data === "object"
        ) {
          if ("message" in error.data) {
            errorMessage += ": " + error.data.message;
          } else {
            errorMessage += ": " + JSON.stringify(error.data);
          }
        } else {
          errorMessage += ": " + JSON.stringify(error);
        }
      } else {
        errorMessage += ": " + String(error);
      }

      message.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    dispatch(setManualEditMode(false));
    dispatch(setEditingPOI(null));
    setEditedPoints([]);
    if (editablePolygon) {
      editablePolygon.setMap(null);
      setEditablePolygon(null);
    }

    if (map) {
      map.setCenter({ lat: 26.55, lng: 82.98 });
      map.setZoom(5);
    }
  };

  if (!isManualEditMode || !editingPOI) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "white",
        padding: "15px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: "500" }}>
        Editing: {editingPOI.name} ({editedPoints.length} points)
      </span>
      <Button
        type="primary"
        onClick={handleSave}
        loading={isSaving}
        disabled={editedPoints.length < 3}
      >
        Save
      </Button>
      <Button onClick={handleCancel}>Cancel</Button>
    </div>
  );
};

export default PoiMarkersImperative;

const PoiDetailsModal = ({
  poiData,
  onCancel,
  onEdit,
  onDelete,
}: {
  poiData: (GetAllPoiListResponseList & { points?: any[] }) | null;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  if (!poiData) return null;

  const latLng =
    poiData.points && poiData.points.length > 0
      ? poiData.points.map((p) => ({
          lat: p.gps_latitude.toFixed(6),
          lng: p.gps_longitude.toFixed(6),
        }))
      : [
          {
            lat: poiData.gps_latitude.toFixed(6),
            lng: poiData.gps_longitude.toFixed(6),
          },
        ];

  return (
    <Modal
      title="Details"
      open={poiData !== null}
      onCancel={onCancel}
      width={400}
      footer={[
        <div key="footer" className="flex justify-between w-full">
          <Button key="delete" danger onClick={onDelete}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button key="edit" type="primary" onClick={onEdit}>
              Edit
            </Button>
            <Button key="cancel" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>,
      ]}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
        className="select-none"
      >
        <div
          style={{
            maxHeight: "35vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          <div className="text-sm text-neutral-800 flex flex-col gap-2 mt-3 rounded-lg font-medium">
            <div className=" pb-3 flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="font-bold">Name :</div>
                <div className="col-span-2">{poiData.name}</div>

                {(!poiData.points || poiData.points.length === 0) && (
                  <>
                    <div className="font-bold">Radius :</div>
                    <div className="col-span-2">{poiData.gps_radius}</div>
                  </>
                )}

                {latLng.map((ll, index) => (
                  <div key={index} className="contents">
                    <div className="font-bold">Latitude {index + 1}:</div>
                    <div className="col-span-2">{ll.lat}</div>

                    <div className="font-bold">Longitude {index + 1}:</div>
                    <div className="col-span-2">{ll.lng}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const EditPoi = ({
  poiData,
  setSelectedPoiMarker,
}: {
  poiData: GetAllPoiListResponseList & { points?: any[] };
  setSelectedPoiMarker: Dispatch<
    SetStateAction<(GetAllPoiListResponseList & { points?: any[] }) | null>
  >;
}) => {
  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  );
  const [triggerEditPoi] = useLazyEditPOIQuery();
  const dispatch = useDispatch();
  const map = useMap();
  const { refreshPoiData } = usePoiRefresh();

  const [promiseLoading, setPromiseLoading] = useState(false);
  const [radius, setRadius] = useState(0);
  const [poiName, setPoiName] = useState("");
  const [latLng, setLatLng] = useState<Array<{ lat: string; lng: string }>>([]);

  useEffect(() => {
    setPoiName(poiData.name);
    setRadius(poiData.gps_radius);
    if (poiData.points && poiData.points.length > 0) {
      setLatLng(
        poiData.points.map((p) => ({
          lat: p.gps_latitude.toFixed(6),
          lng: p.gps_longitude.toFixed(6),
        })),
      );
    } else {
      setLatLng([
        {
          lat: poiData?.gps_latitude.toFixed(6),
          lng: poiData?.gps_longitude.toFixed(6),
        },
      ]);
    }
  }, [poiData]);

  const handleLatLngChange = (
    index: number,
    field: "lat" | "lng",
    value: string,
  ) => {
    const newLatLng = [...latLng];
    newLatLng[index][field] = value;
    setLatLng(newLatLng);
  };

  const onFinish = async () => {
    setPromiseLoading(true);
    try {
      await triggerEditPoi({
        userId,
        poiName,
        radius,
        lat: Number(latLng[0].lat),
        lng: Number(latLng[0].lng),
        poiId: poiData.id,
      });

      // Use unified refresh function
      await refreshPoiData();

      // Call geosync endpoint after successful edit
      await callGeosyncRadius(userId);

      setPromiseLoading(false);
      setSelectedPoiMarker(null);
    } catch (error) {
      console.error("Failed to edit POI:", error);
      setPromiseLoading(false);
    }
  };

  return (
    <Modal
      title="Edit POI"
      open={poiData !== null}
      onCancel={() => setSelectedPoiMarker(null)}
      width={400}
      footer={null}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
        className="select-none"
      >
        <div
          style={{
            maxHeight: "35vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          <div className="text-sm text-neutral-800 flex flex-col gap-2 mt-3 rounded-lg font-medium">
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

                {(!poiData.points || poiData.points.length === 0) && (
                  <>
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
                  </>
                )}

                {latLng.map((ll, index) => (
                  <div key={index} className="contents">
                    <div className="font-bold">Latitude {index + 1}:</div>
                    <div className="col-span-2">
                      <Input
                        value={ll.lat}
                        onChange={(e) =>
                          handleLatLngChange(index, "lat", e.target.value)
                        }
                        disabled={poiData.points && poiData.points.length > 0}
                      />
                    </div>

                    <div className="font-bold">Longitude {index + 1}:</div>
                    <div className="col-span-2">
                      <Input
                        value={ll.lng}
                        onChange={(e) =>
                          handleLatLngChange(index, "lng", e.target.value)
                        }
                        disabled={poiData.points && poiData.points.length > 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-3 border-t border-neutral-200">
          {poiData.points && poiData.points.length > 0 && (
            <Button
              onClick={() => {
                // Close the dialog
                setSelectedPoiMarker(null);

                // Set manual edit mode
                dispatch(setManualEditMode(true));
                dispatch(setEditingPOI(poiData));

                // Zoom into the POI
                if (map && poiData.points && poiData.points.length > 0) {
                  const bounds = new window.google.maps.LatLngBounds();
                  poiData.points.forEach((point) => {
                    bounds.extend({
                      lat: point.gps_latitude,
                      lng: point.gps_longitude,
                    });
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
              }}
            >
              Manual Edit
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              type="primary"
              onClick={() => onFinish()}
              loading={promiseLoading}
              disabled={
                !poiName ||
                (poiData.points && poiData.points.length === 0 && !radius) ||
                latLng.some((ll) => !ll.lat || !ll.lng) ||
                !userId
              }
            >
              Submit
            </Button>

            <Button onClick={() => setSelectedPoiMarker(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
