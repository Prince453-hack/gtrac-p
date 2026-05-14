"use server";

import axios from "axios";
import { cookies } from "next/headers";

type signInData = {
  username: string;
  password: string;
};

export const signIn = async (formData: signInData) => {
  const instance = axios.create({
    httpsAgent: new (require("https").Agent)({
      rejectUnauthorized: false, // Disable SSL verification
    }),
  });
  try {
    const { data } = await instance.post(
      "https://www.gtrac.in:8089/tracking/login",
      formData,
    );

    if (data.status === false) {
      return { message: "Invalid Credentials", status: 403 };
    } else {
      cookies().set("auth-session", JSON.stringify(data), {
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24 * 7 * 52,
        path: "/",
      });

      return {
        message: "Successfully logged in",
        status: 200,
        data: JSON.stringify({
          groupId: data.data[0].groupid,
          userId: data.data[0].userid,
          accessLabel: data.data[0].access_label,
          parentUser: data.data[0].sys_parent_user,
          extra: data.data[0].extra,
          userName: data.data[0].sys_username,
          password: data.data[0].sys_password,
          company: data.data[0].company,
          address: data.data[0].address,
          billingAddress: data.data[0].billing_address,
          mobileNumber: data.data[0].mobile_number,
          mobileAppToken: data.data[0].mobile_app_token,
          payment: data.data[0].payment,
          logo: data.data[0].logo,
          isAc: data.data[0].isAC,
          isOdometer: data.data[0].isOdometer,
          vehicleType: data.data[0].vehicleType,
          isTemp: data.data[0].isTemp,
          isVideotelematics: data.data[0].is_videotelematics,
          isPadlock: data.data[0].isPadlock,
          isMachine: data.data[0].isMachine,
          isEveVehicle: data.data[0].isEvehicle,
          isMarketVehicle: data.data[0].isMarcketvehicle,
          isAlcohol: data.data[0].isAlcohol,
          extraInfo: data.data[0].extraInfo,
          isGoogleMap: data.data[0].isGoogleMap,
          isCrackPadlock: data.data[0].isCrackPadlock,
          isObd: data.data[0].isObd,
        }),
      };
    }
  } catch (err) {
    return { message: "Invalid Credentials", status: 403, data: "" };
  }
};
export const signOut = async () => {
  const cookieStore = cookies();

  cookieStore.getAll().forEach((cookie) => {
    cookies().delete(cookie.name);
  });

  return;
};
