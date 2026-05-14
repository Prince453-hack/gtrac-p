"use client";

import React from "react";
import { Card, Table } from "antd";

const View = () => {
  const data = [
    {
      key: "1",
      particulars: "Sum of Number of vehicles",
      value: "52",
    },
    {
      key: "2",
      particulars: "Sum of Distance",
      value: "48072 KM",
    },
    {
      key: "3",
      particulars: "Sum of Total Fuel Consumed (In Ltrs)",
      value: "17307.65",
    },
    {
      key: "4",
      particulars: "Sum of Idling Fuel Consumed (In Ltrs)",
      value: "61.45",
      highlight: "red",
    },
    {
      key: "5",
      particulars: "Sum of Over Speeding Counts",
      value: "91",
      highlight: "red",
    },
    {
      key: "6",
      particulars: "Sum of Hard Barking Counts",
      value: "18",
    },
    {
      key: "7",
      particulars: "Sum of Freerun Counts",
      value: "517",
    },
    {
      key: "8",
      particulars: "Fuel Economy(Kmpl)",
      value: "2.77",
      highlight: "green",
    },
  ];

  const columns = [
    {
      title: "Particulars",
      dataIndex: "particulars",
      key: "particulars",
      width: "60%",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      width: "40%",
      align: "center" as const,
    },
  ];

  return (
    <div className="">
      <Card
        title="Monthly Utilization Summary of All Vehicles"
        className="shadow-md text-lg"
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          rowClassName={(record: any) => {
            if (record.highlight === "red") {
              return "bg-red-500/95 text-white font-bold";
            }
            if (record.highlight === "green") {
              return "bg-green-500/95 text-white font-bold";
            }
            return "";
          }}
          style={{
            pointerEvents: "none",
          }}
          onRow={() => ({
            style: {
              cursor: "default",
            },
          })}
        />
        <style jsx>{`
          :global(.ant-table-row:hover > td) {
            background: inherit !important;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default View;
