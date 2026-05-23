'use client';

import React, { useEffect, useState } from 'react';
import { Markers as MarkersType } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { RootState } from '@/app/_globalRedux/store';
import { Marker, MarkerClusterer, InfoWindow, OverlayView } from '@/@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip } from 'antd';
import { useGetVehicleCurrentLocationQuery } from '@/app/_globalRedux/services/trackingDashboard';
import updateSingleVehicleMovement from '@/app/helpers/updateSingleVehicleMovement';
import checkIfIgnitionOnOrOff from '@/app/helpers/checkIfIgnitionOnOrOff';
import { getAbbreviation } from '@/app/helpers/getAbbreviation';
import { resetIsMarkerInfoWindowOpen, setIsMarkerInfoWindowOpen } from '@/app/_globalRedux/dashboard/markerInfoWindow';
import { isCheckInAccount } from '@/app/helpers/isCheckInAccount';
import { getLatestGPSTime } from './utils/getLatestGPSTime';
import { getNormalOrControllerId } from './utils/getNormalOrControllerId';

const calculateBearing = (prevLat: number, prevLng: number, currLat: number, currLng: number) => {
	const toRadians = (degrees: number) => degrees * (Math.PI / 180);
	const toDegrees = (radians: number) => radians * (180 / Math.PI);

	const φ1 = toRadians(prevLat);
	const φ2 = toRadians(currLat);
	const λ1 = toRadians(prevLng);
	const λ2 = toRadians(currLng);

	const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
	const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
	const bearing = toDegrees(Math.atan2(y, x));

	return (bearing + 360) % 360; // Normalize to 0-360 degrees
};

