'use client';

import { RootState } from '@/app/_globalRedux/store';
import { importMultipleAssets } from '@/app/helpers/importMultipleAssets';
import { useDispatch, useSelector } from 'react-redux';

const stoppagesPngs = importMultipleAssets(require.context('../../_assets/mapsimg/stoppagesPngs', true));

import blanckred from '../../_assets/mapsimg/blanckred.png';
import paths from '../../_assets/stoppagesPaths';

import { InfoWindow, Marker } from '@/@react-google-maps/api';
import { setCenterOfMap, setOpenStoppageIndex } from '@/app/_globalRedux/dashboard/mapSlice';
import { VehicleItinaryData, VehicleItinaryDiagnosticData } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import convertMinutesToHoursString from '@/app/helpers/convertMinutesToHoursString';

export const StoppageMarkers = () => {
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const { selectedVehicleHistoryTab } = useSelector((state: RootState) => state.selectedVehicle);
	const [stoppageMarkersData, setStoppageMarkersData] = useState<VehicleItinaryData[] | VehicleItinaryDiagnosticData[]>([]);

	const { openStoppageIndex } = useSelector((state: RootState) => state.map);

	const dispatch = useDispatch();
	let dyImg: any;
	var path = '';

	const handleToggleClose = () => {
		dispatch(setOpenStoppageIndex(-1));
	};

	const handleToggleOpen = (lat: number, lng: number, index: number) => {
		let center = { lat, lng };
		dispatch(setCenterOfMap(center));
		dispatch(setOpenStoppageIndex(index));
	};

	useEffect(() => {
		if (vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length > 0 && vehicleItnaryWithPath.patharry[0].lat !== 0) {
			if (selectedVehicleHistoryTab === 'Diagnostic' || selectedVehicleHistoryTab === 'Running' || selectedVehicleHistoryTab === 'Stoppages') {
				setStoppageMarkersData(vehicleItnaryWithPath.diagnosticData);
			} else {
				setStoppageMarkersData(vehicleItnaryWithPath.data);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [vehicleItnaryWithPath, selectedVehicleHistoryTab]);

	return stoppageMarkersData
		.filter((vehicleStatus) => vehicleStatus.mode === 'Idle')
		.reverse()
		.slice(0, 200)
		?.map((vehicleStatus, index) => {
			if (
				vehicleItnaryWithPath.data.length > 0 &&
				vehicleStatus.mode === 'Idle' &&
				(selectedVehicle.vId != 0 || selectedVehicle.vehicleTrip.sys_service_id != 0) &&
				historyReplay.isHistoryReplayMode
			) {
				if (index <= 200) {
					path = `M43.6392 22.0002C43.6392 33.9484 33.9533 43.6343 22.0051 43.6343C10.057 43.6343 0.371094 33.9484 0.371094 22.0002C0.371094 10.0521 10.057 0.366211 22.0051 0.366211C33.9533 0.366211 43.6392 10.0521 43.6392 22.0002Z${paths[index]}`;
				} else if (index <= 300) {
					dyImg = stoppagesPngs[index];
				} else {
					dyImg = blanckred;
				}

				return !path ? null : (
					<Marker
						position={{ lat: vehicleStatus?.fromLat, lng: vehicleStatus?.fromLng }}
						icon={{
							path: path ? path : '',
							scale: 0.6,
							strokeWeight: 0.7,
							strokeColor: 'white',
							strokeOpacity: 1,
							fillColor: '#FC7873',
							fillOpacity: 1,
							scaledSize: new window.google.maps.Size(30, 30),
							anchor: { x: 20, y: 30, equals: () => false },
						}}
						key={index}
						title={`Stop ${index}`}
						zIndex={99}
						onClick={() => handleToggleOpen(vehicleStatus.fromLat, vehicleStatus.fromLng, index)}
					>
						{openStoppageIndex === index && <CustomInfoWindow vehicleStatus={vehicleStatus} handleToggleClose={handleToggleClose} index={index} />}
					</Marker>
				);
			} else {
				return [];
			}
		});
};

const CustomInfoWindow = ({
	vehicleStatus,
	handleToggleClose,
	index,
}: {
	vehicleStatus: VehicleItinaryData;
	handleToggleClose: () => void;
	index: number;
}) => {
	return (
		<InfoWindow key={index} position={{ lat: vehicleStatus?.fromLat, lng: vehicleStatus?.fromLng }} onCloseClick={() => handleToggleClose()}>
			<div className='text-xs  text-gray-800  flex flex-col gap-1 max-w-80'>
				<div className='flex justify-between mb-2 absolute top-5'>
					<p className='font-medium text-lg'>Stoppage Information</p>
				</div>
				<div className='grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-2 font-medium text-neutral-700 '>Start Time:</div>
					<div className='col-span-3'>{vehicleStatus.fromTime}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>To Time:</div> <div className='col-span-3'>{vehicleStatus.toTime}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Stopped Time: </div>{' '}
					<div className='col-span-3'>{convertMinutesToHoursString(vehicleStatus.totalTimeInMIN)}</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Lat | Lng:</div>{' '}
					<div className='col-span-3'>
						<a
							href={`https://www.google.com/maps/search/${vehicleStatus.fromLat},${vehicleStatus.fromLng}`}
							target='_blank'
							rel='noreferrer'
							onClick={(e) => e.stopPropagation()}
						>
							{vehicleStatus.fromLat.toFixed(2)} | {vehicleStatus.fromLng.toFixed(2)}
						</a>
					</div>
					<div className='col-span-2 font-medium text-neutral-700 '>Address:</div>{' '}
					<Tooltip title={vehicleStatus.startLocation ? `${vehicleStatus.startLocation?.replaceAll('_', ' ')}` : ''} mouseEnterDelay={1}>
						<div className='col-span-3 cursor-pointer'>
							{vehicleStatus.startLocation
								? `${vehicleStatus.startLocation?.replaceAll('_', ' ').slice(0, 35)}${vehicleStatus.startLocation.length > 35 ? '...' : ''}`
								: ''}{' '}
						</div>
					</Tooltip>
				</div>
			</div>
		</InfoWindow>
	);
};
