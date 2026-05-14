"use client";

import { RootState } from "@/app/_globalRedux/store";
import BlurBg from "@/public/assets/images/common/blurbg.jpg";
import { PlayCircleOutlined } from "@ant-design/icons";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

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
  const [totalWatchedMs, setTotalWatchedMs] = useState<Record<number, number>>({});

  const socketsRef = useRef<Record<number, WebSocket | null>>({});
  const totalWatchedMsRef = useRef<Record<number, number>>({});
  const rafIdRef = useRef<Record<number, number | null>>({});
  const playingChannelsRef = useRef<number[]>([]);

  // Get selected vehicle to determine number of channels
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );

  // Determine if this vehicle should have 3 channels
  const hasThreeChannels = [21945, 12445248, 21945].includes(
    selectedVehicle.vId,
  );

  const hasFourChannels = [21945].includes(selectedVehicle.vId);

  const scheduleCounterRender = (channel: number) => {
    if (rafIdRef.current[channel] !== null && rafIdRef.current[channel] !== undefined) {
      return;
    }

    rafIdRef.current[channel] = window.requestAnimationFrame(() => {
      const nextWatchedValue = totalWatchedMsRef.current[channel] ?? 0;
      setTotalWatchedMs((prev) => ({ ...prev, [channel]: nextWatchedValue }));
      rafIdRef.current[channel] = null;
    });
  };
 
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
    setTotalWatchedMs({});
    totalWatchedMsRef.current = {};
  }, [deviceId]);



  useEffect(() => {
    playingChannelsRef.current = playingChannels;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingChannels]);

  useEffect(() => {
    // Intercept WebSocket to count video packets from the actual connection
    const originalWebSocket = window.WebSocket;

    const createWebSocketProxy = (url: string, protocols?: string | string[]) => {
      const ws = new originalWebSocket(url, protocols);
      
      // Check if this is a video socket
      const isVideoSocket = typeof url === 'string' && url.toLowerCase().includes('.video');
      
      if (isVideoSocket) {
        console.log('🎥 Video WebSocket detected:', url);
        
        // Patch addEventListener to catch dynamically added message handlers
        const originalAddEventListener = (ws.addEventListener as any);
        ws.addEventListener = function(type: string, listener: any, options?: any) {
          if (type === 'message') {
            const wrappedListener = (event: MessageEvent) => {
              // Count binary packets
              if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
                const size = event.data instanceof Blob 
                  ? event.data.size 
                  : (event.data as ArrayBuffer).byteLength;
                
                console.log('📦 Packet received:', size, 'bytes');
                totalWatchedMsRef.current[1] = (totalWatchedMsRef.current[1] ?? 0) + size;
                scheduleCounterRender(1);
              }
              
              // Call original listener
              listener(event);
            };
            originalAddEventListener.call(this, type, wrappedListener, options);
          } else {
            originalAddEventListener.call(this, type, listener, options);
          }
        };

        // Also patch onmessage property
        let messageHandler: ((event: MessageEvent) => void) | null = null;
        
        Object.defineProperty(ws, 'onmessage', {
          get() {
            return messageHandler;
          },
          set(handler: (event: MessageEvent) => void) {
            messageHandler = handler;
            if (handler) {
              const wrappedHandler = (event: MessageEvent) => {
                // Count binary packets
                if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
                  const size = event.data instanceof Blob 
                    ? event.data.size 
                    : (event.data as ArrayBuffer).byteLength;
                  
                  console.log('📦 Packet received (onmessage):', size, 'bytes');
                  totalWatchedMsRef.current[1] = (totalWatchedMsRef.current[1] ?? 0) + size;
                  scheduleCounterRender(1);
                }
                
                // Call original handler
                handler(event);
              };
              
              // Use the original addEventListener to set the wrapped handler
              try {
                (originalWebSocket.prototype.addEventListener as any).call(this, 'message', wrappedHandler);
              } catch (e) {
                // Fallback if above doesn't work
                (ws as any)._onmessage = wrappedHandler;
              }
            }
          },
        });
      }
      
      return ws;
    };

    // Replace global WebSocket with proxy
    (window as any).WebSocket = createWebSocketProxy as any;

    return () => {
      // Restore original WebSocket
      window.WebSocket = originalWebSocket;
    };
  }, []);



  const handlePlay = (channel: number) => {
    if (isChannelPlaying(channel)) return;

    const url = generateBSJUrl(channel);
    setVideoUrls((prev) => ({ ...prev, [channel]: url }));
    setPlayingChannels((prev) => [...prev, channel]);
    
    // Initialize total watched
    totalWatchedMsRef.current[channel] = 0;
    setTotalWatchedMs((prev) => ({ ...prev, [channel]: 0 }));
  };

  const isChannelPlaying = (channel: number) => {
    return playingChannels.includes(channel);
  };

  const getChannelsToDisplay = () => {
    const channels = [1, 2];
    if (hasThreeChannels) channels.push(3);
    if (hasFourChannels) channels.push(4);
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
            <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded">
              Total Watched: {((totalWatchedMs[channel] ?? 0) / 1000).toFixed(2)}s
            </div>
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
      <div className="space-y-2">
        {getChannelsToDisplay().map((channel) => renderChannelVideo(channel))}
      </div>
    </div>
  );
};

export default BSJVideoPlayer;
