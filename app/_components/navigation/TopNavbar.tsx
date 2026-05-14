"use client";

import {
  initialAuthState,
  setAuth,
  setAuthLoading,
} from "@/app/_globalRedux/common/authSlice";
import { setAllVehicles } from "@/app/_globalRedux/dashboard/allVehicles";
import { setCreateTripOrTripPlanningActive } from "@/app/_globalRedux/dashboard/createTripOrTripPlanningActive";
import { resetDashboardSelectedVehicleState } from "@/app/_globalRedux/dashboard/dashboardVehicleDetailsSelect";
import { setHistoryReplayModeToggle } from "@/app/_globalRedux/dashboard/historyReplaySlice";
import { setVehicleDetailsStatus } from "@/app/_globalRedux/dashboard/isVehicleStatusOrTripStatusActive";
import {
  setCarvanMapUniqueId,
  setIsLoadingScreenActive,
  setOpenStoppageIndex,
} from "@/app/_globalRedux/dashboard/mapSlice";
import { setIsOlMapActive } from "@/app/_globalRedux/dashboard/olMapSlice";
import {
  initialSelectedVehicleState,
  setSelectedVehicleBySelectElement,
} from "@/app/_globalRedux/dashboard/selectedVehicleSlice";
import { useInitiateLocationRequestMutation } from "@/app/_globalRedux/services/carvanmaptracking";
import { useGetIsUserAuthenticatedMutation } from "@/app/_globalRedux/services/reactApi";
import { useLazyGetAllVehiclesQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { useGetEventsDataMutation } from "@/app/_globalRedux/services/yatayaat";
import { RootState } from "@/app/_globalRedux/store";
import { generateRandomToken } from "@/app/_utils/generateRandomToken";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { isSnowmanAccount } from "@/app/helpers/isSnowmanAccount";
import resetDashboardAndTripSystemState from "@/app/helpers/resetDashboardAndTripSystemState";
import { setAuthData } from "@/app/helpers/setAuthData";
import { authenticate, getAuthenticatedData } from "@/app/lib/actions";
import createTripIconGreen from "@/public/assets/svgs/map/create-trip-green.svg";
import createTripIcon from "@/public/assets/svgs/map/create-trip.svg";
import tripPlanningIconGreen from "@/public/assets/svgs/map/trip-planning-green.svg";
import tripPlanningIcon from "@/public/assets/svgs/map/trip-planning.svg";
import { TripSystemIcon, VehicleListIcon } from "@/public/assets/svgs/nav";
import { ReloadOutlined } from "@ant-design/icons";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Dispatch } from "@reduxjs/toolkit";
import { TypedMutationTrigger } from "@reduxjs/toolkit/query/react";
import { Tooltip } from "antd";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DashboardVehicleDetailsSelect,
  PoiDropdownSelector,
} from "../dashboard";
import AlertNotifications from "../dashboard/alertsNotification/AlertNotifications";
import { DashboardCheckInSelect } from "../dashboard/DashboardCheckInSelect";
import UserSettings from "../dashboard/UserSettings";
import GlobalSettings from "./GlobalSettings.tsx";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import DashCamSort from "./DashCamSort";
import FuelSort from "./FuelSort";
import ELockSort from "./ELockSort";
import TicketStatus from "./TicketStatus";

const selectedStyles = {
  selectorBg: "transparent",
  colorBorder: "transparent",
  fontSize: 14,
  optionFontSize: 14,
  optionPadding: "5px",
  optionSelectedColor: "#000",
};

export const LogoutItem = async ({
  dispatch,
  setAuth,
}: {
  dispatch: Dispatch;
  setAuth: any;
}) => {
  dispatch(resetDashboardSelectedVehicleState());
  dispatch(setAuth(initialAuthState));
  await authenticate("LOG_OUT");
  localStorage.removeItem("auth-session");
  localStorage.removeItem("username-password");
  localStorage.removeItem("auth-token");
  dispatch(setAuthLoading(false));
  window.location.replace(`${window.location.origin}`);
};

