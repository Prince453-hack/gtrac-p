'use client';

import { RootState } from '@/app/_globalRedux/store';
import React, { useEffect, useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import { iconFactory } from './utils/iconFactory';
import checkIfIgnitionOnOrOff from '@/app/helpers/checkIfIgnitionOnOrOff';
import { Markers } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { useGetVehicleCurrentLocationQuery, useLazyGetVehicleCurrentLocationQuery } from '@/app/_globalRedux/services/trackingDashboard';
import updateSingleVehicleMovement from '@/app/helpers/updateSingleVehicleMovement';
import { MovementInfoWindow } from './MovementInfoWindow';
import { SelectedVehicleInfoWindow } from './SelectedVehicleInfoWindow';
import { isCheckInAccount } from '@/app/helpers/isCheckInAccount';
import 'leaflet-rotatedmarker';
import { getLatestGPSTime } from '../utils/getLatestGPSTime';
import { getNormalOrControllerId } from '../utils/getNormalOrControllerId';

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

function SelectedVehicleMarker() {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const auth = useSelector((state: RootState) => state.auth);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const liveVehicleItnaryWithPath = useSelector((state: RootState) => state.liveVehicleData);
	const markers = useSelector((state: RootState) => state.markers);

	const dispatch = useDispatch();
	const [rotation, setRotation] = useState(0);
	const [vehicleVar, setVehicleVar] = useState('');
	const [selectedVehicleMarker, setSelectedVehicleMarker] = useState<Markers | null>(null);

	const [getVehicleCurrentLocation, { data: vehicleCurrentLocationData }] = useLazyGetVehicleCurrentLocationQuery();
	const [prevPosition, setPrevPosition] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null }); // Store previous position

	let manualPathIndex = 0;
	if (vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length >= 2) {
		manualPathIndex = Math.floor((historyReplay.manualPath / 100) * (vehicleItnaryWithPath.patharry.length - 2));
	}

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

	useEffect(() => {
		if (!isLoading && !isFetchingCurrentVehicleLocation && !historyReplay.isHistoryReplayMode) {
			if (currentVehicleLocationData?.success === true && markers) {
				if (
					vehicleItnaryWithPath.patharry.length > 0 &&
					((vehicleItnaryWithPath.patharry[0].lat !== 0 && vehicleItnaryWithPath.patharry[0].lng !== 0) ||
						currentVehicleLocationData.list.mode !== 'NOT WORKING')
				) {
					setSelectedVehicleMarker(markers.find((marker) => marker.vId === selectedVehicle.vId) || null);
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [markers, isFetchingCurrentVehicleLocation]);

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
		if (selectedVehicle.vId !== 0 && !historyReplay.isHistoryReplayMode) {
			getVehicleCurrentLocation({
				userId: Number(auth.userId),
				vehId: auth.accessLabel === 6 ? getNormalOrControllerId(selectedVehicle) : selectedVehicle.vId,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedVehicle.vId]);

	function openPopup(e: any) {
		e.target.openPopup();
	}

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

	return (
		<>
			{selectedVehicle.vId !== 0 && historyReplay.isHistoryReplayMode === false && selectedVehicleMarker ? (
				<Marker
					position={[selectedVehicleMarker.gpsDtl.latLngDtl.lat, selectedVehicleMarker.gpsDtl.latLngDtl.lng]}
					icon={
						isCheckInAccount(Number(auth.userId))
							? iconFactory(`/assets/images/map/vehicles/checkin.png`)
							: selectedVehicleMarker.gpsDtl.notworkingHrs >= 24
							? iconFactory(`/assets/images/map/vehicles/${vehicleVar}-black.png`)
							: checkIfIgnitionOnOrOff({
									ignitionState: selectedVehicleMarker.gpsDtl.ignState.toLowerCase() as 'off' | 'on',
									speed: selectedVehicleMarker.gpsDtl.speed,
									mode: selectedVehicleMarker.gpsDtl.mode,
							  }) === 'On'
							? iconFactory(`/assets/images/map/vehicles/${vehicleVar}-green.png`)
							: iconFactory(`/assets/images/map/vehicles/${vehicleVar}-red.png`)
					}
				>
					<Tooltip direction='top' offset={[0, -10]} opacity={1} permanent>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<span>{selectedVehicle.vehReg}</span>
						</div>
					</Tooltip>
					<Popup>
						<SelectedVehicleInfoWindow selectedVehicleMarker={selectedVehicleMarker} />
					</Popup>
				</Marker>
			) : selectedVehicle.vId !== 0 &&
			  historyReplay.isHistoryReplayMode === true &&
			  vehicleItnaryWithPath.patharry &&
			  vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex] &&
			  vehicleItnaryWithPath.patharry.length >= 2 ? (
				<Marker
					position={[
						vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lat,
						vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lng,
					]}
					icon={iconFactory(`/assets/images/map/vehicles/circle.png`)}
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
}

export default SelectedVehicleMarker;
