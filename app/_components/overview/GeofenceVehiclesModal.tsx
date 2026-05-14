"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal, Table, Tag, Input, Button, message, Spin } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import moment from "moment";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";

interface GeofenceVehicle {
  veh_reg: string;
  tel_rawlog: string | null;
  sys_service_id: number;
  lat: number;
  lng: number;
  currenttime: string;
  geo_country: string;
  geo_street: string;
  diff_hr: number;
  date_plus_24h: string;
  date_plus_48h: string;
  date_plus_72h: string;
}

interface GeofenceVehiclesModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  data: GeofenceVehicle[];
}

interface TableDataType {
  key: number;
  srNo: number;
  vehicleNumber: string;
  geofenceInTime: string;
  geofenceName: string;
  haltingHours: number;
  originalData: GeofenceVehicle;
}

const GeofenceVehiclesModal: React.FC<GeofenceVehiclesModalProps> = ({
  isVisible,
  onClose,
  title,
  data,
}) => {
  const [searchText, setSearchText] = useState("");
  const [remarkModal, setRemarkModal] = useState<{
    visible: boolean;
    vehId: number | null;
  }>({ visible: false, vehId: null });
  const [remarkText, setRemarkText] = useState("");
  const [viewRemarkModal, setViewRemarkModal] = useState<{
    visible: boolean;
    content: string;
  }>({ visible: false, content: "" });
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<{
    [key: string]: string;
  }>({});
  const [fetchingLocations, setFetchingLocations] = useState(false);

  const { userId } = useSelector((state: RootState) => state.auth);

  // Fetch locations for all vehicles
  useEffect(() => {
    if (!data.length || !userId) return;

    const fetchLocations = async () => {
      setFetchingLocations(true);
      const locations: { [key: string]: string } = {};

      try {
        for (const vehicle of data) {
          if (vehicle.lat && vehicle.lng) {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/getLocationByLatlong?userid=${userId}&latitude=${vehicle.lat}&longitude=${vehicle.lng}`,
              );

              if (response.ok) {
                const locationResponse = await response.json();
                const locationString =
                  locationResponse.loc || "Location not found";
                locations[`${vehicle.lat},${vehicle.lng}`] = locationString;
              }
            } catch (error) {
              locations[`${vehicle.lat},${vehicle.lng}`] =
                "Error fetching location";
            }
          }
        }

        setLocationData(locations);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setFetchingLocations(false);
      }
    };

    fetchLocations();
  }, [data, userId]);

  const getGeofenceColor = (geofence: string): string => {
    return geofence === "Delhi_Geofence"
      ? "blue"
      : geofence === "Mumbai_geofence"
        ? "green"
        : "default";
  };

  const saveRemark = async () => {
    if (!remarkModal.vehId || !remarkText.trim()) {
      message.error("Please enter a remark");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("remark", remarkText);
      formData.append("veh_id", remarkModal.vehId.toString());

      const response = await fetch(
        "https://gtrac.in/newtracking/reports/saveremark.php",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        message.success("Remark saved successfully");
        setRemarkModal({ visible: false, vehId: null });
        setRemarkText("");
      } else {
        message.error("Failed to save remark");
      }
    } catch (error) {
      message.error("Error saving remark");
    } finally {
      setLoading(false);
    }
  };

  const openRemarkModal = (vehId: number) => {
    setRemarkModal({ visible: true, vehId });
    setRemarkText("");
  };

  const openViewRemarkModal = (content: string) => {
    setViewRemarkModal({ visible: true, content });
  };

  const columns = [
    {
      title: "Sr. No",
      dataIndex: "srNo",
      key: "srNo",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Vehicle Number",
      dataIndex: "vehicleNumber",
      key: "vehicleNumber",
      width: 150,
    },
    {
      title: "Geofence In Time",
      dataIndex: "geofenceInTime",
      key: "geofenceInTime",
      width: 180,
      render: (text: string) => (
        <div>
          <div>{moment(text).format("DD MMM, YYYY")}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {moment(text).format("HH:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Geofence Name",
      dataIndex: "geofenceName",
      key: "geofenceName",
      width: 160,
      render: (text: string) => (
        <Tag color={getGeofenceColor(text)}>{text.replace("_", " ")}</Tag>
      ),
    },
    {
      title: "Halting Hours",
      dataIndex: "haltingHours",
      key: "haltingHours",
      width: 140,
      align: "center" as const,
      render: (hours: number) => `${hours} hrs`,
    },
    {
      title: "Location",
      key: "location",
      width: 250,
      render: (_: unknown, record: TableDataType) => {
        const locationKey = `${record.originalData.lat},${record.originalData.lng}`;
        const location = locationData[locationKey];

        if (fetchingLocations && !location) {
          return <Spin size="small" />;
        }

        return (
          <div
            style={{
              fontSize: "12px",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {location || ""}
          </div>
        );
      },
    },
    {
      title: "Remark",
      key: "remark",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: TableDataType) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => openRemarkModal(record.originalData.sys_service_id)}
          size="small"
        >
          Add
        </Button>
      ),
    },
    {
      title: "View Remark",
      key: "viewRemark",
      width: 120,
      render: (_: unknown, record: TableDataType) => {
        const telRawlog = record.originalData.tel_rawlog;
        if (!telRawlog) return "-";

        const truncated =
          telRawlog.length > 30
            ? `${telRawlog.substring(0, 30)}...`
            : telRawlog;

        return (
          <div>
            <span style={{ fontSize: "12px" }}>{truncated}</span>
            {telRawlog.length > 30 && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openViewRemarkModal(telRawlog)}
                style={{ padding: 0, marginLeft: 4 }}
              >
                More
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const tableData = useMemo(() => {
    const allData = data.map((vehicle, index) => ({
      key: index + 1,
      srNo: index + 1,
      vehicleNumber: vehicle.veh_reg,
      geofenceInTime: vehicle.geo_country,
      geofenceName: vehicle.geo_street,
      haltingHours: vehicle.diff_hr,
      originalData: vehicle,
    }));

    if (!searchText) return allData;

    return allData.filter((item) =>
      item.vehicleNumber.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [data, searchText]);

  const customTitle = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{`${title} (${tableData.length} vehicles)`}</span>
      <Input.Search
        placeholder="Search by vehicle number"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 250 }}
        allowClear
        className="mr-7"
      />
    </div>
  );

  return (
    <Modal
      title={customTitle}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={1250}
      centered
    >
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={{ pageSize: 10 }}
        scroll={{ y: 400 }}
        size="small"
      />

      {/* Remark Modal */}
      <Modal
        title="Add Remark"
        open={remarkModal.visible}
        onOk={saveRemark}
        onCancel={() => setRemarkModal({ visible: false, vehId: null })}
        confirmLoading={loading}
        okText="Save"
      >
        <Input.TextArea
          rows={4}
          placeholder="Enter your remark here..."
          value={remarkText}
          onChange={(e) => setRemarkText(e.target.value)}
        />
      </Modal>

      {/* View Remark Modal */}
      <Modal
        title="View Remark Details"
        open={viewRemarkModal.visible}
        onCancel={() => setViewRemarkModal({ visible: false, content: "" })}
        footer={null}
        width={600}
        centered
      >
        <div
          style={{ maxHeight: 400, overflow: "auto", whiteSpace: "pre-line" }}
        >
          {viewRemarkModal.content}
        </div>
      </Modal>
    </Modal>
  );
};

export default GeofenceVehiclesModal;
