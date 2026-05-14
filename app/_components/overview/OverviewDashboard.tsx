"use client";

import { setMakeInactiveIndex } from "@/app/_globalRedux/dashboard/optionsSlice";
import { useGetVehiclesByStatusQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { AIIcon, NonActiveTruck } from "@/public/assets/svgs/nav";
import {
  CalendarOutlined,
  CarOutlined,
  CloseOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Dropdown,
  Input,
  Modal,
  Table,
  Tabs,
  message,
} from "antd";
import { MenuProps } from "antd/lib";
import moment from "moment";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MakeInactiveVehicle } from "../dashboard/vehicleOverviewCard/MakeInactiveVehicle";
import ODBDetailsSection from "./ODBDetailsSection";
import PerformanceMetrics from "./PerformanceMetrics";
import VehicleStatsCards from "./VehicleStatsCards";

export const OverviewDashboard = () => {
  const [selectedDateRange, setSelectedDateRange] = useState("Today");
  const [selectedDateRangeDateJs, setSelectedDateRangeDateJs] = useState<
    Date[]
  >([new Date(), new Date()]);
  const [nonActiveModalOpen, setNonActiveModalOpen] = useState(false);
  const [activeMenuVehicleId, setActiveMenuVehicleId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [aiSummaryTrigger, setAiSummaryTrigger] = useState(0);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [accidentalImageMap, setAccidentalImageMap] = useState<
    Record<string, string>
  >({});

  const dateRanges = ["Today"];

  const { userId, groupId, parentUser, isOdb } = useSelector(
    (state: RootState) => state.auth,
  );

  const dispatch = useDispatch();

  const { data: vehicleData } = useGetVehiclesByStatusQuery(
    {
      token: groupId,
      userId: userId,
      pUserId: parentUser,
      mode: "",
    },
    {
      skip: !groupId || !userId,
      refetchOnMountOrArgChange: true,
    },
  );

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    switch (range) {
      case "Today":
        setSelectedDateRangeDateJs([new Date(), new Date()]);
        break;
      case "Yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setSelectedDateRangeDateJs([yesterday, yesterday]);
        break;
      case "Last 3 Days":
        setSelectedDateRangeDateJs([
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          new Date(),
        ]);
        break;
      default:
        setSelectedDateRangeDateJs([new Date(), new Date()]);
    }
  };

  // Get non-active vehicles
  const getNonActiveVehicles = () => {
    if (!vehicleData?.list) return [];

    const nonActiveVehicles = vehicleData.list.filter((vehicle: any) => {
      const inactiveStatus = vehicle.gpsDtl?.inactiveStatus;
      // Check both number and string comparison for safety
      return inactiveStatus === 1 || inactiveStatus === "1";
    });

    return nonActiveVehicles;
  };

  // Categorize non-active vehicles by reason
  const categorizeNonActiveVehicles = () => {
    const nonActiveVehicles = getNonActiveVehicles();
    const categories: Record<string, any[]> = {
      "Without Driver": [],
      "At Workshop": [],
      Accidental: [],
      "Vehicle on Sale": [],
      Others: [],
    };

    nonActiveVehicles.forEach((vehicle: any) => {
      let reason = vehicle.gpsDtl?.inactiveReason || "Others";

      // Remove "Other:" prefix if present and categorize
      if (reason.startsWith("Other:")) {
        reason = reason.substring(6).trim();
      }

      // Map reasons to categories
      if (
        reason.toLowerCase().includes("without driver") ||
        reason.toLowerCase().includes("driver")
      ) {
        categories["Without Driver"].push(vehicle);
      } else if (
        reason.toLowerCase().includes("workshop") ||
        reason.toLowerCase().includes("maintenance")
      ) {
        categories["At Workshop"].push(vehicle);
      } else if (
        reason.toLowerCase().includes("accident") ||
        reason.toLowerCase().includes("crash")
      ) {
        categories["Accidental"].push(vehicle);
      } else if (
        reason.toLowerCase().includes("sale") ||
        reason.toLowerCase().includes("sell")
      ) {
        categories["Vehicle on Sale"].push(vehicle);
      } else {
        categories["Others"].push(vehicle);
      }
    });

    return categories;
  };

  // Filter vehicles by search term
  const filterVehiclesBySearch = (vehicles: any[]) => {
    if (!searchTerm.trim()) return vehicles;

    return vehicles.filter((vehicle: any) => {
      const vehReg = vehicle.vehReg || "";
      const reason = vehicle.gpsDtl?.inactiveReason || "";

      return (
        vehReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  // Format date time for display
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    return moment(dateTimeString).format("DD MMM YYYY, HH:mm");
  };

  // Table columns for vehicle details
  const tableColumns = [
    {
      title: "Vehicle No.",
      dataIndex: "vehReg",
      key: "vehReg",
      render: (text: string) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Inactive Reason",
      dataIndex: ["gpsDtl", "inactiveReason"],
      key: "inactiveReason",
      render: (reason: string) => {
        let displayReason = reason || "N/A";
        if (displayReason.startsWith("Other:")) {
          displayReason = displayReason.substring(6).trim();
        }
        return <span className="text-gray-700">{displayReason}</span>;
      },
    },
    {
      title: "Inactive Date Time",
      dataIndex: ["gpsDtl", "InactiveDatetime"],
      key: "InactiveDatetime",
      render: (dateTime: string) => (
        <span className="text-gray-700">{formatDateTime(dateTime)}</span>
      ),
    },
    {
      title: "Image",
      key: "accidentalImage",
      width: 120,
      render: (_: any, record: any) => {
        const reason = String(
          record?.gpsDtl?.inactiveReason || "",
        ).toLowerCase();
        const isAccidentalReason =
          reason.includes("accident") || reason.includes("crash");

        if (!isAccidentalReason) {
          return <span className="text-gray-400">-</span>;
        }

        const vehicleKey = String(record?.vId || "").trim();
        const imageUrl = accidentalImageMap[vehicleKey];

        if (!imageUrl) {
          return <span className="text-gray-400">No image</span>;
        }

        return (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline underline-offset-2 hover:text-blue-500"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            View image
          </a>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      render: (_: any, record: any) => (
        <div className="relative">
          <Dropdown
            open={activeMenuVehicleId === record.vId}
            onOpenChange={(open) => {
              setActiveMenuVehicleId(open ? record.vId : null);
            }}
            menu={{
              items: [
                {
                  key: "makeActive",
                  label: (
                    <div
                      className="py-1 px-2 cursor-pointer"
                      onClick={() => {
                        dispatch(setMakeInactiveIndex(record.vId));
                        setActiveMenuVehicleId(null);
                      }}
                    >
                      Make it Active
                    </div>
                  ),
                },
              ],
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          </Dropdown>
        </div>
      ),
    },
  ];

  const [expandedSection, setExpandedSection] = useState<
    "ALERTS" | "TRENDS" | "ANALYSIS"
  >("ALERTS");

  const handleNonActiveModalOpen = () => {
    const nonActiveVehicles = getNonActiveVehicles();
    if (nonActiveVehicles.length === 0) {
      message.info("No non-active vehicles found");
      return;
    }
    setNonActiveModalOpen(true);
  };

  const items: MenuProps["items"] = dateRanges.map((range) => ({
    key: range,
    label: (
      <div
        onClick={() => handleDateRangeChange(range)}
        className="text-sm py-1"
      >
        {range}
      </div>
    ),
  }));

  const fetchAccidentalImages = async () => {
    try {
      const nonActiveVehicles = getNonActiveVehicles();
      if (nonActiveVehicles.length === 0) {
        setAccidentalImageMap({});
        return;
      }

      const imageMap: Record<string, string> = {};

      for (const vehicle of nonActiveVehicles) {
        const reason = String(
          vehicle?.gpsDtl?.inactiveReason || "",
        ).toLowerCase();
        const isAccidentalReason =
          reason.includes("accident") || reason.includes("crash");

        if (!isAccidentalReason) continue;

        try {
          const response = await fetch(
            `/api/upload/accidental-image?vehicleId=${vehicle.vId}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.imageUrl) {
              imageMap[String(vehicle.vId)] = data.imageUrl;
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch image for vehicle ${vehicle.vId}:`,
            error,
          );
        }
      }

      setAccidentalImageMap(imageMap);
    } catch (error) {
      console.error("Failed to fetch accidental images:", error);
    }
  };

  useEffect(() => {
    if (!nonActiveModalOpen) return;
    fetchAccidentalImages();
  }, [nonActiveModalOpen, vehicleData]);

  return (
    <div className="bg-neutral-50 min-h-screen p-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          {/* <div className="flex items-center gap-2 text-gray-600">
            <span className="font-normal">Show:</span>

            <a
              onClick={(e) => e.preventDefault()}
              className="cursor-default hover:opacity-100"
            >
              {selectedDateRange}
            </a>
          </div> */}
        </div>
        <div className="flex items-center gap-2">
          {/* {isOdb ? (
            <button
              disabled={aiSummaryLoading}
              onClick={() => setAiSummaryTrigger((previous) => previous + 1)}
              className={`bg-sky-600 border-sky-600 hover:bg-sky-700 text-white rounded px-2 py-1 flex items-center space-x-2 ${
                aiSummaryLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <Image
                src={AIIcon}
                alt="Ai Summary"
                width={20}
                height={20}
                className="ml-1"
              />
              <p>{aiSummaryLoading ? "Generating..." : "AI Summary"}</p>
            </button>
          ) : null} */}
          <Button
            className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
            onClick={handleNonActiveModalOpen}
          >
            <Image
              src={NonActiveTruck}
              alt="Non Active Truck"
              width={16}
              height={16}
              className="object-contain"
            />{" "}
            Non Active Vehicles ({getNonActiveVehicles().length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7">
          <div>
            <div className="bg-white flex justify-between rounded-md items-center py-2 px-4 border-b shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <CarOutlined className="text-gray-600" />
                <span className="font-medium text-gray-900">Vehicle</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-gray-600" />
                  <span className="text-gray-600">
                    {Array.isArray(selectedDateRangeDateJs)
                      ? `${moment(selectedDateRangeDateJs[0]).format(
                          "Do MMM, YYYY",
                        )} - ${moment(selectedDateRangeDateJs[1]).format(
                          "Do MMM, YYYY",
                        )}`
                      : moment(selectedDateRangeDateJs).format("Do, MMM YYYY")}
                  </span>
                </div>
              </div>
            </div>

            <VehicleStatsCards />
          </div>
        </div>
        <div className="col-span-5">
          <PerformanceMetrics />
        </div>

        {isOdb ? (
          <>
            {/* <div className="col-span-3">
              <OverviewSidebar
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              />
            </div>

            <div className="col-span-9">
              <ChartsSection
                expandedSection={expandedSection}
                selectedDateRangeDateJs={selectedDateRangeDateJs}
              />
            </div> */}

            <div
              className="col-span-12 overflow-y-auto scrollbar scrollbar-w-0.5 scrollbar-thumb-blue-500 scrollbar-thumb-rounded-full px-1"
              style={{ height: "calc(100vh - 300px)" }}
            >
              <ODBDetailsSection
                selectedDateRangeDateJs={selectedDateRangeDateJs}
                aiSummaryTrigger={aiSummaryTrigger}
                onSummaryLoadingChange={setAiSummaryLoading}
              />
            </div>
          </>
        ) : // <div
        //   className="col-span-12"
        //   // style={{ height: "calc(100vh - 300px)" }}
        // >
        //   <ODBDetailsSection />
        // </div>
        null}
      </div>

      {/* Non Active Vehicles Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Image
                  src={NonActiveTruck}
                  alt="Non Active Truck"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Non Active Vehicles
                </h2>
                <p className="text-sm text-gray-500">
                  ({getNonActiveVehicles().length} vehicles)
                </p>
              </div>
            </div>
            <div className="flex items-center ml-auto mr-7">
              <Input
                placeholder="Search vehicles..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-52"
                size="middle"
                allowClear
              />
            </div>
          </div>
        }
        open={nonActiveModalOpen}
        onCancel={() => setNonActiveModalOpen(false)}
        footer={null}
        width={1000}
        centered
        className="non-active-vehicles-modal"
        closeIcon={
          <CloseOutlined className="text-gray-400 hover:text-gray-600" />
        }
      >
        <div className="mt-6">
          <Tabs
            defaultActiveKey="Without Driver"
            type="card"
            className="custom-tabs"
            items={Object.entries(categorizeNonActiveVehicles())
              .filter(([_, vehicles]) => vehicles.length > 0)
              .map(([reason, vehicles]) => {
                const filteredVehicles = filterVehiclesBySearch(vehicles);
                const hasAccidentalImage = filteredVehicles.some(
                  (vehicle: any) => {
                    return !!accidentalImageMap[String(vehicle?.vId)];
                  },
                );

                const columnsForTab =
                  reason === "Accidental" && hasAccidentalImage
                    ? tableColumns
                    : tableColumns.filter(
                        (column) => column.key !== "accidentalImage",
                      );

                return {
                  key: reason,
                  label: (
                    <div className="flex items-center gap-2 px-3 py-1">
                      <span className="font-medium">{reason}</span>
                      <Badge
                        count={vehicles.length}
                        showZero={false}
                        style={{
                          backgroundColor:
                            reason === "Without Driver" ? "#10b981" : "#6366f1",
                          fontSize: "11px",
                          height: "18px",
                          minWidth: "18px",
                          lineHeight: "18px",
                        }}
                      />
                    </div>
                  ),
                  children: (
                    <div className="px-1 pb-4">
                      <Table
                        dataSource={filteredVehicles.map((vehicle, index) => ({
                          ...vehicle,
                          key: `${reason}-${index}`,
                        }))}
                        columns={columnsForTab}
                        pagination={{
                          pageSize: 5,
                          showSizeChanger: false,
                          showQuickJumper: false,
                          showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} vehicles`,
                        }}
                        size="middle"
                        className="custom-table"
                        scroll={{ x: 800 }}
                      />
                    </div>
                  ),
                };
              })}
          />
        </div>

        {/* Render MakeInactiveVehicle component for each non-active vehicle */}
        {getNonActiveVehicles().map((vehicle) => (
          <MakeInactiveVehicle key={vehicle.vId} vehicleData={vehicle} />
        ))}
      </Modal>
    </div>
  );
};
