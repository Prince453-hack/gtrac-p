'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';

export const NearbyMarkers = () => {
	const map = useMap();
	const markerRef = useRef<google.maps.Marker | null>(null);
	const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
	const infoWindowManuallyClosedRef = useRef<boolean>(false);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);

	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const { isGetNearbyVehiclesActive } = useSelector((state: RootState) => state.nearbyVehicles);
	const auth = useSelector((state: RootState) => state.auth);

	useEffect(
		() => {
			if (!map) return;

			const shouldCreateMarkers = isGetNearbyVehiclesActive === true;
			if (shouldCreateMarkers) {
				if (selectedVehicle.nearbyVehicles && selectedVehicle.nearbyVehicles.length > 0) {
					const markers = selectedVehicle.nearbyVehicles.map((vehicle, index) => {
						const isSelectedVehicle = vehicle.veh_reg === selectedVehicle.vehReg;
						const vehicleType = auth.vehicleType?.toLowerCase() || 'truck';
						const iconUrl = isSelectedVehicle
							? `/assets/images/map/vehicles/${vehicleType}-orange.png`
							: `/assets/images/map/vehicles/${vehicleType}-green.png`;

						const marker = new google.maps.Marker({
							position: { lat: Number(vehicle.gps_latitude), lng: Number(vehicle.gps_longitude) },
							map: map,
							icon: {
								url: iconUrl,
								scaledSize: new google.maps.Size(60, 60),
								anchor: new google.maps.Point(30, 30),
							},
							title: vehicle.veh_reg || `Vehicle ${index + 1}`,
							zIndex: isSelectedVehicle ? 100 : 99,
						});

						marker.addListener('click', () => {
							map.setCenter({ lat: Number(vehicle.gps_latitude), lng: Number(vehicle.gps_longitude) });
							infoWindow.setContent(generateInfoWindowContent(vehicle));
							infoWindow.open(map, marker);
						});

						return marker;
					});

					const infoWindow = new google.maps.InfoWindow();

					return () => {
						markers.forEach((marker) => marker.setMap(null));
						infoWindow.close();
					};
				}
			} else {
				if (markerRef.current) {
					markerRef.current.setMap(null);
					markerRef.current = null;
				}

				if (infoWindowRef.current) {
					infoWindowRef.current.close();
				}

				infoWindowManuallyClosedRef.current = false;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[map, vehicleItnaryWithPath, selectedVehicle, auth.vehicleType]
	);

	return null;
};

// Generate HTML content for the InfoWindow
function generateInfoWindowContent(vehicle: NearbyVehiclesWithInfoWindow) {
	return `
   <div className='text-gray-800 flex flex-col gap-1 max-w-80'>
			<div className='absolute top-5'>
				<p className='font-medium text-lg'></p>
			</div>
			<div className='grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal'>
				<div className='col-span-2 font-medium text-neutral-700'>Vehicle Number:</div>
				<div className='col-span-3'>${vehicle.veh_reg ? vehicle.veh_reg : null}</div>
				<div className='col-span-2 font-medium text-neutral-700'>Lat | Lng</div>
                <div className='col-span-3 cursor-pointer'>
					${vehicle.gps_longitude} | ${vehicle.gps_latitude}
				</div>
				<div className='col-span-2 font-medium text-neutral-700'>Distance:</div>
				<div className='col-span-3 cursor-pointer'>
					${vehicle.distance} Km
				</div>
			</div>
		</div>
  `;
}
