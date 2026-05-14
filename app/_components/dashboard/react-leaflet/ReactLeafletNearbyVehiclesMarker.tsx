'use client';

import { RootState } from '@/app/_globalRedux/store';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { iconFactory } from './utils/iconFactory';

export const ReactLeafletNearbyVehiclesMarker = () => {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const auth = useSelector((state: RootState) => state.auth);
	const cluster = useSelector((state: RootState) => state.cluster);

	const [vehicleVar, setVehicleVar] = useState('');

	useEffect(() => {
		if (auth) {
			let tempVehicleVar = auth.vehicleType.toLowerCase();
			if (tempVehicleVar === 'camera') {
				setVehicleVar('bus');
			} else if (tempVehicleVar === 'cab') {
				setVehicleVar('car');
			} else {
				setVehicleVar(auth.vehicleType.toLowerCase());
			}
		}
	}, [auth]);

	return (
		<>
			<MarkerClusterGroup chunkedLoading maxClusterRadius={cluster ? 80 : 0}>
				<>
					{selectedVehicle.nearbyVehicles && selectedVehicle.nearbyVehicles.length > 0
						? selectedVehicle.nearbyVehicles.map((vehicle, index) => {
								return Number(vehicle.sys_service_id) !== selectedVehicle.vId ? (
									<Marker
										position={{
											lat: Number(vehicle.gps_latitude),
											lng: Number(vehicle.gps_longitude),
										}}
										key={vehicle.sys_service_id + index}
										icon={iconFactory(`/assets/images/map/vehicles/${vehicleVar}-green.png`)}
									>
										<Tooltip direction='top' offset={[0, -10]} opacity={1} permanent>
											<div style={{ display: 'flex', alignItems: 'center' }}>
												<span>{selectedVehicle.vehReg}</span>
											</div>
										</Tooltip>
										<MarkersCustomInfoWindow marker={vehicle} />
									</Marker>
								) : (
									<Marker
										position={{
											lat: Number(vehicle.gps_latitude),
											lng: Number(vehicle.gps_longitude),
										}}
										key={vehicle.sys_service_id + index}
										icon={iconFactory(`/assets/images/map/vehicles/${vehicleVar}-orange.png`)}
									>
										<Tooltip direction='top' offset={[0, -10]} opacity={1} permanent>
											<div style={{ display: 'flex', alignItems: 'center' }}>
												<span>{selectedVehicle.vehReg}</span>
											</div>
										</Tooltip>
										<MarkersCustomInfoWindow marker={vehicle} />
									</Marker>
								);
						  })
						: null}
				</>
			</MarkerClusterGroup>
		</>
	);
};

const MarkersCustomInfoWindow = ({ marker }: { marker: NearbyVehiclesWithInfoWindow }) => {
	return (
		<Popup
			position={{
				lat: Number(marker.gps_latitude),
				lng: Number(marker.gps_longitude),
			}}
		>
			<div className='text-xs  text-gray-800  flex flex-col gap-1 max-w-80'>
				<div className='flex justify-between mb-2 absolute top-5'>
					<p className='font-medium text-lg'>Vehicle Information</p>
				</div>

				<div className='grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-2 font-medium text-neutral-700 '>Vehicle Number:</div> <div className='col-span-3'>{marker.veh_reg}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Location:</div>{' '}
					<div className='col-span-3'>
						{Number(marker.gps_latitude).toFixed(2)} ⎪ {Number(marker.gps_longitude).toFixed(2)}
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Distance: </div> <div className='col-span-3'> {marker.distance} KM</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Speed:</div> <div className='col-span-3'>{marker.gps_speed} kmph</div>
				</div>
			</div>
		</Popup>
	);
};
