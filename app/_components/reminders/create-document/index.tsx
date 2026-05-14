'use client';
import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, Select, Switch, Row, Col, Typography, Space, message, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
	useCreateVehicleDocumentMutation,
	useUpdateVehicleDocumentMutation,
	CreateVehicleDocumentRequest,
	VehicleDocument,
} from '@/app/_globalRedux/services/alertManagement';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import AllVehiclesSelect from '../../common/AllVehiclesSelect';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CreateDocumentFormProps {
	onSuccess?: () => void;
	onCancel?: () => void;
	isModal?: boolean;
	editData?: VehicleDocument | null;
}

export function CreateDocumentForm({ onSuccess, onCancel, isModal = false, editData }: CreateDocumentFormProps) {
	const router = useRouter();
	const [form] = Form.useForm();
	const [selectedDocumentTriggerType, setSelectedDocumentTriggerType] = useState<string>('due_date_based');

	const { userId } = useSelector((state: RootState) => state.auth);
	const [selectedVehicleOption, setSelectedVehicleOption] = useState<{ label: string; value: number } | undefined>(
		editData ? { label: editData.vehicle_reg, value: Number(editData.vehicle_id) } : undefined
	);

	const [createVehicleDocument, { isLoading: isCreateLoading }] = useCreateVehicleDocumentMutation();
	const [updateVehicleDocument, { isLoading: isUpdateLoading }] = useUpdateVehicleDocumentMutation();
	const isLoading = isCreateLoading || isUpdateLoading;

	const documentTypes = [
		'Vehicle Registration',
		'Insurance Policy',
		'Driving License',
		'Road Tax Receipt',
		'Emission Test Certificate',
		'Vehicle Fitness Certificate',
		'Pollution Under Control (PUC)',
		'Commercial Vehicle Permit',
		'Goods Carriage Permit',
		'Passenger Vehicle Permit',
		'Other',
	];

	const alertTriggerTypes = [
		{ value: 'due_date_based', label: 'Due Date Based' },
		{ value: 'interval_based', label: 'Interval Based (Days)' },
	];

	const onlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (
			!/[0-9]/.test(e.key) &&
			!['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'Clear', 'Copy', 'Paste'].includes(e.key)
		) {
			e.preventDefault();
		}
	};

	const handleSubmit = async (values: any) => {
		try {
			const documentData: CreateVehicleDocumentRequest = {
				...values,
				vehicleReg: selectedVehicleOption?.label || '',
				vehicleId: selectedVehicleOption?.value || '',
				issueDate: values.issueDate ? dayjs(values.issueDate).format('YYYY-MM-DD') : undefined,
				expiryDate: dayjs(values.expiryDate).format('YYYY-MM-DD'),
				userId,
			};

			if (editData) {
				await updateVehicleDocument({ id: editData.id, data: { ...documentData, reminderStatus: editData.reminder_status } }).unwrap();
			} else {
				await createVehicleDocument(documentData).unwrap();
			}

			if (onSuccess) {
				onSuccess();
			} else {
				message.success(editData ? 'Document reminder updated successfully!' : 'Document reminder created successfully!');
				router.push('/dashboard/reminders');
			}
		} catch (error) {
			message.error('Failed to create document reminder');
			console.error('Error creating document reminder:', error);
		}
	};

	const handleBack = () => {
		if (onCancel) {
			onCancel();
		} else {
			router.push('/dashboard/reminders');
		}
	};

	const content = (
		<div>
			<Form
				form={form}
				layout='vertical'
				onFinish={handleSubmit}
				className='overflow-y-scroll'
				initialValues={
					editData
						? {
								documentType: editData.document_type,
								documentNumber: editData.document_number,
								emailIds: editData.email_id,
								phoneNumbers: editData.phone_numbers,
								description: editData.description,
								issueDate: editData.issue_date ? dayjs(editData.issue_date) : undefined,
								expiryDate: editData.expiry_date ? dayjs(editData.expiry_date) : undefined,
								alertTriggerType: editData.alert_trigger_type || 'due_date_based',
								intervalDays: editData.interval_days,
								popupRequired: editData.popup_required ?? true,
								emailRequired: editData.email_required ?? true,
								smsRequired: editData.sms_required ?? false,
								notes: editData.notes,
						  }
						: {
								alertTriggerType: 'due_date_based',
								popupRequired: true,
								emailRequired: true,
								smsRequired: false,
								vehicleId: '', // Dummy data
						  }
				}
			>
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item name='documentType' label='Document Type' rules={[{ required: true, message: 'Please select a document type' }]}>
							<Select placeholder='Select document type' size='middle'>
								{documentTypes.map((type) => (
									<Option key={type} value={type}>
										{type}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<p className='h-[30px]'>Select Vehicle</p>
						<AllVehiclesSelect selectedVehicleOption={selectedVehicleOption} setSelectedVehicleOption={setSelectedVehicleOption} />
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item name='documentNumber' label='Document Number'>
							<Input placeholder='Enter document number' size='middle' />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item name='emailIds' label='Email Addresses' rules={[{ required: true, message: 'Please enter email addresses' }]}>
							<Input placeholder='Enter email addresses (comma separated)' size='middle' />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name='phoneNumbers' label='Phone Numbers' rules={[{ required: true, message: 'Please enter phone numbers' }]}>
							<Input placeholder='Enter phone numbers (comma separated)' size='middle' />
						</Form.Item>
					</Col>
				</Row>

				<Form.Item name='description' label='Description'>
					<TextArea rows={3} placeholder='Enter document description' size='middle' />
				</Form.Item>

				<Divider>Document Schedule</Divider>

				<Row gutter={24}>
					<Col span={24}>
						<Form.Item name='alertTriggerType' label='Alert Trigger Type' rules={[{ required: true, message: 'Please select alert trigger type' }]}>
							<Select placeholder='Select trigger type' size='middle' onChange={(value) => setSelectedDocumentTriggerType(value)}>
								{alertTriggerTypes.map((type) => (
									<Option key={type.value} value={type.value}>
										{type.label}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item name='issueDate' label='Issue Date'>
							<DatePicker className='w-full' size='middle' format='YYYY-MM-DD' />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name='expiryDate' label='Expiry Date' rules={[{ required: true, message: 'Please select expiry date' }]}>
							<DatePicker className='w-full' size='middle' format='YYYY-MM-DD' />
						</Form.Item>
					</Col>
				</Row>

				{selectedDocumentTriggerType === 'interval_based' && (
					<Row gutter={24}>
						<Col span={24}>
							<Form.Item
								name='intervalDays'
								label='Reminder Interval (Days)'
								rules={[{ required: true, message: 'Please enter interval in days' }]}
								tooltip='Number of days before expiry to send reminder'
							>
								<Input type='number' min={0} onKeyDown={onlyDigits} className='w-full' placeholder='Enter days before expiry' size='middle' />
							</Form.Item>
						</Col>
					</Row>
				)}

				<Divider>Notification Preferences</Divider>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item name='popupRequired' label='Popup Notifications' valuePropName='checked'>
							<Switch />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name='emailRequired' label='Email Notifications' valuePropName='checked'>
							<Switch />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={24}>
					<Col span={24}>
						<Form.Item name='smsRequired' label='SMS Notifications' valuePropName='checked'>
							<Switch />
						</Form.Item>
					</Col>
				</Row>

				<Form.Item name='notes' label='Additional Notes'>
					<TextArea rows={3} placeholder='Enter any additional notes' size='middle' />
				</Form.Item>

				<Form.Item className='mb-0 sticky top-0'>
					<Space>
						<Button type='primary' htmlType='submit' loading={isLoading} icon={<SaveOutlined />} size='middle'>
							{editData ? 'Update Document Reminder' : 'Create Document Reminder'}
						</Button>
						<Button onClick={handleBack} size='middle'>
							Cancel
						</Button>
					</Space>
				</Form.Item>
			</Form>
		</div>
	);

	if (isModal) {
		return content;
	}

	return (
		<div className='p-6 bg-gray-50 max-h-[80vh] overflow-y-scroll'>
			<div className='max-w-md mx-auto'>
				<div className='mb-6'>
					<Title level={2}>{editData ? 'Edit Document Reminder' : 'Create Document Reminder'}</Title>
					<Text type='secondary'>
						{editData ? 'Update the vehicle document reminder details' : 'Set up a new vehicle document reminder with notification preferences'}
					</Text>
				</div>
				{content}
			</div>
		</div>
	);
}
