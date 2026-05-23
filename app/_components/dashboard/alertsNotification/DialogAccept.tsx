"use client";

import {
  Button,
  Modal,
  Spin,
  Table,
  message,
  Select,
  Input,
  Tooltip,
} from "antd";
import React, { useState } from "react";

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleNumber?: string;
  location?: string;
  currentFuel?: string;
}

interface FuelLog {
  id: number;
  ambulanceId: number;
  invoiceFileUrl: string;
  fuelType: string;
  softwareReadingLitres: string;
  softwareReadingUnitPrice: string;
  softwareReadingTotalAmount: string;
  manualReadingLitres: string;
  manualReadingUnitPrice: string;
  manualReadingTotalAmount: string;
  fuelDateTime: string;
  location: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

interface VehicleFuelData {
  vehicleno: string;
  fuelLogs: FuelLog[];
}

interface GtracVehicle {
  vehReg: string;
  vehicleFuelCapacity: number;
  gpsDtl: {
    latLngDtl: {
      lat: number;
      lng: number;
      addr: string;
    };
    fuel: number;
  };
  drivers?: {
    driverName: string;
  };
  status?: string;
}

const PopupModal: React.FC<PopupModalProps> = ({
  isOpen,
  onClose,
  vehicleNumber,
  location,
  currentFuel,
}) => {
  // State for mode of payment and amount
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");
  const [enteredAmount, setEnteredAmount] = useState<string>("");
  const [enteredOTP, setEnteredOTP] = useState<string>("");

  // Only use passed data, no fallbacks
  const dynamicVehicleNumber = vehicleNumber || "";
  const dynamicLocation = location || "";
  const dynamicCurrentFuel = currentFuel || "0";

  // Don't render if essential data is missing
  if (!vehicleNumber || !location || !currentFuel) {
    return null;
  }

  const staticFuelData: VehicleFuelData[] = [
    {
      vehicleno: dynamicVehicleNumber,
      fuelLogs: [
        {
          id: 1,
          ambulanceId: 101,
          invoiceFileUrl: "",
          fuelType: "Petrol",
          softwareReadingLitres: dynamicCurrentFuel,
          softwareReadingUnitPrice: "90",
          softwareReadingTotalAmount: (
            parseFloat(dynamicCurrentFuel) * 90
          ).toString(),
          manualReadingLitres: dynamicCurrentFuel,
          manualReadingUnitPrice: "90",
          manualReadingTotalAmount: (
            parseFloat(dynamicCurrentFuel) * 90
          ).toString(),
          fuelDateTime: new Date().toISOString(),
          location: dynamicLocation,
          latitude: "",
          longitude: "",
          createdAt: new Date().toISOString(),
          updatedAt: null,
          deletedAt: null,
        },
      ],
    },
  ];
  const staticGtracVehicles: GtracVehicle[] = [
    {
      vehReg: dynamicVehicleNumber,
      vehicleFuelCapacity: 60,
      gpsDtl: {
        latLngDtl: {
          lat: 0,
          lng: 0,
          addr: dynamicLocation,
        },
        fuel: parseFloat(dynamicCurrentFuel),
      },
      drivers: {
        driverName: "Driver",
      },
      status: "Fueling",
    },
  ];

  const fuelData = staticFuelData;
  const gtracVehicles = staticGtracVehicles;
  const loading = false;

  const calculatePercentageDifference = (
    softReading: number,
    appReading: number
  ): number => {
    if (appReading === 0) return 0;
    return softReading - appReading;
  };

  const handleAudit = (vehicleNo: string) => {
    message.success(`Audit action triggered for vehicle ${vehicleNo}`);
    alert(`Audit action triggered for vehicle ${vehicleNo}`);
  };

  const handleOk = (vehicleNo: string) => {
    // message.success(`OK action confirmed for vehicle ${vehicleNo}`);
  };

  const handleCancel = () => {
    onClose();
  };

  const tableData = fuelData
    .filter(
      (vehicle: VehicleFuelData) =>
        vehicle.fuelLogs && vehicle.fuelLogs.length > 0
    )
    .map((vehicle: VehicleFuelData) => {
      const currentLog = vehicle.fuelLogs[0];
      const gtrac = gtracVehicles.find(
        (v) =>
          v.vehReg.replace(/\s/g, "").toLowerCase() ===
          vehicle.vehicleno.replace(/\s/g, "").toLowerCase()
      );

      const softReading = parseFloat(dynamicCurrentFuel) || 0;
      const appReading = parseFloat(dynamicCurrentFuel) || 0;
      const percentageDiff = 0; // Since both readings are the same, difference is 0
      const shouldAudit = false; // No audit needed since readings match
      const currentStatus = gtrac && gtrac.status ? gtrac.status : "Fueling";

      return {
        key: vehicle.vehicleno,
        vehicleNo: vehicle.vehicleno,
        driverName:
          gtrac && gtrac.drivers ? gtrac.drivers.driverName : "Driver",
        location: dynamicLocation,
        coordinates:
          currentLog.latitude && currentLog.longitude
            ? `${currentLog.latitude}, ${currentLog.longitude}`
            : "Coordinates not available",
        softReading: softReading.toFixed(2),
        appReading: appReading.toFixed(2),
        difference: percentageDiff.toFixed(2),
        shouldAudit,
        percentageDiff,
        currentStatus,
        paymentMode: selectedPaymentMode,
        amount: enteredAmount,
        otp: enteredOTP,
      };
    });

  const columns = [
    {
      title: "Vehicle & Driver",
      key: "vehicleDriver",
      render: (record: any) => (
        <div>
          <div className="font-medium text-gray-900">{record.vehicleNo}</div>
          <div className="text-sm text-gray-500">{record.driverName}</div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (record: any) => (
        <Tooltip title={record.location} placement="topLeft">
          <div
            className="text-sm text-gray-900 cursor-pointer"
            style={{
              maxWidth: "150px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {record.location}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Current Status",
      key: "currentStatus",
      render: (record: any) => (
        <span className="font-semibold text-blue-700">
          {dynamicCurrentFuel}
        </span>
      ),
    },
    {
      title: "Soft Reading",
      dataIndex: "softReading",
      key: "softReading",
      render: (value: string) => (
        <span className="font-medium text-yellow-600">-</span>
      ),
    },
    {
      title: "App Reading",
      dataIndex: "appReading",
      key: "appReading",
      render: (value: string) => (
        <span className="font-medium text-blue-600">-</span>
      ),
    },
    {
      title: "Fuel Difference",
      key: "difference",
      render: (record: any) => (
        <div className="text-center">
          <span
            className={`font-medium ${
              Math.abs(record.percentageDiff) > 2.1
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {record.percentageDiff > 0 ? "+" : ""}
            {record.difference}%
          </span>
          {Math.abs(record.percentageDiff) > 2.1 && (
            <div className="text-xs text-red-600">⚠️ Exceeds 2.1%</div>
          )}
        </div>
      ),
    },
    {
      title: "OTP",
      key: "otp",
      render: (record: any) => (
        <Input
          placeholder="Enter OTP"
          type="text"
          style={{ width: 80 }}
          value={enteredOTP}
          onChange={(e) => setEnteredOTP(e.target.value)}
        />
      ),
    },
    {
      title: "Mode of Payment",
      key: "paymentMode",
      render: (record: any) => (
        <Select
          placeholder="Payment Method"
          style={{ width: 150 }}
          value={selectedPaymentMode || undefined}
          onChange={(value) => setSelectedPaymentMode(value)}
          options={[
            { value: "BPCL", label: "BPCL" },
            { value: "IOCL", label: "IOCL" },
            { value: "Paytm", label: "Paytm" },
            { value: "Shankar", label: "Shankar" },
            { value: "Deepak", label: "Deepak" },
          ]}
        />
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (record: any) => (
        <Input
          placeholder="Enter amount"
          type="number"
          style={{ width: 90 }}
          value={enteredAmount}
          onChange={(e) => setEnteredAmount(e.target.value)}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: any) => (
        <div className="flex space-x-2">
          <Button
            type="primary"
            danger={record.shouldAudit}
            size="small"
            onClick={() => handleAudit(record.vehicleNo)}
            disabled={!record.shouldAudit}
            className={
              record.shouldAudit ? "bg-red-600 hover:bg-red-700" : "bg-gray-400"
            }
          >
            Audit
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => handleOk(record.vehicleNo)}
            disabled={true}
            className={
              record.shouldAudit
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            OK
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={1300}
      zIndex={10000}
      className="fuel-audit-modal"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Ambulance Fueling
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Vehicle: </span>
                <span className="text-blue-800">{dynamicVehicleNumber}</span>
              </div>
            </div>
          </div>

          <Table
            dataSource={tableData}
            columns={columns}
            pagination={false}
            scroll={{ x: 1200 }}
            className="fuel-audit-table"
          />
        </div>
      )}
    </Modal>
  );
};

export default PopupModal;