async function fetchUserData({
  getUserAuthenticated,
  dispatch,
}: {
  dispatch: Dispatch;
  getUserAuthenticated: TypedMutationTrigger<any, any, any>;
}) {
  const logoutAndReset = () => {
    dispatch(resetDashboardSelectedVehicleState());
    // LogoutItem({ dispatch, setAuth });
  };

  try {
    // For Snowman accounts logged in via Auth0, use hardcoded data
    const snowmanData = {
      userid: 6347,
      userId: "6347",
      sys_username: "snowman",
      userName: "snowman",
      sys_password: "Snow@#logistic",
      password: "Snow@#logistic",
      sys_parent_user: 1,
      parentUser: "6347",
      groupid: 6255,
      groupId: "6255",
      company: "Snowman Logistics Pvt Ltd.",
      address:
        "B 168, Pocket A, Okhla Phase I, Okhla Industrial Area, New Delhi, Delhi 110020\r\n",
      billing_address:
        "B 168,Pocket A,Okhla Phase I,Okhla Industrial Area,New Delhi,Delhi 110020",
      billingAddress:
        "B 168,Pocket A,Okhla Phase I,Okhla Industrial Area,New Delhi,Delhi 110020",
      mobile_number: "995881444011",
      mobileNumber: "995881444011",
      mobile_app_token:
        "drddHk5ZSTWUVwxedhF5U8:APA91bGB4JgQWczYgGyFAWPCbuS4MvkSQezd7RkNbadTwlL1ULizjlAmAGvyP2QquQU9j9na7oPBQ_UthHYGk47kfxC0FapjKhNJRa6yTn3_0C-kM0HrxWk",
      mobileAppToken:
        "drddHk5ZSTWUVwxedhF5U8:APA91bGB4JgQWczYgGyFAWPCbuS4MvkSQezd7RkNbadTwlL1ULizjlAmAGvyP2QquQU9j9na7oPBQ_UthHYGk47kfxC0FapjKhNJRa6yTn3_0C-kM0HrxWk",
      payment: 0,
      logo: "logo.png",
      access_label: 0,
      accessLabel: 0,
      extra: "0",
      isAC: 0,
      isAc: 0,
      isOdometer: 0,
      vehicleType: "TRUCK",
      isTemp: 1,
      isImb: 0,
      isNotification: 0,
      isPadlock: 0,
      isMachine: 0,
      isEvehicle: 0,
      isEveVehicle: 0,
      isAlcohol: 0,
      isMarcketvehicle: 0,
      isMarketVehicle: 0,
      MemberSince: "2016",
      extraInfo: null,
      isGoogleMap: 1,
      isCrackPadlock: 0,
      isOnlyPolyline: 1,
      is_videotelematics: 0,
      isVideotelematics: 0,
      isOdb: 0,
    };

    // Store in localStorage
    localStorage.setItem("auth-session", JSON.stringify(snowmanData));
    localStorage.setItem(
      "permissions",
      JSON.stringify({
        parentUser: snowmanData.parentUser,
        userId: snowmanData.userId,
        userName: snowmanData.userName,
        groupId: snowmanData.groupId,
      }),
    );
    localStorage.setItem(
      "username-password",
      JSON.stringify({
        username: snowmanData.userName,
        password: snowmanData.password,
      }),
    );

    // Set Redux state
    dispatch(
      setAuth({
        groupId: snowmanData.groupId,
        userId: snowmanData.userId,
        userName: snowmanData.userName,
        mobileNumber: snowmanData.mobileNumber,
        accessLabel: snowmanData.accessLabel,
        parentUser: snowmanData.parentUser,
        extra: snowmanData.extra,
        password: snowmanData.password,
        company: snowmanData.company,
        address: snowmanData.address,
        billingAddress: snowmanData.billingAddress,
        mobileAppToken: snowmanData.mobileAppToken,
        payment: snowmanData.payment,
        logo: snowmanData.logo,
        isAc: snowmanData.isAc,
        isAlcohol: snowmanData.isAlcohol,
        isOdometer: snowmanData.isOdometer,
        vehicleType: snowmanData.vehicleType,
        isVideoTelematics: snowmanData.isVideotelematics,
        isTemp: snowmanData.isTemp,
        isPadlock: snowmanData.isPadlock,
        isMachine: snowmanData.isMachine,
        isEveVehicle: snowmanData.isEveVehicle,
        isMarketVehicle: snowmanData.isMarketVehicle,
        isGoogleMap: snowmanData.isGoogleMap,
        isLoading: false,
        isCrackPadlock: snowmanData.isCrackPadlock,
        isOdb: snowmanData.isOdb || 0,
      }),
    );

    dispatch(setAuthLoading(false));
  } catch (error) {
    console.error("Error in fetchUserData:", error);
    logoutAndReset();
  }
}

