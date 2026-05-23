"use client";

import { useSearchParams } from "next/navigation";
import PassengerCountingView from "./PassengerCountingView";

const PassengerCountingWrapper = () => {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  return <PassengerCountingView serviceId={serviceId} />;
};

export default PassengerCountingWrapper;
