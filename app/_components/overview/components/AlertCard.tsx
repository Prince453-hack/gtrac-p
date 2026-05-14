"use client";

import { TruckFilled } from "@ant-design/icons";
import { Modal, Skeleton, Table, message } from "antd";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import Image from "next/image";
import { RightArrow } from "@/public/assets/svgs/nav";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";

interface AlertCardProps {
  title: string;
  count: number;
  bgColor: string;
  lineColor: string;
  sub: string;
  vehCount: number;
  vehicles?: VehicleData[] | any[];
  alertsLoading: boolean;
  remarkCount: number;
  onClick: () => void;
  alertType?: string; // Add alertType prop to match categories
}

interface AlertData {
  alert_id: string;
  alert_type: string;
  vehicleno: string;
  sys_service_id: string;
  msg: string;
  datetime: string;
  alertcount: string;
  remark: string;
  created_at: string;
  gps_time: string;
}

export const AlertCard = ({
  title,
  count,
  bgColor,
  lineColor,
  sub,
  vehCount,
  vehicles,
  alertsLoading,
  remarkCount,
  onClick,
  alertType,
}: AlertCardProps) => {
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [alertsData, setAlertsData] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(false);

  const { groupId } = useSelector((state: RootState) => state.auth);

  const getAlertCategory = (alertTypeValue?: string): string => {
    const alertTypeLower = (alertTypeValue || "").toLowerCase().trim();

    if (alertTypeLower === "main power disconnected") {
      return "skip";
    }

    switch (alertTypeLower) {
      case "lesser km/day":
        return "lesser-km";
      case "enroute halt alert":
        return "enroute-halt";
      case "geofence halt alert":
        return "geofence-halt";
      case "geofence alert":
        return "geofence-exit";
      case "vehicle health alert":
      case "mainpower disconnected":
        return "vehicle-health";
      case "unlock on move":
      case "lock - unlocked":
      case "elock alert":
      case "unhealthy elock alert":
      case "door open in non-geofence":
      case "door open in non geofence":
        return "e-lock";
      case "phone call":
      case "handheldphonecall":
      case "smoke":
      case "smoking":
      case "fasten seat belt":
      case "tired":
      case "coverning camera":
      case "fatigue warn":
      case "fatigue warning":
      case "fatiguewarn":
        return "dash-cam";
      case "challan alert":
        return "challan";
      default:
        return "driver-behaviour";
    }
  };

  const getCardCategory = (cardTitle: string): string => {
    const titleLower = cardTitle.toLowerCase();

    if (titleLower.includes("lesser km") || titleLower.includes("km / day")) {
      return "lesser-km";
    }
    if (titleLower.includes("enroute") && titleLower.includes("halt")) {
      return "enroute-halt";
    }
    if (titleLower.includes("geofence") && titleLower.includes("halt")) {
      return "geofence-halt";
    }
    if (titleLower.includes("geofence") && titleLower.includes("exit")) {
      return "geofence-exit";
    }
    if (titleLower.includes("vehicle health")) {
      return "vehicle-health";
    }
    if (titleLower.includes("driver") || titleLower.includes("behaviour")) {
      return "driver-behaviour";
    }
    if (titleLower.includes("e-lock") || titleLower.includes("lock")) {
      return "e-lock";
    }
    if (titleLower.includes("dash cam") || titleLower.includes("dashcam")) {
      return "dash-cam";
    }
    if (titleLower.includes("challan")) {
      return "challan";
    }
    if (titleLower.includes("fuel") && titleLower.includes("theft")) {
      return "fuel-theft";
    }

    return "unknown";
  };

  const fetchAlertsData = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_YATAYAAT_API}/reactapi/alerts_popups.php?token=${groupId}&showAll=1`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Keep only remarked alerts and match the same alert division as ODBDetailsSection.
        const selectedCategory = getCardCategory(title);
        let filteredAlerts = data.filter(
          (alert: AlertData) => alert.remark && alert.remark.trim() !== "",
        );

        filteredAlerts = filteredAlerts.filter((alert: AlertData) => {
          if (selectedCategory === "fuel-theft") {
            return false;
          }
          if (selectedCategory === "unknown") {
            return true;
          }

          return getAlertCategory(alert.alert_type) === selectedCategory;
        });

        setAlertsData(filteredAlerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      message.error("Failed to fetch alerts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRemarkModalOpen) {
      fetchAlertsData();
    }
  }, [isRemarkModalOpen, groupId, title]);

  const handleRemarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setIsRemarkModalOpen(true);
  };

  const handleCardClick = () => {
    onClick();
  };

  // Table columns configuration
  const columns = [
    {
      title: "S.No.",
      dataIndex: "key",
      key: "sno",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Vehicle No.",
      dataIndex: "vehicleno",
      key: "vehicleno",
      width: 120,
    },
    {
      title: "Alert Type",
      dataIndex: "alert_type",
      key: "alert_type",
      width: 150,
      render: (alertType: string) => alertType.replace(/_/g, " "),
    },
    {
      title: "Date & Time",
      dataIndex: "gps_time",
      key: "gps_time",
      width: 150,
      render: (gps_time: string, record: AlertData) => {
        if (!gps_time || gps_time === "0000-00-00 00:00:00") {
          return record.datetime || "N/A";
        }
        return gps_time;
      },
    },
    {
      title: "Remark",
      dataIndex: "remark",
      key: "remark",
      width: 200,
      render: (remark: string) => (
        <span className="font-medium text-blue-600">{remark}</span>
      ),
    },
    {
      title: "Alert Count",
      dataIndex: "alertcount",
      key: "alertcount",
      width: 100,
      align: "center" as const,
    },
  ];

  return (
    <>
      <div
        className="w-full h-36 p-4 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        style={{ background: bgColor }}
        onClick={handleCardClick}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center drop-shadow-md"
                style={{ backgroundColor: "white" }}
              >
                <TruckFilled style={{ color: lineColor, fontSize: "16px" }} />
              </div>
              <h3 className="font-semibold text-gray-800 text-base max-w-[140px]">
                {title}
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-4xl font-bold text-gray-800">
                {alertsLoading ? (
                  <Skeleton.Button
                    active
                    size="small"
                    style={{ width: 60, height: 40 }}
                  />
                ) : (
                  count
                )}
              </div>
              <div
                className="text-xs font-medium text-gray-700 px-1.5 py-1 rounded-full mt-1 mb-1 flex items-center gap-0.5 shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: lineColor }}
                onClick={handleRemarkClick}
              >
                <span>Remark</span>
                <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center ml-1 p-1.5">
                  <Image
                    src={RightArrow}
                    alt="right arrow"
                    width={10}
                    height={10}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row with subtitle */}
          <div className="mt-auto">
            <div className="border-b mb-4" style={{ borderColor: lineColor }} />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-700">{sub}</p>
              <p className="text-xs font-medium text-gray-700 bg-white py-1 px-2 rounded-full">
                {vehCount} Vehicle
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Remark Modal */}
      <Modal
        title={`${title} - Remarks`}
        open={isRemarkModalOpen}
        onOk={() => setIsRemarkModalOpen(false)}
        onCancel={() => setIsRemarkModalOpen(false)}
        footer={null}
        width={1000}
        centered
        styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
      >
        <Table
          columns={columns}
          dataSource={alertsData.map((item, index) => ({
            ...item,
            key: index,
          }))}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ y: 400 }}
          size="small"
          bordered
        />
        {alertsData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No remarks found for {title.toLowerCase()}
          </div>
        )}
      </Modal>
    </>
  );
};
