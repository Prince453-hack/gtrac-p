'use client';

import React from 'react';
import { useState } from 'react';
import CustomTableN, { DownloadReportTs } from '../common/CustomTableN';
import { ColumnDef } from '@tanstack/react-table';
import { VideoAlarmsRecord } from '@/app/_globalRedux/services/types/post/getVideoAlerts';
import { AlarmType } from '@/app/_globalRedux/services/types/post/videoAlerts';
import { getAlarmName } from '@/app/helpers/getVideoAlertName';
import { Button } from 'antd';

export const AdasAlertsReportTable = ({
	adjustedAlertsAsList,
	loading,
	columns,
	selectedAlert,
}: {
	adjustedAlertsAsList: VideoAlarmsRecord[];
	loading: boolean;
	columns: ColumnDef<VideoAlarmsRecord>[];
	selectedAlert: string;
}) => {
	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();

	const onDownloadBtnClick = (alerts: VideoAlarmsRecord[]) => {
		const rows = alerts.map((vehicle: VideoAlarmsRecord) => {
			const obj = {
				['Vehicle No']: vehicle.deviceName,
				['Alert Type']: getAlarmName(vehicle.alarmType as AlarmType),
				['Latitude']: vehicle.lat,
				['Longitude']: vehicle.lon,
				['Timestamp']: vehicle.alarmTs,
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
	};

	return (
		<>
			<CustomTableN
				columns={columns}
				data={adjustedAlertsAsList}
				loading={loading}
				height={'h-[calc(100vh-245px)]'}
				onDownloadBtnClick={onDownloadBtnClick}
				downloadReport={downloadReport}
				setDownloadReport={setDownloadReport}
			/>
		</>
	);
};
