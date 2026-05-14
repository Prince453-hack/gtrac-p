'use client';

import { setIsGetNearbyVehiclesActive, setRadiusInKilometers, setSelectedVehicleOption } from '@/app/_globalRedux/dashboard/nearbyVehicleSlice';
import { RootState } from '@/app/_globalRedux/store';
import { CheckCircleFilled } from '@ant-design/icons';
import { FloatButton, Tooltip } from 'antd';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { setNearbyVehicles } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import NearbyVehicle from '@/app/_assets/svgs/map/nearbyVehicle';

const NearbyVehiclesToggle = () => {
	const dispatch = useDispatch();
	const { isGetNearbyVehiclesActive } = useSelector((state: RootState) => state.nearbyVehicles);
	return (
		<FloatButton
			onClick={() => {
				if (isGetNearbyVehiclesActive) {
					dispatch(setSelectedVehicleOption(undefined));
					dispatch(setRadiusInKilometers(0));
					dispatch(setNearbyVehicles(undefined));
					dispatch(setIsGetNearbyVehiclesActive(false));
				} else {
					dispatch(setIsGetNearbyVehiclesActive(true));
				}
			}}
			icon={<NearbyVehicle />}
			tooltip={isGetNearbyVehiclesActive ? 'Disable Nearby Vehicles' : 'Enable Nearby Vehicles'}
		></FloatButton>
	);
};

export default NearbyVehiclesToggle;
