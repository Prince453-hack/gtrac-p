'use client';

import { useGetTempWithDateQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { RootState } from '@/app/_globalRedux/store';
import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { ColumnDef } from '@tanstack/react-table';
import { useSelector } from 'react-redux';
import CustomTableN, { DownloadReportTs } from '../../common/CustomTableN';
import moment from 'moment';
import { useEffect, useState } from 'react';

export const TemperatureReport = ({ selectedData }: { selectedData: any }) => {
	const { userId } = useSelector((state: RootState) => state.auth);
	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [formatedTemperatureData, setFormatedTemperatureData] = useState<TemperatureReportRawData[]>([]);

	const { data, isLoading: isTemperatureReportLoading } = useGetTempWithDateQuery({
		vId: selectedData.sys_service_id,
		startDateTime: moment(selectedData.departure_date).format('YYYY-MM-DD HH:mm'),
		endDateTime: moment(selectedData.trip_complted_datebysystem).format('YYYY-MM-DD HH:mm'),
		userId: Number(userId),
		interval: 5,
	});

	useEffect(() => {
		if (data && data.rawdata && Array.isArray(data.rawdata) && data.rawdata.length > 0) {
			let tempRawData = [...data.rawdata];

			for (let i = 0; i < tempRawData.length; i++) {
				const obj = { ...tempRawData[i] };

				const humidity = obj.alcoholLbl;
				const temperature = obj.tel_temperature;

				if (!humidity) {
					if (i > 0) {
						obj.alcoholLbl = tempRawData[i - 1].alcoholLbl;
					} else if (i < tempRawData.length - 1) {
						obj.alcoholLbl = tempRawData[i + 1].alcoholLbl;
					}
				}

				if (!temperature) {
					if (i > 0) {
						obj.tel_temperature = tempRawData[i - 1].tel_temperature;
					} else if (i < tempRawData.length - 1) {
						obj.tel_temperature = tempRawData[i + 1].tel_temperature;
					}
				}

				tempRawData[i] = obj;
			}

			setFormatedTemperatureData(tempRawData);
		}
	}, [data]);

	const columns: ColumnDef<TemperatureReportRawData>[] = [
		{
			accessorKey: 'gps_time',
			id: 'gps_time',
			cell: (info) => info.getValue(),
			header: 'Date',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			accessorKey: 'tel_temperature',
			id: 'tel_temperature',
			cell: (info) => info.getValue(),
			header: 'Temperature',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			accessorKey: 'alcoholLbl',
			id: 'tel_humidity',
			cell: (info) => info.getValue(),
			header: 'Humidity',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			accessorKey: 'main_powervoltage',
			id: 'main_powervoltage',
			cell: ({ row }) => row.original.main_powervoltage,
			header: 'Power Voltage',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			accessorKey: 'jny_distance',
			id: 'jny_distance',
			cell: ({ row }) => row.original.jny_distance?.toFixed(4),
			header: 'Distance',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			id: 'lat-lng',
			cell: ({ row }) => row.original.gps_latitude?.toFixed(6) + ' | ' + row.original.gps_longitude?.toFixed(6),
			header: 'Lat-Lng',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
	];

	const onDownloadBtnClick = (alerts: TemperatureReportRawData[]) => {
		const rows = alerts.map((vehicle: TemperatureReportRawData, index: number) => {
			const obj = {
				['Date']: moment(new Date(vehicle.gps_time)).format('DD-MM-YYYY HH:mm:ss'),
				['Temperature']: vehicle.tel_temperature,
				['Humidity']: vehicle.alcoholLbl,
				['Power Voltage']: vehicle.main_powervoltage,
				['Distance']: vehicle.jny_distance?.toFixed(4),
				['Lat-Lng']: `${vehicle.gps_latitude?.toFixed(6)} | ${vehicle.gps_longitude?.toFixed(6)}`,
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
			title: `Temperature Report`,
			excel: { title: `Temperature Report`, rows, footer: [] },
			pdf: { head: [head], body: body, title: `Temperature Report`, pageSize: 'a3' },
		});
	};

	return (
		<CustomTableN
			columns={columns}
			data={formatedTemperatureData && formatedTemperatureData.length > 0 ? formatedTemperatureData : []}
			loading={isTemperatureReportLoading}
			height={'h-[calc(100vh-300px)]'}
			onDownloadBtnClick={onDownloadBtnClick}
			downloadReport={downloadReport}
			setDownloadReport={setDownloadReport}
		/>
	);
};
