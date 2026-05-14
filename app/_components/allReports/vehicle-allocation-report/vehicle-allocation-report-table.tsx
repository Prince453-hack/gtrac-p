'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useGetAllMrkMappingQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { RootState } from '@/app/_globalRedux/store';

import { useSelector } from 'react-redux';
import CustomTableN, { DownloadReportTs } from '../../common/CustomTableN';
import moment from 'moment';
import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from 'antd';
import { HeatMapOutlined } from '@ant-design/icons';
import { VehicleAllocationReportModal } from './vehicle-allocation-report-modal';

interface TableRow {
	[key: string]: any;
}

export interface EditedData {
	start_date: string;
	end_date: string;
	id: number;
	service_id: number;
	group_id: number;
	old_veh_number: string;
	new_veh_number: string;
	reason: string;
	date: string;
	ismapped: number;
	imei: string;
	updated_by: string;
	dateFormatted: string;
}

export const VehicleAllocationReportTable = () => {
	const { groupId } = useSelector((state: RootState) => state.auth);
	const [editedData, setEditedData] = useState<EditedData[]>([]);

	const { data, isLoading, isError } = useGetAllMrkMappingQuery(
		{
			token: groupId,
		},
		{ skip: !groupId }
	);

	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [selectectedData, setSelectedData] = useState<any>(null);

	const columns = useMemo(() => {
		const cols: ColumnDef<TableRow>[] = [
			{
				accessorKey: 'imei',
				id: 'imei',
				cell: ({ row }) => row.original.imei,
				header: 'IMEI',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},

			{
				accessorKey: 'start_date',
				id: 'start_date',
				cell: ({ row }) => (row.original.start_date ? moment(row.original.start_date).format('DD-MM-YYYY HH:mm') : ''),
				header: 'Start Date',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},

			{
				accessorKey: 'old_veh_number',
				id: 'old_veh_number',
				cell: ({ row }) => (
					<Tooltip title={row.original.old_veh_number} mouseEnterDelay={1}>
						{row.original.old_veh_number.length > 20 ? row.original.old_veh_number.slice(0, 20) + '...' : row.original.old_veh_number}
					</Tooltip>
				),
				header: 'Old Vehicle No',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},

			{
				accessorKey: 'end_date',
				id: 'end_date',
				cell: ({ row }) => (row.original.end_date ? moment(row.original.end_date).format('DD-MM-YYYY HH:mm') : ''),
				header: 'End Date',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},

			{
				accessorKey: 'new_veh_number',
				id: 'new_veh_number',
				cell: ({ row }) => (
					<Tooltip title={row.original.new_veh_number} mouseEnterDelay={1}>
						{row.original.new_veh_number.length > 20 ? row.original.new_veh_number.slice(0, 20) + '...' : row.original.new_veh_number}
					</Tooltip>
				),
				header: 'New Vehicle No',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},

			{
				accessorKey: 'reason',
				id: 'reason',
				cell: ({ row }) => row.original.reason,
				header: 'Reason',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},

			{
				accessorKey: 'updated_by',
				id: 'updated_by',
				cell: ({ row }) => row.original.updated_by,
				header: 'Updated By',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				id: 'path',

				cell: ({ row }) => {
					return (
						<>
							{/*  the difference between start_date and end_date should be more than 5 minutes */}
							<div
								className='w-full flex items-center justify-center cursor-pointer'
								onClick={() => {
									setSelectedData(row.original);
								}}
							>
								{new Date(row.original.end_date).getTime() - new Date(row.original.start_date).getTime() > 300000 ? (
									<Tooltip title='show path' mouseEnterDelay={1}>
										<HeatMapOutlined />
									</Tooltip>
								) : (
									'NA'
								)}
							</div>
						</>
					);
				},
				header: 'Path',
				footer: (props) => props.column.id,
			},
		];
		return cols;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	const onDownloadBtnClick = (vehicles: EditedData[]) => {
		const rows = vehicles.map((vehicle: EditedData, index: number) => {
			const obj = {
				['IMEI']: vehicle.imei,
				['Start Date']: moment(new Date(vehicle.start_date)).format('DD-MM-YYYY'),
				['Old Vehicle No']: vehicle.old_veh_number,
				['End Date']: moment(new Date(vehicle.end_date)).format('DD-MM-YYYY'),
				['New Vehicle No']: vehicle.new_veh_number,
				['Reason']: vehicle.reason,
				['Updated By']: vehicle.updated_by,
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
			title: `Vehicle Allocation Report`,
			excel: { title: `Vehicle Allocation Report`, rows, footer: [] },
			pdf: { head: [head], body: body, title: `Vehicle Allocation Report`, pageSize: 'a3' },
		});
	};

	useEffect(() => {
		if (data && data.list && data.list.length > 0) {
			let temp = [...data.list].sort((a, b) => {
				return new Date(b.dateFormatted).getTime() - new Date(a.dateFormatted).getTime();
			});

			// groupd by imei

			let newTemp: { imei: string; list: EditedData[] }[] = [];

			temp.forEach((item) => {
				const index = newTemp.findIndex((i) => i.imei === item.imei);
				const data = {
					start_date: item.dateFormatted,
					end_date: '',
					id: item.id,
					service_id: item.service_id,
					group_id: item.group_id,
					old_veh_number: item.old_veh_number,
					new_veh_number: item.new_veh_number,
					reason: item.reason,
					date: item.date,
					ismapped: item.ismapped,
					imei: item.imei,
					updated_by: item.updated_by,
					dateFormatted: item.dateFormatted,
				};

				if (index > -1) {
					newTemp[index].list.push(data);
				} else {
					newTemp.push({ imei: item.imei, list: [data] });
				}
			});

			const newTemp2 = [];
			let vehicle_no_1 = '';
			let vehicle_no_2 = '';

			// now create new array to store a flat list where the old vehicle number
			for (let i = 0; i < newTemp.length; i++) {
				for (let j = newTemp[i].list.length - 1; j > 0; j -= 2) {
					vehicle_no_1 = newTemp[i].list[j].new_veh_number + '_' + temp[i].imei;
					vehicle_no_2 = newTemp[i].list[j - 1].old_veh_number;

					if (vehicle_no_1 === vehicle_no_2) {
						const tempObj = {
							...newTemp[i].list[j - 1],
							start_date: newTemp[i].list[j].dateFormatted,
							end_date: newTemp[i].list[j - 1].dateFormatted,
						};

						newTemp2.unshift(tempObj);
					} else {
						newTemp2.unshift({
							...newTemp[i].list[j - 1],
							start_date: newTemp[i].list[j].dateFormatted,
							end_date: newTemp[i].list[j - 1].dateFormatted,
						});
					}
				}
				if (newTemp[i].list.length % 2 !== 0) {
					newTemp2.unshift({
						...newTemp[i].list[0],
						start_date: newTemp[i].list[1]?.dateFormatted,
						end_date: newTemp[i].list[0]?.dateFormatted,
					});
				}
			}

			setEditedData(newTemp2);
		}
	}, [data]);

	return (
		<>
			<VehicleAllocationReportModal selectedData={selectectedData} setSelectedData={setSelectedData} />
			<CustomTableN
				columns={columns}
				data={(editedData.length > 0 && editedData) || []}
				loading={isLoading}
				height='max-h-[75vh]'
				onDownloadBtnClick={onDownloadBtnClick}
				downloadReport={downloadReport}
				setDownloadReport={setDownloadReport}
				// width='none'
			/>
		</>
	);
};
