'use client';

import { RootState } from '@/app/_globalRedux/store';
import { InfoWindow, Marker, MarkerClusterer } from '@/@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { setNearbyVehicles } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { useEffect, useState } from 'react';

export const NearbyVehiclesMarker = () => {
	const dispatch = useDispatch();

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
			<MarkerClusterer options={{ minimumClusterSize: cluster ? undefined : 99999 }}>
				{(clusterer) => (
					<>
						{selectedVehicle.nearbyVehicles && selectedVehicle.nearbyVehicles.length > 0
							? selectedVehicle.nearbyVehicles.map((vehicle, index) => {
									return Number(vehicle.sys_service_id) !== selectedVehicle.vId ? (
										<Marker
											clusterer={clusterer}
											position={{
												lat: Number(vehicle.gps_latitude),
												lng: Number(vehicle.gps_longitude),
											}}
											key={vehicle.sys_service_id + index}
											onClick={() =>
												dispatch(
													setNearbyVehicles(
														selectedVehicle.nearbyVehicles?.map((nearbyVehicle) =>
															vehicle.sys_service_id === nearbyVehicle.sys_service_id
																? { ...nearbyVehicle, isInfoWindowOpen: true }
																: { ...nearbyVehicle }
														)
													)
												)
											}
											icon={{
												url: `/assets/images/map/vehicles/${vehicleVar}-green.png`,
												scale: 1,
												scaledSize: new window.google.maps.Size(60, 60),
												anchor: { x: 30, y: 30, equals: () => false },
											}}
											label={{
												text: vehicle.veh_reg,
												color: '#000',
												fontSize: '12px',
												className: 'mt-[39px] bg-white p-0.5 px-1 rounded max-w-[100px] truncate font-bold ',
											}}
										>
											{vehicle.isInfoWindowOpen ? <MarkersCustomInfoWindow marker={vehicle} /> : null}
										</Marker>
									) : (
										<Marker
											position={{
												lat: Number(vehicle.gps_latitude),
												lng: Number(vehicle.gps_longitude),
											}}
											key={vehicle.sys_service_id + index}
											icon={{
												url: `/assets/images/map/vehicles/${vehicleVar}-orange.png`,
												scale: 1,
												scaledSize: new window.google.maps.Size(60, 60),
												anchor: { x: 30, y: 30, equals: () => false },
											}}
											label={{
												text: vehicle.veh_reg,
												color: '#000',
												fontSize: '12px',
												className: 'mt-[39px] bg-white p-0.5 px-1 rounded max-w-[100px] truncate font-bold ',
											}}
										>
											{vehicle.isInfoWindowOpen ? <MarkersCustomInfoWindow marker={vehicle} /> : null}
										</Marker>
									);
							  })
							: null}
					</>
				)}
			</MarkerClusterer>
		</>
	);
};

const MarkersCustomInfoWindow = ({ marker }: { marker: NearbyVehiclesWithInfoWindow }) => {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const dispatch = useDispatch();
	return (
		<InfoWindow
			position={{
				lat: Number(marker.gps_latitude),
				lng: Number(marker.gps_longitude),
			}}
			onCloseClick={() =>
				dispatch(
					setNearbyVehicles(
						selectedVehicle.nearbyVehicles?.map((nearbyVehicle) =>
							marker.sys_service_id === nearbyVehicle.sys_service_id ? { ...nearbyVehicle, isInfoWindowOpen: false } : { ...nearbyVehicle }
						)
					)
				)
			}
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
		</InfoWindow>
	);
};
