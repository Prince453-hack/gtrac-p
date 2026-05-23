"use client";

import React, { useState, useEffect } from "react";
import CustomDatePicker from "../../common/datePicker";
import { Button } from "antd";
import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import { useDispatch, useSelector } from "react-redux";
import { MultipleTripUpload } from "./multipleTripUpload";
import { Form } from "../../dashboard/trip";
import { RootState } from "@/app/_globalRedux/store";
import moment from "moment";
import { isSinghTransportAccount } from "@/app/helpers/isSinghTransport";

export const TripHeader2 = ({
  setCustomDateRange,
  refetch,
  isLoading,
}: {
  setCustomDateRange: (e: Date[]) => void;
  refetch: any;
  isLoading: boolean;
}) => {
  const { userId } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [localDateRange, setLocalDateRange] = useState([
    moment().subtract(3, "days").startOf("date").toDate(),
    new Date(),
  ]);

  useEffect(() => {
    const initialDateRange = [
      moment().subtract(3, "days").startOf("date").toDate(),
      new Date(),
    ];

    if (Number(userId) === 5275) {
      setCustomDateRange(initialDateRange);
    } else {
      setCustomDateRange([
        moment(initialDateRange[0]).startOf("date").toDate(),
        moment(initialDateRange[1]).endOf("date").toDate(),
      ]);
      // Delay refetch to ensure query is initialized
      if (refetch && typeof refetch === "function") {
        setTimeout(() => {
          try {
            refetch();
          } catch (error) {
            console.warn("Refetch failed, query may not be ready yet:", error);
          }
        }, 100);
      }
    }
  }, [userId, setCustomDateRange, refetch]);

  return (
    <div className="flex justify-between items-center w-full">
      <p className="text-3xl font-bold mb-2">Trip Report</p>
      <div className="w-[450px] max-w-[450px] flex gap-2 items-center">
        <CustomDatePicker
          dateRange={localDateRange}
          setDateRange={(e) => {
            setLocalDateRange(e);
          }}
          showTimeSelect={true}
          datePickerStyles="h-[32px]  max-h-[32px]"
          disabled={isLoading}
        />
        <Button
          onClick={() => {
            if (Number(userId) === 5275) {
              setCustomDateRange(localDateRange);
            } else {
              setCustomDateRange([
                moment(localDateRange[0]).startOf("date").toDate(),
                moment(localDateRange[1]).endOf("date").toDate(),
              ]);
              if (refetch && typeof refetch === "function") {
                try {
                  refetch();
                } catch (error) {
                  console.warn(
                    "Refetch failed, query may not be ready yet:",
                    error
                  );
                }
              }
            }
          }}
          type="primary"
          loading={isLoading}
        >
          Submit
        </Button>
        {isSinghTransportAccount(userId) || Number(userId) === 80933 ? (
          <>
            <div className="border">
              <Button
                variant="text"
                onClick={() =>
                  dispatch(
                    setCreateTripOrTripPlanningActive({ type: "create-trip" })
                  )
                }
              >
                Create Trip
              </Button>
            </div>
            <MultipleTripUpload />
            <Form />
          </>
        ) : null}
      </div>
    </div>
  );
};
