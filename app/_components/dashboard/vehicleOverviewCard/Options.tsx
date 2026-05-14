"use client";

import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import { setVehicleDetailsStatus } from "@/app/_globalRedux/dashboard/isVehicleStatusOrTripStatusActive";
import {
  setCreatePoiIndex,
  setDriverInfoIndex,
  setIsShareUrlOpenIndex,
  setMapYourInfoIndex,
  setOptionsIndex,
  setMakeInactiveIndex,
} from "@/app/_globalRedux/dashboard/optionsSlice";
import {
  initialSelectedVehicleState,
  setSelectedVehicleStatus,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { RootState } from "@/app/_globalRedux/store";
import { Card } from "antd";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MakeInactiveVehicle } from "./MakeInactiveVehicle";
import VehicleOverviewCardTicket from "./RaiseTicket";
import EsclationMatrix from "./EsclationMatrix";
import { ChatSupport } from "./ChatSupport";
import { HealthStatus } from "./HealthStatus";

export const Options = ({ vehicleData }: { vehicleData: VehicleData }) => {
  const { optionOpenIndex } = useSelector(
    (state: RootState) => state.vehicleOverviewOptions,
  );
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isEsclationMatrixModalOpen, setIsEsclationMatrixModalOpen] =
    useState(false);
  const [isChatSupportOpen, setIsChatSupportOpen] = useState(false);
  const [isHealthStatusOpen, setIsHealthStatusOpen] = useState(false);

  return (
    <>
      {optionOpenIndex === vehicleData.vId ? (
        <div className="w-50 absolute z-[100000] right-10 top-16">
          <Card
            styles={{
              body: {
                padding: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: "10px",
                background: "#F2F5F3",
                boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
                minWidth: "130px",
              },
            }}
            style={{ borderRadius: "10px" }}
          >
            <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                dispatch(setIsShareUrlOpenIndex(vehicleData.vId));
                dispatch(setOptionsIndex(-1));
              }}
            >
              Share Url
            </div>
            {Number(auth.userId) === 87317 ? (
              <div
                className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
                onClick={() => {
                  dispatch(setMapYourInfoIndex(vehicleData.vId));
                  dispatch(setOptionsIndex(-1));
                }}
              >
                Un-Map Your Vehicle
              </div>
            ) : null}
            {auth.isMarketVehicle ||
            auth.isPadlock ||
            Number(auth.userId) === 85380 ||
            Number(auth.parentUser) === 85380 ? (
              <div
                className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
                onClick={() => {
                  if (
                    Number(auth.userId) !== 87162 &&
                    Number(auth.userId) !== 87317
                  ) {
                    dispatch(setMapYourInfoIndex(vehicleData.vId));
                    dispatch(setOptionsIndex(-1));
                  } else {
                    dispatch(setOptionsIndex(-1));
                    dispatch(
                      setVehicleDetailsStatus({
                        type: "vehicle-allocation-trip",
                      }),
                    );
                    dispatch(
                      setCreateTripOrTripPlanningActive({
                        type: "create-trip",
                      }),
                    );
                    dispatch(
                      setSelectedVehicleStatus({
                        ...vehicleData,
                        searchType: "",
                        selectedVehicleHistoryTab:
                          initialSelectedVehicleState.selectedVehicleHistoryTab,
                        nearbyVehicles: [],
                        prevVehicleSelected:
                          initialSelectedVehicleState.prevVehicleSelected,
                      }),
                    );
                  }
                }}
              >
                Map Your Vehicle
              </div>
            ) : null}
            <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                dispatch(setDriverInfoIndex(vehicleData.vId));
                dispatch(setOptionsIndex(-1));
              }}
            >
              Driver Info
            </div>
            <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                dispatch(setCreatePoiIndex(vehicleData.vId));
                dispatch(setOptionsIndex(-1));
              }}
            >
              Create POI
            </div>
            <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                dispatch(setMakeInactiveIndex(vehicleData.vId));
                dispatch(setOptionsIndex(-1));
              }}
            >
              {vehicleData.gpsDtl.inactiveStatus === 1
                ? "Make it Active"
                : "Make It Non Active"}
            </div>
            <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                setIsTicketModalOpen(true);
                dispatch(setOptionsIndex(-1));
              }}
            >
              Raise Ticket
            </div>
            {/* {vehicleData.gpsDtl.controllernum === "CONTROLLER" && (
              <div
                className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
                onClick={() => {
                  setIsHealthStatusOpen(true);
                  dispatch(setOptionsIndex(-1));
                }}
              >
                Health Status
              </div>
            )} */}
            {/* <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                setIsChatSupportOpen(true);
                dispatch(setOptionsIndex(-1));
              }}
            >
              Chat Support
            </div> */}
            {/* <div
              className="py-2 px-3 hover:bg-[rgba(71,140,131,.1)] cursor-pointer"
              onClick={() => {
                setIsEsclationMatrixModalOpen(true);
                dispatch(setOptionsIndex(-1));
              }}
            >
              Exclation Matrix
            </div> */}
          </Card>
        </div>
      ) : null}

      {/* Make Inactive Vehicle Popup */}
      <MakeInactiveVehicle vehicleData={vehicleData} />

      {/* Raise Ticket Modal */}
      <VehicleOverviewCardTicket
        open={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        vehicleNo={
          vehicleData.vehReg || vehicleData.vehicleTrip?.lorry_no || ""
        }
        contactname={vehicleData.drivers?.driverName || ""}
        contactnumber={vehicleData.drivers?.phoneNumber || ""}
      />

      <EsclationMatrix
        open={isEsclationMatrixModalOpen}
        onClose={() => setIsEsclationMatrixModalOpen(false)}
      />

      {/* Chat Support Component */}
      <ChatSupport
        open={isChatSupportOpen}
        onClose={() => setIsChatSupportOpen(false)}
        vehicleNo={
          vehicleData.vehReg || vehicleData.vehicleTrip?.lorry_no || "N/A"
        }
        contactName={vehicleData.drivers?.driverName}
        contactNumber={vehicleData.drivers?.phoneNumber}
        auth={{
          userid: auth.userId,
          userName: auth.userName,
        }}
        vid={vehicleData.vId}
        vehReg={
          vehicleData.vehReg || vehicleData.vehicleTrip?.lorry_no || "N/A"
        }
      />

      <HealthStatus
        open={isHealthStatusOpen}
        onClose={() => setIsHealthStatusOpen(false)}
        vehicleData={vehicleData}
      />
    </>
  );
};
