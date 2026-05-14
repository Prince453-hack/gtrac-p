'use client';

import { setIsShareUrlOpenIndex } from '@/app/_globalRedux/dashboard/optionsSlice';
import { VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { ShareUrlFormData } from '@/app/_globalRedux/services/types/post/shareUrl';
import { useLazyShareUrlQuery } from '@/app/_globalRedux/services/yatayaatNewtracking';
import { RootState } from '@/app/_globalRedux/store';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Modal, notification, Typography } from 'antd';
import Paragraph from 'antd/es/typography/Paragraph';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CustomDatePicker from '../../common/datePicker';
import { setHours, setMinutes } from 'date-fns';

export const ShareUrl = ({ vehicleData }: { vehicleData: VehicleData }) => {
	const dispatch = useDispatch();

	const rangeConfig = {
		rules: [{ type: 'array' as const, required: true, message: 'Please select time!' }],
	};
	const { userId, groupId, userName, parentUser } = useSelector((state: RootState) => state.auth);
	const [promiseLoading, setPromiseLoading] = useState(false);
	const { shareUrlOpenIndex } = useSelector((state: RootState) => state.vehicleOverviewOptions);
	const [api, notificationContextHolder] = notification.useNotification();
	const [customDateRange, setCustomDateRange] = useState([setHours(setMinutes(new Date(), 0), 0), new Date()]);

	const openNotification = ({ message, vehicleNumber, url }: { message: string; vehicleNumber: string; status: boolean; url: string }) => {
		api.open({
			message: <p className='font-bold text-xl'>{vehicleNumber}</p>,
			description: (
				<>
					<p className='font-semibold text-base text-gray-600'>{message}</p>
					<div className='flex gap-2'>
						<Paragraph copyable={{ text: url }}></Paragraph>
						<a href={url} target='_blank' rel='noreferrer'>
							Navigate to generated link <ArrowRightOutlined />
						</a>
					</div>
				</>
			),
			duration: 0,
		});
	};

	const [getShareUrl] = useLazyShareUrlQuery();
	function cleanDateString(dateStr: string) {
		// Split the string by the space before the timezone name
		return dateStr.split(' (')[0];
	}

	const onFinish = (e: any) => {
		setPromiseLoading(true);
		const tempData: ShareUrlFormData = {
			vehicle_popup_id: vehicleData.vId,
			veh_no_id_popup_name: vehicleData.vehReg,
			Txtdate: `${cleanDateString(customDateRange[0].toString())}~${cleanDateString(customDateRange[1].toString())}`,
			UserName: userName || '',
			UserId: Number(userId),
			groupid: Number(groupId),
			client_name: Number(userId) === 87162 ? 'Henkel GPS' : e.user['client-name'],
			action: 'Shareurldatasave',
			email: e.user.email,
			phone_no: Number(userId) === 87162 || Number(parentUser) === 87162 ? 1234567890 : e.user['phone-number'],
		};

		getShareUrl(tempData).then((data) => {
			if (data.data) {
				const { massage, status, vehicle_no, url } = data.data;
				openNotification({ message: massage, vehicleNumber: vehicle_no, status: status, url: url });
			}

			setPromiseLoading(false);
			dispatch(setIsShareUrlOpenIndex(-1));
		});
	};

	return (
		<>
			{notificationContextHolder}
			{shareUrlOpenIndex === vehicleData.vId ? (
				<Modal title='Share Url' open={shareUrlOpenIndex !== -1} onCancel={() => dispatch(setIsShareUrlOpenIndex(-1))} width={500} footer={null}>
					<Form
						onFinish={(e) => onFinish(e)}
						style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '15px' }}
						className='select-none'
					>
						<CustomDatePicker dateRange={customDateRange} setDateRange={setCustomDateRange} datePickerStyles='h-[32px]  max-h-[32px]' />

						<Form.Item name={['user', 'email']} rules={[{ type: 'email' }]} noStyle>
							<Input placeholder='Enter Email' allowClear required />
						</Form.Item>

						{Number(userId) === 87162 || Number(parentUser) === 87162 ? null : (
							<Form.Item name={['user', 'phone-number']} rules={[{ type: 'string' }]} noStyle>
								<Input placeholder='Enter Mobile Number' allowClear required />
							</Form.Item>
						)}
						{Number(userId) === 87162 || Number(parentUser) === 87162 ? null : (
							<Form.Item name={['user', 'client-name']} rules={[{ type: 'string' }]} noStyle>
								<Input placeholder='Enter Client Name' allowClear required />
							</Form.Item>
						)}
						<div className='flex gap-2 justify-end'>
							<Form.Item noStyle>
								<Button type='primary' htmlType='submit' loading={promiseLoading}>
									Submit
								</Button>
							</Form.Item>
							<Form.Item noStyle>
								<Button onClick={() => dispatch(setIsShareUrlOpenIndex(-1))}>Cancel</Button>
							</Form.Item>
						</div>
					</Form>
				</Modal>
			) : null}
		</>
	);
};
