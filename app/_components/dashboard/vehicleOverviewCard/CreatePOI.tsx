'use client';

import { setCreatePoiIndex } from '@/app/_globalRedux/dashboard/optionsSlice';
import { useLazyCreatePOIQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { RootState } from '@/app/_globalRedux/store';
import { Button, Input, Modal } from 'antd';
import React from 'react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface CreatePOIProps {
	vehicleData?: VehicleData;
	type: 'Lat_Lng_Based' | 'Vehicle_Based';
	setGlobalSettingActive?: Dispatch<SetStateAction<'create-manual-poi' | 'get-nearby-location' | undefined>>;
	globalSettingActive?: 'create-manual-poi';
}

export const CreatePOI = ({ vehicleData, type, setGlobalSettingActive, globalSettingActive }: CreatePOIProps) => {
	const { createPOIIndex } = useSelector((state: RootState) => state.vehicleOverviewOptions);
	const { userId } = useSelector((state: RootState) => state.auth);

	const [promiseLoading, setPromiseLoading] = useState(false);
	const [radius, setRadius] = useState(0);
	const [poiName, setPoiName] = useState('');

	const [latLng, setLatLng] = useState({ lat: '', lng: '' });

	const dispatch = useDispatch();

	const [triggerCreatePOI, { isLoading }] = useLazyCreatePOIQuery();

	const onFinish = () => {
		if (type === 'Vehicle_Based') {
			if (vehicleData) {
				if (poiName && radius && vehicleData.gpsDtl.latLngDtl.lat && vehicleData.gpsDtl.latLngDtl.lng && userId) {
					triggerCreatePOI({
						poiName: poiName,
						radius: radius,
						lat: vehicleData.gpsDtl.latLngDtl.lat,
						long: vehicleData.gpsDtl.latLngDtl.lng,
						userId: userId,
						isGeofence: 0,
					});
				}
			}
		} else {
			if (userId) {
				triggerCreatePOI({
					poiName: poiName,
					radius: radius,
					lat: Number(latLng.lat),
					long: Number(latLng.lng),
					userId: userId,
					isGeofence: 0,
				});
			}
		}
	};

	useEffect(
		() => {
			if (isLoading) {
				setPromiseLoading(true);
			} else {
				if (promiseLoading) {
					setPromiseLoading(false);
					if (type === 'Vehicle_Based') {
						dispatch(setCreatePoiIndex(-1));
					} else {
						setGlobalSettingActive && setGlobalSettingActive(undefined);
					}
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isLoading]
	);

	return (
		<>
			{type === 'Lat_Lng_Based' || (vehicleData && createPOIIndex === vehicleData.vId) ? (
				<Modal
					title='Create POI'
					open={type === 'Vehicle_Based' ? createPOIIndex !== -1 : globalSettingActive === 'create-manual-poi'}
					onCancel={() => (type === 'Vehicle_Based' ? dispatch(setCreatePoiIndex(-1)) : setGlobalSettingActive && setGlobalSettingActive(undefined))}
					width={400}
					footer={null}
				>
					<div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '15px' }} className='select-none'>
						<div className='text-sm text-neutral-800 flex flex-col gap-2 mt-3 overflow-clip rounded-lg font-medium'>
							<div className=' pb-3 flex flex-col gap-2'>
								<div className='grid grid-cols-3 gap-2 items-center'>
									<div className='font-bold'>Name :</div>
									<div className='col-span-2'>
										<Input placeholder="Enter POI's Name" value={poiName} onChange={(e) => setPoiName(e.target.value)} />
									</div>

									<div className='font-bold'>Radius :</div>
									<div className='col-span-2'>
										<Input
											placeholder='Enter Radius in KM'
											value={radius}
											onChange={(e) => !isNaN(Number(e.target.value)) && setRadius(Number(e.target.value))}
										/>
									</div>

									<div className='font-bold'>Lat ⎪ Lng :</div>
									<div className='col-span-2 flex gap-2'>
										{type === 'Lat_Lng_Based' ? (
											<>
												<Input onChange={(e) => setLatLng({ lat: e.target.value, lng: latLng.lng })} value={latLng.lat} placeholder='Enter Lat' />
												<Input onChange={(e) => setLatLng({ lat: latLng.lat, lng: e.target.value })} value={latLng.lng} placeholder='Enter Lng' />
											</>
										) : vehicleData ? (
											<>
												<Input
													onChange={(e) => setLatLng({ lat: e.target.value, lng: latLng.lng })}
													value={latLng.lat || vehicleData.gpsDtl.latLngDtl.lat}
													placeholder='Enter Lat'
												/>
												<Input
													onChange={(e) => setLatLng({ lat: latLng.lat, lng: e.target.value })}
													value={latLng.lng || vehicleData.gpsDtl.latLngDtl.lng}
													placeholder='Enter Lng'
												/>
											</>
										) : null}
									</div>
								</div>
							</div>
						</div>

						<div className='flex gap-2 justify-end mt-6'>
							<Button
								type='primary'
								onClick={() => onFinish()}
								loading={promiseLoading}
								disabled={!poiName && !radius && vehicleData && !vehicleData.gpsDtl.latLngDtl.lat && !vehicleData.gpsDtl.latLngDtl.lng && !userId}
							>
								Submit
							</Button>

							<Button
								onClick={() =>
									type === 'Vehicle_Based' ? dispatch(setCreatePoiIndex(-1)) : setGlobalSettingActive && setGlobalSettingActive(undefined)
								}
							>
								Cancel
							</Button>
						</div>
					</div>
				</Modal>
			) : null}
		</>
	);
};
