import React from 'react';
import { VehicleStatusToggle } from './VehicleStatusToggle';
import { TripStatusToggle } from './TripStatusToggle';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';

export const ToggleVehicleStatusAndTripStatus = () => {
	const { type } = useSelector((state: RootState) => state.isVehicleStatusOrTripStatusActive);

	if (type === 'vehicle' || type === 'video') {
		return <VehicleStatusToggle />;
	} else {
		return <TripStatusToggle />;
	}
};
