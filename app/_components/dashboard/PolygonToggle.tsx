"use client";
import CirclePoi from "@/app/_assets/svgs/map/circle-poi";
import PolygonPoi from "@/app/_assets/svgs/map/polygon-poi";
import {
  setCreatePoi,
  setPoiShape,
} from "@/app/_globalRedux/dashboard/createPoi";
import { setIsLoadingScreenActive } from "@/app/_globalRedux/dashboard/mapSlice";
import { RootState } from "@/app/_globalRedux/store";
import { cn } from "@/lib/utils";
import { EditFilled, EditTwoTone } from "@ant-design/icons";
import { FloatButton, Tooltip } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

export const PolygonToggle = () => {
  const { isCreatePoi, shape } = useSelector(
    (state: RootState) => state.createPoi
  );
  const { isOlMapActive } = useSelector((state: RootState) => state.olMap);
  const dispatch = useDispatch();

  const handleTogglePoi = () => {
    dispatch(setIsLoadingScreenActive(isCreatePoi ? true : false));
    dispatch(setCreatePoi(!isCreatePoi));

    if (isCreatePoi) {
      dispatch(setPoiShape(null));
    }

    setTimeout(() => dispatch(setIsLoadingScreenActive(false)), 1);
  };

  const handleShapeToggle = (
    selectedShape: google.maps.drawing.OverlayType
  ) => {
    if (shape === selectedShape) {
      dispatch(setPoiShape(null));
    } else {
      dispatch(setPoiShape(selectedShape));
    }
  };

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1 py-0.5",
        isCreatePoi && "bg-background pl-2 pr-2 rounded-tr-2xl rounded-br-2xl"
      )}
    >
      {/* POI Shape Selectors */}
      {isCreatePoi && !isOlMapActive && (
        <div className="flex gap-2 items-center absolute bottom-14 right-12 z-[1000] bg-background px-1 rounded-tl-2xl rounded-bl-2xl py-0.5">
          <Tooltip title="Create Circle Poi" mouseEnterDelay={1}>
            <div
              onClick={() =>
                handleShapeToggle(google.maps.drawing.OverlayType.CIRCLE)
              }
              className={cn(
                "w-10 h-10 rounded-full shadow-md transition duration-300 cursor-pointer flex items-center justify-center pr-0.5",
                "bg-white",
                shape === google.maps.drawing.OverlayType.CIRCLE &&
                  "ring-2 ring-blue-500 bg-blue-100 pr-0.5"
              )}
            >
              <div className="p-1 flex items-center justify-center">
                <CirclePoi />
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Create Polygon Poi" mouseEnterDelay={1}>
            <div
              onClick={() =>
                handleShapeToggle(google.maps.drawing.OverlayType.POLYGON)
              }
              className={cn(
                "w-10 h-10 rounded-full shadow-md transition duration-300 cursor-pointer flex items-center justify-center",
                "bg-white",
                shape === google.maps.drawing.OverlayType.POLYGON &&
                  "ring-2 ring-blue-500 bg-blue-100"
              )}
            >
              <div className="p-1 flex items-center justify-center">
                <PolygonPoi />
              </div>
            </div>
          </Tooltip>
        </div>
      )}

      {/* Main Toggle Button */}
      <Tooltip
        title={isCreatePoi ? "Stop Drawing POI" : "Start Drawing POI"}
        placement="top"
        mouseEnterDelay={0.5}
      >
        <FloatButton
          onClick={handleTogglePoi}
          icon={
            isCreatePoi ? (
              <EditFilled style={{ color: "rgb(191,47,58)" }} />
            ) : (
              <EditTwoTone />
            )
          }
          style={{ background: "#D1D8BE" }}
        />
      </Tooltip>
    </div>
  );
};
