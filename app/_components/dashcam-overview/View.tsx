"use client";

import { useGetVehiclesByStatusQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { getVehicleStatus } from "@/app/helpers/api/showVehicleStatus";
import { VehicleListIcon } from "@/public/assets/svgs/nav";
import type { MenuProps } from "antd";
import { Dropdown, Spin } from "antd";
import { RotateCw, Search, SlidersHorizontal, X, Menu, Video } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AlertsDrawer } from "./AlertsDrawer";
import { DashcamGrid } from "./DashcamGrid";

const getRealtimeStatusLabel = (vehicleState?: number) => {
    switch (vehicleState) {
        case 0:
            return "Offline";
        case 1:
            return "Driving";
        case 2:
            return "Parking";
        case 3:
            return "Never online";
        case 4:
            return "Expired";
        case 5:
            return "Idling";
        default:
            return "Unknown";
    }
};

const getRealtimeStatusColor = (vehicleState?: number) => {
    switch (vehicleState) {
        case 0:
        case 3:
        case 4:
            return "bg-red-50 text-red-600 border-red-200";
        case 1:
            return "bg-green-50 text-green-600 border-green-200";
        case 2:
            return "bg-amber-50 text-amber-700 border-amber-200";
        case 5:
            return "bg-blue-50 text-blue-700 border-blue-200";
        default:
            return "bg-gray-50 text-gray-600 border-gray-200";
    }
};