export const TopNavbar = ({
  sessionData,
}: {
  sessionData: string | undefined;
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const dispatch = useDispatch();
  const path = usePathname();
  const { isLoading } = useUser();

  const poiData = useSelector((state: RootState) => state.poiData);
  const authState = useSelector((state: RootState) => state.auth);
  const auth = sessionData ? JSON.parse(sessionData || "").data[0] : "";
  const auth1 = useSelector((state: RootState) => state.auth);

  const { isCreatePoi } = useSelector((state: RootState) => state.createPoi);

  const [getEventsData] = useGetEventsDataMutation();
  const [getUserAuthenticated] = useGetIsUserAuthenticatedMutation();
  const [eventsData, setEventsData] = useState<EventsResponse>();
  const [initiateLocationRequest] = useInitiateLocationRequestMutation();

  const allVehicles = useSelector((state: RootState) => state.allVehicles);
  const { type: VehicleListType } = useSelector(
    (state: RootState) => state.isVehicleStatusOrTripStatusActive,
  );
  const { type: createTripOrPlanningTripActive } = useSelector(
    (state: RootState) => state.createTripOrPlanningTripActive,
  );
  const markers = useSelector((state: RootState) => state.markers);
  const dashoboardVehicleDetailsSelected = useSelector(
    (state: RootState) => state.selectedDashboardVehicle,
  );

  const { isOlMapActive } = useSelector((state: RootState) => state.olMap);
  const loggedIn = auth ? auth["groupid"] || auth["groupId"] : false;

  const sysParentUser = auth
    ? auth["sys_parent_user"] || auth["parentUser"]
    : false;
  const userId = auth ? auth["userId"] || auth["userid"] : "";
  const groupId = auth ? auth["groupId"] || auth["groupid"] : "";
  const user = useUser();
  const { accessLabel } = useSelector((state: RootState) => state.auth);

  const updateSessionData = async (value: string) => {
    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  useEffect(() => {
    if (authState.userId !== "") {
      updateSessionData(JSON.stringify({ data: [authState] }));
    }
  }, [authState]);

  const triggerCreateTripOrTripPlanningForm = () => {
    dispatch(setOpenStoppageIndex(-1));
    dispatch(
      setSelectedVehicleBySelectElement({
        ...initialSelectedVehicleState,
        vId: allVehicles[0].id,
        vehReg: allVehicles[0].veh_reg,
        searchType: "",
        selectedVehicleHistoryTab: "All",
        nearbyVehicles: [],
      }),
    );
  };

  const [getAllVehicles] = useLazyGetAllVehiclesQuery();

  useEffect(() => {
    const data = JSON.parse(
      localStorage.getItem("auth-session") || `{ "userId": "", "groupId": "" }`,
    );

    if (
      data.userId &&
      authState.userId === "" &&
      !isSnowmanAccount({ userId })
    ) {
      dispatch(
        setAuth({
          isLoading: false,
          groupId: data.groupId,
          userName: data.userName,
          mobileNumber: data.mobileNumber,
          userId: data.userId,
          accessLabel: data.accessLabel,
          parentUser: data.parentUser,
          extra: data.extra,
          password: data.password,
          company: data.company,
          address: data.address,
          billingAddress: data.billingAddress,
          mobileAppToken: data.mobileAppToken,
          payment: data.payment,
          logo: data.logo,
          isAc: data.isAc || 0,
          isAlcohol: data.isAlcohol || 0,
          isOdometer: data.isOdometer || 0,
          vehicleType: data.vehicleType || "",
          isTemp: data.isTemp || 0,
          isVideoTelematics: data.isVideotelematics || 0,
          isPadlock: data.isPadlock || 0,
          isMachine: data.isMachine || 0,
          isEveVehicle: data.isEveVehicle || 0,
          isMarketVehicle: data.isMarketVehicle || 0,
          isGoogleMap: data.isGoogelMap || 1,
          isCrackPadlock: data.isCrackPadlock || 0,
          isOdb: data.isObd || 0,
        }),
      );
      if (data) {
        if (data.isGoogleMap !== 1) {
          dispatch(setIsOlMapActive(true));
        }
      }
    } else if (data.userId && data.isSnowmanLoggedIn) {
      dispatch(
        setAuth({
          isLoading: false,
          groupId: data.groupId,
          userName: data.userName,
          mobileNumber: data.mobileNumber,
          userId: data.userId,
          accessLabel: data.accessLabel,
          parentUser: data.parentUser,
          extra: data.extra,
          password: data.password,
          company: data.company,
          address: data.address,
          billingAddress: data.billingAddress,
          mobileAppToken: data.mobileAppToken,
          payment: data.payment,
          logo: data.logo,
          isAc: data.isAc || 0,
          isAlcohol: data.isAlcohol || 0,
          isOdometer: data.isOdometer || 0,
          vehicleType: data.vehicleType || "",
          isTemp: data.isTemp || 0,
          isVideoTelematics: data.isVideotelematics || 0,
          isPadlock: data.isPadlock || 0,
          isMachine: data.isMachine || 0,
          isEveVehicle: data.isEveVehicle || 0,
          isMarketVehicle: data.isMarketVehicle || 0,
          isGoogleMap: data.isGoogelMap || 1,
          isCrackPadlock: data.isCrackPadlock || 0,
          isOdb: data.isObd || 0,
        }),
      );
    } else if (
      !isLoading &&
      user.user &&
      isSnowmanAccount({ userId }) &&
      data.userId === ""
    ) {
      dispatch(setAuthLoading(true));
      fetchUserData({ getUserAuthenticated, dispatch });
    } else if (!isLoading && data.userId === "") {
      dispatch(resetDashboardSelectedVehicleState());
      // LogoutItem({ dispatch, setAuth });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const getElockData = async () => {
    if (auth.accessLabel === 6) {
      try {
        await axios.get(
          `https://yatayaat.in/ses_alert/unhealthy.php?Group_id=${groupId}`,
        );
      } catch (Err) {
        console.log("");
      }
    }
  };

  useEffect(() => {
    if (userId && groupId) {
      getAllVehicles({
        token: groupId,
      }).then(({ data }) => {
        if (!data) return;
        dispatch(setAllVehicles(data.list));
      });

      if (eventsData === undefined) {
        getEventsData({
          userId: userId,
          token: groupId,
        }).then((res) => {
          if ("data" in res) {
            setEventsData(res.data);
          }
        });
      }

      getElockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, groupId]);

  useEffect(() => {
    const auth = JSON.parse(
      localStorage.getItem("auth-session") || `{ "userId": "", "groupId": "" }`,
    );
    if (auth.isGoogleMap !== 1) {
      dispatch(setAuth({ ...auth, isGoogleMap: 0 }));
      dispatch(setIsOlMapActive(true));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFetchAll = () => {
    const phoneNumbers = markers
      .map((marker) => marker.gpsDtl.model ?? "")
      .filter((phoneNumber) => phoneNumber);
    const token = generateRandomToken();
    dispatch(setCarvanMapUniqueId(token));

    setIsRotating(true);
    initiateLocationRequest({
      phoneNumbers: phoneNumbers,
    });
  };

  const onFetchSelectedVehicle = () => {
    const selectedPhoneNumber = markers
      .filter((marker) => marker.visibility)
      .map((marker) => marker.gpsDtl.model ?? "")
      .filter((phoneNumber) => phoneNumber);
    const token = generateRandomToken();

    dispatch(setCarvanMapUniqueId(token));

    setIsRotating(true);
    initiateLocationRequest({
      phoneNumbers: selectedPhoneNumber,
    });
  };

  useEffect(() => {
    if (isRotating) {
      setTimeout(() => {
        setIsRotating(false);
      }, 2000);
    }
  }, [isRotating]);

  return (
    <>
      <nav className="flex justify-between py-3 px-6 border-b-2 bg-white min-h-[60.5px] select-none">
        <div className="flex space-x-4 items-center">
          <Link href="/">
            {loggedIn ? (
              loggedIn === 56919 || sysParentUser === 84700 ? (
                <Image
                  src="/assets/images/common/sfox.png"
                  width="70"
                  height="30"
                  alt="Logo"
                />
              ) : userId === 87162 || sysParentUser === 87162 ? (
                <Image
                  src="/assets/images/henkle_logo.png"
                  width="30"
                  height="30"
                  alt="Logo"
                />
              ) : eventsData && eventsData.logo ? (
                eventsData.extension === "png" ||
                eventsData.extension === "jpg" ? (
                  <div className="max-w-[80px] max-h-[30px] object-contain">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={decodeURIComponent(eventsData.logo)}
                      width="80"
                      height="30"
                      alt="Logo"
                    />
                  </div>
                ) : (
                  <div className="max-w-[80px] max-h-[30px] object-contain">
                    <Image
                      src={eventsData.logo}
                      width="70"
                      height="30"
                      alt="Logo"
                    />
                  </div>
                )
              ) : (
                <Image
                  src="/assets/images/common/logo.png"
                  width="70"
                  height="30"
                  alt="Logo"
                />
              )
            ) : null}
          </Link>
        </div>

        <div className="flex space-x-4 items-center">
          {isCheckInAccount(Number(userId)) ? (
            <div
              className=" bg-white mr-10 rounded-full border border-neutral-500 flex items-center justify-center px-2 py-1 gap-2 hover:bg-neutral-100 cursor-pointer active:bg-neutral-200 transition-all duration-300"
              onClick={() => {
                if (dashoboardVehicleDetailsSelected.length > 0) {
                  onFetchSelectedVehicle();
                } else {
                  onFetchAll();
                }
              }}
            >
              {dashoboardVehicleDetailsSelected.length > 0 ? (
                <p className="text-sm">Fetch Selected</p>
              ) : (
                <p className="text-sm">Fetch All</p>
              )}
              <ReloadOutlined
                className={`${isRotating ? "animate-spin" : ""} text-sm`}
              />
            </div>
          ) : (
            <>
              {VehicleListType === "trip" ||
              VehicleListType === "vehicle-allocation-trip" ? (
                <>
                  <Tooltip title="Create Trip" mouseEnterDelay={1}>
                    {userId ===
                    87162 ? null : createTripOrPlanningTripActive ===
                      "create-trip" ? (
                      <Image
                        src={createTripIconGreen}
                        width={22}
                        height={22}
                        alt="poi icon"
                        onClick={() => {
                          dispatch(
                            setCreateTripOrTripPlanningActive({
                              type: "create-trip",
                            }),
                          );
                          triggerCreateTripOrTripPlanningForm();
                        }}
                        className="cursor-pointer hover:filter hover:brightness-75 transition-all duration-300 relative right-10"
                      />
                    ) : (
                      <Image
                        src={createTripIcon}
                        width={22}
                        height={22}
                        alt="poi icon"
                        onClick={() => {
                          dispatch(
                            setCreateTripOrTripPlanningActive({
                              type: "create-trip",
                            }),
                          );
                          triggerCreateTripOrTripPlanningForm();
                        }}
                        className="cursor-pointer hover:filter hover:brightness-75 transition-all duration-300 relative right-10"
                      />
                    )}
                  </Tooltip>
                  <Tooltip title="Plan Trip" mouseEnterDelay={1}>
                    {userId ===
                    87162 ? null : createTripOrPlanningTripActive ===
                      "trip-planning" ? (
                      <Image
                        src={tripPlanningIconGreen}
                        width={22}
                        height={22}
                        alt="poi icon"
                        onClick={() => {
                          dispatch(
                            setCreateTripOrTripPlanningActive({
                              type: "trip-planning",
                            }),
                          );
                          triggerCreateTripOrTripPlanningForm();
                        }}
                        className="cursor-pointer hover:filter hover:brightness-75 transition-all duration-300 relative right-10"
                      />
                    ) : (
                      <Image
                        src={tripPlanningIcon}
                        width={22}
                        height={22}
                        alt="poi icon"
                        onClick={() => {
                          dispatch(
                            setCreateTripOrTripPlanningActive({
                              type: "trip-planning",
                            }),
                          );
                          triggerCreateTripOrTripPlanningForm();
                        }}
                        className="cursor-pointer hover:filter hover:brightness-75 transition-all duration-300 relative right-10"
                      />
                    )}
                  </Tooltip>
                </>
              ) : null}
              {path === "/dashboard" ? (
                VehicleListType === "trip" ||
                VehicleListType === "vehicle-allocation-trip" ? (
                  <Tooltip title="Vehicle Listing" mouseEnterDelay={1}>
                    <div
                      className="cursor-pointer hover:filter hover:brightness-95 transition-all duration-300 relative right-10"
                      onClick={() => {
                        resetDashboardAndTripSystemState(dispatch);
                        dispatch(setVehicleDetailsStatus({ type: "vehicle" }));
                        dispatch(setIsLoadingScreenActive(true));
                        dispatch(setHistoryReplayModeToggle(true));
                        dispatch(
                          setCreateTripOrTripPlanningActive({ type: "" }),
                        );
                        setTimeout(
                          () => dispatch(setIsLoadingScreenActive(false)),
                          1,
                        );
                      }}
                    >
                      <Image
                        src={VehicleListIcon}
                        alt="vehicle list icon"
                        height={30}
                        width={30}
                      />
                    </div>
                  </Tooltip>
                ) : (
                  Number(userId) === 833815 ? null : (
                    <Tooltip title="Trip System" mouseEnterDelay={1}>
                      <div
                        className="cursor-pointer hover:filter hover:brightness-95 transition-all duration-300 relative right-10"
                        onClick={() => {
                          resetDashboardAndTripSystemState(dispatch);
                          dispatch(setVehicleDetailsStatus({ type: "trip" }));
                          dispatch(
                            setCreateTripOrTripPlanningActive({ type: "" }),
                          );
                          dispatch(setIsLoadingScreenActive(true));
                          dispatch(setHistoryReplayModeToggle(true));
                          setTimeout(
                            () => dispatch(setIsLoadingScreenActive(false)),
                            1,
                          );
                        }}
                      >
                        <Image
                          src={TripSystemIcon}
                          alt="trip system icon"
                          height={30}
                          width={30}
                        />
                      </div>
                    </Tooltip>
                  )
                )
              ) : null}

              {path === "/dashboard" ? (
                <DashboardVehicleDetailsSelect
                  selectedStyles={selectedStyles}
                />
              ) : null}
              <div className="flex items-center gap-3">
                <div className="mr-10">
                  {poiData?.poi?.length > 0 ||
                  poiData?.geofenceList?.length > 0 ? (
                    <PoiDropdownSelector />
                  ) : null}
                </div>
                <div className="mr-8 flex items-center space-x-2">
                  {path === "/dashboard" ? <TicketStatus /> : null}
                  {path === "/dashboard" && accessLabel === 6 ? (
                    <ELockSort />
                  ) : null}
                  {path === "/dashboard" && auth1.isVideoTelematics ? (
                    <DashCamSort />
                  ) : null}

                  {path === "/dashboard" &&
                  (Number(userId) === 3356 ||
                    Number(userId) === 833193 ||
                    Number(userId) === 833105 ||
                    Number(userId) === 81707 ||
                    Number(userId) === 4343 ||
                    Number(userId) === 87115 ||
                    Number(userId) === 833608 ||
                    Number(userId) === 86693) ? (
                    <FuelSort />
                  ) : null}
                </div>
                <GlobalSettings />
              </div>
              <AlertNotifications userId={userId} parentUser={sysParentUser} />
            </>
          )}
          {userId === 87307 ? (
            <DashboardCheckInSelect selectedStyles={selectedStyles} />
          ) : null}
          <UserSettings />
        </div>
      </nav>
    </>
  );
};

export default TopNavbar;
