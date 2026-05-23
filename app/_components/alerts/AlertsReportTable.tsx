'use client';

import { AlertByDayEvents } from '@/app/_globalRedux/services/types/alerts';
import { useState } from 'react';
import CustomTableN, { DownloadReportTs } from '../common/CustomTableN';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { isKmtAccount } from '@/app/helpers/isKmtAccount';
import { isValidDTCAlert } from './View';

export const AlertsReportTable = ({
	adjustedAlertsAsList,
	loading,
	columns,
	selectedAlert,
}: {
	adjustedAlertsAsList: AlertByDayEvents[];
	loading: boolean;
	columns: ColumnDef<AlertByDayEvents>[];
	selectedAlert: string;
}) => {
	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const { userId, parentUser } = useSelector((state: RootState) => state.auth);
	const onDownloadBtnClick = (alerts: AlertByDayEvents[]) => {
		const validDTCAlert = isValidDTCAlert(selectedAlert);

		if (validDTCAlert) {
			const rows = alerts.map((vehicle: AlertByDayEvents, index: number) => {
				const obj = {
					['Vehicle No']: vehicle.vehicle_no,
					['Alert Type']: vehicle.exception_type,
					['Description']: vehicle.startlocation,
					['Code']: vehicle.route_name,
					['Severity']: vehicle.InvoiceDate,
				};

				const result: { [key: string]: any } = {};
				columns.forEach((column) => {
					if (column.header) {
						result[column.header.toString()] = obj[column.header.toString() as keyof typeof obj];
					}
				});
				return result;
			});

			const head = Object.keys(rows[0]);

			const body = rows.map((row) => Object.values(row));

			setDownloadReport({
				title: `${selectedAlert} Alert Report`,
				excel: { title: `${selectedAlert}`, rows, footer: [] },
				pdf: { head: [head], body: body, title: `${selectedAlert} Alert Report`, pageSize: 'a3' },
			});
		} else {
			const rows = alerts.map((vehicle: AlertByDayEvents, index: number) => {
				const obj = {
					['Alert Type']: vehicle.exception_type,
					['Vehicle No']: vehicle.vehicle_no,
					['Start Time']: vehicle.starttime ? moment(new Date(vehicle.starttime)).format('DD-MM-yyyy HH:mm:ss') : '',
					['Start Location']: vehicle.startlocation ? vehicle.startlocation?.replaceAll('_', ' ') : '',
					['End Time']:
						vehicle.endtime && vehicle.journey_statusfinal !== 'Ongoing'
							? moment(new Date(vehicle.endtime)).format('DD-MM-yyyy HH:mm:ss')
							: vehicle.journey_statusfinal === 'Ongoing'
							? 'Ongoing'
							: '',
					['End Location']: vehicle.endlocation ? vehicle.endlocation?.replaceAll('_', ' ') : '',
					Location: `${vehicle.startlocation ? vehicle.startlocation?.replaceAll('_', ' ') : ''}\n${
						vehicle.endlocation ? vehicle.endlocation?.replaceAll('_', ' ') : ''
					}`,
					Distance: vehicle ? Number(vehicle.KM).toFixed(2) : '',
					Duration: vehicle ? vehicle.duration : '',
					Speed: vehicle ? vehicle.speed : '',
					['Running Hrs']: vehicle ? vehicle.duration : '',
					['Total Stoppages']: vehicle ? vehicle.Halting : '',
					['Alert Receiving Time']:
						vehicle && vehicle.journey_statusfinal !== 'Ongoing' ? vehicle.speed : vehicle.journey_statusfinal === 'Ongoing' ? '' : '',
					['Halting Hour']: vehicle ? vehicle.hour : '',
					['Invoice No']: vehicle ? vehicle.InvoiceNo : '',
					['Invoice Date']:
						vehicle && vehicle.InvoiceDate && vehicle.InvoiceDate?.trim() ? moment(new Date(vehicle.InvoiceDate?.trim())).format('DD-MM-yyyy') : '',
					['Remarks']: vehicle && vehicle.remark ? vehicle.remark : '',
					['Alert Status']: vehicle && vehicle.remark ? 'Open' : 'Closed',
				};

				const result: { [key: string]: any } = {};
				columns.forEach((column) => {
					if (column.header) {
						result[column.header.toString()] = obj[column.header.toString() as keyof typeof obj];
					}
				});
				return result;
			});

			const head = Object.keys(rows[0]);

			const body = rows.map((row) => Object.values(row));

			setDownloadReport({
				title: `${selectedAlert} Alert Report`,
				excel: { title: `${selectedAlert}`, rows, footer: [] },
				pdf: { head: [head], body: body, title: `${selectedAlert} Alert Report`, pageSize: 'a3' },
			});
		}
	};

	return (
		<CustomTableN
			columns={columns}
			data={adjustedAlertsAsList}
			loading={loading}
			height={`${isKmtAccount(Number(userId), Number(parentUser)) ? 'h-[calc(100vh-350px)]' : 'h-[calc(100vh-200px)]'}`}
			onDownloadBtnClick={onDownloadBtnClick}
			downloadReport={downloadReport}
			setDownloadReport={setDownloadReport}
		/>
	);
};
