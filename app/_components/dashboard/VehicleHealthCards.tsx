"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { Badge, Card } from "antd";
import { useLazyGetDTCResultQuery } from "@/app/_globalRedux/services/trackingDashboard";

import accelerationImg from "@/public/assets/svgs/dtc/acceleration.svg";
import batteryImg from "@/public/assets/svgs/dtc/battery.svg";
import brakeImg from "@/public/assets/svgs/dtc/brake.svg";
import engineImg from "@/public/assets/svgs/dtc/engine.svg";
import safetySystemsImg from "@/public/assets/svgs/dtc/safety-systems.svg";
import generalImg from "@/public/assets/svgs/dtc/general.svg";
import sensorImg from "@/public/assets/svgs/dtc/sensor.svg";
import fuelSystemImg from "@/public/assets/svgs/dtc/fuel-system.svg";
import { FolderOpenOutlined } from "@ant-design/icons";

interface HealthCategory {
  category: string;
  icon: any;
  status: JSX.Element;
  severity: "GREEN" | "YELLOW" | "RED";
  issue: string;
  description: string;
  code: string;
  causes: string;
  recommendedActions: string;
  symptoms: string;
}

const getColorFromStatusForAlerts = (status: string) => {
  if (status === "Good" || status === "PINK" || status === "GREEN") {
    return (
      <Badge.Ribbon
        placement="end"
        text="Minor"
        color="#8540e"
        className="z-10"
      />
    );
  } else if (status === "Moderate" || status === "YELLOW") {
    return (
      <Badge.Ribbon
        placement="start"
        text="Moderate"
        color="#9a3412"
        className="z-10"
      />
    );
  } else if (status === "Severe" || status === "RED") {
    return (
      <Badge.Ribbon
        placement="start"
        text="Severe"
        color="#991b1b"
        className="z-10"
      />
    );
  } else {
    return <Badge.Ribbon text="Minor" color="#854d0e" className="z-10" />;
  }
};

