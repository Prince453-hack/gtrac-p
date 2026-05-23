"use client";

import { toggleTrafficLayer } from "@/app/_globalRedux/dashboard/trafficSlice";
import { RootState } from "@/app/_globalRedux/store";
import { FloatButton } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import TrafficOn from "@/app/_assets/svgs/map/traffic-on.svg";
import TrafficOff from "@/app/_assets/svgs/map/traffic-off.svg";
import Image from "next/image";

export const HistoryReplayToggle = () => {
  const dispatch = useDispatch();
  const { isTrafficLayerVisible } = useSelector(
    (state: RootState) => state.traffic
  );
  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive
  );

  const handleTrafficToggle = () => {
    if (
      createTripOrPlanningTripActive !== "create-trip" &&
      createTripOrPlanningTripActive !== "trip-planning"
    ) {
      dispatch(toggleTrafficLayer());
    }
  };

  return (
    <FloatButton
      onClick={handleTrafficToggle}
      tooltip={isTrafficLayerVisible ? "Hide Traffic" : "Show Traffic"}
      icon={
        isTrafficLayerVisible ? (
          <Image src={TrafficOn} alt="Traffic On" />
        ) : (
          <Image src={TrafficOff} alt="Traffic Off" />
        )
      }
    ></FloatButton>
  );
};
