"use server";

import { signIn, signOut } from "./services/auth";
import { cookies } from "next/headers";

export async function authenticate(type: unknown, formData?: FormData) {
  if (type !== "LOG_OUT" && formData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const user = {
      username,
      password,
    };
    const res = await signIn(user);
    return res;
  } else {
    signOut();

    return { message: "Logged out successfully", status: 200, data: "" };
  }
}

export async function getAuthenticatedData() {
  cookies().get("auth-session");

  if (cookies().has("auth-session")) {
    const data = JSON.parse(cookies().get("auth-session")?.value || "");
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
      }),
    };
  } else {
    return { message: "Invalid Credentials", status: 403, data: "" };
  }
}
