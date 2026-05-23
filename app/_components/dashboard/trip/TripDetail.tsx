"use client";

import { useGetTripSingleQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { Card, Skeleton, Tooltip } from "antd";
import { Timeline } from "antd";
import Image from "next/image";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import markerIcon from "@/public/assets/svgs/common/marker-icon.svg";
import { fixDateFormat } from "@/app/helpers/fixDateFormat";
import moment from "moment";

export const TripDetail = () => {
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const selectedTrip = useSelector((state: RootState) => state.selectedTrip);

  const { groupId } = useSelector((state: RootState) => state.auth);

  const { isLoading } = useGetTripSingleQuery(
    {
      trip_id: `${selectedVehicle?.vehicleTrip.trip_id}`,
      token: groupId,
      vehicle_id: `${selectedVehicle?.vId}`,
    },
    {
      skip:
        !selectedVehicle.vehReg ||
        selectedTrip.lorry_no === selectedVehicle.vehReg,
      refetchOnFocus: false,
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
    }
  );

  return (
    <div>
      {isLoading ? (
        <Skeleton active={true} />
      ) : (
        <>
          {selectedTrip ? (
            <Card className="px-2">
              <div className="-mb-[20px] mt-[20px]">
                <CustomTimeLine data={selectedTrip} />
              </div>
            </Card>
          ) : (
            "No Data Found"
          )}
        </>
      )}
    </div>
  );
};

const CustomTimeLine = ({
  data,
}: {
  data: SingleTripResponse["list"][0] | undefined;
}) => {
  const [viaPointsCount, setViaPointsCount] = React.useState<number>(0);

  useEffect(() => {
    if (data) {
      let count = 0;
      data.vaiOne && count++;
      data.vaiTwo && count++;
      data.vaiThree && count++;
      data.vaiFour && count++;

      setViaPointsCount(count);
    }
  }, [data]);

  return (
    <Timeline
      items={[
        {
          color: "green",
          dot: (
            <Tooltip
              title="Start Location"
              placement="left"
              mouseEnterDelay={1}
            >
              <div className="w-5 h-5 border-[1.5px] relative border-black rounded-full"></div>
            </Tooltip>
          ),
          children: (
            <>
              <div className="flex items-center gap-2">
                <div>
                  <div>
                    <p className="font-semibold text-primary-green text-sm">
                      Start Location:
                    </p>{" "}
                  </div>
                  <Tooltip
                    title={`${data?.station_from_location?.replaceAll(
                      "_",
                      " "
                    )}`}
                    placement="right"
                    mouseEnterDelay={1}
                  >
                    <p className="text-sm truncate w-[310px]">
                      {data?.station_from_location?.replaceAll("_", " ")}
                    </p>
                  </Tooltip>
                </div>
              </div>

              <div className=" flex items-center gap-2">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold text-xs">
                    {fixDateFormat(
                      data?.departure_date ?? "",
                      "Do MMM YYYY hh:mm A",
                      "No Info"
                    )}
                  </span>
                </p>
              </div>
            </>
          ),
        },

        ...(viaPointsCount > 0
          ? new Array(viaPointsCount).fill(0).map((_, index) => ({
              color: "gray",
              children: (
                <>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-semibold text-gray-500 text-sm">
                        Via {index + 1}
                      </p>
                      <Tooltip
                        title={`${data?.station_to_location?.replaceAll(
                          "_",
                          " "
                        )}`}
                        placement="right"
                        mouseEnterDelay={1}
                      >
                        <p className="text-sm truncate w-[310px]">
                          {index === 0
                            ? data?.vaiOne
                            : index === 1
                            ? data?.vaiTwo
                            : index === 2
                            ? data?.vaiThree
                            : data?.vaiFour}
                        </p>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-neutral-600">
                      <span className="font-semibold text-xs">
                        {index === 0
                          ? data?.vaiOneInTime === "01 Jan 1970 05:30:00"
                            ? "Not Touched"
                            : data?.vaiOneInTime
                          : index === 1
                          ? data?.vaiTwoInTime === "01 Jan 1970 05:30:00"
                            ? "Not Touched"
                            : data?.vaiTwoInTime
                          : index === 2
                          ? data?.vaiThreeInTime === "01 Jan 1970 05:30:00"
                            ? "Not Touched"
                            : data?.vaiThreeInTime
                          : data?.vaiFourInTime === "01 Jan 1970 05:30:00"
                          ? "Not Touched"
                          : data?.vaiFourInTime}
                      </span>
                    </p>
                  </div>
                </>
              ),
            }))
          : []),

        {
          dot: (
            <Tooltip title="End Location" placement="left" mouseEnterDelay={1}>
              <Image
                src={markerIcon}
                alt="current location"
                width={24}
                height={30}
              />
            </Tooltip>
          ),
          children: (
            <>
              <div className="flex items-center gap-2">
                <div>
                  <p className="font-semibold text-primary-red text-sm">
                    End Location:
                  </p>
                  <Tooltip
                    title={`${data?.station_to_location?.replaceAll("_", " ")}`}
                    placement="right"
                    mouseEnterDelay={1}
                  >
                    <p className="text-sm truncate w-[310px]">
                      {data?.station_to_location?.replaceAll("_", " ")}
                    </p>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold text-xs">
                    {fixDateFormat(
                      data?.trip_complted_datebysystem ?? "",
                      "Do MMM YYYY hh:mm A",
                      "date"
                    )}
                  </span>
                </p>
              </div>
            </>
          ),
        },
      ]}
    />
  );
};
