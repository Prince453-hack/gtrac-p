"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLazyGetpathwithDateDaignosticQuery } from "@/app/_globalRedux/services/trackingDashboard";

// Dynamic import to prevent SSR issues with Leaflet
const Map = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      Loading map...
    </div>
  ),
});

interface PathPoint {
  lat: number;
  lng: number;
  gpstime?: string;
  datetime?: string;
  speed: number;
  location: string;
  bearing?: number;
  distance?: number;
  nearestPoi?: string;
}

// Helper to get time from path point (handles both gpstime and datetime)
const getPathPointTime = (point: PathPoint): string => {
  return point.gpstime || point.datetime || "";
};

interface ShareUrlData {
  id: number;
  uniqueid: string;
  booking_no: string;
  user_id: string;
  start_date: string;
  End_date: string;
  vehicle_no: string;
  clinet_name: string;
  dispatch_date: string;
  route_from: string | null;
  cargo: string | null;
  phone_no: string;
  email_id: string;
  fight_no: string;
  driver_name: string;
  driver_no: string;
  pickup_time: string;
  url: string;
  serviceid: string;
}

interface TrackingData {
  success: boolean;
  vehicleId: string;
  totalDistance: string;
  runningTime: string | number;
  stoppageTime: string | number;
  patharry: PathPoint[];
}

