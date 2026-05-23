'use client';

import { RootState } from '@/app/_globalRedux/store';
import React, { useEffect, useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useSelector } from 'react-redux';
import { iconFactory } from './utils/iconFactory';
import checkIfIgnitionOnOrOff from '@/app/helpers/checkIfIgnitionOnOrOff';
import MultipleVehicleInfoWindow from './MultipleVehicleInfoWindow';
import { isCheckInAccount } from '@/app/helpers/isCheckInAccount';

function MultipleVehicleMarkers() {
	const markers = useSelector((state: RootState) => state.markers);
	const auth = useSelector((state: RootState) => state.auth);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const cluster = useSelector((state: RootState) => state.cluster);

	// * create a local state toggle
	const [vehicleVar, setVehicleVar] = useState('');

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

	return (
		<MarkerClusterGroup chunkedLoading maxClusterRadius={cluster ? 80 : 0}>
			{selectedVehicle.vId === 0
				? markers.map((marker, index) =>
						marker.visibility ? (
							<Marker
								position={[marker.gpsDtl.latLngDtl.lat, marker.gpsDtl.latLngDtl.lng]}
								icon={
									isCheckInAccount(Number(auth.userId))
										? iconFactory(`/assets/images/map/vehicles/checkin.png`)
										: marker.gpsDtl.notworkingHrs >= 24
										? iconFactory(`/assets/images/map/vehicles/${vehicleVar}-black.png`)
										: checkIfIgnitionOnOrOff({
												ignitionState: marker.gpsDtl.ignState.toLowerCase() as 'off' | 'on',
												speed: marker.gpsDtl.speed,
												mode: marker.gpsDtl.mode,
										  }) === 'On'
										? iconFactory(`/assets/images/map/vehicles/${vehicleVar}-green.png`)
										: iconFactory(`/assets/images/map/vehicles/${vehicleVar}-red.png`)
								}
								key={index}
							>
								<Tooltip direction='top' offset={[0, -10]} opacity={1} permanent>
									<div style={{ display: 'flex', alignItems: 'center' }}>
										<span>{marker.vehReg}</span>
									</div>
								</Tooltip>
								<Popup>
									<MultipleVehicleInfoWindow marker={marker} />
								</Popup>
							</Marker>
						) : null
				  )
				: null}
		</MarkerClusterGroup>
	);
}

export default MultipleVehicleMarkers;
