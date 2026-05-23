'use client';
import React, { useState } from 'react';
import { Button, ConfigProvider, Input, Row, Table, Modal, Tag, Space, Tooltip, message, DatePicker } from 'antd';
import { FileAddOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import {
	useGetVehicleServicesQuery,
	useLazyGetVehicleServicesQuery,
	useDeleteVehicleServiceMutation,
	VehicleService,
} from '@/app/_globalRedux/services/alertManagement';
import { CreateServiceForm } from '../create-service';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { ViewDetailsModal } from '../components/view-details-modal';
import { DownloadModal } from '../components/download-modal';
import { formatVehicleServiceForExport } from '../utils/export-utils';

export function ManageServiceReminders() {
	const router = useRouter();
	const { userId } = useSelector((state: RootState) => state.auth);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<VehicleService | undefined>(undefined);

	const [viewDetailsModal, setViewDetailsModal] = useState<{ open: boolean; data: VehicleService | null }>({ open: false, data: null });
	const [downloadModal, setDownloadModal] = useState(false);

	// State for search filters (UI)
	const [searchFilters, setSearchFilters] = useState({
		status: '',
		serviceType: '',
		vehicleId: '',
		alertTriggerType: '',
		nextDueDateFrom: '',
		nextDueDateTo: '',
		vehicleReg: '',
	});

	// State to track if initial load is done
	const [hasSearched, setHasSearched] = useState(false);

	// Initial query for loading data on mount
	const { data: initialVehicleServices = [], isLoading: isInitialLoading } = useGetVehicleServicesQuery(
		{
			userId: userId,
		},
		{
			skip: !userId || hasSearched,
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		}
	);

	const [deleteVehicleService] = useDeleteVehicleServiceMutation();
	const [triggerFetchVehicleServices, { data: searchResults, isLoading: isSearchLoading }] = useLazyGetVehicleServicesQuery();

	// Use search results if available, otherwise use initial data
	const vehicleServices = hasSearched ? searchResults || [] : initialVehicleServices;
	const isLoading = isInitialLoading || isSearchLoading;

	const handleDelete = async (id: number) => {
		try {
			await deleteVehicleService(id).unwrap();
			message.success('Service reminder deleted successfully');
		} catch (error) {
			message.error('Failed to delete service reminder');
		}
	};

	const handleViewDetails = (record: VehicleService) => {
		setViewDetailsModal({ open: true, data: record });
	};

	const handleEdit = (record: VehicleService) => {
		setEditingRecord(record);
		setIsCreateModalOpen(true);
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
			title: 'Service Type',
			dataIndex: 'service_type',
			key: 'serviceType',
			width: 150,
			render: (text: string) => <span className='font-medium'>{text}</span>,
		},
		{ title: 'Vehicle Reg', dataIndex: 'vehicle_reg', key: 'vehicleReg', width: 120 },
		{
			title: 'Last Service',
			dataIndex: 'last_service_date',
			key: 'lastServiceDate',
			width: 120,
			render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
		},
		{
			title: 'Next Due Date',
			dataIndex: 'next_due_date',
			key: 'nextDueDate',
			width: 120,
			render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
		},
		{
			title: 'Next Due Mileage',
			dataIndex: 'next_due_mileage',
			key: 'nextDueMileage',
			width: 130,
			render: (mileage: number) => (mileage ? `${mileage.toLocaleString()} km` : '-'),
		},
		{
			title: 'Status',
			dataIndex: 'reminder_status',
			key: 'reminderStatus',
			width: 100,
			render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
		},
		{
			title: 'Alert Type',
			dataIndex: 'alert_trigger_type',
			key: 'alertTriggerType',
			width: 120,
			render: (type: string) => <Tag color='blue'>{type.replace('_', ' ').toUpperCase()}</Tag>,
		},
		{
			title: 'Notifications',
			key: 'notifications',
			width: 120,
			render: (record: VehicleService) => (
				<Space size='small'>
					{record.email_required ? <Tag color='green'>Email</Tag> : null}
					{record.sms_required ? <Tag color='orange'>SMS</Tag> : null}
					{record.popup_required ? <Tag color='purple'>Popup</Tag> : null}
				</Space>
			),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 150,
			render: (record: VehicleService) => (
				<Space size='small'>
					<Tooltip title='View Details'>
						<Button type='text' icon={<EyeOutlined />} size='middle' onClick={() => handleViewDetails(record)} />
					</Tooltip>
					<Tooltip title='Edit'>
						<Button type='text' icon={<EditOutlined />} size='middle' onClick={() => handleEdit(record)} />
					</Tooltip>
					<Tooltip title='Delete'>
						<Button
							type='text'
							danger
							disabled
							icon={<DeleteOutlined />}
							size='middle'
							onClick={() => {
								Modal.confirm({
									title: 'Delete Service Reminder',
									content: 'Are you sure you want to delete this service reminder?',
									onOk: () => handleDelete(record.id),
									okText: 'Delete',
									okButtonProps: { danger: true },
									cancelText: 'Cancel',
									cancelButtonProps: { type: 'default' },
								});
							}}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	const handleSearch = () => {
		triggerFetchVehicleServices({
			userId: userId,
			status: searchFilters.status || undefined,
			serviceType: searchFilters.serviceType || undefined,
			vehicleId: searchFilters.vehicleId || undefined,
			vehicleReg: searchFilters.vehicleReg || undefined,
			alertTriggerType: searchFilters.alertTriggerType || undefined,
			nextDueDateFrom: searchFilters.nextDueDateFrom || undefined,
			nextDueDateTo: searchFilters.nextDueDateTo || undefined,
		});
		setHasSearched(true);
	};

	const handleCreateSuccess = () => {
		setIsCreateModalOpen(false);
		setEditingRecord(undefined);
		// Trigger search with current filters to refresh data
		handleSearch();
		message.success(editingRecord ? 'Service reminder updated successfully!' : 'Service reminder created successfully!');
	};

	const handleBack = () => {
		router.push('/dashboard/reminders');
	};

	const totalWidth = columns.reduce((sum, column) => sum + (Number(column.width) || 100), 0);
	const windowHeight = window.innerHeight;

	return (
		<div className='bg-gray-100 h-[calc(100vh-150px)] border-t border-[#c5c8cb]'>
			<div className='w-full flex justify-between items-center px-4 h-20 mt-1'>
				<div className='w-full flex items-center gap-4'>
					<div onClick={handleBack} className='cursor-pointer text-lg'>
						<ArrowLeftOutlined />
					</div>
					<h1 className='font-proxima font-bold text-2xl leading-relaxed'>Manage Service Reminders</h1>
				</div>
				<Button type='primary' size='middle' onClick={() => setIsCreateModalOpen(true)} icon={<FileAddOutlined />} iconPosition='start'>
					Create Service
				</Button>
			</div>

			<div className='w-full flex items-center gap-4 mb-4 mx-6'>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Service Type</p>
					<Input
						variant='outlined'
						size='middle'
						placeholder='Filter by service type'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa' }}
						value={searchFilters.serviceType}
						onChange={(e) => setSearchFilters((prev) => ({ ...prev, serviceType: e.target.value }))}
					/>
				</div>

				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Vehicle Reg</p>
					<Input
						variant='outlined'
						size='middle'
						placeholder='Filter by vehicle Reg'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa' }}
						value={searchFilters.vehicleReg}
						onChange={(e) => setSearchFilters((prev) => ({ ...prev, vehicleReg: e.target.value }))}
					/>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Status</p>
					<Input
						variant='outlined'
						size='middle'
						placeholder='Filter by status'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa' }}
						value={searchFilters.status}
						onChange={(e) => setSearchFilters((prev) => ({ ...prev, status: e.target.value }))}
					/>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Alert Trigger Type</p>
					<Input
						variant='outlined'
						size='middle'
						placeholder='Filter by trigger type'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa' }}
						value={searchFilters.alertTriggerType}
						onChange={(e) => setSearchFilters((prev) => ({ ...prev, alertTriggerType: e.target.value }))}
					/>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Next Due From</p>
					<DatePicker
						variant='outlined'
						size='middle'
						format='DD/MM/YYYY'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa', width: 150 }}
						value={searchFilters.nextDueDateFrom ? dayjs(searchFilters.nextDueDateFrom) : null}
						onChange={(date) =>
							setSearchFilters((prev) => ({
								...prev,
								nextDueDateFrom: date ? date.format('YYYY-MM-DD') : '',
							}))
						}
					/>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Next Due To</p>
					<DatePicker
						variant='outlined'
						size='middle'
						format='DD/MM/YYYY'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa', width: 150 }}
						value={searchFilters.nextDueDateTo ? dayjs(searchFilters.nextDueDateTo) : null}
						onChange={(date) =>
							setSearchFilters((prev) => ({
								...prev,
								nextDueDateTo: date ? date.format('YYYY-MM-DD') : '',
							}))
						}
					/>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Search</p>
					<Button type='primary' size='middle' onClick={handleSearch} icon={<SearchOutlined />} iconPosition='start'>
						Search
					</Button>
				</div>
			</div>

			<div className='h-[calc(100vh-150px)] px-4'>
				<ConfigProvider
					theme={{
						token: { borderRadius: 0, borderRadiusLG: 0, borderRadiusSM: 0 },
						components: {
							Table: { headerBg: '#F6F8F6', borderColor: '#dddddd', borderRadius: 0, rowHoverBg: '#E9EFEB' },
							Pagination: { itemBg: '#E9EFEB' },
						},
					}}
				>
					<Table
						columns={columns}
						dataSource={vehicleServices}
						rowKey='id'
						rootClassName='rounded-none'
						rowClassName='bg-[#F6F8F6]'
						loading={isLoading}
						virtual={true}
						rowHoverable={true}
						bordered={true}
						scroll={{ y: windowHeight - 360, x: totalWidth }}
						footer={() => (
							<Row justify='space-between'>
								<div className='flex gap-4'>
									<Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!vehicleServices || vehicleServices.length === 0}>
										Download Details Report
									</Button>
								</div>
								{vehicleServices && vehicleServices.length > 0 ? (
									<span className='font-bold text-gray-700'>Total Records: {vehicleServices.length}</span>
								) : null}
							</Row>
						)}
					/>
				</ConfigProvider>
			</div>

			<Modal
				open={isCreateModalOpen}
				onCancel={() => {
					setIsCreateModalOpen(false);
					setEditingRecord(undefined);
				}}
				footer={null}
				destroyOnClose
				style={{ top: 20, position: 'relative' }}
			>
				<CreateServiceForm
					onSuccess={handleCreateSuccess}
					onCancel={() => {
						setIsCreateModalOpen(false);
						setEditingRecord(undefined);
					}}
					editData={editingRecord}
				/>
			</Modal>

			<ViewDetailsModal
				open={viewDetailsModal.open}
				onClose={() => setViewDetailsModal({ open: false, data: null })}
				data={viewDetailsModal.data}
				type='vehicle-service'
				title='Vehicle Service Details'
			/>

			<DownloadModal
				open={downloadModal}
				onClose={() => setDownloadModal(false)}
				data={vehicleServices}
				filename='vehicle-services'
				formatData={formatVehicleServiceForExport}
				title='Download Vehicle Services Report'
			/>
		</div>
	);
}