// Helper to format time (minutes to readable string)
const formatTime = (time: string | number): string => {
  if (typeof time === "string") return time;
  if (typeof time === "number") {
    const hours = Math.floor(time / 60);
    const mins = Math.round(time % 60);
    if (hours > 0) {
      return `${hours} Hr${hours > 1 ? "s" : ""} ${mins} Min${mins !== 1 ? "s" : ""}`;
    }
    return `${mins} Min${mins !== 1 ? "s" : ""}`;
  }
  return "N/A";
};

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const [shareUrlData, setShareUrlData] = useState<ShareUrlData | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set sidebar open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redux hook for path data
  const [getPathData, { isLoading: isPathLoading }] =
    useLazyGetpathwithDateDaignosticQuery();

  const getDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatForApi = (d: Date, time: string) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day} ${time}`;
    };

    return {
      startDate: formatForApi(start, "00:00"),
      endDate: formatForApi(end, "23:59"),
    };
  };

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!id) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        // Step 1: Fetch share URL data
        const shareResponse = await fetch(
          `https://gtrac.in:8089/trackingDashboard/getShareUrlKey?key=${id}`,
        );

        if (!shareResponse.ok) {
          throw new Error(
            `Failed to fetch share URL data: HTTP ${shareResponse.status}`,
          );
        }

        const shareData = await shareResponse.json();

        if (
          !shareData.success ||
          !shareData.list ||
          shareData.list.length === 0
        ) {
          throw new Error("Invalid or expired share URL");
        }

        // Get the latest entry (last item in the array)
        const shareInfo: ShareUrlData =
          shareData.list[shareData.list.length - 1];
        setShareUrlData(shareInfo);

        // Step 2: Fetch path data using Redux hook
        const { startDate, endDate } = getDateRange(
          shareInfo.start_date,
          shareInfo.End_date,
        );

        const pathResult = await getPathData({
          vId: Number(shareInfo.serviceid) || shareInfo.id,
          startDate,
          endDate,
          userId: shareInfo.user_id || "6258",
        }).unwrap();

        if (pathResult.success) {
          setTrackingData({
            success: pathResult.success,
            vehicleId: String(pathResult.vehicleId) || shareInfo.vehicle_no,
            totalDistance: pathResult.totalDistance || "N/A",
            runningTime: pathResult.runningTime || "N/A",
            stoppageTime: pathResult.stoppageTime || "N/A",
            patharry: pathResult.patharry || [],
          });
        } else {
          setTrackingData({
            success: true,
            vehicleId: shareInfo.vehicle_no,
            totalDistance: "N/A",
            runningTime: "N/A",
            stoppageTime: "N/A",
            patharry: [],
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [id, getPathData],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const pathPoints = trackingData?.patharry || [];
  const center: [number, number] =
    pathPoints.length > 0
      ? [pathPoints[0].lat, pathPoints[0].lng]
      : [21.502832, 72.922309];

  const formatLocation = (loc: string) => loc?.replace(/_/g, " ") || "Unknown";

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-5xl mb-4">⚠️</div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
            Error Loading Data
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-lg z-[1003]">
        <div className="flex items-center gap-2 sm:gap-4">
          <Image
            src="/assets/images/common/logo.png"
            alt="GTrac Logo"
            width={80}
            height={30}
            className="object-contain w-16 sm:w-20"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-1.5 sm:p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <span className="bg-slate-700 border border-slate-600 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none">
            Vehicle:{" "}
            {shareUrlData?.vehicle_no ||
              trackingData?.vehicleId ||
              "Loading..."}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Mobile Bottom Sheet Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[1001] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Bottom sheet on mobile, side panel on desktop */}
        <aside
          className={`
            fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
            ${sidebarOpen ? "translate-y-0 md:translate-y-0" : "translate-y-full md:translate-y-0"}
            ${sidebarOpen ? "md:w-80" : "md:w-0"}
            h-[70vh] md:h-auto max-h-[70vh] md:max-h-none
            transition-all duration-300 ease-in-out
            bg-white shadow-xl z-[1002] flex flex-col overflow-hidden
            rounded-t-2xl md:rounded-none
          `}
        >
          {/* Mobile drag handle */}
          <div className="md:hidden flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {sidebarOpen && (
            <>
              {/* Trip Summary */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    Summary
                  </h2>
                  <button
                    className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-0 sm:grid-cols-1">
                  <div className="p-2 sm:p-3 rounded-xl border border-gray-300 sm:mb-4">
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500">
                      Total Distance
                    </div>
                    <div className="text-lg sm:text-xl font-bold">
                      {trackingData?.totalDistance || "--"}
                    </div>
                  </div>
                  <div className="border border-gray-300 p-2 sm:p-3 rounded-xl">
                    <div className="text-[10px] sm:text-xs font-medium">
                      Booking No
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-purple-800 truncate">
                      {shareUrlData?.booking_no || "--"}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {shareUrlData && (
                  <div className="mt-3 sm:mt-4 space-y-2">
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-xl">
                      <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
                        Client
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                        {shareUrlData.clinet_name}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 p-2 rounded-lg">
                        <div className="text-[10px] sm:text-xs text-green-600 font-medium">
                          Running
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-green-800">
                          {trackingData?.runningTime
                            ? formatTime(trackingData.runningTime)
                            : "--"}
                        </div>
                      </div>
                      <div className="bg-red-50 p-2 rounded-lg">
                        <div className="text-[10px] sm:text-xs text-red-600 font-medium">
                          Stoppage
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-red-800">
                          {trackingData?.stoppageTime
                            ? formatTime(trackingData.stoppageTime)
                            : "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Start/End Points */}
              <div className="p-3 sm:p-4 border-b border-gray-200 flex-1 overflow-auto">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Route Details
                </h3>

                {pathPoints.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Start Point */}
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 sm:w-3 h-4 sm:h-5 bg-[#478c83] rounded-full" />
                        <div className="w-0.5 h-full bg-gray-300 my-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          Start Point
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                          {formatLocation(pathPoints[0].location).slice(0, 50)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                          {getPathPointTime(pathPoints[0])}
                        </div>
                      </div>
                    </div>

                    {/* End Point */}
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-red-500 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          End Point
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                          {formatLocation(
                            pathPoints[pathPoints.length - 1].location,
                          ).slice(0, 50)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                          {getPathPointTime(pathPoints[pathPoints.length - 1])}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-500 text-center py-4">
                    No route data available
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-white shadow-lg p-2 rounded-r-lg hover:bg-gray-50 transition-colors"
          style={{ left: sidebarOpen ? "320px" : "0" }}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Map Container */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base text-gray-600">
                  Loading tracking data...
                </span>
              </div>
            </div>
          ) : (
            <Map
              center={center}
              zoom={14}
              className="h-full w-full"
              pathPoints={pathPoints}
            />
          )}

          {/* Mobile Bottom Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {sidebarOpen ? "Hide Details" : "View Details"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
