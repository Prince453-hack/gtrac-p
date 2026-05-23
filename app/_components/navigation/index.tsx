import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { cookies } from "next/headers";

const index = ({ children }: { children: ReactNode }) => {
  const sessionData = cookies().get("auth-session")?.value;

  return (
    <>
      <div className="relative">
        <TopNavbar sessionData={sessionData} />
        <div className="w-full h-2 absolute -bottom-[8px] z-40 bg-gradient-to-b from-gray-800 opacity-[0.05]"></div>
      </div>
      <Sidebar>{children}</Sidebar>
    </>
  );
};

export default index;
