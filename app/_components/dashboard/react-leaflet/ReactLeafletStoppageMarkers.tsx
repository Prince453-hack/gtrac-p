'use client';

import { RootState } from '@/app/_globalRedux/store';
import { useSelector } from 'react-redux';

import { VehicleItinaryData, VehicleItinaryDiagnosticData } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import convertMinutesToHoursString from '@/app/helpers/convertMinutesToHoursString';
import { Marker, Popup } from 'react-leaflet';
import { iconFactory } from './utils/iconFactory';

export const ReactLeafletStoppageMarkers = () => {
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const { selectedVehicleHistoryTab } = useSelector((state: RootState) => state.selectedVehicle);
	const [stoppageMarkersData, setStoppageMarkersData] = useState<VehicleItinaryData[] | VehicleItinaryDiagnosticData[]>([]);

	useEffect(() => {
		if (vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length > 0 && vehicleItnaryWithPath.patharry[0].lat !== 0) {
			if (selectedVehicleHistoryTab === 'Diagnostic') {
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
				return (
					<Marker
						position={{ lat: vehicleStatus?.fromLat, lng: vehicleStatus?.fromLng }}
						icon={iconFactory(
							index <= 200
								? `/assets/images/stoppageImages/${index + 1}.png`
								: index <= 300
								? `/assets/images/stoppagesPngs/img${index + 1}.png`
								: `/assets/images/stoppagesPngs/blankRed.png`
						)}
						key={index}
						title={`Stop ${index}`}
					>
						<CustomInfoWindow vehicleStatus={vehicleStatus} index={index} />
					</Marker>
				);
			} else {
				return [];
			}
		});
};

const CustomInfoWindow = ({ vehicleStatus, index }: { vehicleStatus: VehicleItinaryData; index: number }) => {
	return (
		<Popup key={index}>
			<div className='text-xs  text-gray-800  flex flex-col gap-1 w-80'>
				<div className='flex justify-between mb-2 font-medium text-lg'>Stoppage Information</div>
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
		</Popup>
	);
};
