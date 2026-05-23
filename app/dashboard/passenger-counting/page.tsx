import Layout from "@/app/_components/navigation";
import PassengerCountingWrapper from "@/app/_components/passenger-counting/PassengerCountingWrapper";
import { Suspense } from "react";

const page = () => {
  return (
    <Layout>
      <PassengerCountingWrapper />
    </Layout>
  );
};

export default page;
