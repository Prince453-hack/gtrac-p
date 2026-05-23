"use client";
import { useGetCountDetailsQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import { ArrowUpOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  trendUp?: boolean;
}

const StatCard = ({
  title,
  value,
  subtitle,
  trendUp = true,
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex justify-between items-end">
        <div className="flex-1">
          <h3 className="font-medium text-gray-700 mb-1">{title}</h3>
          <p className="text-xl font-medium text-gray-900 mb-2">{value}</p>
          <p className="text-xs text-gray-500 ">{subtitle}</p>
          <p className="text-xs text-gray-500">Vehicle</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-md ml-4">
          <ArrowUpOutlined
            className={`text-blue-500 text-lg transform ${
              trendUp ? "rotate-45" : "-rotate-45"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

const StatCardSkeleton = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex justify-between items-end">
        <div className="flex-1">
          <h3 className="font-medium text-gray-700 mb-1">{title}</h3>
          <div className="mb-2">
            <Skeleton.Input
              style={{ width: 50, height: 24 }}
              active
              size="small"
            />
          </div>
          <p className="text-xs text-gray-500">{subtitle}</p>
          <p className="text-xs text-gray-500">Vehicle</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-md ml-4">
          <ArrowUpOutlined className="text-blue-500 text-lg transform rotate-45" />
        </div>
      </div>
    </div>
  );
};

const VehicleStatsCards = () => {
  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth
  );

  const { data: vehicleCounts, isLoading } = useGetCountDetailsQuery(
    {
      userid: userId,
      groupid: groupId,
      puserid: parentUser,
    },
    {
      skip: !groupId || !userId || !parentUser,
    }
  );

  const [stats, setStats] = useState([
    {
      key: "ALL",
      title: "Total",
      value: "",
      subtitle: "Total",
    },
    {
      key: "RUNNING",
      title: "Running",
      value: "",
      subtitle: "Total Running",
    },
    {
      key: "STOPPAGE",
      title: "Stopped",
      value: "",
      subtitle: "Total Stopped",
    },
    {
      key: "NOT WORKING",
      title: "Not Working",
      value: "",
      subtitle: "Not Working",
    },
  ]);

  useEffect(
    () => {
      if (vehicleCounts) {
        const updatedStats = stats.map((stat) => {
          switch (stat.key) {
            case "ALL":
              return {
                ...stat,
                value:
                  vehicleCounts.list
                    .find((e) => e.mode === "ALL")
                    ?.count.toString() || "0",
              };
            case "RUNNING":
              const runningCount =
                vehicleCounts.list.find((e) => e.mode === "RUNNING")?.count ||
                0;
              const idleCount =
                vehicleCounts.list.find((e) => e.mode === "IDLE")?.count || 0;
              return {
                ...stat,
                value: (runningCount + idleCount).toString(),
              };
            case "STOPPAGE":
              return {
                ...stat,
                value:
                  vehicleCounts.list
                    .find((e) => e.mode === "STOPPAGE")
                    ?.count.toString() || "0",
              };
            case "NOT WORKING":
              return {
                ...stat,
                value:
                  vehicleCounts.list
                    .find((e) => e.mode === "NOT WORKING")
                    ?.count.toString() || "0",
              };
            default:
              return stat;
          }
        });

        setStats(updatedStats);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehicleCounts]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 mt-2">
        {stats.map((stat, index) => (
          <StatCardSkeleton
            key={index}
            title={stat.title}
            subtitle={stat.subtitle}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 mt-2s">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
        />
      ))}
    </div>
  );
};

export default VehicleStatsCards;
