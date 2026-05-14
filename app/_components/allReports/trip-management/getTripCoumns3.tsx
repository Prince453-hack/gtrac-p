import { GatewayRailCurrentTrip, GatewayRailCurrentTripsResponse } from '@/app/_globalRedux/services/types/gatewayRailCurrentTripsResponse';
import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { ColumnDef, HeaderContext, Row } from '@tanstack/react-table';
import { DownloadReportTs } from '../../common/CustomTableN';

// Use the provided GatewayRailCurrentTrip type
interface TableRow extends GatewayRailCurrentTrip {}

// Define the fields based on GatewayRailCurrentTrip properties
const fields = [
	{ key: 'vehicle_no', header: 'Vehicle No' },
	{ key: 'TripStartDate', header: 'Trip Start Date' },
	{ key: 'Driver_name', header: 'Driver Name' },
	{ key: 'site_reporting_time', header: 'Site Reporting Time' },
	{ key: 'gr_no', header: 'GR No' },
	{ key: 'billing_party_name', header: 'Billing Party Name' },
	{ key: 'booking_type', header: 'Booking Type' },
	{ key: 'document_no', header: 'Document No' },
	{ key: 'container_no', header: 'Container No' },
	{ key: 'route', header: 'Route' },
	{ key: 'header_tripstatus', header: 'Header Trip Status' },
	{ key: 'timeupdate', header: 'Time Update' },
	{ key: 'TIMESTAMP', header: 'Timestamp' },
	{ key: 'line2_id', header: 'Line2 ID' },
	{ key: 'Tripsheet Doc No_', header: 'Tripsheet Doc No' },
	{ key: 'Line No_', header: 'Line No' },
	{ key: 'Route', header: 'Route (Upper)' },
	{ key: 'FROM Location', header: 'From Location' },
	{ key: 'TO Location', header: 'To Location' },
	{ key: 'Active Leg', header: 'Active Leg' },
	{ key: 'Leg STATUS', header: 'Leg Status' },
	{ key: 'Site RELEASE DATE', header: 'Site Release Date' },
	{ key: 'Site RELEASE TIME', header: 'Site Release Time' },
	{ key: 'Site Reporting DATE', header: 'Site Reporting Date' },
	{ key: 'gps Site Reporting IN DATE TIME', header: 'GPS Site Reporting In Date Time' },
	{ key: 'gps Site Reporting OUT DATE TIME', header: 'GPS Site Reporting Out Date Time' },
	{ key: 'Site Reporting TIME', header: 'Site Reporting Time (Upper)' },
	{ key: 'Booking TYPE', header: 'Booking Type (Upper)' },
	{ key: 'Transit TIME', header: 'Transit Time' },
	{ key: 'Actual Transit TIME', header: 'Actual Transit Time' },
	{ key: 'Remarks', header: 'Remarks' },
	{ key: 'gtrac_site_release', header: 'Gtrac Site Release' },
	{ key: 'gtrac_site_reporting', header: 'Gtrac Site Reporting' },
	{ key: 'update_time', header: 'Update Time' },
	{ key: 'gps Site RELEASE IN DATE TIME', header: 'GPS Site Release In Date Time' },
	{ key: 'gps Site RELEASE OUT DATE TIME', header: 'GPS Site Release Out Date Time' },
	{ key: 'haltingAtsource', header: 'Halting At Source' },
	{ key: 'haltingAtDestination', header: 'Halting At Destination' },
	{ key: 'transit', header: 'Transit' },
];

// Function to get table columns
export const getTripsColumns3 = (): ColumnDef<TableRow>[] => {
	return fields.map((field) => ({
		accessorKey: field.key,
		header: field.header,
		footer: (props: HeaderContext<TableRow, unknown>) => props.column.id,
		filterFn: (row: Row<TableRow>, id: string, value: any) => operatorFilterFn(row, id, value),
	}));
};

// Function to download trip report
export const downloadTripReport3 = ({
	data,
	setDownloadReport,
}: {
	data: GatewayRailCurrentTripsResponse | undefined;
	setDownloadReport: React.Dispatch<React.SetStateAction<DownloadReportTs | undefined>>;
}) => {
	if (!data) return;

	const rows = data.list.map((item: GatewayRailCurrentTrip) =>
		fields.reduce((acc, field) => {
			acc[field.header] = item[field.key as keyof GatewayRailCurrentTrip];
			return acc;
		}, {} as { [key: string]: any })
	);

	const head = Object.keys(rows[0]);
	const body = rows.map((row) => Object.values(row));

	const columnsStyles: { [key: number]: { cellWidth: number } } = {};
	body[0].forEach((value: any, index: number) => {
		columnsStyles[index] = { cellWidth: value?.toString().length > 10 ? 50 : 20 };
	});

	setDownloadReport({
		title: 'Trip Report',
		excel: { title: 'Trip Report', rows, footer: [] },
		pdf: {
			head: [head],
			body,
			title: 'Trip Report',
			pageSize: 'a3',
			userOptions: { columnStyles: columnsStyles },
		},
	});
};
