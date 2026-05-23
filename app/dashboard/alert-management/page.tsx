import Layout from "@/app/_components/navigation";
import { cookies } from "next/headers";
import AlertList from "./alert-list";

const AlertPage = () => {
  const sessionData = cookies().get("auth-session")?.value;
  let userId = "";

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      userId = session.userId || "";
    } catch (error) {
      console.error("Error parsing session data:", error);
    }
  }

  return (
    <Layout>
      <AlertList initialUserId={userId} />
    </Layout>
  );
};

export default AlertPage;
