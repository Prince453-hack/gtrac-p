import PoiIcon from "@/app/_assets/svgs/map/poi-icon";
import { setIsLoadingScreenActive } from "@/app/_globalRedux/dashboard/mapSlice";
import {
  initialPOIDropDownState,
  setGeoFence,
  setPoiData,
  setSelectedPOIList,
} from "@/app/_globalRedux/dashboard/poiSlice";
import { RootState } from "@/app/_globalRedux/store";
import { CheckCircleFilled } from "@ant-design/icons";
import { FloatButton, message } from "antd";
import axios from "axios";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const callGeosyncRadius = async (userId: string | number) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_TRACKING_DASHBOARD}/callGeosyncradis?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.warn(
        "Geosync call failed:",
        response.status,
        response.statusText,
      );
    } else {
      console.log("Geosync call successful");
    }
  } catch (error) {
    console.error("Error calling geosync:", error);
  }
};

export const PoiToggle = ({
  checked,
  setChecked,
  geofenceList = [],
  availablePOIs = [],
}: {
  checked: string;
  setChecked: React.Dispatch<React.SetStateAction<string>>;
  geofenceList?: any[];
  availablePOIs?: any[];
}) => {
  const dispatch = useDispatch();
  const { userId, parentUser } = useSelector((state: RootState) => state.auth);

  const { poi, geofenceList: reduxGeofenceList } = useSelector(
    (state: RootState) => state.poiData || { poi: [], geofenceList: [] },
  );

  const displayPOIOnMap = async () => {
    if (checked === "POI") {
      dispatch(setPoiData({ poi: initialPOIDropDownState.poi }));
      dispatch(
        setGeoFence({ geofenceList: initialPOIDropDownState.geofenceList }),
      );
      dispatch(setSelectedPOIList([]));
      setChecked("loading");
    } else {
      try {
        var res = await axios.get(
          process.env.NEXT_PUBLIC_DASH_URL +
            `/getAllPoiList?userid=${userId}&puserid=${parentUser}`,
        );

        // Check if the API response contains any POI data
        const hasPoiData =
          (res.data.list && res.data.list.length > 0) ||
          (res.data.geofenceList && res.data.geofenceList.length > 0);

        if (!hasPoiData) {
          message.info("NO POI AVAILABLE");
          return;
        }

        dispatch(setPoiData({ poi: res.data.list }));
        dispatch(setGeoFence({ geofenceList: res.data.geofenceList }));
        setChecked("POI");

        // Call geosync endpoint when POI is turned ON
        await callGeosyncRadius(userId);
      } catch (error) {
        console.error("Error fetching POI data:", error);
        message.error("Failed to load POI data");
        return;
      }
    }
    dispatch(setIsLoadingScreenActive(true));

    setTimeout(() => dispatch(setIsLoadingScreenActive(false)), 1);
  };

  return (
    <>
      <FloatButton
        tooltip="Toggle POI"
        icon={<PoiIcon />}
        onClick={async () => {
          await displayPOIOnMap();
        }}
      >
        {checked === "POI" || poi.length > 0 || reduxGeofenceList.length > 0 ? (
          <>
            <CheckCircleFilled
              className="absolute z-30 top-0 -right-1 text-primary-green"
              twoToneColor="#478C81"
              color="#478C81"
            />
          </>
        ) : null}
      </FloatButton>
    </>
  );
};
