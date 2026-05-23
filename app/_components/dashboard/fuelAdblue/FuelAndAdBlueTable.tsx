"use client";

import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/lib/table";
import { FillTheftLogPoint, Point } from "./FuelAndAdblueTabs";

export function AdblueAndFuelTable({
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
  event: "filed" | "theft";
}) {
  const tableData = data.map((row, idx) => ({
    key: idx,
    ...row,
  }));

  if (tableData.length === 0) {
    return (
      <div>
        <h3 className="mb-4 font-semibold text-neutral-600 text-xl">{title}</h3>
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">
            No {event === "filed" ? "fill" : "theft"} events found for {type}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 font-semibold text-neutral-600 text-xl">{title}</h3>
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

export function AdblueAndFuelTableKuber({
  data,
  title,
  columns,
  type,
  event,
}: {
  data: FillTheftLogPoint[];
  title: string;
  columns: ColumnsType;
  type: "adblue" | "fuel";
  event: "filed" | "theft";
}) {
  const tableData = data.map((row, idx) => ({
    key: idx,
    ...row,
  }));

  if (tableData.length === 0) {
    return (
      <div>
        <h3 className="mb-4 font-semibold text-neutral-600 text-xl">{title}</h3>
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">
            No {event === "filed" ? "fill" : "theft"} events found for {type}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 font-semibold text-neutral-600 text-xl">{title}</h3>
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

export function NewFuelTrackingTable({
  data,
  title,
  columns,
  type,
  event,
}: {
  data: any[];
  title: string;
  columns: ColumnsType;
  type: "adblue" | "fuel";
  event: "filed" | "theft";
}) {
  const tableData = data.map((row, idx) => ({
    key: idx,
    ...row,
  }));

  if (tableData.length === 0) {
    return (
      <div>
        <h3 className="mb-4 font-semibold text-neutral-600 text-xl">{title}</h3>
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">
            No {event === "filed" ? "fill" : "theft"} events found for {type}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 font-semibold text-neutral-600 text-xl">{title}</h3>
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
