'use client';
import React, { useEffect, useState } from 'react';
import { RootState } from '@/app/_globalRedux/store';
import { useSelector } from 'react-redux';
import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { ColumnDef } from '@tanstack/react-table';
import { Button, message, Modal, Tooltip } from 'antd';
import moment from 'moment';
import CustomTableN, { DownloadReportTs } from '../common/CustomTableN';
import {
	useAddElockAlertCommentMutation,
	useGetElockAlertsByDateQuery,
	useLazyGetElockAlertsByDateQuery,
} from '@/app/_globalRedux/services/gtrac_newtracking';
import { PlusOutlined } from '@ant-design/icons';

import AddRemarkModal from './AddRemarkModal';
import Header from './Header';
import { NoticeType } from 'antd/es/message/interface';

interface TableRow {
	[key: string]: any;
}

export const View = () => {
	const { groupId, userId, parentUser } = useSelector((state: RootState) => state.auth);

	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [formatedData, setFormatedData] = useState<ElockAlertByDate[]>([]);
	const [isAddRemarkModalOpen, setIsAddRemarkModalOpen] = useState(false);
	const [selectedRow, setSelectedRow] = useState<ElockAlertByDate | null>(null);
	const [customDateRange, setCustomDateRange] = useState([moment().subtract(1, 'days').toDate(), new Date()]);

	const { data, isLoading } = useGetElockAlertsByDateQuery({
		token: groupId,
		userId: userId,
		puserId: parentUser,
		startDate: moment().startOf('day').format('YYYY-MM-DD'),
		endDate: moment().format('YYYY-MM-DD'),
	});
	const [fetchElockAlerts, { isLoading: isGetAlertsByDateLoading }] = useLazyGetElockAlertsByDateQuery();

	const [
		addElockAlertComment,
		{ isLoading: isAddElockAlertCommentLoading, isSuccess: isAddElockAlertCommentSuccess, isError: isAddElockAlertCommentError },
	] = useAddElockAlertCommentMutation();

	const [messageApi, contextHolder] = message.useMessage();

	const createMessage = ({ type, content }: { type: NoticeType; content: string }) => {
		messageApi.open({
			type: type,
			content,
		});
	};

	useEffect(() => {
		if (data && Array.isArray(data)) {
			setFormatedData(data);
		}
	}, [data]);

	const columns: ColumnDef<TableRow>[] = [
		{
			header: 'Vehicle Number',
			accessorKey: 'vehicle_no',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			header: 'VRID',
			accessorKey: 'amazon_vrid',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			header: 'FMC Date',
			accessorKey: 'FMCDate',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			header: 'Elock Alert Type',
			accessorKey: 'title',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			header: 'Description',
			accessorKey: 'description',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			header: 'Log Time',
			accessorKey: 'log_time',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
		{
			header: 'Remarks By',
			accessorKey: 'remarkby',
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},

		{
			header: 'Remark',
			accessorKey: 'remark',
			cell: ({ row }) => (
				<div className='w-full flex items-center justify-center'>
					{row.original.remark || (
						<Tooltip title='search'>
							<Button
								shape='circle'
								icon={<PlusOutlined size={12} />}
								onClick={() => {
									setIsAddRemarkModalOpen(true);
									setSelectedRow(row.original as ElockAlertByDate);
								}}
							/>
						</Tooltip>
					)}
				</div>
			),
			footer: (props) => props.column.id,
			filterFn: (row, id, value) => operatorFilterFn(row, id, value),
		},
	];

	// eslint-disable-next-line react-hooks/exhaustive-deps

	const onDownloadBtnClick = (vehicles: ElockAlertByDate[]) => {
		const rows = vehicles.map((vehicle, index: number) => {
			const obj = {
				['Vehicle Number']: vehicle.vehicle_no,
				['VRID']: vehicle.amazon_vrid,
				['FMC Date']: vehicle.FMCDate,
				['Elock Alert Type']: vehicle.title,
				['Description']: vehicle.description,
				['Log Time']: vehicle.log_time,
				['Remarks By']: vehicle.remarkby,
				['Remark']: vehicle.remark,
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
			title: `Elock Alerts Report`,
			excel: { title: `Elock Alerts Report`, rows, footer: [] },
			pdf: { head: [head], body: body, title: `Elock Alerts Report`, pageSize: 'a3' },
		});
	};

	const onSubmit = () => {
		if (selectedRow && selectedRow.remark) {
			addElockAlertComment({
				token: groupId,
				userId: userId,
				puserId: parentUser,
				body: {
					id: Number(selectedRow?.row_id),
					remarks: selectedRow?.remark,
					title: selectedRow?.title,
					veh_id: Number(selectedRow?.vehicle_id),
				},
			}).then(() => {
				fetchElockAlerts({
					token: groupId,
					userId: userId,
					puserId: parentUser,
					startDate: moment(customDateRange[0]).format('YYYY-MM-DD'),
					endDate: moment(customDateRange[1]).format('YYYY-MM-DD'),
				}).then(({ data }) => {
					if (data && Array.isArray(data)) {
						setFormatedData(data);
					}
				});
			});
		}
	};

	useEffect(() => {
		if (isAddElockAlertCommentSuccess) {
			createMessage({
				type: 'success',
				content: 'Remark added successfully',
			});
			setIsAddRemarkModalOpen(false);
			setSelectedRow(null);
		} else if (isAddElockAlertCommentError) {
			createMessage({
				type: 'error',
				content: 'Something went wrong, please try again later',
			});
			setIsAddRemarkModalOpen(false);
			setSelectedRow(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAddElockAlertCommentSuccess, isAddElockAlertCommentError]);

	return (
		<>
			{contextHolder}
			<AddRemarkModal
				isModalOpen={isAddRemarkModalOpen}
				setIsModalOpen={setIsAddRemarkModalOpen}
				selectedRow={selectedRow}
				onSubmit={onSubmit}
				isLoading={isAddElockAlertCommentLoading}
				setSelectedRow={setSelectedRow}
			/>

			<Header
				isGetAlertsByDateLoading={isGetAlertsByDateLoading || isLoading}
				fetchElockAlerts={fetchElockAlerts}
				setFormatedData={setFormatedData}
				customDateRange={customDateRange}
				setCustomDateRange={setCustomDateRange}
			/>
			<CustomTableN
				columns={columns}
				data={(formatedData && formatedData.length > 0 && formatedData) || []}
				loading={isGetAlertsByDateLoading || isLoading}
				height='max-h-[75vh]'
				onDownloadBtnClick={onDownloadBtnClick}
				downloadReport={downloadReport}
				setDownloadReport={setDownloadReport}
				lazyLoad={true}
			/>
		</>
	);
};
