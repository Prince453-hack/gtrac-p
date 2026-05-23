"use client";

import { RootState } from "@/app/_globalRedux/store";
import { Alert } from "antd";
import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { useSelector } from "react-redux";

function InfoBanner() {
  const [isAlertValid, setIsAlertValid] = useState(false);
  const [paymentAlert, setPaymentAlert] = useState(false);
  const { payment } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const currentDateObj = new Date();
    const currentDate = currentDateObj.getDate();
    const currentMonth = currentDateObj.getMonth() + 1;

    const currentHour = currentDateObj.getHours();

    if (currentDate === 27 && currentMonth === 11 && currentHour <= 16) {
      setIsAlertValid(true);
    }

    if (payment === 1) return setPaymentAlert(true);
  }, []);
  return (
    <>
      {isAlertValid ? (
        <div className="z-20 absolute left-0 top-0 w-full">
          {/* <Alert
						type='warning'
						message={
							<Marquee pauseOnHover gradient={false} speed={30}>
								{' '}
								We will be upgrading our backend, You may experience some issues between 2:30 PM to 3:00 PM. We appreciate your understanding and
								support during this time.
							</Marquee>
						}
						banner
					/> */}
        </div>
      ) : null}
      {paymentAlert ? (
        <div className="z-20 absolute left-0 top-0 w-full">
          <Alert
            type="warning"
            message={
              <Marquee pauseOnHover gradient={false} speed={30}>
                This is to inform you that your services may be interrupted by
                this evening due to delay in payments.
              </Marquee>
            }
            banner
          />
        </div>
      ) : null}
    </>
  );
}

export default InfoBanner;
