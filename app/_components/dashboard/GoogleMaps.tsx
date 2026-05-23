"use client";

import type { RootState } from "@/app/_globalRedux/store";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsMapActive,
  setIsMapNotLoading,
} from "@/app/_globalRedux/dashboard/mapSlice";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button, Spin } from "antd";
import { useEffect, useState } from "react";
import { CustomGoogleMapInstance } from "./newMap/CustomGoogleMapInstance";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import getGoogleApiKey from "@/app/helpers/getGoogleMapKeys";
import InfoBanner from "../common/InfoBanner";
import ReactLeaflet from "./react-leaflet/ReactLeaflet";
import { Mixpanel } from "@/lib/mixpanel";
import axios from "axios";
import { SignJWT } from "jose";

async function generateJWT(payload: any) {
  const secret = new TextEncoder().encode("sape");

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

export type Library =
  | "core"
  | "maps"
  | "places"
  | "geocoding"
  | "routes"
  | "marker"
  | "geometry"
  | "elevation"
  | "streetView"
  | "journeySharing"
  | "drawing"
  | "visualization";

const googleLibraries = [
  "places",
  "drawing",
  "marker",
  "geometry",
] as Library[];

export const GoogleMaps = () => {
  const { centerOfMap, containerStyle, zoomNo, isMapActive } = useSelector(
    (state: RootState) => state.map,
  );
  const { isOlMapActive } = useSelector((state: RootState) => state.olMap);
  const { userId, groupId, userName } = useSelector(
    (state: RootState) => state.auth,
  );
  const auth = useSelector((state: RootState) => state.auth);
  const [googleMapKey, setGoogleMapKey] = useState(getGoogleApiKey());
  const router = useRouter();
  const path = usePathname();
  const [mode, setMode] = useState<"Dashboard" | "Trip System">("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    let pathLength = path.split("/").length;
    pathLength === 3 ? setMode("Trip System") : setMode("Dashboard");

    const checkGoogleMapsApi = () => {
      if (window.google && window.google.maps) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
        dispatch(setIsMapActive(false));
      }
    };

    checkGoogleMapsApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (!googleMapKey) {
      setGoogleMapKey(getGoogleApiKey());
    }
  }, [router]);

  return (
    <>
      {isLoading ? (
        <div
          className={`flex justify-center absolute z-10 right-0  ${
            containerStyle.width === "calc(100% - 20px)"
              ? "w-screen"
              : containerStyle.width === "calc(100% - 480px)" ||
                  containerStyle.width === "calc(100% - 450px)"
                ? "w-[calc(100%-450px)]"
                : "w-[calc(100%-900px)]"
          } items-center h-screen`}
        >
          <Spin size="large" />
        </div>
      ) : isMapActive && !isOlMapActive && googleMapKey ? (
        <APIProvider
          apiKey={googleMapKey}
          libraries={googleLibraries}
          onLoad={() => {
            dispatch(setIsMapNotLoading(true));
          }}
        >
          <CustomGoogleMapInstance />
        </APIProvider>
      ) : isMapActive && isOlMapActive ? (
        <ReactLeaflet />
      ) : (
        <div
          className={`absolute z-10 right-0 bg-white ${
            containerStyle.width === "calc(100% - 20px)"
              ? "w-screen"
              : containerStyle.width === "calc(100% - 480px)" ||
                  containerStyle.width === "calc(100% - 450px)"
                ? "w-[calc(100%-450px)]"
                : "w-[calc(100%-900px)]"
          } h-[calc(100vh-60px)] flex items-center justify-center`}
        >
          <div className="absolute z-20 right-0 top-0">
            <Image
              src="/assets/images/map/indiaMap.png"
              width="2236"
              height="1560"
              alt="India Map"
              className="object-cover h-screen blur-[2px]"
            />
          </div>
          <InfoBanner />

          <Button
            onClick={() => {
              axios
                .get("https://geolocation-db.com/json/")
                .then(async (res) => {
                  Mixpanel.identify(userId);
                  const token = await generateJWT(auth);
                  const ipv4 = res.data.IPv4;
                  Mixpanel.track("Show Map v2", {
                    $userName: userName,
                    $groupId: groupId,
                    $ip: ipv4,
                    $token: token,
                  });
                  Mixpanel.people.set({
                    $name: userName,
                    $group: groupId,
                    $userId: userId,
                  });
                });

              dispatch(setIsMapNotLoading(false));
              dispatch(setIsMapActive(true));
            }}
            className="absolute z-30 right-0 top-0 font-bold"
          >
            Show Maps
          </Button>
        </div>
      )}
    </>
  );
};
