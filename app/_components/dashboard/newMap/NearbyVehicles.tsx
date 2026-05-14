'use client';

import { RootState } from '@/app/_globalRedux/store';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

export const NearbyVehiclesMarker = () => {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const auth = useSelector((state: RootState) => state.auth);

	const [vehicleVar, setVehicleVar] = useState('');
	const [openInfoWindowId, setOpenInfoWindowId] = useState<string | null>(null);

	useEffect(() => {
		if (auth) {
			let tempVehicleVar = auth.vehicleType.toLowerCase();
			if (tempVehicleVar === 'camera') {
				setVehicleVar('bus');
			} else if (tempVehicleVar === 'cab') {
				setVehicleVar('car');
			} else {
				setVehicleVar(tempVehicleVar);
			}
		}
	}, [auth]);

	return (
		<>
			{selectedVehicle.nearbyVehicles && selectedVehicle.nearbyVehicles.length > 0
				? selectedVehicle.nearbyVehicles.map((vehicle, index) => {
						const isSelectedVehicle = Number(vehicle.sys_service_id) === selectedVehicle.vId;
						const iconUrl = isSelectedVehicle
							? `/assets/images/map/vehicles/${vehicleVar}-orange.png`
							: `/assets/images/map/vehicles/${vehicleVar}-green.png`;

						return (
							<AdvancedMarker
								key={vehicle.sys_service_id} // Use unique ID only
								position={{
									lat: Number(vehicle.gps_latitude),
									lng: Number(vehicle.gps_longitude),
								}}
								onClick={!isSelectedVehicle ? () => setOpenInfoWindowId(vehicle.sys_service_id) : undefined}
							>
								<div style={{ position: 'relative', textAlign: 'center' }}>
									<img src={iconUrl} alt='Vehicle' width={60} height={60} />
									<div
										style={{
											position: 'absolute',
											top: '39px',
											left: '50%',
											transform: 'translateX(-50%)',
											backgroundColor: '#e6f5e9',
											padding: '2px 4px',
											borderRadius: '4px',
											fontSize: '12px',
											color: '#000',
											maxWidth: '100px',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											fontWeight: 'bold',
										}}
									>
										{vehicle.veh_reg}
									</div>
								</div>
								{openInfoWindowId === vehicle.sys_service_id && (
									<MarkersCustomInfoWindow marker={vehicle} onClose={() => setOpenInfoWindowId(null)} />
								)}
							</AdvancedMarker>
						);
				  })
				: null}
		</>
	);
};

const MarkersCustomInfoWindow = ({ marker, onClose }: { marker: any; onClose?: () => void }) => {
	return (
		<InfoWindow
			position={{
				lat: Number(marker.gps_latitude),
				lng: Number(marker.gps_longitude),
			}}
			onCloseClick={onClose}
		>
			<div className='text-xs text-gray-800 flex flex-col gap-1 max-w-80'>
				<div className='flex justify-between mb-2 absolute top-5'>
					<p className='font-medium text-lg'>Vehicle Information</p>
				</div>
				<div className='grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-2 font-medium text-neutral-700'>Vehicle Number:</div>
					<div className='col-span-3'>{marker.veh_reg}</div>
					<div className='col-span-2 font-medium text-neutral-700'>Location:</div>
					<div className='col-span-3'>
						{Number(marker.gps_latitude).toFixed(2)} ⎪ {Number(marker.gps_longitude).toFixed(2)}
					</div>
					<div className='col-span-2 font-medium text-neutral-700'>Distance:</div>
					<div className='col-span-3'>{marker.distance} KM</div>
					<div className='col-span-2 font-medium text-neutral-700'>Speed:</div>
					<div className='col-span-3'>{marker.gps_speed} kmph</div>
				</div>
			</div>
		</InfoWindow>
	);
};
