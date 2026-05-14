'use client';

import { RootState } from '@/app/_globalRedux/store';
import { InfoWindow, Marker } from '@/@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { SelectedVehicleState, setSelectedVehicleBySelectElement } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { useGetVehicleCurrentLocationQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { setCenterOfMap } from '@/app/_globalRedux/dashboard/mapSlice';
import { setVehicleItnaryWithPath, vehicleItnaryWithPathInitialState } from '@/app/_globalRedux/dashboard/vehicleItnaryWithPathSlice';
import checkIfIgnitionOnOrOff from '@/app/helpers/checkIfIgnitionOnOrOff';
import { getAbbreviation } from '@/app/helpers/getAbbreviation';
import { getNormalOrControllerId } from '../utils/getNormalOrControllerId';

export const CreateTripOrPlanMarker = () => {
	const dispatch = useDispatch();
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const auth = useSelector((state: RootState) => state.auth);
	const { type: vehicleListType } = useSelector((state: RootState) => state.isVehicleStatusOrTripStatusActive);
	const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

	const {
		data: currentVehicleLocationData,
		isLoading,
		isFetching: isFetchingCurrentVehicleLocation,
	} = useGetVehicleCurrentLocationQuery(
		{
			userId: Number(auth.userId),
			vehId: auth.accessLabel === 6 ? getNormalOrControllerId(selectedVehicle) : selectedVehicle.vId,
		},
		{
			skip:
				selectedVehicle.vId === 0 ||
				historyReplay.isHistoryReplayMode ||
				(vehicleListType !== 'trip' && vehicleListType !== 'vehicle-allocation-trip'),
			pollingInterval: 10000,
		}
	);

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

	useEffect(() => {
		if (
			!isLoading &&
			!isFetchingCurrentVehicleLocation &&
			!historyReplay.isHistoryReplayMode &&
			selectedVehicle &&
			selectedVehicle?.vId &&
			selectedVehicle.vId !== 0 &&
			(vehicleListType == 'trip' || vehicleListType == 'vehicle-allocation-trip')
		) {
			if (currentVehicleLocationData?.success === true) {
				dispatch(
					setSelectedVehicleBySelectElement({
						...selectedVehicle,
						gpsDtl: {
							...selectedVehicle.gpsDtl,
							latLngDtl: {
								...selectedVehicle.gpsDtl.latLngDtl,
								lat: currentVehicleLocationData.list.latLngDtl.lat,
								lng: currentVehicleLocationData.list.latLngDtl.lng,
								addr: currentVehicleLocationData.list.latLngDtl.addr,
								gpstime: currentVehicleLocationData.list.latLngDtl.gpstime,
							},
							mode: currentVehicleLocationData.list.mode,
							speed: currentVehicleLocationData.list.speed,
						},
					})
				);

				dispatch(setVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));
				dispatch(
					setCenterOfMap({ lat: Number(currentVehicleLocationData.list.latLngDtl.lat), lng: Number(currentVehicleLocationData.list.latLngDtl.lng) })
				);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentVehicleLocationData, isLoading, isFetchingCurrentVehicleLocation]);

	return (
		<>
			{selectedVehicle && selectedVehicle?.vId && selectedVehicle?.vId !== 0 ? (
				<Marker
					position={{
						lat: Number(selectedVehicle.gpsDtl.latLngDtl.lat),
						lng: Number(selectedVehicle.gpsDtl.latLngDtl.lng),
					}}
					key={selectedVehicle.vehReg}
					icon={{
						url:
							checkIfIgnitionOnOrOff({
								ignitionState: selectedVehicle.gpsDtl.ignState.toLowerCase() as 'off' | 'on',
								speed: selectedVehicle.gpsDtl.speed,
								mode: selectedVehicle.gpsDtl.mode,
							}) === 'On'
								? `/assets/images/map/vehicles/${vehicleVar}-green.png`
								: `/assets/images/map/vehicles/${vehicleVar}-red.png`,
						scale: 1,
						scaledSize: new window.google.maps.Size(60, 60),
						anchor: { x: 30, y: 30, equals: () => false },
					}}
					label={{
						text:
							vehicleListType === 'trip' || vehicleListType === 'vehicle-allocation-trip'
								? `${getAbbreviation(selectedVehicle.vehicleTrip.station_from_location)}-${getAbbreviation(
										selectedVehicle.vehicleTrip.station_to_location
								  )} \n ${selectedVehicle.vehReg}`
								: selectedVehicle.vehReg,
						color: '#000',
						fontSize: '12px',
						className: 'mt-[39px] bg-white p-0.5 px-1 rounded max-w-[100px] truncate font-bold ',
					}}
					onClick={() => setIsVehicleModalOpen(true)}
				>
					{isVehicleModalOpen ? <MarkersCustomInfoWindow selectedVehicle={selectedVehicle} setIsVehicleModalOpen={setIsVehicleModalOpen} /> : null}
				</Marker>
			) : null}
		</>
	);
};

const MarkersCustomInfoWindow = ({
	selectedVehicle,
	setIsVehicleModalOpen,
}: {
	selectedVehicle: SelectedVehicleState;
	setIsVehicleModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	return (
		<InfoWindow
			onCloseClick={() => {
				setIsVehicleModalOpen(false);
			}}
			position={{
				lat: selectedVehicle.vehicleTrip.trip_id ? Number(selectedVehicle.vehicleTrip.gps.latLngDtl.lat) : selectedVehicle.gpsDtl.latLngDtl.lat,
				lng: selectedVehicle.vehicleTrip.trip_id ? Number(selectedVehicle.vehicleTrip.gps.latLngDtl.lng) : selectedVehicle.gpsDtl.latLngDtl.lng,
			}}
		>
			<div className='text-xs text-gray-800 flex flex-col gap-1 max-w-80'>
				<div className='absolute top-5'>
					<p className='font-medium text-lg'>Vehicle Information</p>
				</div>

				<div className='grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-2 font-medium text-neutral-700 '>Vehicle Number:</div>{' '}
					<div className='col-span-3'>{selectedVehicle.vehicleTrip.trip_id ? selectedVehicle.vehicleTrip.lorry_no : selectedVehicle.vehReg}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Lat | Lng</div>{' '}
					<div className='col-span-3'>
						{selectedVehicle.vehicleTrip.trip_id
							? `${Number(selectedVehicle.vehicleTrip.gps.latLngDtl.lat).toFixed(2)} | ${Number(
									selectedVehicle.vehicleTrip.gps.latLngDtl.lng
							  ).toFixed(2)}`
							: `${selectedVehicle.gpsDtl.latLngDtl.lat.toFixed(2)} | ${selectedVehicle.gpsDtl.latLngDtl.lng.toFixed(2)}`}
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Address:</div>{' '}
					<div className='col-span-3 cursor-pointer'>
						{selectedVehicle.vehicleTrip.trip_id ? (
							<Tooltip title={selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ')} mouseEnterDelay={1}>
								{selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ').slice(0, 45)}
								{selectedVehicle.gpsDtl.latLngDtl.addr?.length > 45 ? '...' : ''}
							</Tooltip>
						) : selectedVehicle.gpsDtl.latLngDtl.addr ? (
							<Tooltip title={selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ')} mouseEnterDelay={1}>
								{selectedVehicle.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ').slice(0, 45)}
								{selectedVehicle.gpsDtl.latLngDtl.addr?.length > 45 ? '...' : ''}
							</Tooltip>
						) : null}
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Last Update: </div>{' '}
					<div className='col-span-3'> {selectedVehicle.vehicleTrip.trip_id ? '' : selectedVehicle.gpsDtl.latLngDtl.gpstime}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Speed:</div>{' '}
					<div className='col-span-3'>{selectedVehicle.vehicleTrip.trip_id ? '' : selectedVehicle.gpsDtl.speed} kmph</div>
				</div>
			</div>
		</InfoWindow>
	);
};