const View = () => {
    const { userId, groupId } = useSelector((state: RootState) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [sidebarFilter, setSidebarFilter] = useState("all");
    const [headerFilter, setHeaderFilter] = useState("all");
    const [vehicleStatuses, setVehicleStatuses] = useState<Record<string, any>>({});
    const [showCH3, setShowCH3] = useState(false);
    const [showCH4, setShowCH4] = useState(false);

    const filterMenuProps: MenuProps = {
        items: [
            { key: "all", label: "All Status" },
            { key: "driving", label: "Driving" },
            { key: "idling", label: "Idling" },
            { key: "parking", label: "Parking" },
            { key: "offline", label: "Offline" },
        ],
        onClick: (info) => {
            setSidebarFilter(info.key);
        },
        selectable: true,
        selectedKeys: [sidebarFilter],
    };

    const {
        data: vehiclesData,
        isLoading,
        isFetching,
        refetch,
    } = useGetVehiclesByStatusQuery(
        {
            token: groupId || "",
            userId: userId || "",
            pUserId: userId || "",
            mode: "",
        },
        {
            skip: !groupId || !userId,
        }
    );

    const bsjVehicles = useMemo(() => {
        return (
            vehiclesData?.list?.filter((v: any) => {
                const model = v.gpsDtl?.model;
                return model && model.includes("##BSJ") && model.replace("##BSJ", "").trim() !== "";
            }) || []
        );
    }, [vehiclesData]);

    // Vehicles for sidebar list - Filtered by search text AND sidebarFilter (left filter)
    const searchFilteredVehicles = useMemo(() => {
        return bsjVehicles.filter((v: any) => {
            const matchesSearch = v.vehReg?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (sidebarFilter === "all") return true;

            const imei = v.gpsDtl?.model?.replace("##BSJ", "") || "";
            const status = vehicleStatuses[imei];
            const state = status ? status.vehicleState : 0;

            if (sidebarFilter === "driving") return state === 1;
            if (sidebarFilter === "idling") return state === 5;
            if (sidebarFilter === "parking") return state === 2;
            if (sidebarFilter === "online") return state === 1 || state === 2 || state === 5;
            if (sidebarFilter === "offline") return state === 0 || state === 3 || state === 4;

            return true;
        });
    }, [bsjVehicles, searchTerm, sidebarFilter, vehicleStatuses]);

    // Vehicles for DashcamGrid feeds - Filtered by selectedVehicleId (if selected), else by headerFilter (right filter)
    const filteredVehicles = useMemo(() => {
        if (selectedVehicleId) {
            const selected = bsjVehicles.find((v) => String(v.vId) === String(selectedVehicleId));
            return selected ? [selected] : [];
        }

        return bsjVehicles.filter((v: any) => {
            if (headerFilter === "all") return true;

            const imei = v.gpsDtl?.model?.replace("##BSJ", "") || "";
            const status = vehicleStatuses[imei];
            const state = status ? status.vehicleState : 0;

            if (headerFilter === "driving") return state === 1;
            if (headerFilter === "idling") return state === 5;
            if (headerFilter === "parking") return state === 2;
            if (headerFilter === "online") return state === 1 || state === 2 || state === 5;
            if (headerFilter === "offline") return state === 0 || state === 3 || state === 4;

            return true;
        });
    }, [bsjVehicles, headerFilter, vehicleStatuses, selectedVehicleId]);

    const selectedVehicle = useMemo(() => {
        return bsjVehicles.find((v) => String(v.vId) === String(selectedVehicleId)) || null;
    }, [bsjVehicles, selectedVehicleId]);

    useEffect(() => {
        if (bsjVehicles.length > 0) {
            const imeis = bsjVehicles
                .map((v: any) => v.gpsDtl?.model?.replace("##BSJ", ""))
                .filter(Boolean);
            if (imeis.length > 0) {
                getVehicleStatus(imeis)
                    .then((statuses) => {
                        const statusMap: Record<string, any> = {};
                        statuses.forEach((status) => {
                            statusMap[status.terminalNo] = status;
                        });
                        setVehicleStatuses(statusMap);
                    })
                    .catch((err) => console.error("Failed to load vehicle statuses:", err));
            }
        }
    }, [bsjVehicles]);

    const handleMenuClick = () => {
        setIsDrawerOpen(true);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50 overflow-hidden font-sans">
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm h-full">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search Vehicle"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 placeholder-slate-400"
                            />
                            {searchTerm ? (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-8 top-2.5 hover:bg-slate-200 p-0.5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            ) : null}
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
                            title="Refresh Vehicles"
                        >
                            <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin text-emerald-500" : ""}`} />
                        </button>
                        <Dropdown menu={filterMenuProps} trigger={["click"]}>
                            <button
                                className={`p-2 border rounded-lg bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0 ${sidebarFilter !== "all"
                                    ? "border-[#009b7c] text-[#007d69] bg-[#eefcf7]"
                                    : "border-slate-200 text-slate-500 hover:text-slate-700"
                                    }`}
                                title="Filter by Status"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                            </button>
                        </Dropdown>
                    </div>

                    <div className="text-xs font-semibold text-slate-400 tracking-wider mt-4 mb-1 pl-1">
                        Vehicle Count : {searchFilteredVehicles.length}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                            <Spin spinning size="default" />
                            <span className="text-sm">Loading vehicles...</span>
                        </div>
                    ) : searchFilteredVehicles.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            {searchTerm ? "No matching vehicles found" : "No BSJ vehicles available"}
                        </div>
                    ) : (
                        searchFilteredVehicles.map((vehicle) => {
                            const isSelected = String(vehicle.vId) === String(selectedVehicleId);
                            return (
                                <div
                                    key={vehicle.vId}
                                    onClick={() => {
                                        setSelectedVehicleId(vehicle.vId);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${isSelected
                                        ? "bg-[#f2faf7] text-[#007d69] font-semibold"
                                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    style={
                                        isSelected
                                            ? { borderLeft: "4px solid #009b7c" }
                                            : { borderLeft: "4px solid transparent" }
                                    }
                                >
                                    <div className="shrink-0 flex items-center justify-center">
                                        <Image
                                            src={VehicleListIcon}
                                            alt="vehicle icon"
                                            width={20}
                                            height={20}
                                            className={isSelected ? "filter brightness-90 saturate-150" : ""}
                                        />
                                    </div>
                                    <div className="font-medium text-sm tracking-wide">
                                        {vehicle.vehReg}
                                    </div>
                                    {(() => {
                                        const imei = vehicle.gpsDtl?.model?.replace("##BSJ", "") || "";
                                        const status = vehicleStatuses[imei];
                                        const state = status ? status.vehicleState : 0;
                                        const label = getRealtimeStatusLabel(state);
                                        const colorClasses = getRealtimeStatusColor(state);
                                        return (
                                            <span
                                                className={`ml-auto inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ${colorClasses}`}
                                            >
                                                {label}
                                            </span>
                                        );
                                    })()}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
                <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col gap-3 shrink-0 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-slate-800">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-800 font-sans">Dashcam Overview</h1>
                            <span className="text-slate-300 font-light">|</span>
                            <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
                                <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-red-300"></span>
                                </span>
                                <span className="leading-none select-none">Live View</span>
                            </div>
                            <span className="text-slate-300 font-light">|</span>
                            {isLoading ? (
                                <span className="text-slate-400 text-sm flex items-center gap-1.5 font-medium select-none">
                                    <Spin size="small" className="scale-75 text-emerald-500" />
                                    Loading cameras...
                                </span>
                            ) : (
                                <span className="text-slate-500 text-sm font-medium">
                                    {filteredVehicles.length * (2 + (showCH3 ? 1 : 0) + (showCH4 ? 1 : 0))} cameras
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleMenuClick}
                                className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
                            >
                                <Menu className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center w-full">
                        <div className="flex gap-2 items-center">
                            {selectedVehicle ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-[#eefcf7] border-[#009b7c] text-[#007d69] hover:bg-[#eefcf7] transition-all select-none">
                                    <span>{selectedVehicle.vehReg}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVehicleId(null);
                                        }}
                                        className="hover:bg-[#d5f5eb] p-0.5 rounded-full transition-colors flex items-center justify-center border-none cursor-pointer text-[#007d69] hover:text-[#005c4b]"
                                        title="Clear Selection"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                [
                                    { key: "all", label: "All" },
                                    { key: "online", label: "Online" },
                                    { key: "offline", label: "Offline" },
                                    { key: "idling", label: "Idle" },
                                ].map((tab) => {
                                    const isSelectedStatus =
                                        tab.key === "all"
                                            ? headerFilter === "all"
                                            : tab.key === "online"
                                                ? ["online", "driving", "parking"].includes(headerFilter)
                                                : tab.key === "offline"
                                                    ? headerFilter === "offline"
                                                    : headerFilter === "idling";

                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                if (tab.key === "all") setHeaderFilter("all");
                                                else if (tab.key === "online") setHeaderFilter("online");
                                                else if (tab.key === "offline") setHeaderFilter("offline");
                                                else if (tab.key === "idling") setHeaderFilter("idling");
                                            }}
                                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isSelectedStatus
                                                ? "bg-[#eefcf7] border-[#009b7c] text-[#007d69]"
                                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex items-center gap-2 select-none">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                                Extra Channels:
                            </span>
                            <button
                                onClick={() => setShowCH3(!showCH3)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${showCH3
                                    ? "bg-[#eefcf7] border-[#009b7c] text-[#007d69] shadow-sm"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm"
                                    }`}
                            >
                                CH3
                            </button>
                            <button
                                onClick={() => setShowCH4(!showCH4)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${showCH4
                                    ? "bg-[#eefcf7] border-[#009b7c] text-[#007d69] shadow-sm"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm"
                                    }`}
                            >
                                CH4
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right side main view feeds grid */}
                <div className="flex-1 bg-white h-full overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 bg-slate-50 font-sans">
                            <Spin size="large" />
                            <span className="text-sm font-medium">Loading camera channels...</span>
                        </div>
                    ) : (
                        <DashcamGrid vehicles={filteredVehicles} showCH3={showCH3} showCH4={showCH4} />
                    )}
                </div>
            </div>

            {/* Alerts Drawer overlay */}
            <AlertsDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                selectedVehicle={selectedVehicle}
            />
        </div>
    );
};

export default View;