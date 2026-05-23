"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, message } from "antd";
import { MicIcon } from "@/public/assets/svgs/nav";
import Image from "next/image";

interface MettaxTalkComponentProps {
  deviceId: string;
  channelId?: number;
  getTalkChannel: (params: {
    deviceId: string;
    channelId?: number;
  }) => Promise<any>;
}

const MettaxTalkComponent: React.FC<MettaxTalkComponentProps> = ({
  deviceId,
  channelId = 1,
  getTalkChannel,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [talkUrl, setTalkUrl] = useState<string>("");
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize talk channel
  const initializeTalkChannel = async () => {
    try {
      const response = await getTalkChannel({ deviceId, channelId });
      if (response.data && response.data.code === 0) {
        setTalkUrl(response.data.data.talkUrl);
        message.success("Talk channel initialized successfully");
      } else {
        message.error("Failed to initialize talk channel");
      }
    } catch (error) {
      console.error("Error initializing talk channel:", error);
      message.error("Error initializing talk channel");
    }
  };

  // Connect to WebSocket
  const connectWebSocket = () => {
    if (!talkUrl) {
      message.error("Talk URL not available. Please initialize first.");
      return;
    }

    try {
      wsRef.current = new WebSocket(talkUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        message.success("Connected to talk channel");
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        message.info("Disconnected from talk channel");
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        message.error("WebSocket connection error");
        setIsConnected(false);
      };

      wsRef.current.onmessage = (event) => {};
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      message.error("Failed to connect to WebSocket");
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 8000,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);

          // Send audio data through WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data);
          }
        }
      };

      mediaRecorder.onstop = () => {
        setAudioChunks(chunks);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      // Start recording with 100ms intervals
      mediaRecorder.start(100);
      setIsRecording(true);
      message.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      message.error(
        "Failed to start recording. Please check microphone permissions.",
      );
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.success("Recording stopped");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
      <div className="text-center">
        <Image
          src={MicIcon}
          alt="Microphone"
          width={48}
          height={48}
          className="mx-auto mb-4"
        />
        <h3 className="text-lg font-semibold mb-2">Two-Way Communication</h3>
      </div>

      <div className="flex flex-col space-y-3 w-full max-w-xs">
        {!talkUrl && (
          <Button
            type="primary"
            onClick={initializeTalkChannel}
            className="w-full"
          >
            Initialize Talk Channel
          </Button>
        )}

        {talkUrl && !isConnected && (
          <Button type="default" onClick={connectWebSocket} className="w-full">
            Connect to Device
          </Button>
        )}

        {isConnected && (
          <Button
            type="default"
            onClick={disconnectWebSocket}
            className="w-full"
            danger
          >
            Disconnect
          </Button>
        )}

        {isConnected && (
          <div className="flex flex-col space-y-2">
            {!isRecording ? (
              <Button
                type="primary"
                onClick={startRecording}
                className="w-full bg-green-500 hover:bg-green-600 border-green-500"
              >
                <Image
                  src={MicIcon}
                  alt="Mic"
                  width={16}
                  height={16}
                  className="mr-2"
                />
                Start Talk
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={stopRecording}
                className="w-full bg-red-500 hover:bg-red-600 border-red-500"
                danger
              >
                Stop Talk
              </Button>
            )}
          </div>
        )}

        <div className="text-center">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-400" : "bg-gray-400"
              }`}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </div>

          {isRecording && (
            <div className="mt-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <div className="w-2 h-2 rounded-full mr-2 bg-red-400 animate-pulse" />
                Recording...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center max-w-sm">
        <p>Make sure your microphone is enabled and working properly.</p>
      </div>
    </div>
  );
};

export default MettaxTalkComponent;
