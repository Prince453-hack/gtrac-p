'use client';
import { FileAddOutlined, EyeOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Row, Table, Tag, Space, Tooltip, message } from 'antd';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetReminderNotificationsQuery, useMarkReminderAsReadMutation, ReminderNotification } from '@/app/_globalRedux/services/alertManagement';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { ViewDetailsModal } from '../components/view-details-modal';
import { DownloadModal } from '../components/download-modal';
import { formatDocumentReminderForExport } from '../utils/export-utils';

export function DocumentReminders() {
	const router = useRouter();
	const { userId } = useSelector((state: RootState) => state.auth);

	// Modal states
	const [viewDetailsModal, setViewDetailsModal] = useState<{
		open: boolean;
		data: ReminderNotification | null;
	}>({ open: false, data: null });
	const [downloadModal, setDownloadModal] = useState(false);

	// Query for loading document reminders
	const { data: reminderNotifications = [], isLoading } = useGetReminderNotificationsQuery(
		{
			userId: userId,
			alertType: 'document',
			startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
			endDate: dayjs().format('YYYY-MM-DD'),
		},
		{
			skip: !userId,
		}
	);

	const [markAsRead] = useMarkReminderAsReadMutation();

	const handleMarkAsRead = async (id: number) => {
		try {
			await markAsRead(id).unwrap();
			message.success('Reminder marked as read');
		} catch (error) {
			message.error('Failed to mark reminder as read');
		}
	};

	const handleViewDetails = (record: ReminderNotification) => {
		setViewDetailsModal({ open: true, data: record });
	};

	const handleDownload = () => {
		setDownloadModal(true);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'orange';
			case 'alerted':
				return 'red';
			case 'completed':
				return 'green';
			case 'snoozed':
				return 'blue';
			case 'cancelled':
				return 'gray';
			default:
				return 'default';
		}
	};

	const columns = [
		{
			title: 'Document Type',
			key: 'documentType',
			width: 180,
			render: (record: ReminderNotification) => <span className='font-medium'>{record.document?.document_type || 'N/A'}</span>,
		},
		{
			title: 'Vehicle Reg',
			key: 'vehicleReg',
			width: 120,
			render: (record: ReminderNotification) => <span className='font-medium'>{record.document?.vehicle_reg || 'N/A'}</span>,
		},
		{
			title: 'Vehicle ID',
			key: 'vehicleId',
			width: 120,
			render: (record: ReminderNotification) => record.document?.vehicle_id || 'N/A',
		},
		{
			title: 'Doc. Number',
			key: 'documentNumber',
			width: 150,
			render: (record: ReminderNotification) => record.document?.document_number || '-',
		},
		{
			title: 'Message',
			dataIndex: 'message',
			key: 'message',
			width: 250,
			render: (text: string) => (
				<div className='truncate' title={text}>
					{text}
				</div>
			),
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
		},
		{
			title: 'Sent At',
			dataIndex: 'sent_at',
			key: 'sentAt',
			width: 150,
			render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
		},
		{
			title: 'Read At',
			dataIndex: 'read_at',
			key: 'readAt',
			width: 150,
			render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'),
		},
		{
			title: 'Notifications',
			key: 'notifications',
			width: 120,
			render: (record: ReminderNotification) => (
				<Space size='small'>
					{record.sent_via_email ? <Tag color='green'>Email</Tag> : null}
					{record.sent_via_sms ? <Tag color='orange'>SMS</Tag> : null}
					{record.sent_via_popup ? <Tag color='purple'>Popup</Tag> : null}
				</Space>
			),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 120,
			render: (record: ReminderNotification) => (
				<Space size='small'>
					<Tooltip title='View Details'>
						<Button type='text' icon={<EyeOutlined />} size='middle' onClick={() => handleViewDetails(record)} />
					</Tooltip>
					{!record.read_at && (
						<Tooltip title='Mark as Read'>
							<Button type='text' icon={<CheckOutlined />} size='middle' onClick={() => handleMarkAsRead(record.id)} />
						</Tooltip>
					)}
				</Space>
			),
		},
	];

	const totalWidth = columns.reduce((sum, column) => sum + (Number(column.width) || 100), 0);
	const windowHeight = window.innerHeight;

	const handleManageDocumentReminders = () => {
		router.push('/dashboard/reminders/manage-documents');
	};

	return (
		<div className='bg-gray-100 h-[calc(100vh-150px)] border-t border-[#c5c8cb]'>
			<div className='w-full flex justify-between items-center px-4 h-20'>
				<div className='w-full flex items-center gap-8'>
					<h1 className='font-proxima font-bold text-2xl leading-relaxed'>Document Reminders</h1>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Manage</p>
					<Button type='primary' size='middle' onClick={handleManageDocumentReminders} icon={<FileAddOutlined />} iconPosition='start'>
						Manage Document Reminders
					</Button>
				</div>
			</div>
			<div className={`h-[calc(100vh - 150px)] px-4`}>
				<ConfigProvider
					theme={{
						token: {
							borderRadius: 0,
							borderRadiusLG: 0,
							borderRadiusSM: 0,
						},
						components: {
							Table: {
								headerBg: '#F6F8F6',
								borderColor: '#dddddd',
								borderRadius: 0,
								rowHoverBg: '#E9EFEB',
							},
							Pagination: {
								itemBg: '#E9EFEB',
							},
						},
					}}
				>
					<Table
						columns={columns}
						dataSource={reminderNotifications}
						rowKey='id'
						rootClassName='rounded-none'
						rowClassName='bg-[#F6F8F6]'
						loading={isLoading}
						virtual={true}
						rowHoverable={true}
						bordered={true}
						pagination={{
							pageSize: 50,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
						}}
						scroll={{ y: windowHeight - 360, x: totalWidth }}
						footer={() => (
							<Row justify='space-between'>
								<div className='flex gap-4'>
									<Button
										icon={<DownloadOutlined />}
										onClick={handleDownload}
										disabled={!reminderNotifications || reminderNotifications.length === 0}
									>
										Download Details Report
									</Button>
								</div>
								{reminderNotifications && reminderNotifications.length > 0 ? (
									<span className='font-bold text-gray-700'>Total Records: {reminderNotifications.length}</span>
								) : null}
							</Row>
						)}
					/>
				</ConfigProvider>
			</div>

			{/* View Details Modal */}
			<ViewDetailsModal
				open={viewDetailsModal.open}
				onClose={() => setViewDetailsModal({ open: false, data: null })}
				data={viewDetailsModal.data}
				type='document-reminder'
				title='Document Reminder Details'
			/>

			{/* Download Modal */}
			<DownloadModal
				open={downloadModal}
				onClose={() => setDownloadModal(false)}
				data={reminderNotifications}
				filename='document-reminders'
				formatData={formatDocumentReminderForExport}
				title='Download Document Reminders Report'
			/>
		</div>
	);
}
