"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LiveToggleContextType {
  isLiveOn: boolean;
  setIsLiveOn: (value: boolean) => void;
}

const LiveToggleContext = createContext<LiveToggleContextType | undefined>(
  undefined
);

export const LiveToggleProvider = ({ children }: { children: ReactNode }) => {
  const [isLiveOn, setIsLiveOn] = useState(true);

  return (
    <LiveToggleContext.Provider value={{ isLiveOn, setIsLiveOn }}>
      {children}
    </LiveToggleContext.Provider>
  );
};

export const useLiveToggle = () => {
  const context = useContext(LiveToggleContext);
  if (context === undefined) {
    throw new Error("useLiveToggle must be used within a LiveToggleProvider");
  }
  return context;
};
