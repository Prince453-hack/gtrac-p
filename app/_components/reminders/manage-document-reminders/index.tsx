'use client';
import React, { useEffect, useState } from 'react';
import { Button, ConfigProvider, Input, Row, Table, Modal, Tag, Space, Tooltip, message, DatePicker } from 'antd';
import { FileAddOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import {
	useGetVehicleDocumentsQuery,
	useLazyGetVehicleDocumentsQuery,
	useDeleteVehicleDocumentMutation,
	VehicleDocument,
} from '@/app/_globalRedux/services/alertManagement';
import { CreateDocumentForm } from '../create-document';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { ViewDetailsModal } from '../components/view-details-modal';
import { DownloadModal } from '../components/download-modal';
import { formatVehicleDocumentForExport } from '../utils/export-utils';

export function ManageDocumentReminders() {
	const router = useRouter();
	const { userId } = useSelector((state: RootState) => state.auth);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<VehicleDocument | null>(null);

	const [viewDetailsModal, setViewDetailsModal] = useState<{ open: boolean; data: VehicleDocument | null }>({ open: false, data: null });
	const [downloadModal, setDownloadModal] = useState(false);

	// State for search filters (UI)
	const [searchFilters, setSearchFilters] = useState({
		status: '',
		vehicleReg: '',
		documentType: '',
		alertTriggerType: '',
		issueDate: '',
		expiryDateFrom: '',
		expiryDateTo: '',
	});

	// State to track if initial load is done
	const [hasSearched, setHasSearched] = useState(false);
	const [initilizedOnce, setInitializedOnce] = useState(false);

	// Initial query for loading data on mount
	const {
		data: initialVehicleDocuments = [],
		isLoading: isInitialLoading,
		isUninitialized,
	} = useGetVehicleDocumentsQuery(
		{
			userId: userId,
		},
		{
			skip: !userId,
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		}
	);

	useEffect(() => {
		if (isUninitialized === false && !initilizedOnce) {
			setInitializedOnce(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isUninitialized]);

	const [deleteVehicleDocument] = useDeleteVehicleDocumentMutation();
	const [triggerFetchVehicleDocuments, { data: searchResults, isLoading: isSearchLoading }] = useLazyGetVehicleDocumentsQuery();

	// Use search results if available, otherwise use initial data
	const vehicleDocuments = hasSearched ? searchResults || [] : initialVehicleDocuments;

	const handleDelete = async (id: number) => {
		try {
			await deleteVehicleDocument(id).unwrap();
			message.success('Document reminder deleted successfully');
		} catch (error) {
			message.error('Failed to delete document reminder');
		}
	};

	const handleViewDetails = (record: VehicleDocument) => {
		setViewDetailsModal({ open: true, data: record });
	};

	const handleEdit = (record: VehicleDocument) => {
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
			title: 'Document Type',
			dataIndex: 'document_type',
			key: 'documentType',
			width: 180,
			render: (text: string) => <span className='font-medium'>{text}</span>,
		},
		{ title: 'Vehicle Reg', dataIndex: 'vehicle_reg', key: 'vehicleReg', width: 120 },
		{
			title: 'Document Number',
			dataIndex: 'document_number',
			key: 'documentNumber',
			width: 150,
			render: (text: string) => text || '-',
		},
		{
			title: 'Issue Date',
			dataIndex: 'issue_date',
			key: 'issueDate',
			width: 120,
			render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
		},
		{
			title: 'Expiry Date',
			dataIndex: 'expiry_date',
			key: 'expiryDate',
			width: 120,
			render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
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
			render: (type: string) => (type ? <Tag color='blue'>{type.replace('_', ' ').toUpperCase()}</Tag> : '-'),
		},
		{
			title: 'Notifications',
			key: 'notifications',
			width: 120,
			render: (record: VehicleDocument) => (
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
			render: (record: VehicleDocument) => (
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
									title: 'Delete Document Reminder',
									content: 'Are you sure you want to delete this document reminder?',
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
		triggerFetchVehicleDocuments({
			userId: userId,
			status: searchFilters.status || undefined,
			vehicleReg: searchFilters.vehicleReg || undefined,
			documentType: searchFilters.documentType || undefined,
			alertTriggerType: searchFilters.alertTriggerType || undefined,
			issueDate: searchFilters.issueDate || undefined,
			expiryDateFrom: searchFilters.expiryDateFrom || undefined,
			expiryDateTo: searchFilters.expiryDateTo || undefined,
		});
		setHasSearched(true);
	};

	const handleCreateSuccess = () => {
		setIsCreateModalOpen(false);
		setEditingRecord(null);
		// Trigger search with current filters to refresh data
		handleSearch();
		message.success(editingRecord ? 'Document reminder updated successfully!' : 'Document reminder created successfully!');
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
					<h1 className='font-proxima font-bold text-2xl leading-relaxed'>Manage Document Reminders</h1>
				</div>
				<Button type='primary' size='middle' onClick={() => setIsCreateModalOpen(true)} icon={<FileAddOutlined />} iconPosition='start'>
					Create Document
				</Button>
			</div>

			<div className='w-full flex items-center gap-4 mb-4 mx-6'>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Document Type</p>
					<Input
						variant='outlined'
						size='middle'
						placeholder='Filter by document type'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa' }}
						value={searchFilters.documentType}
						onChange={(e) => setSearchFilters((prev) => ({ ...prev, documentType: e.target.value }))}
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
					<p className='text-sm font-semibold text-gray-700 ml-1'>Expiry From</p>
					<DatePicker
						variant='outlined'
						size='middle'
						format='DD/MM/YYYY'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa', width: 150 }}
						value={searchFilters.expiryDateFrom ? dayjs(searchFilters.expiryDateFrom) : null}
						onChange={(date) =>
							setSearchFilters((prev) => ({
								...prev,
								expiryDateFrom: date ? date.format('YYYY-MM-DD') : '',
							}))
						}
					/>
				</div>
				<div className='space-y-1'>
					<p className='text-sm font-semibold text-gray-700 ml-1'>Expiry To</p>
					<DatePicker
						variant='outlined'
						size='middle'
						format='DD/MM/YYYY'
						style={{ backgroundColor: '#f3f4f6', border: '1px solid #aaa', width: 150 }}
						value={searchFilters.expiryDateTo ? dayjs(searchFilters.expiryDateTo) : null}
						onChange={(date) =>
							setSearchFilters((prev) => ({
								...prev,
								expiryDateTo: date ? date.format('YYYY-MM-DD') : '',
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
						dataSource={vehicleDocuments}
						rowKey='id'
						rootClassName='rounded-none'
						rowClassName='bg-[#F6F8F6]'
						loading={isInitialLoading || isSearchLoading}
						virtual={true}
						rowHoverable={true}
						bordered={true}
						scroll={{ y: windowHeight - 360, x: totalWidth }}
						footer={() => (
							<Row justify='space-between'>
								<div className='flex gap-4'>
									<Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!vehicleDocuments || vehicleDocuments.length === 0}>
										Download Details Report
									</Button>
								</div>
								{vehicleDocuments && vehicleDocuments.length > 0 ? (
									<span className='font-bold text-gray-700'>Total Records: {vehicleDocuments.length}</span>
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
					setEditingRecord(null);
				}}
				footer={null}
				destroyOnClose
				style={{ top: 20, position: 'relative' }}
			>
				<CreateDocumentForm
					onSuccess={handleCreateSuccess}
					onCancel={() => {
						setIsCreateModalOpen(false);
						setEditingRecord(null);
					}}
					editData={editingRecord}
				/>
			</Modal>

			<ViewDetailsModal
				open={viewDetailsModal.open}
				onClose={() => setViewDetailsModal({ open: false, data: null })}
				data={viewDetailsModal.data}
				type='vehicle-document'
				title='Vehicle Document Details'
			/>

			<DownloadModal
				open={downloadModal}
				onClose={() => setDownloadModal(false)}
				data={vehicleDocuments}
				filename='vehicle-documents'
				formatData={formatVehicleDocumentForExport}
				title='Download Vehicle Documents Report'
			/>
		</div>
	);
}
