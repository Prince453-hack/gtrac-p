"use client";

import React, {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import "./index.css";
import {
  useReactTable,
  makeStateUpdater,
  getSortedRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  flexRender,
  TableFeature,
  Table,
  RowData,
  OnChangeFn,
  ColumnDef,
  Column,
  Updater,
  functionalUpdate,
} from "@tanstack/react-table";
import useDebounce from "@/app/hooks/useDebounce";
import { Button, Spin } from "antd";
import { DownloadReportsModal } from "./DownloadReportsModal";
import { CloudDownloadOutlined } from "@ant-design/icons";
import { UserOptions } from "jspdf-autotable";
import { useInView } from "react-intersection-observer";

export type DensityState = "sm" | "md" | "lg";
export interface DensityTableState {
  density: DensityState;
}
export interface DensityOptions {
  enableDensity?: boolean;
  onDensityChange?: OnChangeFn<DensityState>;
}
export interface DensityInstance {
  setDensity: (updater: Updater<DensityState>) => void;
  toggleDensity: (value?: DensityState) => void;
}

declare module "@tanstack/react-table" {
  interface TableState extends DensityTableState {}
  interface TableOptionsResolved<
    TData extends RowData,
  > extends DensityOptions {}
  interface Table<TData extends RowData> extends DensityInstance {}
}

export const DensityFeature: TableFeature<any> = {
  getInitialState: (state): DensityTableState => ({
    density: "md",
    ...state,
  }),
  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): DensityOptions => ({
    enableDensity: true,
    onDensityChange: makeStateUpdater("density", table),
  }),
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table.setDensity = (updater) => {
      const safeUpdater: Updater<DensityState> = (old) =>
        functionalUpdate(updater, old);
      return table.options.onDensityChange?.(safeUpdater);
    };
    table.toggleDensity = (value) => {
      table.setDensity((old) =>
        value ? value : old === "lg" ? "md" : old === "md" ? "sm" : "lg",
      );
    };
  },
};

interface Rows {
  [key: string]: any;
}

function Filter({ column }: { column: Column<any, any> }) {
  const columnFilterValue = column.getFilterValue();
  const [value, setValue] = React.useState((columnFilterValue as string) ?? "");
  const debouncedValue = useDebounce({ value, delay: 4000 });

  React.useEffect(() => {
    column.setFilterValue(debouncedValue);
  }, [debouncedValue, column]);

  return (
    <div className="mt-3 pt-3 border-0 border-t-[1px] border-t-[rgb(211,211,211)]">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search..."
        className="w-full p-1 px-2 border border-neutral-100 shadow rounded focus:outline-primary-green font-semibold"
        style={{ minWidth: "100px", maxWidth: "100%" }}
      />
    </div>
  );
}

export interface DownloadReportTs {
  title: string;
  excel: { title: string; rows: Rows[]; footer: undefined | unknown };
  pdf: {
    head: any[];
    body: any[];
    title: string;
    pageSize?: string | number[] | undefined;
    userOptions?: UserOptions;
  };
}

const getCommonPinningStyles = (column: Column<any>): CSSProperties => {
  const isPinned = (column.columnDef.meta as any)?.pinned;
  const metaWidth = (column.columnDef.meta as any)?.width;
  const width = isPinned
    ? column.getSize()
    : metaWidth === "auto"
      ? "auto"
      : column.getSize();

  return {
    boxShadow: isPinned ? "-2px 0 2px -2px gray inset" : undefined,
    left: 0,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: width,
    zIndex: isPinned ? 1 : 0,
    background: "#F5F8F6",
    borderRadius: 0,
  };
};

const CustomTableN = ({
  columns,
  data,
  loading,
  onDownloadBtnClick,
  downloadReport,
  setDownloadReport,
  width,
  height,
  fontSize,
  lazyLoad,
  showDownloadBtn = true,
  densityProp,
  onClick,
  noFilter,
}: {
  columns: ColumnDef<any>[];
  data: any;
  loading: boolean;
  onDownloadBtnClick: (args: any) => void;
  downloadReport: DownloadReportTs | undefined;
  setDownloadReport: Dispatch<SetStateAction<DownloadReportTs | undefined>>;
  width?: string;
  height?: string;
  fontSize?: string;
  lazyLoad?: boolean;
  showDownloadBtn?: boolean;
  densityProp?: DensityState;
  onClick?: (row: any) => void;
  noFilter?: boolean;
}) => {
  const [density, setDensity] = React.useState<DensityState>(
    densityProp || "md",
  );
  const [currentPage, setCurrentPage] = React.useState(20);

  const table = useReactTable({
    _features: [DensityFeature],
    columns,
    data,
    debugTable: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    state: { density },
    onDensityChange: setDensity,
  });

  const [ref, inView] = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView) {
      setTimeout(() => setCurrentPage((prev) => prev + 10), 200);
    }
  }, [inView]);

  return (
    <div className="table-container p-2 max-h-[100vh]">
      {loading ? (
        <div className="w-full h-[77vh] flex justify-center items-center">
          <Spin size="large" tip="Data Loading" />
        </div>
      ) : (
        <>
          <div className="bg-[#F5F8F6] mb-4 mx-1 flex justify-between items-center font-semibold">
            <p>Total: {table ? table.getRowCount() : 0}</p>
            {showDownloadBtn ? (
              <Button
                onClick={() =>
                  onDownloadBtnClick(
                    table.getFilteredRowModel().rows.map((row) => row.original),
                  )
                }
                icon={<CloudDownloadOutlined />}
              />
            ) : null}
            <DownloadReportsModal
              downloadReport={downloadReport}
              setDownloadReport={setDownloadReport}
            />
          </div>
          <div
            className={`${height || "max-h-[77vh]"} max-w-[95vw] overflow-auto border-t`}
          >
            <table
              className="table"
              style={{ width: width || "100%", fontSize: fontSize || "14px" }}
            >
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const { column } = header;
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            ...getCommonPinningStyles(column),
                            position: "sticky",
                            top: 0,
                            backgroundColor: "#F5F8F6",
                            zIndex: 4,
                            padding:
                              density === "sm"
                                ? "4px"
                                : density === "md"
                                  ? "8px"
                                  : "16px",
                            transition: "padding 0.2s",
                          }}
                        >
                          <div
                            className={
                              header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : ""
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{ asc: " 🔼", desc: " 🔽" }[
                              header.column.getIsSorted() as string
                            ] ?? null}
                          </div>
                          {header.column.getCanFilter() && !noFilter ? (
                            <Filter column={header.column} />
                          ) : null}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-neutral-100"
                    onClick={() => onClick && onClick(row.original)}
                  >
                    {(lazyLoad
                      ? row.getVisibleCells().slice(0, currentPage)
                      : row.getVisibleCells()
                    ).map((cell) => {
                      const { column } = cell;
                      return (
                        <td
                          key={cell.id}
                          className="rounded-none"
                          style={{
                            ...getCommonPinningStyles(column),
                            padding:
                              density === "sm"
                                ? "4px"
                                : density === "md"
                                  ? "8px"
                                  : "16px",
                            transition: "padding 0.2s",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="h-2" ref={ref} />
          </div>
        </>
      )}
    </div>
  );
};

export default CustomTableN;
