import { DownloadReportTs } from '../../common/CustomTableN';
import { MergedGatewayRailTrip } from '@/app/helpers/mergeGatewayRailTrips';
import moment from 'moment';

// Function to get download fields based on user
const getDownloadFields = (userId?: string) => {
	const baseFields = [
		{ key: 'vehicle_no', header: 'Vehicle No' },
		{ key: 'Driver_name', header: 'Driver Name' },
		{ key: 'gr_no', header: 'GR No' },
		{ key: 'header_tripstatus', header: 'Header Trip Status' },
		{ key: 'billing_party_name', header: 'Billing Party Name' },
		{ key: 'Importer NAME', header: 'Importer Name' },
		{ key: 'container_no', header: 'Container No' },
		{ key: 'size', header: 'size' },
		{ key: 'segment', header: 'Segment' },
		{ key: 'Container Combination', header: 'Container Combination' },
		{ key: 'route', header: 'Route' },
		{ key: 'shipping_line_name', header: 'Shipping Line' },
		{ key: 'document_no', header: 'Document No' },
		{ key: 'booking_type', header: 'Booking Type' },
		{ key: 'TripStartDate', header: 'Trip Start Date' },
		{ key: 'timeupdate', header: 'Time Update' },

		{ key: 'legs[0].location', header: 'Start Location' },
		{ key: 'legs[0].inboundTime', header: 'Start Time' },

		{ key: 'legs[1].location', header: 'Via-1 Location' },
		{ key: 'legs[1].inboundTime', header: 'Via-1 In Time' },
		{ key: 'legs[1].outboundTime', header: 'Via-1 Out Time' },

		{ key: 'legs[2].location', header: 'Via-2 Location' },
		{ key: 'legs[2].inboundTime', header: 'Via-2 In Time' },
		{ key: 'legs[2].outboundTime', header: 'Via-2 Out Time' },

		{ key: 'legs[3].location', header: 'Via-3 Location' },
		{ key: 'legs[3].inboundTime', header: 'Via-3 In Time' },
		{ key: 'legs[3].outboundTime', header: 'Via-3 Out Time' },
	];

	// Add parking fields only for user 5275
	if (userId === '5275') {
		baseFields.push(
			{ key: 'gps Site parking IN DATE TIME', header: 'Parking In' },
			{ key: 'gps Site parking OUT DATE TIME', header: 'Parking Out' }
		);
	}

	return baseFields;
};

// Date-time fields that need formatting
const dateTimeFields = ['site_reporting_time', 'TripStartDate', 'timeupdate', 'gps Site parking IN DATE TIME', 'gps Site parking OUT DATE TIME'];

// Function to format date safely
const formatDate = (dateValue: any): string => {
	if (!dateValue) return '-';
	if (typeof dateValue === 'string' || typeof dateValue === 'number') {
		return moment(dateValue).format('YYYY-MM-DD HH:mm');
	}
	return '-';
};

// Function to download trip report
export const downloadTripReport3 = ({
	data,
	setDownloadReport,
	userId,
}: {
	data: MergedGatewayRailTrip[] | undefined;
	setDownloadReport: React.Dispatch<React.SetStateAction<DownloadReportTs | undefined>>;
	userId?: string;
}) => {
	if (!data) return;

	const downloadFields = getDownloadFields(userId);

	const rows = data.map((item: MergedGatewayRailTrip) => {
		const row: { [key: string]: any } = {};

		downloadFields.forEach((field) => {
			if (field.key === 'segment') {
				row[field.header] =
					item.segment == 1 ? 'Export' : item.segment == 0 ? 'Import' : item.segment == 3 ? 'Empty' : item.segment == 2 ? 'Domestic' : 'Unknown';
			} else if (field.key === 'Container Combination') {
				row[field.header] =
					item['Container Combination'] == 1
						? '1x20'
						: item['Container Combination'] == 3
						? '1x40'
						: item['Container Combination'] == 2
						? '2x20'
						: 'Unknown';
			} else if (field.key.includes('legs[')) {
				const [legsPart, property] = field.key.split('.');
				const legIndex = parseInt(legsPart.match(/\d+/)?.[0] || '0', 10);
				const legs = item.legs;

				if (legs && legs[legIndex]) {
					if (property === 'inboundTime' || property === 'outboundTime') {
						const dateValue = legs[legIndex][property as keyof (typeof legs)[0]];
						row[field.header] = formatDate(dateValue);
					} else {
						row[field.header] = legs[legIndex][property as keyof (typeof legs)[0]] || '-';
					}
				} else {
					row[field.header] = '-';
				}
			} else {
				if (dateTimeFields.includes(field.key)) {
					const dateValue = item[field.key as keyof MergedGatewayRailTrip];
					row[field.header] = formatDate(dateValue);
				} else {
					row[field.header] = item[field.key as keyof MergedGatewayRailTrip] || '-';
				}
			}
		});

		return row;
	});

	const head = Object.keys(rows[0] || {});
	const body = rows.map((row) => Object.values(row));

	const columnsStyles: { [key: number]: { cellWidth: number } } = {};
	body[0]?.forEach((value: any, index: number) => {
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
