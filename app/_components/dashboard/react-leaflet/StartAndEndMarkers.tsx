'use client';

import { RootState } from '@/app/_globalRedux/store';
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { iconFactory } from './utils/iconFactory';
import { PathArrayItem } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';

function StartAndEndMarkers({ vehicleAllocationReport }: { vehicleAllocationReport?: boolean }) {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const liveVehicleItnaryWithPath = useSelector((state: RootState) => state.liveVehicleData);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const { type: createTripOrPlanningTripActive } = useSelector((state: RootState) => state.createTripOrPlanningTripActive);
	const { patharry: path } = vehicleItnaryWithPath;

	return (
		<>
			{vehicleAllocationReport || selectedVehicle.vId !== 0 ? (
				<>
					{(createTripOrPlanningTripActive !== 'create-trip' &&
						createTripOrPlanningTripActive !== 'trip-planning' &&
						historyReplay.isHistoryReplayMode &&
						path[path.length - 1]) ||
					liveVehicleItnaryWithPath.patharry[liveVehicleItnaryWithPath.patharry.length - 1] ? (
						<>
							<Marker
								position={[
									historyReplay.isHistoryReplayMode ? path[0].lat : liveVehicleItnaryWithPath.patharry[0].lat,
									historyReplay.isHistoryReplayMode ? path[0].lng : liveVehicleItnaryWithPath.patharry[0].lng,
								]}
								icon={iconFactory(`/assets/images/map/start-end-flags/start-flag.png`)}
							>
								<Popup>
									<div className='w-[300px]'>
										<div className='font-medium text-lg mb-1'>Start Point Information</div>
										<InfoWindowDescription path={path[0]} />
									</div>
								</Popup>
							</Marker>
							{historyReplay.isHistoryReplayMode ? (
								<Marker
									position={{ lat: path[path.length - 1].lat, lng: path[path.length - 1].lng }}
									icon={iconFactory(`/assets/images/map/start-end-flags/end-flag.png`)}
								>
									<Popup>
										<div className='w-[300px]'>
											<div className='font-medium text-lg mb-1'>End Point Information</div>
											<InfoWindowDescription path={path[path.length - 1]} />
										</div>
									</Popup>
								</Marker>
							) : null}
						</>
					) : null}
				</>
			) : null}
		</>
	);
}

const InfoWindowDescription = ({ path }: { path: PathArrayItem }) => {
	return (
		<div className='grid grid-cols-5 gap-2 my-0 py-0 grid-flow-row-dense text-sm font-normal '>
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

export default StartAndEndMarkers;
