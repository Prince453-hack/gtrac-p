import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Layout from "@/app/_components/navigation";
import TripOverviewClient from "./trip-overview-client";

const Page = () => {
  const sessionData = cookies().get("auth-session")?.value;
  let userId = "";

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      userId = session.userId || 
               (session.data && session.data[0] && (session.data[0].userid || session.data[0].userId)) || 
               "";
    } catch (error) {
      console.error("Error parsing session data:", error);
    }
  }

  // Restrict access: only allow user 833916
  if (String(userId) !== "833916") {
    redirect("/dashboard");
  }

  return (
    <Layout>
      <TripOverviewClient userId={userId} />
    </Layout>
  );
};

export default Page;


