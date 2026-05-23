'use client';

import { RootState } from '@/app/_globalRedux/store';
import { InfoWindow, Marker } from '@/@react-google-maps/api';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import fontawesome from 'fontawesome-markers';
import { PathArrayItem } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';

export const StartAndEndPointMarker = () => {
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const liveVehicleItnaryWithPath = useSelector((state: RootState) => state.liveVehicleData);
	const { type: createTripOrPlanningTripActive } = useSelector((state: RootState) => state.createTripOrPlanningTripActive);

	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const { patharry: path } = vehicleItnaryWithPath;

	const [showStartEndPoint, setShowStartEndPoint] = useState('');

	const openStartEndPoint = (startOrEnd: 'start' | 'end') => {
		setShowStartEndPoint(startOrEnd);
	};

	const closeStartEndPoint = () => {
		setShowStartEndPoint('');
	};

	return (
		<>
			{(createTripOrPlanningTripActive !== 'create-trip' &&
				createTripOrPlanningTripActive !== 'trip-planning' &&
				historyReplay.isHistoryReplayMode &&
				path[path.length - 1]) ||
			liveVehicleItnaryWithPath.patharry[liveVehicleItnaryWithPath.patharry.length - 1] ? (
				<>
					<Marker
						position={{
							lat: historyReplay.isHistoryReplayMode ? path[0].lat : liveVehicleItnaryWithPath.patharry[0].lat,
							lng: historyReplay.isHistoryReplayMode ? path[0].lng : liveVehicleItnaryWithPath.patharry[0].lng,
						}}
						icon={{
							path: fontawesome.FLAG,
							scale: 0.5,
							strokeWeight: 0.2,
							strokeColor: 'black',
							strokeOpacity: 1,
							fillColor: '#468C80',
							fillOpacity: 1,
						}}
						title={'Start'}
						visible={true}
						onClick={() => openStartEndPoint('start')}
						// onPositionChanged={onPositionChanged()}
					>
						{showStartEndPoint === 'start' && (
							<InfoWindow
								position={{
									lat: historyReplay.isHistoryReplayMode ? path[0].lat : liveVehicleItnaryWithPath.patharry[0].lat,
									lng: historyReplay.isHistoryReplayMode ? path[0].lng : liveVehicleItnaryWithPath.patharry[0].lng,
								}}
								onCloseClick={() => closeStartEndPoint()}
							>
								<div className='w-[300px]'>
									<div className='absolute top-5'>
										<div className='flex justify-between mb-2'>
											<p className='font-medium text-lg'>Start Point Information</p>
										</div>
									</div>
									<InfoWindowDescription path={historyReplay.isHistoryReplayMode ? path[0] : liveVehicleItnaryWithPath.patharry[0]} />
								</div>
							</InfoWindow>
						)}
					</Marker>
					{historyReplay.isHistoryReplayMode ? (
						<Marker
							position={{ lat: path[path.length - 1].lat, lng: path[path.length - 1].lng }}
							icon={{
								path: fontawesome.FLAG,
								scale: 0.5,
								strokeWeight: 0.2,
								strokeColor: 'black',
								strokeOpacity: 1,
								fillColor: '#C12F3C',
								fillOpacity: 1,
							}}
							visible={true}
							onClick={() => openStartEndPoint('end')}
						>
							{showStartEndPoint === 'end' && (
								<InfoWindow position={{ lat: path[path.length - 1].lat, lng: path[path.length - 1].lng }} onCloseClick={() => closeStartEndPoint()}>
									<div className='w-[300px]'>
										<div className='absolute top-5'>
											<div className='flex justify-between mb-2'>
												<p className='font-medium text-lg'>End Point Information</p>
											</div>
										</div>
										<InfoWindowDescription path={path[path.length - 1]} />
									</div>
								</InfoWindow>
							)}
						</Marker>
					) : null}
				</>
			) : null}
		</>
	);
};

const InfoWindowDescription = ({ path }: { path: PathArrayItem }) => {
	return (
		<div className='grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal '>
			<div className='col-span-2 font-medium text-neutral-700 '>Date Time:</div>
			<div className='col-span-3'>{path.datetime}</div>
			<div className='col-span-2 font-medium text-neutral-700 '>Distance: </div> <div className='col-span-3'>{path.distance.toFixed(2)} KM</div>
			<div className='col-span-2 font-medium text-neutral-700 '>Lat | Lng:</div>{' '}
			<div className='col-span-3'>
				{path.lat.toFixed(4)} ⎪ {path.lng.toFixed(4)}
			</div>
			<div className='col-span-2 font-medium text-neutral-700 '>Address:</div> <div className='col-span-3'>{path.location?.replaceAll('_', ' ')}</div>
			<div className='col-span-2 font-medium text-neutral-700 '>Nearest POI:</div> <div className='col-span-3'>{path.nearestPoi}</div>
		</div>
	);
};
