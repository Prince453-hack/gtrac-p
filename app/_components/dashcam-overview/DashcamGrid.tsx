"use client";

import React, { useMemo, useState } from "react";
import { Play, Video } from "lucide-react";
import Image from "next/image";
import BlurBg from "@/public/assets/images/common/blurbg.jpg";

interface DashcamGridProps {
  vehicles: any[];
  showCH3?: boolean;
  showCH4?: boolean;
}

const wsConfig = {
  url: "wss://y.gpstracktech.com/videows/",
  apiToken: process.env.NEXT_PUBLIC_BSJ_VIDEO_API_TOKEN || "",
  apiName: "",
  lang: "en",
};

const generateBSJUrl = (deviceId: string, channel: number) => {
  const params = {
    device: deviceId,
    channel: [channel],
    protocolType: 1,
    codetype: 1,
    datatype: 0,
  };

  const controls = "play,fullscreen,record,screenshot,HD,mute";
  const videoFormat = 98;
  const isSleep = 0;
  const countdown = 0;
  const timestamp = Date.now();

  const encodedParams = encodeURIComponent(JSON.stringify(params));
  const encodedConfig = encodeURIComponent(JSON.stringify(wsConfig));

  return `https://y.gpstracktech.com/#/videoapi/real?param=${encodedParams}&config=${encodedConfig}&controls=${controls}&videoFormat=${videoFormat}&isSleep=${isSleep}&countdown=${countdown}&t=${timestamp}`;
};

export const DashcamGrid: React.FC<DashcamGridProps> = ({ vehicles, showCH3 = false, showCH4 = false }) => {
  const [playingFeeds, setPlayingFeeds] = useState<Record<string, boolean>>({});

  const channelsList = useMemo(() => {
    const list: { key: string; vehReg: string; deviceId: string; channel: number; url: string }[] = [];
    vehicles.forEach((v) => {
      const deviceId = v.gpsDtl?.model?.replace("##BSJ", "") || "";
      if (deviceId) {
        list.push({
          key: `${v.vId}-${deviceId}-ch1`,
          vehReg: v.vehReg || "Vehicle",
          deviceId,
          channel: 1,
          url: generateBSJUrl(deviceId, 1),
        });
        list.push({
          key: `${v.vId}-${deviceId}-ch2`,
          vehReg: v.vehReg || "Vehicle",
          deviceId,
          channel: 2,
          url: generateBSJUrl(deviceId, 2),
        });
        if (showCH3) {
          list.push({
            key: `${v.vId}-${deviceId}-ch3`,
            vehReg: v.vehReg || "Vehicle",
            deviceId,
            channel: 3,
            url: generateBSJUrl(deviceId, 3),
          });
        }
        if (showCH4) {
          list.push({
            key: `${v.vId}-${deviceId}-ch4`,
            vehReg: v.vehReg || "Vehicle",
            deviceId,
            channel: 4,
            url: generateBSJUrl(deviceId, 4),
          });
        }
      }
    });
    return list;
  }, [vehicles, showCH3, showCH4]);

  const handlePlay = (key: string) => {
    setPlayingFeeds((prev) => ({ ...prev, [key]: true }));
  };

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-slate-50 font-sans">
        <span className="text-sm font-medium">No active vehicles to display</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6 bg-slate-50 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {channelsList.map((item) => {
          const isPlaying = playingFeeds[item.key];
          return (
            <div
              key={item.key}
              className="bg-slate-900 aspect-video rounded-xl overflow-hidden shadow-md relative group border border-slate-200"
            >
              {isPlaying ? (
                <iframe
                  src={item.url}
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="microphone; camera"
                  title={`${item.vehReg} Channel ${item.channel}`}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 transition-all select-none">
                  {/* Thumbnail Placeholder */}
                  <div className="absolute inset-0 bg-gray-200">
                    <Image
                      src={BlurBg}
                      alt="Video Placeholder"
                      fill
                      className="object-cover blur-md opacity-65"
                    />
                    <div className="absolute inset-0 bg-slate-900/30" />
                  </div>

                  <button
                    onClick={() => handlePlay(item.key)}
                    className="p-2 bg-[#ffff] text-white rounded-full transition-all hover:scale-105 shadow-lg flex items-center justify-center z-10 border-none cursor-pointer"
                    title={`Play ${item.vehReg} Channel ${item.channel}`}
                  >
                    <Play className="h-5 w-5 fill-black ml-0.5" />
                  </button>
                </div>
              )}
              {/* Channel overlay - always visible */}
              <div className="absolute top-3 right-3 text-white flex items-center gap-1.5 text-xs bg-black/60 px-2 py-0.5 rounded z-10 backdrop-blur-sm font-semibold select-none pointer-events-none">
                <Video className="h-3.5 w-3.5" />
                CH{item.channel}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-md text-white text-xs font-mono select-none z-10 backdrop-blur-sm font-semibold">
                {item.vehReg}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
