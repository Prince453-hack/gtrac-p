"use client";

import { setAuth } from "@/app/_globalRedux/common/authSlice";
import { Button } from "antd";
import { authenticate } from "@/app/lib/actions";
import { Dispatch, SetStateAction, useState } from "react";
import { useDispatch } from "react-redux";
import { isSnowmanAccount } from "@/app/helpers/isSnowmanAccount";
import axios from "axios";

export const LoginsForm = ({
  setForgetPasswordPage,
}: {
  setForgetPasswordPage?: Dispatch<SetStateAction<boolean>>;
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSignInWithNumber, setIsSignInWithNumber] = useState(false);
  const [otp, setOtp] = useState("");
  const [formOtp, setFormOtp] = useState("");
  const [getOtpRes, setGetOtpRes] = useState<any>();

  const authenticateUser = async (formData: FormData) => {
    setLoading(true);
    const res = await authenticate("", formData);

    let data;
    if (res.status === 403) {
      setErrorMessage(res.message);
      setLoading(false);
    } else if (
      isSnowmanAccount({ userId: JSON.parse(res.data || "")?.userId })
    ) {
      process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
        ? window.location?.replace("https://localhost:3000/api/auth/login")
        : window.location?.replace(`${window.location.origin}/api/auth/login`);
    } else if (Number(JSON.parse(res.data || "")?.userId) === 83482) {
      const token = localStorage.getItem("auth-token");
      if (token && token.length > 34) {
        data = JSON.parse(res.data || "");
        localStorage.setItem("auth-session", res.data || "");
        localStorage.setItem(
          "permissions",
          JSON.stringify({
            parentUser: data.parentUser,
            userId: data.userId,
            userName: data.userName,
            groupId: data.groupId,
          }),
        );
        localStorage.setItem(
          "username-password",
          JSON.stringify({
            username: formData.get("username"),
            password: formData.get("password"),
          }),
        );

        dispatch(
          setAuth({
            groupId: data.groupId,
            userId: data.userId,
            userName: data.userName,
            mobileNumber: data.mobileNumber,
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
            isVideoTelematics: data.isVideoTelematics || 0,
            isPadlock: data.isPadlock || 0,
            isMachine: data.isMachine || 0,
            isEveVehicle: data.isEveVehicle || 0,
            isMarketVehicle: data.isMarketVehicle || 0,
            isGoogleMap: data.isGoogleMap || 1,
            isLoading: false,
            isCrackPadlock: data.isCrackPadlock || 0,
            isOdb: data.isOdb || 0,
          }),
        );
        setTimeout(() => {
          window.location?.replace(
            process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
              ? "http://localhost:3000/dashboard"
              : `${window.location.origin}/dashboard`,
          );
          setLoading(false);
        }, 1000);
      } else {
        setErrorMessage("Please use midway authhentication first");
        setLoading(false);
      }
    } else {
      data = JSON.parse(res.data || "");
      localStorage.setItem("auth-session", res.data || "");
      localStorage.setItem(
        "permissions",
        JSON.stringify({
          parentUser: data.parentUser,
          userId: data.userId,
          userName: data.userName,
          groupId: data.groupId,
        }),
      );

      localStorage.setItem(
        "username-password",
        JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      );

      dispatch(
        setAuth({
          groupId: data.groupId,
          userId: data.userId,
          userName: data.userName,
          mobileNumber: data.mobileNumber,
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
          isVideoTelematics: data.isVideotelematics || 0,
          isTemp: data.isTemp || 0,
          isPadlock: data.isPadlock || 0,
          isMachine: data.isMachine || 0,
          isEveVehicle: data.isEveVehicle || 0,
          isMarketVehicle: data.isMarketVehicle || 0,
          isGoogleMap: data.isGoogleMap || 1,
          isLoading: false,
          isOdb: data.isOdb || 0,
          isCrackPadlock: data.isCrackPadlock || 0,
        }),
      );
      if (data && data.userId === 87205) {
        setTimeout(() => {
          window.location?.replace(
            process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
              ? "http://localhost:3000/dashboard/all-reports/trip-report"
              : `${window.location.origin}/dashboard/all-reports/trip-report`,
          );
          setLoading(false);
        }, 1000);
      } else if (data && data.userId === 7300) {
        setTimeout(() => {
          window.location?.replace(
            process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
              ? "http://localhost:3000/chamber-dashboard"
              : `${window.location.origin}/chamber-dashboard`,
          );
          setLoading(false);
        }, 1000);
      } else {
        setTimeout(() => {
          window.location?.replace(
            process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
              ? "http://localhost:3000/dashboard"
              : `${window.location.origin}/dashboard`,
          );
          setLoading(false);
        }, 1000);
      }
      // }
    }
  };

  const getOtp = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `https://gtrac.in:8089/tracking/sendLoginSMSotp`,
        {
          mobileNum: formData.get("mobileNumber"),
        },
      );
      if (res.status === 201 || res.status === 200) {
        const data = res.data;
        formData.set("mobileNumber", "");
        formData.set("otp", "");
        setOtp(data.otp.toString());
        setGetOtpRes(data);
        setLoading(false);
      } else {
        setErrorMessage("Failed to send OTP. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage("Failed to send OTP. Please try again.");
      setLoading(false);
      return;
    }
  };

  const authenticateWithNumber = async (formData: FormData) => {
    if (formOtp !== otp) {
      setErrorMessage("Invalid OTP. Please try again.");
      return;
    }
    if (!getOtpRes) {
      setErrorMessage("Please request OTP first.");
      return;
    }
    setErrorMessage("");
    setLoading(true);

    const data = getOtpRes.data[0];

    const newFormData = new FormData();
    newFormData.append("username", data.sys_username as string);
    newFormData.append("password", data.sys_password as string);

    const authenticatedRes = await authenticate("", newFormData);
    const authenticatedData = JSON.parse(authenticatedRes.data || "");

    localStorage.setItem("auth-session", authenticatedRes.data || "");
    localStorage.setItem(
      "permissions",
      JSON.stringify({
        parentUser: authenticatedData.parentUser,
        userId: authenticatedData.userId,
        userName: authenticatedData.userName,
        groupId: authenticatedData.groupId,
      }),
    );

    localStorage.setItem(
      "username-password",
      JSON.stringify({
        username: data.sys_username,
        password: data.sys_password,
      }),
    );

    dispatch(
      setAuth({
        groupId: authenticatedData.groupId,
        userId: authenticatedData.userId,
        userName: authenticatedData.userName,
        mobileNumber: authenticatedData.mobileNumber,
        accessLabel: authenticatedData.accessLabel,
        parentUser: authenticatedData.parentUser,
        extra: authenticatedData.extra,
        password: authenticatedData.password,
        company: authenticatedData.company,
        address: authenticatedData.address,
        billingAddress: authenticatedData.billingAddress,
        mobileAppToken: authenticatedData.mobileAppToken,
        payment: authenticatedData.payment,
        logo: authenticatedData.logo,
        isAc: authenticatedData.isAc || 0,
        isAlcohol: authenticatedData.isAlcohol || 0,
        isOdometer: authenticatedData.isOdometer || 0,
        vehicleType: authenticatedData.vehicleType || "",
        isVideoTelematics: authenticatedData.isVideotelematics || 0,
        isTemp: authenticatedData.isTemp || 0,
        isPadlock: authenticatedData.isPadlock || 0,
        isMachine: authenticatedData.isMachine || 0,
        isEveVehicle: authenticatedData.isEveVehicle || 0,
        isMarketVehicle: authenticatedData.isMarketVehicle || 0,
        isGoogleMap: authenticatedData.isGoogleMap || 1,
        isLoading: false,
        isCrackPadlock: authenticatedData.isCrackPadlock || 0,
        isOdb: authenticatedData.isOdb || 0,
      }),
    );

    setTimeout(() => {
      if (authenticatedData && authenticatedData.userId === 7300) {
        window.location?.replace(
          process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
            ? "http://localhost:3000/chamber-dashboard"
            : `${window.location.origin}/chamber-dashboard`,
        );
      } else {
        window.location?.replace(
          process.env.NEXT_PUBLIC_ENV === "DEVELOPMENT"
            ? "http://localhost:3000/dashboard"
            : `${window.location.origin}/dashboard`,
        );
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-[400px]  bg-white  rounded-2xl shadow  md:mt-0 sm:max-w-md xl:p-0  ">
      <div className="p-6 space-y-4 md:space-y-6 sm:p-10 pb-14">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-3xl">
          Sign In
        </h1>

        <form
          className="space-y-4 md:space-y-6"
          action={
            isSignInWithNumber && otp
              ? authenticateWithNumber
              : isSignInWithNumber
                ? getOtp
                : authenticateUser
          }
        >
          {isSignInWithNumber && otp ? (
            <div>
              <label
                htmlFor="otp"
                className="block mb-2 text-sm font-medium text-gray-900 "
              >
                Enter OTP
              </label>
              <input
                type="text"
                name="otp"
                id="otp"
                value={formOtp}
                onChange={(e) => setFormOtp(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                placeholder="Enter OTP"
                required={true}
              />
            </div>
          ) : isSignInWithNumber ? (
            <div>
              <label
                htmlFor="mobileNumber"
                className="block mb-2 text-sm font-medium text-gray-900 "
              >
                Mobile Number
              </label>
              <input
                type="text"
                name="mobileNumber"
                id="mobileNumber"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                placeholder="+91 1234567890"
                required={true}
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-medium text-gray-900 "
                >
                  Username
                </label>
                <input
                  type="username"
                  name="username"
                  id="username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                  placeholder="Username"
                  required={true}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 "
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                  required={true}
                />
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
          </div>
          <Button
            htmlType="submit"
            style={{
              background: "rgb(218,94,26)",
              color: "white",
              width: "100%",
              borderRadius: "8px",
            }}
            type="primary"
            size="large"
            loading={loading}
          >
            Sign in
          </Button>
        </form>
        <div className="w-full flex justify-between items-center">
          {isSignInWithNumber ? (
            <Button
              type="link"
              size="small"
              onClick={() => setIsSignInWithNumber(false)}
            >
              Sign in with password
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => setIsSignInWithNumber(true)}
            >
              Sign in with number
            </Button>
          )}
          {setForgetPasswordPage ? (
            <Button
              type="link"
              size="small"
              onClick={() => setForgetPasswordPage(true)}
            >
              Forgot password?
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
