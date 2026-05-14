import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { setAuth } from "../_globalRedux/common/authSlice";

export const setAuthData = ({
  res,
  dispatch,
}: {
  res:
    | {
        message: string;
        status: number;
        data?: undefined;
      }
    | {
        message: string;
        status: number;
        data: string;
      };
  dispatch: Dispatch<UnknownAction>;
}) => {
  const data = JSON.parse(res.data || "");

  localStorage.setItem(
    "permissions",
    JSON.stringify({ parentUser: data.parentUser })
  );
  localStorage.setItem(
    "auth-session",
    JSON.stringify({
      ...JSON.parse(res.data || ""),
      isSnowmanLoggedIn: true,
    }) || ""
  );

  dispatch(
    setAuth({
      isLoading: false,
      groupId: data.groupId,
      userId: data.userId,
      accessLabel: data.accessLabel,
      parentUser: data.parentUser,
      extra: data.extra,
      userName: data.userName,
      password: data.password,
      company: data.company,
      address: data.address,
      billingAddress: data.billingAddress,
      mobileNumber: data.mobileNumber,
      mobileAppToken: data.mobileAppToken,
      payment: data.payment,
      logo: data.logo,
      isAc: data.isAc || 0,
      isAlcohol: data.isAlcohol || 0,
      isOdometer: data.isOdometer || 0,
      vehicleType: data.vehicleType || "",
      isTemp: data.isTemp || 0,
      isVideoTelematics: data.isVideoTelematics || 0,
      isPadlock: data.isPadlock || 0,
      isMachine: data.isMachine || 0,
      isEveVehicle: data.isEveVehicle || 0,
      isMarketVehicle: data.isMarketVehicle || 0,
      isGoogleMap: data.isGoogleMap || 1,
      isCrackPadlock: data.isCrackPadlock || 0,
      isOdb: data.isObd || 0,
    })
  );
};
