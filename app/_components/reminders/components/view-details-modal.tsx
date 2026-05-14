import React from 'react';
import { Modal, Descriptions, Tag, Space, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface ViewDetailsModalProps {
	open: boolean;
	onClose: () => void;
	data: any;
	type: 'service-reminder' | 'vehicle-service' | 'document-reminder' | 'vehicle-document';
	title: string;
}

export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ open, onClose, data, type, title }) => {
	if (!data) return null;

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
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
			case 'active':
				return 'green';
			case 'expired':
				return 'red';
			default:
				return 'default';
		}
	};

	const renderServiceReminderDetails = () => (
		<Descriptions column={2} bordered size='small'>
			<Descriptions.Item label='ID' span={2}>
				{data.id}
			</Descriptions.Item>
			<Descriptions.Item label='Service Type'>{data.service?.service_type || 'N/A'}</Descriptions.Item>
			<Descriptions.Item label='Vehicle ID'>{data.service?.vehicle_id || 'N/A'}</Descriptions.Item>
			<Descriptions.Item label='Message' span={2}>
				{data.message}
			</Descriptions.Item>
			<Descriptions.Item label='Status'>
				<Tag color={getStatusColor(data.status)}>{data.status?.toUpperCase()}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label='Alert Type'>{data.alert_type || 'N/A'}</Descriptions.Item>
			<Descriptions.Item label='Sent At'>{data.sent_at ? dayjs(data.sent_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Read At'>{data.read_at ? dayjs(data.read_at).format('DD/MM/YYYY HH:mm:ss') : 'Not read yet'}</Descriptions.Item>
			<Descriptions.Item label='Notifications' span={2}>
				<Space>
					{data.sent_via_email && <Tag color='green'>Email</Tag>}
					{data.sent_via_sms && <Tag color='orange'>SMS</Tag>}
					{data.sent_via_popup && <Tag color='purple'>Popup</Tag>}
				</Space>
			</Descriptions.Item>
			<Descriptions.Item label='Created At'>{data.created_at ? dayjs(data.created_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Updated At'>{data.updated_at ? dayjs(data.updated_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
		</Descriptions>
	);

	const renderVehicleServiceDetails = () => (
		<Descriptions column={2} bordered size='small'>
			<Descriptions.Item label='ID' span={2}>
				{data.id}
			</Descriptions.Item>
			<Descriptions.Item label='Service Type'>{data.service_type}</Descriptions.Item>
			<Descriptions.Item label='Vehicle ID'>{data.vehicle_id}</Descriptions.Item>
			<Descriptions.Item label='Last Service Date'>
				{data.last_service_date ? dayjs(data.last_service_date).format('DD/MM/YYYY') : '-'}
			</Descriptions.Item>
			<Descriptions.Item label='Next Due Date'>{data['next_due-date'] ? dayjs(data['next_due-date']).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Last Service Mileage'>
				{data.last_service_mileage ? `${data.last_service_mileage?.toLocaleString()} km` : '-'}
			</Descriptions.Item>
			<Descriptions.Item label='Next Due Mileage'>{data.next_due_mileage ? `${data.next_due_mileage?.toLocaleString()} km` : '-'}</Descriptions.Item>
			<Descriptions.Item label='Status'>
				<Tag color={getStatusColor(data.reminder_status)}>{data.reminder_status?.toUpperCase()}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label='Alert Type'>
				<Tag color='blue'>{data.alert_trigger_type?.replace('_', ' ')?.toUpperCase()}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label='Days Before Alert'>{data.days_before_alert || '-'}</Descriptions.Item>
			<Descriptions.Item label='Mileage Before Alert'>
				{data.mileage_before_alert ? `${data.mileage_before_alert?.toLocaleString()} km` : '-'}
			</Descriptions.Item>
			<Descriptions.Item label='Notifications' span={2}>
				<Space>
					{data.email_required ? <Tag color='green'>Email</Tag> : null}
					{data.sms_required ? <Tag color='orange'>SMS</Tag> : null}
					{data.popup_required ? <Tag color='purple'>Popup</Tag> : null}
				</Space>
			</Descriptions.Item>
			<Descriptions.Item label='Created At'>{data.created_at ? dayjs(data.created_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Updated At'>{data.updated_at ? dayjs(data.updated_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
		</Descriptions>
	);

	const renderDocumentReminderDetails = () => (
		<Descriptions column={2} bordered size='small'>
			<Descriptions.Item label='Document Name' span={2}>
				{data.documentName}
			</Descriptions.Item>
			<Descriptions.Item label='Expiry Date'>{data.expiryDate}</Descriptions.Item>
			<Descriptions.Item label='Status'>
				<Tag color={getStatusColor(data.status)}>{data.status?.toUpperCase()}</Tag>
			</Descriptions.Item>
		</Descriptions>
	);

	const renderVehicleDocumentDetails = () => (
		<Descriptions column={2} bordered size='small'>
			<Descriptions.Item label='ID' span={2}>
				{data.id}
			</Descriptions.Item>
			<Descriptions.Item label='Document Type'>{data.document_type}</Descriptions.Item>
			<Descriptions.Item label='Vehicle ID'>{data.vehicle_id}</Descriptions.Item>
			<Descriptions.Item label='Document Number'>{data.document_number || '-'}</Descriptions.Item>
			<Descriptions.Item label='Description' span={2}>
				{data.description || '-'}
			</Descriptions.Item>
			<Descriptions.Item label='Issue Date'>{data.issue_date ? dayjs(data.issue_date).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Expiry Date'>{data.expiry_date ? dayjs(data.expiry_date).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Status'>
				<Tag color={getStatusColor(data.reminder_status)}>{data.reminder_status?.toUpperCase()}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label='Alert Type'>
				{data.alert_trigger_type ? <Tag color='blue'>{data.alert_trigger_type?.replace('_', ' ')?.toUpperCase()}</Tag> : '-'}
			</Descriptions.Item>
			<Descriptions.Item label='Interval Days'>{data.interval_days || '-'}</Descriptions.Item>
			<Descriptions.Item label='Email IDs'>{data.email_id || '-'}</Descriptions.Item>
			<Descriptions.Item label='Phone Numbers'>{data.phone_numbers || '-'}</Descriptions.Item>
			<Descriptions.Item label='Notifications' span={2}>
				<Space>
					{data.email_required ? <Tag color='green'>Email</Tag> : null}
					{data.sms_required ? <Tag color='orange'>SMS</Tag> : null}
					{data.popup_required ? <Tag color='purple'>Popup</Tag> : null}
				</Space>
			</Descriptions.Item>
			<Descriptions.Item label='Notes' span={2}>
				{data.notes || '-'}
			</Descriptions.Item>
			<Descriptions.Item label='Created At'>{data.created_at ? dayjs(data.created_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
			<Descriptions.Item label='Updated At'>{data.updated_at ? dayjs(data.updated_at).format('DD/MM/YYYY HH:mm:ss') : '-'}</Descriptions.Item>
		</Descriptions>
	);

	const renderDetails = () => {
		switch (type) {
			case 'service-reminder':
				return renderServiceReminderDetails();
			case 'vehicle-service':
				return renderVehicleServiceDetails();
			case 'document-reminder':
				return renderDocumentReminderDetails();
			case 'vehicle-document':
				return renderVehicleDocumentDetails();
			default:
				return <div>No details available</div>;
		}
	};

	return (
		<Modal
			title={
				<div className='flex justify-between items-center'>
					<span className='text-lg font-semibold'>{title}</span>
					<Button type='text' icon={<CloseOutlined />} onClick={onClose} className='text-gray-500 hover:text-gray-700' />
				</div>
			}
			closeIcon={false}
			open={open}
			onCancel={onClose}
			footer={[
				<Button key='close' onClick={onClose}>
					Close
				</Button>,
			]}
			width={800}
			destroyOnClose
		>
			{renderDetails()}
		</Modal>
	);
};
