import { Button, ConfigProvider, DatePicker, Drawer, Form, Input, Select, TimePicker } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

interface AddRecordFormProps {
	onSubmit: (values: any) => void;
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AddDriverAlcoholStatus = ({ onSubmit, isDrawerOpen, setIsDrawerOpen }: AddRecordFormProps) => {
	const [form] = Form.useForm();
	return (
		<ConfigProvider
			theme={{
				components: {
					Input: {
						colorBgContainer: '#F0F3F3',
						colorBorder: '#D9D9D9',
					},
					Select: {
						colorBgContainer: '#F0F3F3',
						colorBorder: '#D9D9D9',
					},
					DatePicker: {
						colorBgContainer: '#F0F3F3',
						colorBorder: '#D9D9D9',
					},
				},
			}}
		>
			<Drawer
				title='Add Driver Entry'
				placement='right'
				onClose={() => setIsDrawerOpen(false)}
				open={isDrawerOpen}
				width={350}
				styles={{
					body: { padding: 15, background: '#F0F3F3', borderRadius: '15px', border: 0 },
					header: {
						padding: 15,
						background: '#F0F3F3',
						borderColor: '#D9D9D9',
					},
				}}
			>
				<Form
					form={form}
					layout='vertical'
					onFinish={(values) => {
						onSubmit(values);
						form.resetFields();
					}}
				>
					<div className=''>
						<Form.Item label='Location' name='location' rules={[{ required: true, message: 'Please enter your location' }]}>
							<Input placeholder='Enter your location' size='large' />
						</Form.Item>

						<Form.Item label='Driver Name' name='driverName' rules={[{ required: true, message: 'Please enter driver name' }]}>
							<Input placeholder='Enter driver name' size='large' />
						</Form.Item>

						<Form.Item label='Shift' name='shift' rules={[{ required: true, message: 'Please select shift' }]}>
							<Select
								placeholder='Select shift'
								options={[
									{ label: 'Morning', value: 'Morning' },
									{ label: 'Evening', value: 'Evening' },
								]}
								size='large'
							/>
						</Form.Item>

						<Form.Item label='Reading' name='reading' rules={[{ required: true, message: 'Please enter a valid reading' }]}>
							<Input className='w-full' placeholder='Enter reading' type='number' size='large' disabled />
						</Form.Item>
						<Form.Item label='Status' name='status' rules={[{ required: true, message: 'Please enter a status' }]}>
							<Input className='w-full' placeholder='Enter reading' type='number' size='large' disabled />
						</Form.Item>

						<Form.Item label='Remark' name='remark'>
							<Input placeholder='Enter remark' size='large' />
						</Form.Item>
					</div>

					<Form.Item className='absolute bottom-0'>
						<Button type='primary' htmlType='submit' size='large' className='w-[calc(350px-30px)]'>
							Add Record
						</Button>
					</Form.Item>
				</Form>
			</Drawer>
		</ConfigProvider>
	);
};