export const Markers = () => {
	const markers = useSelector((state: RootState) => state.markers);
	const auth = useSelector((state: RootState) => state.auth);
	const cluster = useSelector((state: RootState) => state.cluster);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const liveVehicleItnaryWithPath = useSelector((state: RootState) => state.liveVehicleData);
	const { type: vehicleListType } = useSelector((state: RootState) => state.isVehicleStatusOrTripStatusActive);
	const isMarkerInfoWindowOpen = useSelector((state: RootState) => state.isMarkerInfoWindowOpen);

	const [prevPosition, setPrevPosition] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null }); // Store previous position
	const [rotation, setRotation] = useState(0); // Store calculated rotation angle

	// * create a local state toggle
	const [vehicleVar, setVehicleVar] = useState('');

	const {
		data: currentVehicleLocationData,
		isLoading,
		isFetching: isFetchingCurrentVehicleLocation,
	} = useGetVehicleCurrentLocationQuery(
		{
			userId: Number(auth.userId),
			vehId: auth.accessLabel === 6 ? getNormalOrControllerId(selectedVehicle) : selectedVehicle.vId,
		},
		{ skip: selectedVehicle.vId === 0 || historyReplay.isHistoryReplayMode, pollingInterval: 10000 }
	);

	const getIconUrl = (marker: MarkersType) => {
		return isCheckInAccount(Number(auth.userId))
			? `/assets/images/map/vehicles/checkin.png`
			: Number(auth.userId) === 85182
			? `/assets/images/map/vehicles/${vehicleVar}-black.png`
			: marker.gpsDtl.notworkingHrs >= 24
			? `/assets/images/map/vehicles/${vehicleVar}-black.png`
			: checkIfIgnitionOnOrOff({
					ignitionState: marker.gpsDtl.ignState.toLowerCase() as 'off' | 'on',
					speed: marker.gpsDtl.speed,
					mode: marker.gpsDtl.mode,
			  }) === 'On'
			? `/assets/images/map/vehicles/${vehicleVar}-green.png`
			: `/assets/images/map/vehicles/${vehicleVar}-red.png`;
	};

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

	useEffect(() => {
		if (!isLoading && !isFetchingCurrentVehicleLocation && !historyReplay.isHistoryReplayMode) {
			if (currentVehicleLocationData?.success === true && markers) {
				if (
					vehicleItnaryWithPath.patharry.length > 0 &&
					((vehicleItnaryWithPath.patharry[0].lat !== 0 && vehicleItnaryWithPath.patharry[0].lng !== 0) ||
						currentVehicleLocationData.list.mode !== 'NOT WORKING')
				) {
					updateSingleVehicleMovement({
						dispatch,
						vehicleItnaryWithPath,
						currentVehicleLocationData,
						liveVehicleItnaryWithPath,
						markers,
						selectedVehicle,
					});
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentVehicleLocationData, isLoading, isFetchingCurrentVehicleLocation]);

	// Calculate rotation angle based on previous and current positions
	useEffect(() => {
		if (selectedVehicle && selectedVehicle.gpsDtl.latLngDtl.lat !== 0 && selectedVehicle.gpsDtl.latLngDtl.lng !== 0) {
			const currentLat = selectedVehicle.gpsDtl.latLngDtl.lat;
			const currentLng = selectedVehicle.gpsDtl.latLngDtl.lng;

			// If we have a previous position, calculate the bearing
			if (prevPosition.lat !== null && prevPosition.lng !== null) {
				const bearing = calculateBearing(prevPosition.lat, prevPosition.lng, currentLat, currentLng);
				bearing ? setRotation(bearing) : null;
			}

			// Update the previous position to the current one
			setPrevPosition({ lat: currentLat, lng: currentLng });
		}
	}, [markers, selectedVehicle]);

	const dispatch = useDispatch();

	return (
		<>
			{markers.length ? (
				<MarkerClusterer options={{ minimumClusterSize: cluster ? undefined : 99999 }}>
					{(clusterer) => (
						<>
							{selectedVehicle.vId === 0
								? markers.map((marker: MarkersType, index) => {
										return marker.visibility ? (
											<Marker
												key={index}
												position={{
													lat: auth.accessLabel === 6 && getLatestGPSTime(marker) === 'ELOCK' ? marker.ELOCKInfo.lat : marker.gpsDtl.latLngDtl.lat,
													lng: auth.accessLabel === 6 && getLatestGPSTime(marker) === 'ELOCK' ? marker.ELOCKInfo.lng : marker.gpsDtl.latLngDtl.lng,
												}}
												icon={{
													url: getIconUrl(marker),
													scale: 1,
													scaledSize: new window.google.maps.Size(60, 60),
													anchor: { x: 30, y: 30, equals: () => false },
												}}
												clusterer={clusterer}
												label={{
													text:
														vehicleListType === 'trip' || vehicleListType === 'vehicle-allocation-trip'
															? `${getAbbreviation(marker.vehicleTrip.station_from_location)}-${getAbbreviation(
																	marker.vehicleTrip.station_to_location
															  )} \n ${marker.vehReg}`
															: marker.vehReg,

													color: '#000',
													fontSize: '12px',
													className: 'mt-[39px] bg-white p-0.5 px-1 rounded  truncate font-bold ',
												}}
												onClick={() => dispatch(setIsMarkerInfoWindowOpen(marker.vId))}
											>
												{isMarkerInfoWindowOpen === marker.vId ? <MarkersCustomInfoWindow marker={marker} /> : null}
											</Marker>
										) : (
											<Marker key={index} clusterer={clusterer} />
										);
								  })
								: markers.map((marker, index) => {
										return marker.vId === selectedVehicle.vId && !historyReplay.isHistoryReplayMode ? (
											<OverlayView
												position={{
													lat:
														auth.accessLabel === 6 && getLatestGPSTime(selectedVehicle) === 'ELOCK'
															? selectedVehicle.ELOCKInfo.lat
															: selectedVehicle.gpsDtl.latLngDtl.lat,
													lng:
														auth.accessLabel === 6 && getLatestGPSTime(selectedVehicle) === 'ELOCK'
															? selectedVehicle.ELOCKInfo.lng
															: selectedVehicle.gpsDtl.latLngDtl.lng,
												}}
												mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
												getPixelPositionOffset={() => ({ x: -30, y: -30 })} // Adjusted offset to center the icon
											>
												<div onClick={() => dispatch(setIsMarkerInfoWindowOpen(selectedVehicle.vId))} style={{ position: 'relative', zIndex: 100 }}>
													{/* eslint-disable-next-line @next/next/no-img-element, @next/next/no-img-element */}
													<img
														src={getIconUrl(markers.find((marker) => marker.vId === selectedVehicle.vId) as MarkersType)}
														alt='Selected Vehicle'
														width={60}
														height={60}
														style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
													/>
												</div>
											</OverlayView>
										) : (
											<Marker key={index} clusterer={clusterer} />
										);
								  })}
						</>
					)}
				</MarkerClusterer>
			) : (
				<></>
			)}
		</>
	);
};

const MarkersCustomInfoWindow = ({ marker }: { marker: MarkersType }) => {
	const dispatch = useDispatch();

	return (
		<InfoWindow
			onCloseClick={() => {
				dispatch(resetIsMarkerInfoWindowOpen());
			}}
			position={{
				lat: marker.vehicleTrip.trip_id ? Number(marker.vehicleTrip.gps.latLngDtl.lat) : marker.gpsDtl.latLngDtl.lat,
				lng: marker.vehicleTrip.trip_id ? Number(marker.vehicleTrip.gps.latLngDtl.lng) : marker.gpsDtl.latLngDtl.lng,
			}}
		>
			<div className=' text-gray-800 flex flex-col gap-1 max-w-80'>
				<div className='absolute top-5'>
					<p className='font-medium text-lg'>Vehicle Information</p>
				</div>

				<div className='grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-2 font-medium text-neutral-700'>Vehicle Number:</div>{' '}
					<div className='col-span-3'>{marker.vehicleTrip.trip_id ? marker.vehicleTrip.lorry_no : marker.vehReg}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Lat | Lng</div>{' '}
					<div className='col-span-3'>
						{marker.vehicleTrip.trip_id
							? `${Number(marker.vehicleTrip.gps.latLngDtl.lat).toFixed(2)} | ${Number(marker.vehicleTrip.gps.latLngDtl.lng).toFixed(2)}`
							: `${marker.gpsDtl.latLngDtl.lat.toFixed(2)} | ${marker.gpsDtl.latLngDtl.lng.toFixed(2)}`}
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Address:</div>{' '}
					<div className='col-span-3 cursor-pointer'>
						{marker.vehicleTrip.trip_id ? (
							<Tooltip title={marker.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ')} mouseEnterDelay={1}>
								{marker.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ').slice(0, 45)}
								{marker.gpsDtl.latLngDtl.addr?.length > 45 ? '...' : ''}
							</Tooltip>
						) : marker.gpsDtl.latLngDtl.addr ? (
							<Tooltip title={marker.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ')} mouseEnterDelay={1}>
								{marker.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ').slice(0, 45)}
								{marker.gpsDtl.latLngDtl.addr?.length > 45 ? '...' : ''}
							</Tooltip>
						) : null}
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Destination:</div>{' '}
					<div className='col-span-3'>
						{marker.vehicleTrip.trip_id ? (
							''
						) : marker.gpsDtl.veh_destinationShow ? (
							<Tooltip title={marker.gpsDtl.veh_destinationShow?.replaceAll('_', ' ')} mouseEnterDelay={1}>
								{marker.gpsDtl.veh_destinationShow?.replaceAll('_', ' ').slice(0, 45)}
								{marker.gpsDtl.veh_destinationShow?.length > 45 ? '...' : ''}
							</Tooltip>
						) : null}
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Last Update: </div>{' '}
					<div className='col-span-3'> {marker.vehicleTrip.trip_id ? '' : marker.gpsDtl.latLngDtl.gpstime}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Idle Time:</div>{' '}
					<div className='col-span-3'>{marker.gpsDtl.hatledSince === '01 Jan 1970 05:30:00' ? '' : marker.gpsDtl.hatledSince}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Speed:</div>{' '}
					<div className='col-span-3'>{marker.vehicleTrip.trip_id ? '' : marker.gpsDtl.speed} kmph</div>
				</div>
			</div>
		</InfoWindow>
	);
};
