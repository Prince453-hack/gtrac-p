"use client";

import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/lib/table";
import { Point } from "./FuelAndAdblueTabs";

export function FuelAndAdBlueTableInDetails({
  data,
  title,
  columns,
  type,
  event,
}: {
  data: Point[];
  title: string;
  columns: ColumnsType;
  type: "adblue" | "fuel";
  event: "filled" | "theft";
}) {
  const tableData = data.map((row, idx) => ({
    key: idx,
    ...row,
  }));

  if (tableData.length === 0) {
    return (
      <div>
        <h3 className="mt-4 mb-2 font-semibold text-neutral-600 text-base">
          {title}
        </h3>
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">
            No {event === "filled" ? "fill" : "theft"} events found for {type}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mt-4 mb-2 font-semibold text-neutral-600 text-base">
        {title}
      </h3>
      <div className="max-h-[300px] overflow-scroll">
        <Table
          columns={columns}
          dataSource={tableData}
          bordered
          size="middle"
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
}
