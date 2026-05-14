'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useGetContinuousJourneyQuery, useLazyGetContinuousJourneyQuery } from '@/app/_globalRedux/services/trackingReport';
import { RootState } from '@/app/_globalRedux/store';

import { useSelector } from 'react-redux';
import CustomTableN, { DownloadReportTs } from '../../common/CustomTableN';

import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from 'antd';

import Header from './Header';
import moment from 'moment';
import { setHours, setMinutes } from 'date-fns';

interface TableRow {
	[key: string]: any;
}

interface ContinuousJourneyReportFormattedData extends ContinuousJourneyResponse {
	list: (ContinuousJourneyList & { duration: string })[];
}

export const View = () => {
	const { groupId, userId } = useSelector((state: RootState) => state.auth);

	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [formatedData, setFormatedData] = useState<ContinuousJourneyReportFormattedData['list']>([]);

	const [customDateRange, setCustomDateRange] = useState([setHours(setMinutes(new Date(), 0), 0), new Date()]);
	const [selectedVehicleOption, setSelectedVehicleOption] = useState<{ label: string; value: number } | undefined>(undefined);

	const [getContinuousJourney, { isLoading: isContinousJourneyLoading }] = useLazyGetContinuousJourneyQuery();

	const { data, isLoading } = useGetContinuousJourneyQuery(
		{
			token: groupId,
			userId: userId,
			startDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
			endDate: moment().format('YYYY-MM-DD'),
			vId: '',
		},
		{ skip: !groupId || !userId }
	);
	const [isLocalLoading, setIsLocalLoading] = useState(false);

	useEffect(() => {
		if (data && data.list && Array.isArray(data.list)) {
			setFormatedData(
				data.list.map((vehicle) => ({
					...vehicle,
					End_Location: vehicle.End_Location?.replaceAll('_', ' '),
					Start_Location: vehicle.Start_Location?.replaceAll('_', ' '),
					End_Time: moment(vehicle.End_Time).format('DD-MM-YYYY HH:mm:ss'),
					Start_Time: moment(vehicle.Start_Time).format('DD-MM-YYYY HH:mm:ss'),
					duration: `${moment(vehicle.End_Time).diff(moment(vehicle.Start_Time), 'minutes')} Minutes`,
				}))
			);
		}
	}, [data]);

	const columns = useMemo(() => {
		const cols: ColumnDef<TableRow>[] = [
			{
				accessorKey: 'vehicleNum',
				id: 'vehicle_num',
				header: 'Vehicle Number',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'Start_Time',
				id: 'start_time',
				header: 'Start Date Time',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'End_Time',
				id: 'end_time',
				header: 'End Date Time',

				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'Start_Location',
				id: 'start_location',
				header: 'Start Location',
				cell: ({ row }) => {
					return (
						<div className='cursor-pointer'>
							<Tooltip title={row.original.Start_Location} mouseEnterDelay={1}>
								{row.original.Start_Location.slice(0, 40)}
							</Tooltip>
						</div>
					);
				},
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'End_Location',
				id: 'end_location',
				header: 'End Location',
				cell: ({ row }) => {
					return (
						<div className='cursor-pointer'>
							<Tooltip title={row.original.End_Location} mouseEnterDelay={1}>
								{row.original.End_Location.slice(0, 40)}
							</Tooltip>
						</div>
					);
				},
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'duration',
				id: 'duration',
				header: 'Duration',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'Total_KM',
				id: 'total_km',
				header: 'Km Run in this duration',
				footer: (props) => props.column.id,
				cell: ({ row }) => (row.original.Total_KM ? `${row.original.Total_KM.toFixed(2)}` : '0'),
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
		];
		return cols;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	const onDownloadBtnClick = (vehicles: ContinuousJourneyReportFormattedData['list']) => {
		const rows = vehicles.map((vehicle, index: number) => {
			const obj = {
				['Vehicle Number']: vehicle.vehicleNum,
				['Start Date Time']: vehicle.Start_Time,
				['End Date Time']: vehicle.End_Time,
				['Start Location']: vehicle.Start_Location,
				['End Location']: vehicle.End_Location,
				['Duratrion']: vehicle.duration,
				['Km Run in this duration']: vehicle.Total_KM ? `${vehicle.Total_KM.toFixed(2)}` : '0',
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
			title: `Continuous Journey Report`,
			excel: { title: `Continuous Journey Report`, rows, footer: [] },
			pdf: { head: [head], body: body, title: `Continuous Journey Report`, pageSize: 'a3' },
		});
	};

	const onSubmit = async () => {
		setIsLocalLoading(true);
		setFormatedData([]);
		await getContinuousJourney({
			token: groupId,
			userId: userId,
			startDate: moment(customDateRange[0]).format('YYYY-MM-DD'),
			endDate: moment(customDateRange[1]).format('YYYY-MM-DD'),
			vId: selectedVehicleOption ? `${selectedVehicleOption.value}` : '',
		}).then(({ data }) => {
			if (data && data.list && Array.isArray(data.list)) {
				setFormatedData(
					data.list.map((vehicle) => ({
						...vehicle,
						End_Location: vehicle.End_Location?.replaceAll('_', ' '),
						Start_Location: vehicle.Start_Location?.replaceAll('_', ' '),
						End_Time: moment(vehicle.End_Time).format('DD-MM-YYYY HH:mm:ss'),
						Start_Time: moment(vehicle.Start_Time).format('DD-MM-YYYY HH:mm:ss'),
						duration: `${moment(vehicle.End_Time).diff(moment(vehicle.Start_Time), 'minutes')} Minutes`,
					}))
				);
			}
		});

		setTimeout(() => {
			setIsLocalLoading(false);
		}, 2000);
	};

	return (
		<div>
			<Header
				customDateRange={customDateRange}
				setCustomDateRange={setCustomDateRange}
				onSubmit={() => onSubmit()}
				selectedVehicleOption={selectedVehicleOption}
				setSelectedVehicleOption={setSelectedVehicleOption}
			/>
			<CustomTableN
				columns={columns}
				data={(formatedData && formatedData.length > 0 && formatedData) || []}
				loading={isLocalLoading || isContinousJourneyLoading || isLoading}
				height='max-h-[75vh]'
				onDownloadBtnClick={onDownloadBtnClick}
				downloadReport={downloadReport}
				setDownloadReport={setDownloadReport}
			/>
		</div>
	);
};
