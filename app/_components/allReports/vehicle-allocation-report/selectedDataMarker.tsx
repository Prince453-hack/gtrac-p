'use client';

import { RootState } from '@/app/_globalRedux/store';
import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { iconFactory } from '@/app/_components/dashboard/react-leaflet/utils/iconFactory';

import { MovementInfoWindow } from '../../dashboard/react-leaflet/MovementInfoWindow';

export const SelectedDataMarker = ({ selectedData }: { selectedData: any }) => {
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const auth = useSelector((state: RootState) => state.auth);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	const [vehicleVar, setVehicleVar] = useState('');

	let manualPathIndex = 0;
	if (vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length >= 2) {
		manualPathIndex = Math.floor((historyReplay.manualPath / 100) * (vehicleItnaryWithPath.patharry.length - 2));
	}

	useEffect(() => {
		if (auth) {
			let tempVehicleVar = auth.vehicleType.toLowerCase();
			if (tempVehicleVar === 'camera') {
				setVehicleVar('bus');
			} else if (tempVehicleVar === 'cab') {
				setVehicleVar('car');
			} else if (auth.vehicleType === null || auth.vehicleType === '' || auth.vehicleType === undefined) {
				setVehicleVar('truck');
			} else {
				setVehicleVar(auth.vehicleType.toLowerCase());
			}
		}
	}, [auth]);
	function openPopup(e: any) {
		e.target.openPopup();
	}
	return (
		<>
			{vehicleItnaryWithPath.patharry.length >= 2 ? (
				<Marker
					position={[
						vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lat,
						vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lng,
					]}
					icon={iconFactory(`/assets/images/map/vehicles/${vehicleVar}-green.png`)}
					eventHandlers={{ add: openPopup }}
				>
					<Popup autoClose={false} closeOnClick={false}>
						<MovementInfoWindow
							selectedVehicle={selectedVehicle}
							vehicleItnaryWithPath={vehicleItnaryWithPath}
							historyReplay={historyReplay}
							manualPathIndex={0}
						/>
					</Popup>
				</Marker>
			) : null}
		</>
	);
};
