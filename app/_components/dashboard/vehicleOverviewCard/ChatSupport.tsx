"use client";

import { Card } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ChatSupportProps {
  open: boolean;
  onClose: () => void;
  vehicleNo: string;
  contactName?: string;
  contactNumber?: string;
  auth: {
    userid: string;
    userName: string;
  };
  vid: string | number;
  vehReg: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
}

export const ChatSupport: React.FC<ChatSupportProps> = ({
  open,
  onClose,
  vehicleNo,
  contactName,
  contactNumber,
  auth,
  vid,
  vehReg,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: `Hello! How can we help you with vehicle ${vehicleNo}?`,
      sender: "support",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (open && mounted) {
      setIsAnimating(true);
      setIsClosing(false);
    }
  }, [open, mounted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history when chat opens
  useEffect(() => {
    if (!open || !mounted) return;

    const loadMessageHistory = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/gtrac/messages?gtracUserId=${auth.userid}&gtracVehicleId=${vid}`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.messages && data.messages.length > 0) {
            const historyMessages: ChatMessage[] = data.messages.map(
              (msg: any) => ({
                id: msg.id.toString(),
                text: msg.content,
                sender: msg.senderType === "admin" ? "support" : "user",
                timestamp: new Date(msg.createdAt),
              })
            );

            setMessages((prev) => {
              // Keep the welcome message at the beginning if it exists
              const welcomeMsg = prev.find((m) =>
                m.text.includes("Hello! How can we help")
              );
              const filtered = prev.filter(
                (m) => !m.text.includes("Hello! How can we help")
              );
              return welcomeMsg
                ? [welcomeMsg, ...historyMessages]
                : historyMessages;
            });
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    loadMessageHistory();
  }, [open, mounted, auth.userid, vid]);


  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      // Send message to GTRAC API
      const response = await fetch(
        "http://localhost:3001/api/gtrac/send-message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gtracUserId: auth.userid,
            gtracVehicleId: vid,
            content: messageToSend,
            messageType: "text",
            username: auth.userName,
            vehicleName: vehReg,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
      }
    } catch (error) {
      // Silent error handling
    }

    // Real messages will come via Socket.IO, no need to simulate
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!open || !mounted) return null;

  const chatComponent = (
    <div
      className={`fixed bottom-4 right-4 z-[100000] transition-all duration-300 ease-in-out ${
        isClosing
          ? "translate-y-full opacity-0"
          : isAnimating
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 100000,
        transform: isClosing
          ? "translateY(100%)"
          : isAnimating
          ? "translateY(0)"
          : "translateY(100%)",
        opacity: isClosing ? 0 : isAnimating ? 1 : 0,
      }}
    >
      <Card
        styles={{
          body: {
            padding: 0,
            borderRadius: "12px",
            background: "#ffffff",
            boxShadow: "rgba(0, 0, 0, 0.15) 0px 8px 24px",
            minWidth: "330px",
            maxWidth: "350px",
            height: "450px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
        style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#478C83] to-[#5BA08F] text-white">
          <div>
            <h3 className="text-lg font-semibold">Chat Support</h3>
            <p className="text-xs opacity-90">Vehicle: {vehicleNo}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-[#478C83] text-white"
                    : "bg-white text-gray-800 shadow-sm"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === "user"
                      ? "text-green-100"
                      : "text-gray-500"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#478C83] focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-[#478C83] text-white rounded-lg hover:bg-[#3E7A72] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  return createPortal(chatComponent, document.body);
};
