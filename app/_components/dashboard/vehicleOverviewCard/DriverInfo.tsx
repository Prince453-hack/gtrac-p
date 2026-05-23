'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { setDriverInfoIndex } from '@/app/_globalRedux/dashboard/optionsSlice';
import { useUpdateDriverDataMutation } from '@/app/_globalRedux/services/trackingDashboard';
import { VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { Modal, Form, Input, Button, Typography, Divider } from 'antd';
import { CloseOutlined, UserOutlined, EditFilled, DeleteOutlined, PhoneOutlined } from '@ant-design/icons';
import { toggleRefetchVehicleListMob } from '@/app/_globalRedux/dashboard/mapSlice';

const { Text } = Typography;

interface DriverInfoProps {
	vehicleData: VehicleData;
}

export const DriversInfo: React.FC<DriverInfoProps> = ({ vehicleData }) => {
	const dispatch = useDispatch();
	const { driverInfoIndex } = useSelector((state: RootState) => state.vehicleOverviewOptions);
	const { groupId } = useSelector((state: RootState) => state.auth);

	const [isEdit, setIsEdit] = useState(false);
	const [promiseLoading, setPromiseLoading] = useState(false);
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [form] = Form.useForm();
	const [triggerUpdate, { isLoading }] = useUpdateDriverDataMutation();

	const hasInfo = vehicleData.drivers.driverName && vehicleData.drivers.driverName !== 'NA';

	useEffect(() => {
		if (driverInfoIndex === vehicleData.vId) {
			if (hasInfo) {
				setName(vehicleData.drivers.driverName);
				setPhone(vehicleData.drivers.phoneNumber);
				form.setFieldsValue({ 'driver-name': vehicleData.drivers.driverName, 'driver-number': vehicleData.drivers.phoneNumber });
			} else {
				form.resetFields();
			}
		}
	}, [driverInfoIndex]);

	useEffect(() => {
		if (isLoading) setPromiseLoading(true);
		else if (!isLoading && promiseLoading) handleClose();
	}, [isLoading]);

	const handleClose = () => {
		dispatch(setDriverInfoIndex(-1));
		setIsEdit(false);
		setPromiseLoading(false);
		form.resetFields();
	};

	const onFinish = (values: any) => {
		setPromiseLoading(true);
		triggerUpdate({
			sysServiceId: `${vehicleData.vId}`,
			groupId: Number(groupId),
			driverName: values['driver-name'] || '',
			driverNumber: values['driver-number'] || '',
		}).then(() => {
			dispatch(toggleRefetchVehicleListMob(true));
			handleClose();
		});
	};

	const handleRemove = () => {
		setPromiseLoading(true);
		triggerUpdate({
			sysServiceId: `${vehicleData.vId}`,
			groupId: Number(groupId),
			driverName: 'NA',
			driverNumber: 'NA',
		}).then(() => {
			dispatch(toggleRefetchVehicleListMob(true));
			handleClose();
		});
	};

	return (
		<Modal
			title={<Text strong>Modify Driver</Text>}
			visible={driverInfoIndex === vehicleData.vId}
			onCancel={handleClose}
			footer={null}
			width={500}
			closeIcon={<CloseOutlined />}
		>
			{/* Vehicle Info */}
			<div className='mb-6'>
				<div className='flex justify-between border-b pb-2'>
					<Text type='secondary'>Vehicle</Text>
					<Text>{vehicleData.vehReg || vehicleData.vId}</Text>
				</div>
			</div>

			{/* Existing Driver Display */}
			{hasInfo && !isEdit && (
				<div className='mb-6'>
					<div className='flex justify-between items-center'>
						<div className='flex items-center space-x-2'>
							<UserOutlined className='text-gray-600' />
							<Text>{name}</Text>
							<Text className='bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs'>{phone}</Text>
						</div>
						<div className='flex space-x-3'>
							<Button type='link' icon={<EditFilled />} onClick={() => setIsEdit(true)}>
								Edit
							</Button>
							<Button type='link' icon={<DeleteOutlined />} onClick={handleRemove} danger>
								Remove
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Form Section */}
			<Form form={form} layout='vertical' onFinish={onFinish} className='space-y-4'>
				{(isEdit || !hasInfo) && (
					<>
						<Form.Item label='Driver Name' name='driver-name' rules={[{ required: true, message: 'Please enter driver name' }]}>
							<Input prefix={<UserOutlined />} placeholder="Enter driver's name" />
						</Form.Item>

						<Form.Item
							label='Phone Number'
							name='driver-number'
							rules={[
								{ required: true, message: 'Please enter phone number' },
								{ pattern: /^\+?[\d\s-()]+$/, message: 'Please enter valid phone number' },
							]}
						>
							<Input prefix={<PhoneOutlined />} placeholder="Enter driver's phone number" />
						</Form.Item>
					</>
				)}

				<Divider />
				<div className='flex justify-end space-x-3'>
					<Button onClick={handleClose}>Cancel</Button>
					<Button type='primary' htmlType='submit' loading={promiseLoading}>
						{(hasInfo ? 'Update' : 'Add') + ' Driver'}
					</Button>
				</div>
			</Form>
		</Modal>
	);
};
