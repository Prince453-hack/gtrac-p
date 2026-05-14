'use client';
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, DatePicker, Select, Switch, Row, Col, Typography, Space, message, Divider, FormInstance } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
	useCreateVehicleServiceMutation,
	type CreateVehicleServiceRequest,
	useUpdateVehicleServiceMutation,
	VehicleService,
} from '@/app/_globalRedux/services/alertManagement';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import AllVehiclesSelect from '../../common/AllVehiclesSelect';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CreateServiceFormProps {
	onSuccess?: () => void;
	onCancel?: () => void;
	isModal?: boolean;

	editData?: VehicleService;
}

const onlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
	if (!/[0-9]/.test(e.key)) {
		e.preventDefault();
	}
};

export function CreateServiceForm({ onSuccess, onCancel, isModal = false, editData }: CreateServiceFormProps) {
	const router = useRouter();
	const [form] = Form.useForm();
	const [selectedVehicleServiceTriggerType, setSelectedVehicleServiceTriggerType] = useState<string>('interval_based');

	const { userId } = useSelector((state: RootState) => state.auth);
	const [selectedVehicleOption, setSelectedVehicleOption] = useState<{ label: string; value: number } | undefined>(
		editData ? { label: editData.vehicle_reg ?? '', value: Number(editData.vehicle_id) ?? '' } : undefined
	);

	const [createVehicleService, { isLoading }] = useCreateVehicleServiceMutation();
	const [updateVehicleService, { isLoading: isUpdateVehicleServiceLoading }] = useUpdateVehicleServiceMutation();

	const serviceTypes = [
		'Oil Change',
		'Brake Service',
		'Tire Rotation',
		'Engine Tune-up',
		'Transmission Service',
		'Air Filter Replacement',
		'Battery Check',
		'Coolant Service',
		'Spark Plug Replacement',
		'Fuel System Cleaning',
		'Other',
	];

	const alertTriggerTypes = [
		{ value: 'interval_based', label: 'Interval Based (Days)' },
		{ value: 'mileage_based', label: 'Mileage Based' },
		{ value: 'due_date_based', label: 'Due Date Based' },
	];

	const handleSubmit = async (values: any) => {
		try {
			const serviceData: CreateVehicleServiceRequest = {
				...values,
				vehicleId: selectedVehicleOption?.value || '',
				vehicleReg: selectedVehicleOption?.label || '',
				lastServiceDate: values.lastServiceDate ? dayjs(values.lastServiceDate).format('YYYY-MM-DD') : undefined,
				nextDueDate: values.nextDueDate ? dayjs(values.nextDueDate).format('YYYY-MM-DD') : undefined,
				userId,
			};

			if (editData) {
				await updateVehicleService({ id: editData.id, data: { ...serviceData } });
			} else {
				await createVehicleService(serviceData).unwrap();
			}

			if (onSuccess) {
				onSuccess();
			} else {
				message.success(editData ? 'Service reminder updated successfully!' : 'Service reminder created successfully!');
				router.push('/dashboard/reminders');
			}
		} catch (error) {
			message.error('Failed to create service reminder');
			console.error('Error creating service reminder:', error);
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
								serviceType: editData.service_type,
								alertTriggerType: editData.alert_trigger_type || 'interval_based',
								lastServiceDate: editData.last_service_date ? dayjs(editData.last_service_date) : undefined,
								nextDueDate: editData['next_due_date'] ? dayjs(editData['next_due_date']) : undefined,
								intervalDays: editData.interval_days,
								nextDueMileage: editData.next_due_mileage,
								popupRequired: editData.popup_required ?? true,
								emailRequired: editData.email_required ?? true,
								smsRequired: editData.sms_required ?? false,
								description: editData.description,
								notes: editData.notes,
								emailIds: editData.email_id,
								phoneNumbers: editData.phone_numbers,
						  }
						: {
								alertTriggerType: 'interval_based',
								popupRequired: true,
								emailRequired: true,
								smsRequired: false,
								vehicleId: '', // Dummy data
						  }
				}
			>
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item name='serviceType' label='Service Type' rules={[{ required: true, message: 'Please select a service type' }]}>
							<Select placeholder='Select service type' size='middle'>
								{serviceTypes.map((type) => (
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
					<TextArea rows={3} placeholder='Enter service description' size='middle' />
				</Form.Item>

				<Divider>Service Schedule</Divider>

				<Row gutter={24}>
					<Col span={24}>
						<Form.Item name='alertTriggerType' label='Alert Trigger Type' rules={[{ required: true, message: 'Please select alert trigger type' }]}>
							<Select placeholder='Select trigger type' size='middle' onChange={(value) => setSelectedVehicleServiceTriggerType(value)}>
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
					<Col span={24}>
						<Form.Item name='lastServiceDate' label='Last Service Date'>
							<DatePicker className='w-full' size='middle' format='YYYY-MM-DD' />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					{selectedVehicleServiceTriggerType === 'mileage_based' ? (
						<Col span={24}>
							<Form.Item name='nextDueMileage' label='Next Due Mileage' rules={[{ required: true, message: 'Please enter next due mileage' }]}>
								<Input type='number' min={0} onKeyDown={onlyDigits} className='w-full' placeholder='Enter mileage' size='middle' />
							</Form.Item>
						</Col>
					) : null}
					{selectedVehicleServiceTriggerType === 'due_date_based' ? (
						<Col span={24}>
							<Form.Item name='nextDueDate' label='Next Due Date' rules={[{ required: true, message: 'Please select next due date' }]}>
								<DatePicker className='w-full' size='middle' format='YYYY-MM-DD' />
							</Form.Item>
						</Col>
					) : null}

					{selectedVehicleServiceTriggerType === 'interval_based' ? (
						<Col span={24}>
							<Form.Item name='intervalDays' label='Interval (Days)' rules={[{ required: true, message: 'Please enter interval in days' }]}>
								<Input type='number' min={0} onKeyDown={onlyDigits} className='w-full' placeholder='Enter interval in days' size='middle' />
							</Form.Item>
						</Col>
					) : null}
				</Row>

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
						<Button type='primary' htmlType='submit' loading={isLoading || isUpdateVehicleServiceLoading} icon={<SaveOutlined />} size='middle'>
							{editData ? 'Update Service Reminder' : 'Create Service Reminder'}
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
					<Title level={2}>{editData ? 'Edit Service Reminder' : 'Create Service Reminder'}</Title>
					<Text type='secondary'>
						{editData ? 'Update the vehicle service reminder details' : 'Set up a new vehicle service reminder with notification preferences'}
					</Text>
				</div>
				{content}
			</div>
		</div>
	);
}
