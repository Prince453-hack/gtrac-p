"use client";

import {
  setCurrentPathArrayIndex,
  setHistoryReplayInterval,
  setHistoryReplayPlayPause,
  setIncrement,
  stopHistoryReplayInterval,
} from "@/app/_globalRedux/dashboard/historyReplaySlice";
import { VehicleItinaryData } from "@/app/_globalRedux/services/types/getItnaryWithMapResponse";
import { RootState } from "@/app/_globalRedux/store";
import * as pause from "@/public/assets/svgs/common/Pause.svg";
import * as play from "@/public/assets/svgs/common/Play.svg";
import { Card, Tooltip } from "antd";
import moment from "moment";
import Image from "next/image";
import { Dispatch, SetStateAction, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

export const VehicleHistoryCard = ({
  type,
  vehicleData,
  stoppagesCount,
  index,
  setHistorySpecificEventRunning,
  historySpecificEventRunning,
}: {
  type: "Running" | "Idle" | "Title";
  vehicleData: VehicleItinaryData;
  stoppagesCount: number;
  index: number;
  setHistorySpecificEventRunning: Dispatch<SetStateAction<boolean>>;
  historySpecificEventRunning: boolean;
}) => {
  const date = vehicleData.fromTime;

  const { openStoppageIndex } = useSelector((state: RootState) => state.map);
  const historyReplay = useSelector((state: RootState) => state.historyReplay);
  const vehicleItnaryWithPath = useSelector(
    (state: RootState) => state.vehicleItnaryWithPath,
  );

  const dispatch = useDispatch();

  const isCardActive = useMemo(() => {
    const currentIndex = historyReplay.currentPathArrayIndex;
    const currentPath = vehicleItnaryWithPath.patharry?.[currentIndex];

    if (!currentPath || !vehicleData.fromTime) return false;

    const currentTime = currentPath.datetime || "";
    const currentTimeHM =
      currentTime.split(":")[0] + ":" + currentTime.split(":")[1];
    const cardTimeHM =
      vehicleData.fromTime.split(":")[0] +
      ":" +
      vehicleData.fromTime.split(":")[1];

    return currentTimeHM === cardTimeHM;
  }, [
    historyReplay.currentPathArrayIndex,
    vehicleItnaryWithPath.patharry,
    vehicleData.fromTime,
  ]);

  const startHistoryReplay = () => {
    dispatch(stopHistoryReplayInterval());

    setHistorySpecificEventRunning(true);

    dispatch(
      setCurrentPathArrayIndex(
        vehicleItnaryWithPath.patharry.findIndex(
          (path) =>
            path.datetime.split(":")[0] + ":" + path.datetime.split(":")[1] ===
            vehicleData.fromTime.split(":")[0] +
              ":" +
              vehicleData.fromTime.split(":")[1],
        ),
      ),
    );
    dispatch(setHistoryReplayPlayPause(true));

    const interval = setInterval(() => {
      dispatch(setIncrement());
    }, historyReplay.playTimeInMilliseconds);

    dispatch(setHistoryReplayInterval(interval));
  };

  return (
    <>
      {date ? (
        <div
          id={`${stoppagesCount}`}
          className={`bottom-1 w-fit left-1 pl-1 z-10 relative text-gray-600 font-semibold mt-3 mb-1`}
        >
          {moment(date).format("Do MMMM, YYYY HH:mm A")}
        </div>
      ) : null}

      <div
        className={`border-[1.5px] ${
          openStoppageIndex === stoppagesCount && vehicleData.mode === "Idle"
            ? "border-custom-pink"
            : ""
        } shadow-xl shadow-s-light rounded-md`}
      >
        <Card className="px-2">
          <div className="flex gap-3">
            <div
              className={`min-w-6 h-6 mt-2 ${
                type === "Running"
                  ? "bg-primary-green"
                  : type === "Idle"
                    ? "bg-custom-pink"
                    : "bg-blue-800"
              } rounded-full flex items-center justify-center text-white p-1 text-xs`}
            >
              <p className="font-semibold">
                {type === "Idle" ? stoppagesCount + 1 : null}
              </p>
            </div>
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {type === "Running" ? (
                      <p className="text-primary-green">
                        Ran for {vehicleData.totalTime}
                      </p>
                    ) : type === "Idle" ? (
                      <p className="text-custom-pink">
                        Stopped for {vehicleData.totalTime}
                      </p>
                    ) : null}
                  </span>
                </div>
                <div className="flex gap-2">
                  <p className="font-bold text-gray-500">
                    {isNaN(Number(vehicleData.totalDistance)) &&
                    type === "Running"
                      ? `${vehicleData.totalDistance}`
                      : ``}
                  </p>
                  {historyReplay.isHistoryReplayMode &&
                  vehicleData.mode === "Running" ? (
                    <>
                      {historyReplay.isHistoryReplayPlaying &&
                      isCardActive &&
                      historySpecificEventRunning ? (
                        <Tooltip title="Pause" mouseEnterDelay={1}>
                          <Image
                            src={pause}
                            alt="pause icon"
                            width="12"
                            height="12"
                            onClick={() => {
                              setHistorySpecificEventRunning(false);
                              dispatch(setHistoryReplayPlayPause(false));
                              dispatch(stopHistoryReplayInterval());
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title="Play"
                          mouseEnterDelay={1}
                          className="cursor-pointer"
                        >
                          <Image
                            src={play}
                            alt="play icon"
                            width="12"
                            height="12"
                            onClick={() => {
                              startHistoryReplay();
                            }}
                          />
                        </Tooltip>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
              <div>
                <Tooltip
                  title={
                    vehicleData.endLocation
                      ? vehicleData.endLocation?.replaceAll("_", " ")
                      : ""
                  }
                  mouseEnterDelay={1}
                >
                  <p className="mt-1 text-gray-600">
                    {vehicleData.endLocation
                      ? vehicleData.endLocation
                          ?.replaceAll("_", " ")
                          .slice(0, 70)
                      : ""}
                  </p>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
