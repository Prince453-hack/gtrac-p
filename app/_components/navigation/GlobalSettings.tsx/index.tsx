"use client";

import { RootState } from "@/app/_globalRedux/store";
import { getIsPadlock } from "@/app/helpers/isPadlock";
import { SettingOutlined } from "@ant-design/icons";
import { Dropdown, MenuProps } from "antd";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { CreatePOI } from "../../dashboard/vehicleOverviewCard/CreatePOI";

const GlobalSettings = () => {
  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth
  );
  const path = usePathname();

  const [globalSettingActive, setGlobalSettingActive] = useState<
    "create-manual-poi" | "get-nearby-location" | undefined
  >(undefined);

  const items: MenuProps["items"] = [
    path !== "/dashboard"
      ? null
      : {
          label: (
            <div
              onClick={() => setGlobalSettingActive("create-manual-poi")}
              className="flex gap-2 items-center"
            >
              {/* <Image src={POIIcon} alt='trip system icon' height={20} width={15} className='mr-[5px]' /> */}
              <p>Create Manual POI</p>
            </div>
          ),
          key: "Create Manual POI",
        },
    Number(userId) === 85380 || Number(userId) === 3098
      ? {
          label: (
            <div
              onClick={() =>
                window.open(
                  `https://gtrac.in/newtracking/gtrac_admin/client_service_alerts.php?token=${groupId}&userid=${userId}&extra=0&puserid=${parentUser}`
                )
              }
            >
              Manage Odometer Service
            </div>
          ),
          key: "Manage Odometer Service",
        }
      : null,
    ...(Number(userId) === 6258 || Number(parentUser) === 6258
      ? [
          {
            label: (
              <div
                onClick={() =>
                  window.open(
                    `https://gtrac.in/newtracking/clientservice/vehicle_installation_removal.php?token=${groupId}&userid=${userId}&extra=0&puserid=${parentUser}`
                  )
                }
              >
                Installation and Removal
              </div>
            ),
            key: "Installation and Removal",
          },
          {
            label: (
              <div
                onClick={() =>
                  window.open(
                    `https://gtrac.in/newtracking/clientservice/client_addrequest.php?token=${groupId}&userid=${userId}&extra=0&puserid=${parentUser}`
                  )
                }
              >
                Add Ticket
              </div>
            ),
            key: "Add Ticket",
          },
        ]
      : []),

    getIsPadlock({ userId })
      ? {
          label: (
            <div
              onClick={() => {
                window.open(
                  `https://gtrac.in/newtracking/reports/ImmobilizeSetall.php?userid=${userId}&token=${groupId}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              Immobilize Vehicles
            </div>
          ),
          key: "Immobilize Vehicles",
        }
      : null,
  ];

  return (
    <>
      <Dropdown
        menu={{ items }}
        trigger={["click"]}
        overlayStyle={{ width: "200px", position: "relative", bottom: "0px" }}
      >
        <div
          className="flex space-x-1 items-center cursor-pointer relative pl-4"
          onClick={(e) => e.preventDefault()}
        >
          <div className="rounded-full border-primary-green border-2  relative z-20">
            <div className="rounded-full border-white border-2 overflow-clip cursor-pointer">
              <div className="bg-primary-green px-[6px] flex items-center justify-center rounded-full">
                <SettingOutlined
                  className="text-[12.5px] py-1.5"
                  style={{ color: "#fff" }}
                />
              </div>
            </div>
          </div>
        </div>
      </Dropdown>

      {globalSettingActive === "create-manual-poi" && (
        <CreatePOI
          type="Lat_Lng_Based"
          setGlobalSettingActive={setGlobalSettingActive}
          globalSettingActive={globalSettingActive}
        />
      )}
    </>
  );
};

export default GlobalSettings;
