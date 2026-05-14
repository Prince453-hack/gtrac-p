"use client";

import { AlertByDayEvents } from "@/app/_globalRedux/services/types/alerts";
import {
  AlertOutlined,
  CarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Spin, Tag, Tooltip, Modal, Tabs } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import moment from "moment";
import React, { useMemo, useState, useEffect } from "react";
import { openNotification } from "../dashboard/alertsNotification/AlertNotifications";
import { isValidDTCAlert } from "./View";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";

interface AlertsListViewProps {
  adjustedAlertsAsList: AlertByDayEvents[];
  filteredAlerts: AlertByDayEvents[];
  loading: boolean;
  selectedAlert: string | undefined;
  fetchUpdatedAlertsNotificationCard: (alertType?: string) => void;
  api: NotificationInstance;
  filters: {
    vehicleNo: string;
    alertType: string;
    location: string;
    status: string;
  };
  getFilterDropdown: () => React.JSX.Element;
  videoAlarmFiles?: { [key: string]: { images: string[]; videos: string[] } };
  fetchAlarmFiles?: (
    alertId: string,
  ) => Promise<{ images: string[]; videos: string[] }>;
}

const AlertsListView: React.FC<AlertsListViewProps> = ({
  filteredAlerts,
  adjustedAlertsAsList,
  loading,
  selectedAlert,
  fetchUpdatedAlertsNotificationCard,
  api,
  filters,
  getFilterDropdown,
  videoAlarmFiles = {},
  fetchAlarmFiles,
}) => {
  // State for tracking loading and error states for video alarm files
  const [fetchingImages, setFetchingImages] = useState<{
    [key: string]: boolean;
  }>({});
  const [fetchErrors, setFetchErrors] = useState<{ [key: string]: boolean }>(
    {},
  );

  // State for modal and carousel
  const [selectedAlertMedia, setSelectedAlertMedia] = useState<{
    alert: AlertByDayEvents;
    files: { images: string[]; videos: string[] };
  } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Define this function early so it can be used in useEffect
  const isVideoTelematicsAlert = (alertType: string) => {
    const videoTypes = [
      "FORWARD_COLLISION_WARNING",
      "DISTRACTED_DRIVING",
      "TAILGATING_WARNING",
      "LANE_DEPARTURE_WARNING",
      "DRIVER_FATIGUE_DETECTION",
      "Phone Calling",
      "Fatigue warning",
      "Distracted driving",
      "Smoking",
      "Camera Blocked",
      "Seatbelt Detection",
      "Seat-Belt Detection",
      "seatBelt",
    ];
    return videoTypes.includes(alertType);
  };

  const isGPSAlert = (alertType: string) => {
    const gpsTypes = [
      "GPS Disconnect",
      "GPS Power Disconnected",
      "gpsPowerDisconnected",
    ];
    return gpsTypes.includes(alertType);
  };

  const isIdleAlert = (alertType: string) => {
    const idleTypes = [
      "Enroute Idle",
      "Idle at Geofence",
      "Idle",
      "Enroute Halt Alert",
      "Geofence Halt Alert",
      "Enroute Halt",
      "Geofence Halt Alerts",
    ];
    return idleTypes.includes(alertType);
  };

  const isELockAlert = (alertType: string) => {
    const eLockTypes = [
      "Unlock on move",
      "Unlock outside Geofence",
      "Unhealthy",
    ];
    return eLockTypes.includes(alertType);
  };

  const handleFetchImages = async (alertId: string) => {
    if (!fetchAlarmFiles || fetchingImages[alertId]) return;

    setFetchingImages((prev) => ({ ...prev, [alertId]: true }));
    setFetchErrors((prev) => ({ ...prev, [alertId]: false }));

    try {
      await fetchAlarmFiles(alertId);
    } catch (error) {
      console.error("Failed to fetch alarm files:", error);
      setFetchErrors((prev) => ({ ...prev, [alertId]: true }));
    } finally {
      setFetchingImages((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  useEffect(() => {
    if (
      !fetchAlarmFiles ||
      !adjustedAlertsAsList ||
      adjustedAlertsAsList.length === 0
    )
      return;

    adjustedAlertsAsList.forEach((alert: AlertByDayEvents) => {
      const alertId = alert.service_id;
      if (
        alertId &&
        isVideoTelematicsAlert(alert.exception_type) &&
        !videoAlarmFiles[alertId] &&
        !fetchingImages[alertId] &&
        !fetchErrors[alertId]
      ) {
        setTimeout(() => handleFetchImages(alertId), Math.random() * 1000);
      }
    });
  }, [
    adjustedAlertsAsList,
    videoAlarmFiles,
    fetchingImages,
    fetchErrors,
    fetchAlarmFiles,
  ]);

  const validAlerts = useMemo(() => {
    return filteredAlerts.filter((alert) => {
      // Check if alert has essential data
      const hasVehicleNo =
        alert.vehicle_no &&
        (typeof alert.vehicle_no === "string"
          ? alert.vehicle_no.trim() !== ""
          : alert.vehicle_no !== 0);
      const hasAlertType =
        alert.exception_type &&
        (typeof alert.exception_type === "string"
          ? alert.exception_type.trim() !== ""
          : true);
      const hasStartTime =
        alert.starttime &&
        (typeof alert.starttime === "string"
          ? alert.starttime.trim() !== ""
          : true);

      // Only show alerts that have at least vehicle number, alert type, and start time
      return hasVehicleNo && hasAlertType && hasStartTime;
    });
  }, [filteredAlerts]);

  if (!adjustedAlertsAsList || adjustedAlertsAsList.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Empty description="No alerts found" />
      </div>
    );
  }
  if (validAlerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Empty description="No valid alerts to display" />
      </div>
    );
  }

  const getAlertTypeColor = (alertType: string) => {
    const type = alertType?.toLowerCase();
    if (
      type?.includes("harsh") ||
      type?.includes("overspeed") ||
      type?.includes("acceleration") ||
      type?.includes("brake")
    ) {
      return "red";
    }
    if (
      type?.includes("power") ||
      type?.includes("battery") ||
      type?.includes("engine")
    ) {
      return "orange";
    }
    if (type?.includes("idle") || type?.includes("geofence")) {
      return "blue";
    }
    return "default";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "minor":
        return "yellow";
      case "moderate":
        return "orange";
      case "major":
      case "critical":
        return "red";
      default:
        return "default";
    }
  };

  const formatDateTime = (dateTime: string) => {
    return moment(dateTime).format("DD MMM YYYY, hh:mm A");
  };

  const formatLocation = (location: string) => {
    return location?.replaceAll("_", " ") || "N/A";
  };

  const formatIdleLocation = (alert: AlertByDayEvents) => {
    const locationParts = [
      alert.startlocation?.replaceAll("_", " ").replace(/^\s*Location:\s*/, ""),
      alert.InvoiceNo?.replaceAll("_", " "),
      alert.InvoiceDate?.replaceAll("_", " "),
    ].filter(Boolean);
    return locationParts.join(" ") || "N/A";
  };

  const renderVideoImages = (alert: AlertByDayEvents) => {
    if (!isVideoTelematicsAlert(alert.exception_type)) {
      return null;
    }

    // For video telematics alerts, use service_id which contains the original string ID
    const alertId = alert.service_id;
    if (!alertId || !fetchAlarmFiles) return null;

    const files = videoAlarmFiles[alertId];
    const isLoading = fetchingImages[alertId];
    const hasError = fetchErrors[alertId];

    // If we have files, show them with a view option
    if (files && (files.images.length > 0 || files.videos.length > 0)) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-3">
            Video Alert Media:
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              {files.images.length > 0 && (
                <div className="flex items-center gap-2">
                  <PictureOutlined className="text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {files.images.length} Images
                  </span>
                </div>
              )}
              {files.videos.length > 0 && (
                <div className="flex items-center gap-2">
                  <PlayCircleOutlined className="text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {files.videos.length} Videos
                  </span>
                </div>
              )}
            </div>
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setSelectedAlertMedia({ alert, files });
                setCurrentImageIndex(0);
                setCurrentVideoIndex(0);
              }}
            >
              View Media
            </Button>
          </div>
        </div>
      );
    }

    if (files && files.images.length === 0 && files.videos.length === 0) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Video Alert Media:
          </div>
          <div className="text-center py-2">
            <div className="text-sm text-gray-500">
              No media available for this alert
            </div>
          </div>
        </div>
      );
    }

    // If there's an error, show retry option
    if (hasError) {
      return (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-700 mb-2">
            Failed to load video alert media
          </div>
          <button
            onClick={() => handleFetchImages(alertId)}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      );
    }

    // If currently loading, show loading state
    if (isLoading) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-2">
            Video Alert Media:
          </div>
          <div className="flex justify-center py-2">
            <Spin size="small" />
            <span className="ml-2 text-sm text-blue-600">Loading media...</span>
          </div>
        </div>
      );
    }

    // Initial state - trigger fetch
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-blue-700 mb-2">
          Video Alert Media:
        </div>
        <div className="flex justify-center py-2">
          <button
            onClick={() => handleFetchImages(alert.service_id)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Load media
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4 px-4 max-h-[calc(100vh-230px)] overflow-y-auto">
        {validAlerts.map((alert, index) => (
          <Card
            key={`${alert.id}-${index}`}
            className="hover:shadow-md transition-shadow border-l-8"
            style={{
              borderLeftColor:
                getAlertTypeColor(alert.exception_type) === "red"
                  ? "#ef4444"
                  : getAlertTypeColor(alert.exception_type) === "orange"
                    ? "#f97316"
                    : getAlertTypeColor(alert.exception_type) === "blue"
                      ? "#3b82f6"
                      : "#6b7280",
            }}
            size="small"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Tag
                    color={getAlertTypeColor(alert.exception_type)}
                    icon={<AlertOutlined />}
                  >
                    {alert.exception_type}
                  </Tag>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CarOutlined />
                    <span className="font-medium">{alert.vehicle_no}</span>
                  </div>
                </div>
                {isValidDTCAlert(selectedAlert) && alert.InvoiceDate && (
                  <Tag color={getSeverityColor(alert.InvoiceDate)}>
                    {alert.InvoiceDate}
                  </Tag>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockCircleOutlined />
                  <div>
                    <span className="font-medium">
                      {isVideoTelematicsAlert(alert.exception_type) ||
                      isGPSAlert(alert.exception_type) ||
                      isIdleAlert(alert.exception_type)
                        ? "Time:"
                        : "Start:"}
                    </span>{" "}
                    {formatDateTime(alert.starttime)}
                  </div>
                </div>
                {alert.endtime &&
                  alert.journey_statusfinal !== "Ongoing" &&
                  !isVideoTelematicsAlert(alert.exception_type) &&
                  !isGPSAlert(alert.exception_type) &&
                  !isIdleAlert(alert.exception_type) &&
                  !isELockAlert(alert.exception_type) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockCircleOutlined />
                      <div>
                        <span className="font-medium">End:</span>{" "}
                        {formatDateTime(alert.endtime)}
                      </div>
                    </div>
                  )}
                {alert.journey_statusfinal === "Ongoing" && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag color="geekblue">Ongoing</Tag>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {alert.startlocation && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <EnvironmentOutlined className="mt-1" />
                    <div>
                      <span className="font-medium">
                        {isValidDTCAlert(selectedAlert)
                          ? "Description:"
                          : isVideoTelematicsAlert(alert.exception_type) ||
                              isGPSAlert(alert.exception_type)
                            ? "Location:"
                            : "Start Location:"}
                      </span>
                      <Tooltip
                        title={
                          isIdleAlert(alert.exception_type)
                            ? formatIdleLocation(alert)
                            : formatLocation(alert.startlocation)
                        }
                      >
                        <span className="ml-2">
                          {isIdleAlert(alert.exception_type)
                            ? formatIdleLocation(alert).length > 80
                              ? `${formatIdleLocation(alert).substring(
                                  0,
                                  80,
                                )}...`
                              : formatIdleLocation(alert)
                            : formatLocation(alert.startlocation).length > 80
                              ? `${formatLocation(
                                  alert.startlocation,
                                ).substring(0, 80)}...`
                              : formatLocation(alert.startlocation)}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                )}
                {alert.endlocation &&
                  !isValidDTCAlert(selectedAlert) &&
                  !isVideoTelematicsAlert(alert.exception_type) &&
                  !isGPSAlert(alert.exception_type) &&
                  !isIdleAlert(alert.exception_type) &&
                  !isELockAlert(alert.exception_type) && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <EnvironmentOutlined className="mt-1" />
                      <div>
                        <span className="font-medium">End Location:</span>
                        <Tooltip title={formatLocation(alert.endlocation)}>
                          <span className="ml-2">
                            {formatLocation(alert.endlocation).length > 80
                              ? `${formatLocation(alert.endlocation).substring(
                                  0,
                                  80,
                                )}...`
                              : formatLocation(alert.endlocation)}
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                {alert.duration &&
                !isVideoTelematicsAlert(alert.exception_type) &&
                !isGPSAlert(alert.exception_type) &&
                !isIdleAlert(alert.exception_type) &&
                !isELockAlert(alert.exception_type) ? (
                  <div>
                    <span className="font-medium">Duration:</span>
                    <span className="ml-1">{alert.duration}</span>
                  </div>
                ) : null}
                {alert.speed &&
                alert.exception_type !== "GPS Power Disconnected" ? (
                  <div>
                    <span className="font-medium">Speed:</span>
                    <span className="ml-1">{alert.speed} Km/h</span>
                  </div>
                ) : null}
                {alert.hour || isIdleAlert(alert.exception_type) ? (
                  <div>
                    <span className="font-medium">Halting Hour:</span>
                    <span className="ml-1">{alert.hour || "N/A"}</span>
                  </div>
                ) : null}
              </div>

              {isValidDTCAlert(selectedAlert) && alert.route_name ? (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Code:</span>
                  <span className="ml-1">{alert.route_name}</span>
                </div>
              ) : null}

              {selectedAlert === "idle" || selectedAlert === "Idle" ? (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Remarks:</span>
                    <span className="ml-1">{alert.remark || "No remarks"}</span>
                  </div>
                  {!alert.remark && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        openNotification({
                          description: `Vehicle number ${alert.vehicle_no} has been idle for ${alert.hour} hours`,
                          vehicleNumber: `${alert.vehicle_no}`,
                          title: "Idle",
                          type: "Idle",
                          alertId: `${alert.id}`,
                          vehicleId: alert.service_id,
                          dateTime: alert.starttime,
                          api: api,
                          key: `${alert.id}` + `${alert.vehicle_no}`,
                          from: "ALERTS_TABLE",
                          fetchUpdatedAlerts:
                            fetchUpdatedAlertsNotificationCard,
                        });
                      }}
                    >
                      Add Remark
                    </Button>
                  )}
                </div>
              ) : null}

              {/* Alert Status - Only for idle alerts */}
              {selectedAlert === "idle" || selectedAlert === "Idle" ? (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span>
                  <Tag className="ml-1" color={alert.remark ? "green" : "red"}>
                    {alert.remark ? "Closed" : "Open"}
                  </Tag>
                </div>
              ) : null}

              {/* Video Telematics Images */}
              {renderVideoImages(alert)}
            </div>
          </Card>
        ))}
      </div>

      {/* Video Alert Media Modal */}
      <Modal
        title={
          selectedAlertMedia ? (
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold">
                  {selectedAlertMedia.alert.exception_type}
                </span>
                <div className="text-sm text-gray-600">
                  {selectedAlertMedia.alert.vehicle_no} •{" "}
                  {formatDateTime(selectedAlertMedia.alert.starttime)}
                </div>
              </div>
              <div className="flex gap-4">
                {selectedAlertMedia.files.images.length > 0 && (
                  <div className="flex items-center gap-1">
                    <PictureOutlined className="text-blue-600" />
                    <span className="text-sm">
                      {selectedAlertMedia.files.images.length}
                    </span>
                  </div>
                )}
                {selectedAlertMedia.files.videos.length > 0 && (
                  <div className="flex items-center gap-1">
                    <PlayCircleOutlined className="text-blue-600" />
                    <span className="text-sm">
                      {selectedAlertMedia.files.videos.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            "Alert Media"
          )
        }
        open={!!selectedAlertMedia}
        onCancel={() => {
          setSelectedAlertMedia(null);
          setCurrentImageIndex(0);
          setCurrentVideoIndex(0);
        }}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        {selectedAlertMedia && (
          <Tabs
            defaultActiveKey="images"
            items={[
              {
                label: `Images (${selectedAlertMedia.files.images.length})`,
                key: "images",
                disabled: selectedAlertMedia.files.images.length === 0,
                children:
                  selectedAlertMedia.files.images.length > 0 ? (
                    <div className="space-y-4">
                      {/* Image Carousel */}
                      <div className="relative">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <img
                            src={
                              selectedAlertMedia.files.images[currentImageIndex]
                            }
                            alt={`Alert image ${currentImageIndex + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error("Image failed to load");
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>

                        {/* Navigation Arrows */}
                        {selectedAlertMedia.files.images.length > 1 && (
                          <>
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<LeftOutlined />}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 border-none hover:bg-opacity-90"
                              onClick={() => {
                                setCurrentImageIndex(
                                  currentImageIndex === 0
                                    ? selectedAlertMedia.files.images.length - 1
                                    : currentImageIndex - 1,
                                );
                              }}
                              disabled={
                                selectedAlertMedia.files.images.length <= 1
                              }
                            />
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<RightOutlined />}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 border-none hover:bg-opacity-90"
                              onClick={() => {
                                setCurrentImageIndex(
                                  currentImageIndex ===
                                    selectedAlertMedia.files.images.length - 1
                                    ? 0
                                    : currentImageIndex + 1,
                                );
                              }}
                              disabled={
                                selectedAlertMedia.files.images.length <= 1
                              }
                            />
                          </>
                        )}

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} /{" "}
                          {selectedAlertMedia.files.images.length}
                        </div>
                      </div>

                      {/* Thumbnail Strip */}
                      {selectedAlertMedia.files.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedAlertMedia.files.images.map(
                            (imageUrl, index) => (
                              <div
                                key={index}
                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                                  currentImageIndex === index
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                                onClick={() => setCurrentImageIndex(index)}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No images available
                    </div>
                  ),
              },
              {
                label: `Videos (${selectedAlertMedia.files.videos.length})`,
                key: "videos",
                disabled: selectedAlertMedia.files.videos.length === 0,
                children:
                  selectedAlertMedia.files.videos.length > 0 ? (
                    <div className="space-y-4">
                      {/* Video Carousel */}
                      <div className="relative">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            key={
                              selectedAlertMedia.files.videos[currentVideoIndex]
                            }
                            width="100%"
                            height="100%"
                            controls
                            className="w-full h-full"
                          >
                            <source
                              src={
                                selectedAlertMedia.files.videos[
                                  currentVideoIndex
                                ]
                              }
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                        </div>

                        {/* Navigation Arrows */}
                        {selectedAlertMedia.files.videos.length > 1 && (
                          <>
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<LeftOutlined />}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 border-none hover:bg-opacity-90"
                              onClick={() => {
                                setCurrentVideoIndex(
                                  currentVideoIndex === 0
                                    ? selectedAlertMedia.files.videos.length - 1
                                    : currentVideoIndex - 1,
                                );
                              }}
                              disabled={
                                selectedAlertMedia.files.videos.length <= 1
                              }
                            />
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<RightOutlined />}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 border-none hover:bg-opacity-90"
                              onClick={() => {
                                setCurrentVideoIndex(
                                  currentVideoIndex ===
                                    selectedAlertMedia.files.videos.length - 1
                                    ? 0
                                    : currentVideoIndex + 1,
                                );
                              }}
                              disabled={
                                selectedAlertMedia.files.videos.length <= 1
                              }
                            />
                          </>
                        )}

                        {/* Video Counter */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                          {currentVideoIndex + 1} /{" "}
                          {selectedAlertMedia.files.videos.length}
                        </div>
                      </div>

                      {/* Video List */}
                      {selectedAlertMedia.files.videos.length > 1 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Select Video:
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {selectedAlertMedia.files.videos.map((_, index) => (
                              <Button
                                key={index}
                                type={
                                  currentVideoIndex === index
                                    ? "primary"
                                    : "default"
                                }
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={() => setCurrentVideoIndex(index)}
                                className="text-left"
                              >
                                Video {index + 1}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No videos available
                    </div>
                  ),
              },
            ]}
          />
        )}
      </Modal>
    </>
  );
};

export default AlertsListView;
