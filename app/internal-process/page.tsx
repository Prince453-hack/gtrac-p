"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pagination, Spin, Tooltip } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  useGetNightTeamUsersQuery,
  type NightTeamUser,
} from "@/app/_globalRedux/services/internalProcess";
import { useGetVehiclesByStatusQuery } from "@/app/_globalRedux/services/trackingDashboard";

const InternalProcessPage = () => {
  const { data, isLoading, isError } = useGetNightTeamUsersQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [selectedUser, setSelectedUser] = useState<NightTeamUser | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [vehicleColumnSearch, setVehicleColumnSearch] = useState("");
  const [controllerIdSearch, setControllerIdSearch] = useState("");
  const [lockStatusSearch, setLockStatusSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [timeSearch, setTimeSearch] = useState("");

  const pages = useMemo(() => {
    const map = new Map<string, NightTeamUser>();
    if (data?.data) {
      data.data.forEach((group: NightTeamUser[]) => {
        group.forEach((item: NightTeamUser) => {
          if (item.page) {
            if (!map.has(item.page)) {
              map.set(item.page, item);
            }
          }
        });
      });
    }
    return Array.from(map.values());
  }, [data]);

  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    const term = searchTerm.toLowerCase();
    return pages.filter((p) => p.page.toLowerCase().includes(term));
  }, [pages, searchTerm]);

  const paginatedPages = useMemo(
    () =>
      filteredPages.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [filteredPages, currentPage, itemsPerPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const {
    data: vehiclesData,
    isLoading: isVehiclesLoading,
    isError: isVehiclesError,
    isFetching: isVehiclesFetching,
  } = useGetVehiclesByStatusQuery(
    selectedUser
      ? {
          token: String(selectedUser.sys_group_id),
          userId: String(selectedUser.sys_user_id),
          pUserId: "1",
          mode: "",
        }
      : {
          token: "",
          userId: "",
          pUserId: "",
          mode: "",
        },
    {
      skip: !selectedUser,
      refetchOnMountOrArgChange: true,
    },
  );

  const filteredVehicles = useMemo(() => {
    const baseList = (vehiclesData?.list || []).filter(
      (vehicle) => vehicle.gpsDtl.controllernum === "CONTROLLER",
    );
    return baseList.filter((vehicle) => {
      const vehRegRaw = vehicle.vehReg || "";
      const controllerIdRaw = String(vehicle.controllermergeId ?? "");
      const isLocked = vehicle.gpsDtl.acState === "Off";
      const lockStatusRaw = isLocked ? "Locked" : "Unlocked";
      const rawLocation =
        vehicle.gpsDtl.latLngDtl.addr || vehicle.gpsDtl.latLngDtl.poi || "";
      const locationRaw = rawLocation.split("_").join(" ");
      const timeRaw = vehicle.gpsDtl.latLngDtl.gpstime || "";

      const globalTerm = vehicleSearch.toLowerCase();
      const matchesGlobal = !globalTerm
        ? true
        : [vehRegRaw, controllerIdRaw, lockStatusRaw, locationRaw, timeRaw]
            .join(" ")
            .toLowerCase()
            .includes(globalTerm);

      const vehicleColTerm = vehicleColumnSearch.toLowerCase();
      const controllerColTerm = controllerIdSearch.toLowerCase();
      const lockColTerm = lockStatusSearch.toLowerCase().trim();
      const locationColTerm = locationSearch.toLowerCase();
      const timeColTerm = timeSearch.toLowerCase();

      const matchesVehicleCol = !vehicleColTerm
        ? true
        : vehRegRaw.toLowerCase().includes(vehicleColTerm);
      const matchesControllerCol = !controllerColTerm
        ? true
        : controllerIdRaw.toLowerCase().includes(controllerColTerm);
      let matchesLockCol: boolean;
      if (!lockColTerm) {
        matchesLockCol = true;
      } else if (
        lockColTerm === "l" ||
        lockColTerm === "lock" ||
        lockColTerm === "locked"
      ) {
        // Explicitly searching for locked vehicles
        matchesLockCol = isLocked;
      } else if (
        lockColTerm === "u" ||
        lockColTerm === "un" ||
        lockColTerm === "unlock" ||
        lockColTerm === "unlocked"
      ) {
        // Explicitly searching for unlocked vehicles
        matchesLockCol = !isLocked;
      } else {
        // Fallback to substring match for any other term
        matchesLockCol = lockStatusRaw
          .toLowerCase()
          .includes(lockColTerm.toLowerCase());
      }
      const matchesLocationCol = !locationColTerm
        ? true
        : locationRaw.toLowerCase().includes(locationColTerm);
      const matchesTimeCol = !timeColTerm
        ? true
        : timeRaw.toLowerCase().includes(timeColTerm);

      return (
        matchesGlobal &&
        matchesVehicleCol &&
        matchesControllerCol &&
        matchesLockCol &&
        matchesLocationCol &&
        matchesTimeCol
      );
    });
  }, [
    vehiclesData,
    vehicleSearch,
    vehicleColumnSearch,
    controllerIdSearch,
    lockStatusSearch,
    locationSearch,
    timeSearch,
  ]);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center space-x-2">
          <Image
            src="/assets/images/common/logo.png"
            alt="Gtrac logo"
            width={80}
            height={20}
          />
          <h1 className="text-lg font-bold text-gray-800">Internal Process</h1>
        </div>
      </header>

      <main className="h-[calc(100vh-72px)] flex justify-start px-0">
        <div
          className={`h-full transition-all duration-300 ${
            isSidebarCollapsed
              ? "w-[6%] md:w-[4%] min-w-[56px]"
              : "w-full md:w-[30%]"
          }`}
        >
          {isSidebarCollapsed ? (
            <div className="bg-white shadow-sm border-r border-gray-200 h-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100"
              >
                <MenuUnfoldOutlined />
              </button>
            </div>
          ) : (
            <div className="bg-white shadow-sm border-r border-gray-200 h-full flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    All Users
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Showing {filteredPages.length} users.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  <MenuFoldOutlined />
                </button>
              </div>

              <div className="px-4 py-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="px-4 py-3 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : isError ? (
                  <p className="text-sm text-red-500">Failed to load data.</p>
                ) : filteredPages.length === 0 ? (
                  <p className="text-sm text-gray-500">No data available.</p>
                ) : (
                  <div>
                    <div className="space-y-1">
                      {paginatedPages.map((user) => (
                        <div
                          key={user.sys_user_id}
                          onClick={() => {
                            setSelectedUser(user);
                            setVehicleSearch("");
                            setIsSidebarCollapsed(true);
                          }}
                          className="flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-200 hover:bg-blue-50 transition transform hover:-translate-y-[1px] hover:shadow-sm cursor-pointer"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500 text-base flex-shrink-0">
                            <UserOutlined />
                          </div>
                          <div className="flex-1 min-w-0 flex items-center">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.page}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {filteredPages.length > itemsPerPage && (
                <div className="flex justify-center border-t border-gray-100 py-2">
                  <Pagination
                    current={currentPage}
                    pageSize={itemsPerPage}
                    total={filteredPages.length}
                    onChange={(page) => setCurrentPage(page)}
                    size="small"
                    showSizeChanger={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="hidden md:flex flex-1 px-4 py-4">
          {!selectedUser ? (
            <div className="m-auto">
              <p className="text-sm md:text-base text-gray-400 text-center">
                Click on the user to see its vehicle
              </p>
            </div>
          ) : isVehiclesLoading || isVehiclesFetching ? (
            <div className="m-auto flex items-center justify-center">
              <Spin size="small" />
            </div>
          ) : isVehiclesError ? (
            <div className="m-auto">
              <p className="text-sm text-red-500 text-center">
                Failed to load vehicles.
              </p>
            </div>
          ) : !vehiclesData || vehiclesData.list.length === 0 ? (
            <div className="m-auto">
              <p className="text-sm text-gray-500 text-center">
                No vehicles found for this user.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col h-full">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-800 truncate mr-3">
                    {selectedUser?.page || "Selected client"}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    Showing{" "}
                    <span className="font-semibold">
                      {filteredVehicles.length}
                    </span>{" "}
                    vehicle
                    {filteredVehicles.length === 1 ? "" : "s"}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-100 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Vehicle
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Controller Id
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Lock Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Location
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Time
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">
                        Action
                      </th>
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="px-3 pb-2 pt-0">
                        <input
                          type="text"
                          placeholder="Search vehicle"
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={vehicleColumnSearch}
                          onChange={(e) =>
                            setVehicleColumnSearch(e.target.value)
                          }
                        />
                      </th>
                      <th className="px-3 pb-2 pt-0">
                        <input
                          type="text"
                          placeholder="Search controller"
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={controllerIdSearch}
                          onChange={(e) =>
                            setControllerIdSearch(e.target.value)
                          }
                        />
                      </th>
                      <th className="px-3 pb-2 pt-0">
                        <input
                          type="text"
                          placeholder="Locked/Unlocked"
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={lockStatusSearch}
                          onChange={(e) => setLockStatusSearch(e.target.value)}
                        />
                      </th>
                      <th className="px-3 pb-2 pt-0">
                        <input
                          type="text"
                          placeholder="Search location"
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                        />
                      </th>
                      <th className="px-3 pb-2 pt-0">
                        <input
                          type="text"
                          placeholder="Search time"
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={timeSearch}
                          onChange={(e) => setTimeSearch(e.target.value)}
                        />
                      </th>
                      <th className="px-3 pb-2 pt-0" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.length === 0 && (
                      <tr className="border-t border-gray-100">
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-center text-xs text-gray-500"
                        >
                          No matching vehicles found.
                        </td>
                      </tr>
                    )}
                    {filteredVehicles.length > 0 &&
                      filteredVehicles.map((vehicle) => {
                        const isLocked = vehicle.gpsDtl.acState === "Off";
                        const contIdDisplay =
                          vehicle.controllermergeId !== undefined &&
                          vehicle.controllermergeId !== null
                            ? String(vehicle.controllermergeId)
                            : "-";
                        const rawLocation =
                          vehicle.gpsDtl.latLngDtl.addr ||
                          vehicle.gpsDtl.latLngDtl.poi ||
                          "-";
                        const locationDisplay = rawLocation
                          .split("_")
                          .join(" ");

                        return (
                          <tr
                            key={vehicle.vId}
                            className="border-t border-gray-100"
                          >
                            <td className="px-3 py-2 font-semibold text-gray-900 text-sm">
                              {vehicle.vehReg}
                            </td>
                            <td className="px-3 py-2 text-gray-700 text-sm">
                              {contIdDisplay}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isLocked
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {isLocked ? "Locked" : "Unlocked"}
                              </span>
                            </td>
                            <td className="px-3 py-2 max-w-xs text-sm">
                              <Tooltip title={locationDisplay}>
                                <span className="block truncate text-gray-800">
                                  {locationDisplay}
                                </span>
                              </Tooltip>
                            </td>
                            <td className="px-3 py-2 text-gray-700 text-sm">
                              {vehicle.gpsDtl.latLngDtl.gpstime}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedUser) return;
                                  const urlLink =
                                    Number(selectedUser.sys_user_id) !== 87115
                                      ? "load_search_data_with_reports_react.php"
                                      : "load_search_reactvrc.php";
                                  const url = `https://gtrac.in/newtracking/reports/${urlLink}?action=search_with_reports&vehicle_Number=${vehicle.vId}&CtrlId=${vehicle.controllermergeId}&ParentId=1&UserName=htpl&sys_group_id_parent=1&sys_group_id=${selectedUser.sys_group_id}&UserId=${selectedUser.sys_user_id}`;
                                  window.open(url, "_blank");
                                }}
                                className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-600"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InternalProcessPage;
