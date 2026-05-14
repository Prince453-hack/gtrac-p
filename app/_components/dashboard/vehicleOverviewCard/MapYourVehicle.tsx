'use client';

import { setMapYourInfoIndex } from '@/app/_globalRedux/dashboard/optionsSlice';
import { useMapYourVehicleQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { MapYourVehicleData } from '@/app/_globalRedux/services/types/post/mapYourVehicle';
import { RootState } from '@/app/_globalRedux/store';
import { Button, Checkbox, Form, Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const initialState: MapYourVehicleData = {
	group_id: 0,
	lorry_no: '',
	oldlorry_no: '',
	sys_service_id: '',
	username: '',
};

export const MapYourVehicle = ({ vehicleData }: { vehicleData: VehicleData }) => {
	const { mapYourVehicleIndex } = useSelector((state: RootState) => state.vehicleOverviewOptions);
	const { userName, groupId, userId } = useSelector((state: RootState) => state.auth);

	const dispatch = useDispatch();

	const [mapYourVehicleDataState, setMapYourVehicleDataState] = useState<MapYourVehicleData>(initialState);
	const [promiseLoading, setPromiseLoading] = useState(false);

	const { isLoading } = useMapYourVehicleQuery(
		{ ...mapYourVehicleDataState },
		{
			skip: !mapYourVehicleDataState.group_id || !mapYourVehicleDataState.oldlorry_no || !mapYourVehicleDataState.sys_service_id,
		}
	);

	const onFinish = (e: any) => {
		if (Number(userId) === 87162 || Number(userId) === 87317) {
			// concanate all forms into lorry_no

			const data: MapYourVehicleData = {
				group_id: Number(groupId) || 0,
				lorry_no: e['vehicle-number'] || '',
				oldlorry_no: vehicleData.vehReg,
				sys_service_id: `${vehicleData.vId}`,
				username: userName,
			};

			setMapYourVehicleDataState(data);
		} else if (e['un-map-your-vehicle'] || (e['vehicle-number'] && userName == 'mahindraelock')) {
			const data: MapYourVehicleData = {
				group_id: Number(groupId) || 0,
				lorry_no: e['vehicle-number'] || '',
				oldlorry_no: vehicleData.vehReg,
				sys_service_id: `${vehicleData.vId}`,
				username: userName,
			};

			setMapYourVehicleDataState(data);
		}
	};

	useEffect(() => {
		if (mapYourVehicleDataState.group_id || mapYourVehicleDataState.oldlorry_no || mapYourVehicleDataState.sys_service_id) {
			if (isLoading) {
				setPromiseLoading(true);
			} else {
				setPromiseLoading(false);
				dispatch(setMapYourInfoIndex(-1));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		mapYourVehicleDataState.group_id,
		mapYourVehicleDataState.lorry_no,
		mapYourVehicleDataState.oldlorry_no,
		mapYourVehicleDataState.sys_service_id,
		isLoading,
	]);

	return (
		<>
			{mapYourVehicleIndex === vehicleData.vId ? (
				<Modal
					title='Map Your Vehicle'
					open={mapYourVehicleIndex !== -1}
					onCancel={() => dispatch(setMapYourInfoIndex(-1))}
					width={400}
					footer={null}
				>
					<Form
						onFinish={(e) => onFinish(e)}
						style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '15px' }}
						className='select-none'
						layout='vertical'
					>
						<div className='mt-2'>
							{typeof vehicleData.vehReg === 'string' && (
								<div className='flex flex-col gap-3'>
									<Form.Item name={['un-map-your-vehicle']} valuePropName='checked' noStyle>
										<Checkbox>Un-map your vehicle</Checkbox>
									</Form.Item>
									<div className='flex items-center justify-between'>
										<div className='w-full h-0.5 bg-neutral-200'></div>
										<div className='font-semibold text-neutral-500 w-[50%] text-center'>OR</div>
										<div className='w-full h-0.5 bg-neutral-200'></div>
									</div>

									<p className='leading-none font-semibold'>Assign it to existing vehicle:</p>
									<Form.Item
										name={['vehicle-number']}
										rules={[
											{ pattern: /^[a-zA-Z0-9-_\/]+$/, message: 'Special characters are not allowed' },
											{ max: 50, message: 'Length should be less than 50 characters' },
										]}
										noStyle
									>
										<Input placeholder={'Enter vehicle number'} allowClear maxLength={50} />
									</Form.Item>
								</div>
							)}
						</div>

						<div className='flex gap-2 justify-end'>
							<Form.Item noStyle>
								<Button type='primary' htmlType='submit' loading={promiseLoading}>
									Submit
								</Button>
							</Form.Item>
							<Form.Item noStyle>
								<Button onClick={() => dispatch(setMapYourInfoIndex(-1))}>Cancel</Button>
							</Form.Item>
						</div>
					</Form>
				</Modal>
			) : null}
		</>
	);
};
