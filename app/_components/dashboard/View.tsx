"use client";

import { VehicleDetails } from "./VehicleDetails";
import { GoogleMaps } from "./GoogleMaps";
import { Slide, toast, ToastContainer } from "react-toastify";
import { createContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import "react-toastify/dist/ReactToastify.css";
import { GetAlertsPopupsResponse } from "@/app/_globalRedux/services/types/alerts";
import NearbyVehiclesDetails from "./nearbyVehicles/NearbyVehiclesDetails";
import { ExpandReportsModal } from "./ExpandReportsModal";
import { ToggleVehicleStatusAndTripStatus } from "./ToggleVehicleStatusAndTripStatus";
import { TripForm } from "./trip/TripForm";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Spin, Modal } from "antd";
import React from "react";
import { CheckInAccountDetails } from "./CheckInAccountDetails";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import VideoOverview from "./video/VideoOverview";
import { VehicleAllocationTripForm } from "./trip/VehicleAllocationTripForm";

export const VehicleDetailsContext = createContext<{
  reportsModalState: {
    isReportsExpanded: boolean;
    setIsReportsExpanded: (prev: boolean) => boolean;
    selectedView: "Column" | "Table";
    setSelectedView: (prev: "Column" | "Table") => "Column" | "Table";
  };
}>({
  reportsModalState: {
    isReportsExpanded: false,
    setIsReportsExpanded: () => false,
    selectedView: "Column",
    setSelectedView: () => "Column",
  },
});

export const View = () => {
  const { isGetNearbyVehiclesActive } = useSelector(
    (state: RootState) => state.nearbyVehicles,
  );
  const { isLoading: isAuthGlobalLoading, userId } = useSelector(
    (state: RootState) => state.auth,
  );
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath,
  );
  const { isMapActive } = useSelector((state: RootState) => state.map);

  const { isLoading } = useUser();

  const [showGpsDetailsModal, setShowGpsDetailsModal] = useState(false);

  useEffect(() => {
    if (userId) {
      const storageKey = `gps_details_popup_shown_${userId}`;
      const hasBeenShown = localStorage.getItem(storageKey);

      if (!hasBeenShown) {
        setShowGpsDetailsModal(true);
      }
    }
  }, [userId]);

  const data = useSelector((state: RootState) => {
    const getAlertsPopup = Object.values(state["react-api"].queries).find(
      (query) => query && query.endpointName === "getAlertsPopups",
    );
    if (getAlertsPopup) {
      return getAlertsPopup.data as GetAlertsPopupsResponse[];
    }
  });

  useEffect(() => {
    const callRedisPOIEndpoints = async () => {
      if (userId) {
        const storageKey = `redis_poi_called_${userId}`;
        const hasBeenCalled = localStorage.getItem(storageKey);

        if (!hasBeenCalled) {
          try {
            await Promise.all([
              fetch(
                `https://gtrac.in/newtracking/redis-files/geo/hset_pois.php?userid=${userId}`,
              ),
              fetch(
                `https://gtrac.in/newtracking/redis-files/geo/hset_pois1.php?userid=${userId}`,
              ),
            ]);
            localStorage.setItem(storageKey, "true");
          } catch (error) {
            console.error("Error calling Redis POI endpoints:", error);
          }
        }
      }
    };

    callRedisPOIEndpoints();
  }, [userId]);

  useEffect(() => {
    if (data && data.length) {
      // * showing last 6 alert notifications
      data.slice(data.length - 2).map((alert) =>
        toast.warning(alert.msg, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: alert.alert_id,
          theme: "light",

          transition: Slide,
        }),
      );
    }
  }, [data]);

  return (
    <div>
      {isLoading || isAuthGlobalLoading ? (
        <div className="w-screen h-screen flex items-center justify-center">
          <Spin spinning={true} size="large" />
        </div>
      ) : (
        <>
          <GoogleMaps />
          <ToastContainer limit={1} />

          <ToggleVehicleStatusAndTripStatus />
          <ToggleVehicleDetailsAndNearbyVehicles
            isGetNearbyVehiclesActive={isGetNearbyVehiclesActive}
          />
          <Modal
            open={showGpsDetailsModal}
            onCancel={() => {
              setShowGpsDetailsModal(false);
              if (userId) {
                localStorage.setItem(`gps_details_popup_shown_${userId}`, "true");
              }
            }}
            footer={null}
            width={680}
            centered
            styles={{
              body: {
                padding: 0,
                overflow: 'hidden',
                borderRadius: '8px',
              }
            }}
          >
            <img
              src="/assets/images/gps-details.png"
              alt="GPS Details"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
              draggable={false}
            />
          </Modal>
        </>
      )}
    </div>
  );
};

const ToggleVehicleDetailsAndNearbyVehicles = ({
  isGetNearbyVehiclesActive,
}: {
  isGetNearbyVehiclesActive: boolean;
}) => {
  const { type: VehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive,
  );
  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive,
  );
  const { userId } = useSelector((state: RootState) => state.auth);

  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [selectedReportsView, setSelectedReportsView] = useState<
    "Column" | "Table"
  >("Column");

  const reportsModalState = {
    isReportsExpanded,
    setSelectedView: (prev: "Column" | "Table") => {
      setSelectedReportsView(prev);
      return prev;
    },
    selectedView: selectedReportsView,
    setIsReportsExpanded: (prev: boolean) => {
      setIsReportsExpanded(prev);
      return prev;
    },
  };
  if (isCheckInAccount(Number(userId))) {
    return <CheckInAccountDetails />;
  } else if (VehicleListType === "video") {
    return <VideoOverview />;
  } else if (VehicleListType === "vehicle-allocation-trip") {
    return <VehicleAllocationTripForm />;
  } else if (
    VehicleListType === "trip" &&
    (createTripOrPlanningTripActive === "create-trip" ||
      createTripOrPlanningTripActive === "trip-planning")
  ) {
    return <TripForm />;
  } else if (VehicleListType === "trip") {
    return (
      <VehicleDetailsContext.Provider value={{ reportsModalState }}>
        <VehicleDetails />
        <ExpandReportsModal />
      </VehicleDetailsContext.Provider>
    );
  } else if (isGetNearbyVehiclesActive) {
    return <NearbyVehiclesDetails />;
  } else {
    return (
      <VehicleDetailsContext.Provider value={{ reportsModalState }}>
        <VehicleDetails />
        <ExpandReportsModal />
      </VehicleDetailsContext.Provider>
    );
  }
};
