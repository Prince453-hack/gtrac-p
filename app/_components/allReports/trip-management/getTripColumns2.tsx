import { operatorFilterFn } from "@/app/helpers/customTableFilterFns";
import { Cell, ColumnDef, HeaderContext, Row } from "@tanstack/react-table";
import { DownloadReportTs } from "../../common/CustomTableN";
import { Tooltip } from "antd";
import { HeatMapOutlined } from "@ant-design/icons";
import moment from "moment";

interface TableRow {
  [key: string]: any;
}

export const getTripsColumns2 = ({
  userId,
  data,
  setSelectedData,
  setTripEndModal,
}: {
  userId: string;
  data: getTripVehiclesResponse | undefined;
  setSelectedData: React.Dispatch<React.SetStateAction<any>>;
  setTripEndModal?: React.Dispatch<
    React.SetStateAction<PlannedTrips | undefined>
  >;
}) => {

  let additionalColKeys: string[] = [];
  if (data && data.list && data.list[0]?.extraInfo !== null) {
    // todo make the keys dependent on a field in auth
    const additionalColKeysInJSON = JSON.parse(
      localStorage.getItem("auth-session") || "",
    ).extraInfo;
    additionalColKeys = JSON.parse(additionalColKeysInJSON || "[]");
  }

  const cols: ColumnDef<TableRow>[] = [
    {
      header: "S.No.",
      cell: ({ row, table }: { row: Row<TableRow>; table: any }) => {
        return (
          <div className="text-center">
            {table.getRowModel().rows.indexOf(row) + 1}
          </div>
        );
      },
      size: 50,
    },
    {
      accessorKey: Number(userId) === 87317 ? "lorry_no" : "challan_no",
      header: "Device No",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "departure_date",
      header: "Trip Start Date",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },

    {
      accessorKey: "party_name",
      header: "Transporter Name",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "station_from_location",
      header: "From Location",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "station_to_location",
      header: "To Location",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "lorry_no",
      header: "Vehicle Number",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "destination_party_name",
      header: "GC Number",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "cargo_weight",
      header: "Shipment Number",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "driver_name",
      header: "Driver Name",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "driver_number",
      header: "Driver Number",
      footer: (props) => props.column.id,
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },
    {
      accessorKey: "trip_complted_datebysystem",
      header: "Trip Close Date",
      footer: (props) => props.column.id,
      cell: ({
        cell,
        row,
      }: {
        cell: Cell<TableRow, unknown>;
        row: Row<TableRow>;
      }) => {
        return (
          <div className="">
            {String(cell.getValue()) && cell.getValue() !== null
              ? String(cell.getValue())
              : "Not Fetchable"}
          </div>
        );
      },
      filterFn: (row, id, value) => operatorFilterFn(row, id, value),
    },

    ...(Number(userId) === 87317
      ? [
          {
            accessorKey: "",
            header: "Close Trip",
            footer: (props: any) => props.column.id,
            cell: ({ row }: { row: Row<TableRow> }) => (
              <div
                className="flex justify-center items-center text-primary-green font-proxima font-medium cursor-pointer hover:text-[#58a89d] transition-colors duration-300"
                onClick={() => {
                  if (setTripEndModal) setTripEndModal(row.original as any);
                }}
              >
                Close Trip ({row.original.trip_id})
              </div>
            ),
          },
        ]
      : []),

    ...(additionalColKeys.length > 0
      ? additionalColKeys.map((key) => {
          return {
            header: key,
            cell: ({
              cell,
              row,
            }: {
              cell: Cell<TableRow, unknown>;
              row: Row<TableRow>;
            }) =>
              row.original.extraInfo
                ? JSON.parse(row.original.extraInfo)[key]
                : "",
            footer: (props: HeaderContext<TableRow, unknown>) =>
              props.column.id,
          };
        })
      : []),
    {
      id: "path",

      cell: ({ row }) => {
        return (
          <>
            <div
              className="w-full flex items-center justify-center cursor-pointer"
              onClick={() => {
                if (
                  row.original.trip_complted_datebysystem &&
                  row.original.trip_complted_datebysystem !== null
                ) {
                  setSelectedData({
                    ...row.original,
                  });
                } else {
                  setSelectedData({
                    ...row.original,
                    trip_complted_datebysystem: moment().format(
                      "DD MMM YYYY HH:mm:ss",
                    ),
                  });
                }
              }}
            >
              <Tooltip title="show path" mouseEnterDelay={1}>
                <HeatMapOutlined />
              </Tooltip>
            </div>
          </>
        );
      },
      header: "Path",

      footer: (props) => props.column.id,
    },
  ];

  return cols;
};

export const downloadTripReport = ({
  data,
  setDownloadReport,
}: {
  data: getTripVehiclesResponse | undefined;
  setDownloadReport: React.Dispatch<
    React.SetStateAction<DownloadReportTs | undefined>
  >;
}) => {
  if (!data) return;

  let additionalColKeys: string[] = [];
  if (data.list && data.list[0].extraInfo !== null) {
    // todo make the keys dependent on a field in auth
    const additionalColKeysInJSON = JSON.parse(
      localStorage.getItem("auth-session") || "",
    ).extraInfo;
    additionalColKeys = JSON.parse(additionalColKeysInJSON || "[]");
  }

  // Build rows with keys matching the header names from the table columns
  const rows = data.list.map((item, index) => {
    // Build additional columns as an object
    const additionalInfo =
      additionalColKeys.length > 0
        ? additionalColKeys.reduce(
            (acc, key) => {
              acc[key] = item.extraInfo ? JSON.parse(item.extraInfo)[key] : "";
              return acc;
            },
            {} as Record<string, any>,
          )
        : {};

    return {
      "S.No.": index + 1,
      "Device No": item.challan_no,
      "Trip Start Date": item.departure_date,
      "Transporter Name": item.party_name,
      "From Location": item.station_from_location,
      "To Location": item.station_to_location,
      "Vehicle Number": item.lorry_no,
      "GC Number": item.destination_party_name,
      "Shipment Number": item.cargo_weight,
      "Driver Name": item.driver_name,
      "Driver Number": item.driver_number,
      "Trip Close Date": String(item.trip_complted_datebysystem)
        ? item.trip_complted_datebysystem
        : "Not Fetchable",
      ...additionalInfo,
    };
  });

  // Create header from the keys of the first row
  const head = Object.keys(rows[0]);

  // Create body rows with the values in header order, casting each row as indexable
  const body = rows.map((row) =>
    head.map((key) => (row as Record<string, any>)[key]),
  );

  // Determine column styles based on the first row's cell content
  const columnsStyles: any = {};
  head.forEach((key, index) => {
    const value = (rows[0] as Record<string, any>)[key];
    columnsStyles[index] = {
      cellWidth: value ? (value?.toString().length > 10 ? 50 : 20) : "",
    };
  });

  setDownloadReport({
    title: "Trip Report",
    excel: { title: "Trip Report", rows, footer: [] },
    pdf: {
      head: [head],
      body: body,
      title: "Trip Report",
      pageSize: "a2",
      userOptions: {
        columnStyles: columnsStyles,
      },
    },
  });
};
