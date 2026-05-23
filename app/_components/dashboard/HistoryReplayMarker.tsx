'use client';

import { RootState } from '@/app/_globalRedux/store';
import { InfoWindow, Marker } from '@/@react-google-maps/api';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { useEffect, useState } from 'react';

export const HistoryReplayMarker = () => {
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	const vehicleImageUrl = '/assets/images/map/moving-vehicle.png';

	let manualPathIndex = 0;
	if (vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length >= 2) {
		manualPathIndex = Math.floor((historyReplay.manualPath / 100) * (vehicleItnaryWithPath.patharry.length - 2));
	}

	const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);

	useEffect(() => {
		historyReplay.isHistoryReplayPlaying && setIsInfoWindowOpen(true);
	}, [historyReplay.isHistoryReplayPlaying]);

	return (
		<>
			{vehicleItnaryWithPath.patharry &&
			vehicleItnaryWithPath.patharry.length >= 2 &&
			historyReplay.isHistoryReplayMode &&
			selectedVehicle.vId !== 0 ? (
				<>
					{vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex] &&
					vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex] ? (
						<Marker
							position={{
								lat: vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lat,
								lng: vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lng,
							}}
							icon={{
								url: vehicleImageUrl,
								scale: 1,
								scaledSize: new window.google.maps.Size(60, 60),
								anchor: { x: 30, y: 30, equals: () => false },
							}}
							onClick={() => setIsInfoWindowOpen(true)}
						>
							{isInfoWindowOpen ? (
								<InfoWindow
									position={{
										lat: vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lat,
										lng: vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lng,
									}}
									onCloseClick={() => setIsInfoWindowOpen(false)}
								>
									<div className='text-xs  text-gray-800  flex flex-col gap-1 max-w-80'>
										<div className='flex justify-between mb-1 absolute top-5'>
											<p className='font-medium text-lg'>Movement Information</p>
										</div>
										<div className='grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal'>
											<div className='col-span-2 font-medium text-neutral-700 '>Date Time:</div>
											<div className='col-span-3'>
												{moment(vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].datetime).format(
													'Do MMM, YYYY HH:mm'
												)}
											</div>
											<div className='col-span-2 font-medium text-neutral-700'>Position:</div>{' '}
											<div className='col-span-3'>
												{String(vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lat).slice(0, 5)},
												{String(vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].lng).slice(0, 5)}
											</div>
											<div className='col-span-2 font-medium text-neutral-700 '>KM Covered:</div>
											<div className='col-span-3'>
												{vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].distance.toFixed(2)} Km
											</div>
											<div className='col-span-2 font-medium text-neutral-700 '>Speed:</div>
											<div className='col-span-3'>
												{vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].speed} Km/h
											</div>
										</div>
									</div>
								</InfoWindow>
							) : null}
						</Marker>
					) : (
						<></>
					)}
				</>
			) : (
				<></>
			)}
		</>
	);
};
