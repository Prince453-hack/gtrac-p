"use client";

import BlurBg from "@/public/assets/images/common/blurbg.jpg";
import { PlayCircleOutlined } from "@ant-design/icons";
import { Switch } from "antd";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface BSJVideoPlayerProps {
  deviceId: string;
  className?: string;
}



const BSJVideoPlayer: React.FC<BSJVideoPlayerProps> = ({
  deviceId,
  className = "",
}) => {
  const [playingChannels, setPlayingChannels] = useState<number[]>([]);
  const [videoUrls, setVideoUrls] = useState<{ [key: number]: string }>({});
  const [showCH3, setShowCH3] = useState(false);
  const [showCH4, setShowCH4] = useState(false);

  // BSJ Video URL configuration
  const baseUrl = "https://y.gpstracktech.com/#/videoapi/real";
  const wsConfig = {
    url: "wss://y.gpstracktech.com/videows/",
    apiToken: process.env.NEXT_PUBLIC_BSJ_VIDEO_API_TOKEN || "",
    apiName: "",
    lang: "en",
  };

  // Generate BSJ video URL
  const generateBSJUrl = (channel: number) => {
    const params = {
      device: deviceId,
      channel: [channel],
      protocolType: 1,
      codetype: 1,
      datatype: 0,
    };

    const config = wsConfig;

    const controls = "play,fullscreen,record,screenshot,HD,mute";
    const videoFormat = 98;
    const isSleep = 0;
    const countdown = 0;
    const timestamp = Date.now();

    const encodedParams = encodeURIComponent(JSON.stringify(params));
    const encodedConfig = encodeURIComponent(JSON.stringify(config));

    return `${baseUrl}?param=${encodedParams}&config=${encodedConfig}&controls=${controls}&videoFormat=${videoFormat}&isSleep=${isSleep}&countdown=${countdown}&t=${timestamp}`;
  };

  useEffect(() => {
    // Clear URLs when device changes
    setVideoUrls({});
    setPlayingChannels([]);
    setShowCH3(false);
    setShowCH4(false);
  }, [deviceId]);



  const handlePlay = (channel: number) => {
    if (isChannelPlaying(channel)) return;

    const url = generateBSJUrl(channel);
    setVideoUrls((prev) => ({ ...prev, [channel]: url }));
    setPlayingChannels((prev) => [...prev, channel]);
  };

  const isChannelPlaying = (channel: number) => {
    return playingChannels.includes(channel);
  };

  const getChannelsToDisplay = () => {
    const channels = [1, 2];
    if (showCH3) channels.push(3);
    if (showCH4) channels.push(4);
    return channels;
  };

  const renderChannelVideo = (channel: number) => (
    <div key={channel}>
      <div className="aspect-video relative">
        {isChannelPlaying(channel) && videoUrls[channel] ? (
          <>
            <iframe
              src={videoUrls[channel]}
              className="w-full h-full rounded-lg shadow-lg border pointer-events-auto"
              allowFullScreen
              title={`BSJ Video Stream - Channel ${channel}`}
            />
          </>
        ) : (
          <div className="w-full h-full relative rounded-lg overflow-hidden border">
            <div className="absolute inset-0 bg-gray-200">
              <Image
                src={BlurBg}
                alt="Video Placeholder"
                fill
                className="object-cover blur-lg"
              />
            </div>
            <button
              onClick={() => handlePlay(channel)}
              className="absolute inset-0 flex items-center justify-center hover:bg-black/10 transition-colors"
            >
              <PlayCircleOutlined className="text-white text-4xl opacity-80 hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600">CH3</span>
          <Switch
            size="small"
            checked={showCH3}
            onChange={setShowCH3}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600">CH4</span>
          <Switch
            size="small"
            checked={showCH4}
            onChange={setShowCH4}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </div>
      </div>
      <div className="space-y-2">
        {getChannelsToDisplay().map((channel) => renderChannelVideo(channel))}
      </div>
    </div>
  );
};

export default BSJVideoPlayer;