const healthCategories: HealthCategory[] = [
  {
    category: "Acceleration",
    icon: accelerationImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "Battery",
    icon: batteryImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "Brake",
    icon: brakeImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "Engine",
    icon: engineImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "Fuel System",
    icon: fuelSystemImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "Safety Systems",
    icon: safetySystemsImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "General",
    icon: generalImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
  {
    category: "Sensor",
    icon: sensorImg,
    status: getColorFromStatusForAlerts("Good"),
    severity: "GREEN",
    issue: "",
    description: "",
    code: "",
    causes: "",
    recommendedActions: "",
    symptoms: "",
  },
];

function aggregateSPNData(data: Record<string, any>, maxCodes: number = 10) {
  const aggregatedData: any[] = [];
  for (let i = 1; i <= maxCodes; i++) {
    const spnCode = data[`SPN${i}_Code`];
    if (spnCode === null || spnCode === undefined) continue;
    const spnDescription = data[`SPN${i}_Description`];
    const spnDescriptionExpansion = data[`SPN${i}_DetailedExplanation`];
    const spnPossibleCauses = data[`SPN${i}_Causes`];
    const spnRecommendedActions = data[`SPN${i}_RecommendedAction`];
    const spnSymptoms = data[`SPN${i}_Symptoms`];
    const spnCategory = data[`SPN${i}_Category`];
    const fmiCategory = data[`FMI${i}_Category`];
    aggregatedData.push({
      SPN_Code: `#${spnCode}`,
      SPN_Description: spnDescription,
      SPN_Category: spnCategory,
      FMI_Category: getColorFromStatusForAlerts(fmiCategory),
      Set_At: `${data.odometer} Km`,
      category: (fmiCategory as string) || "GREEN",
      SPN_Possible_Causes: spnPossibleCauses,
      SPN_Recommended_Actions: spnRecommendedActions,
      SPN_Symptoms: spnSymptoms,
      SPN_Description_Expansion: spnDescriptionExpansion,
    });
  }
  return aggregatedData;
}

const VehicleHealthCards = () => {
  const { userId, parentUser, groupId } = useSelector(
    (state: RootState) => state.auth
  );
  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle
  );
  const [getDTCquery, { data: dtcResultData }] = useLazyGetDTCResultQuery();
  const [healthData, setHealthData] = useState<HealthCategory[]>([]);

  useEffect(() => {
    if (selectedVehicle.vId && groupId) {
      setHealthData([]);
      getDTCquery({ vehicleId: 0, token: groupId });
    }
  }, [selectedVehicle.vId, userId, parentUser, groupId, getDTCquery]);

  useEffect(() => {
    if (
      dtcResultData &&
      Array.isArray(dtcResultData.list) &&
      dtcResultData.list.length > 0
    ) {
      let vehicleSpecificData = (
        dtcResultData.list as Array<Record<string, any>>
      ).filter(
        (row) =>
          row.sys_service_id === selectedVehicle.vehicleTrip?.sys_service_id
      );
      if (vehicleSpecificData.length === 0) {
        vehicleSpecificData = (
          dtcResultData.list as Array<Record<string, any>>
        ).filter((row) => row.sys_service_id === selectedVehicle.vId);
      }

      if (vehicleSpecificData.length === 0) {
        setHealthData([]);
        return;
      }
      const candidate = vehicleSpecificData.find((row) => {
        for (let i = 1; i <= 10; i++) {
          const code = row[`SPN${i}_Code`];
          if (code !== null && code !== undefined) return true;
        }
        return false;
      });

      if (!candidate) {
        setHealthData([]);
        return;
      }

      const aggregatedData = aggregateSPNData(
        {
          ...candidate,
          odometer: selectedVehicle.gpsDtl.tel_odometer,
        },
        10
      );

      const iconMap: Record<string, any> = {
        Acceleration: accelerationImg,
        Battery: batteryImg,
        Brake: brakeImg,
        Engine: engineImg,
        "Fuel System": fuelSystemImg,
        "Safety Systems": safetySystemsImg,
        General: generalImg,
        Sensor: sensorImg,
      };

      const perCode = aggregatedData.map((alert) => {
        const sev = (alert.category as "GREEN" | "YELLOW" | "RED") || "GREEN";
        return {
          category: alert.SPN_Category || "General",
          icon: iconMap[alert.SPN_Category] || generalImg,
          status: alert.FMI_Category,
          severity: sev,
          issue: alert.SPN_Description || "",
          description: alert.SPN_Description_Expansion || "",
          code: alert.SPN_Code || "",
          causes: alert.SPN_Possible_Causes || "",
          recommendedActions: alert.SPN_Recommended_Actions || "",
          symptoms: alert.SPN_Symptoms || "",
        } as HealthCategory;
      });

      setHealthData(perCode);
    }
  }, [dtcResultData, selectedVehicle.gpsDtl.tel_odometer]);

  return (
    <>
      {healthData.length > 0 ? (
        <div className="space-y-4">
          {healthData.map((health, index) => (
            <div key={index} className="relative">
              {health.status}
              <Card className="shadow-xl shadow-s-light relative">
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-semibold">{health.causes}</h3>
                      <p className="text-base text-neutral-800">
                        {health.issue}
                      </p>
                    </div>
                    <p className="text-blue-500 font-semibold">{health.code}</p>
                  </div>
                  <p className="text-xs text-neutral-800 mt-1">
                    {health.description}
                  </p>
                  <p className="text-xs text-neutral-800 mt-1">
                    <span className="font-semibold">Causes:</span>{" "}
                    {health.causes}
                  </p>
                  <p className="text-xs text-neutral-800 mt-1">
                    <span className="font-semibold">Symptoms: </span>{" "}
                    {health.symptoms}
                  </p>
                  <p className="text-xs text-neutral-800 mt-1">
                    <span className="font-semibold">Recommended Actions:</span>{" "}
                    {health.recommendedActions}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-4xl text-neutral-400 w-full h-[200px] flex gap-2 justify-center items-center">
          <div>
            <div className="flex items-center justify-center w-full">
              <FolderOpenOutlined />
            </div>
            <p className="text-base text-neutral-800 font-semibold">
              No Data Found
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleHealthCards;
