'use client';

import { RootState } from '@/app/_globalRedux/store';
import { useDispatch, useSelector } from 'react-redux';

import paths from '../../_assets/stoppagesPaths';

import { InfoWindow, Marker } from '@/@react-google-maps/api';
import { setCenterOfMap, setOpenStoppageIndex } from '@/app/_globalRedux/dashboard/mapSlice';
import { Tooltip } from 'antd';

export const CheckInMarkers = () => {
	const checkInData = useSelector((state: RootState) => state.checkIndData);
	const { openStoppageIndex } = useSelector((state: RootState) => state.map);

	const dispatch = useDispatch();

	const handleToggleClose = () => {
		dispatch(setOpenStoppageIndex(-1));
	};

	const handleToggleOpen = (lat: number, lng: number, index: number) => {
		let center = { lat, lng };
		dispatch(setCenterOfMap(center));
		dispatch(setOpenStoppageIndex(index));
	};

	return checkInData && Array.isArray(checkInData) && checkInData.length > 0 ? (
		checkInData?.map((data, index) => {
			return (
				<Marker
					position={{ lat: data?.gps_latitude, lng: data?.gps_longitude }}
					icon={{
						path: `M43.6392 22.0002C43.6392 33.9484 33.9533 43.6343 22.0051 43.6343C10.057 43.6343 0.371094 33.9484 0.371094 22.0002C0.371094 10.0521 10.057 0.366211 22.0051 0.366211C33.9533 0.366211 43.6392 10.0521 43.6392 22.0002Z${paths[index]}`,
						scale: 0.6,
						strokeWeight: 0.7,
						strokeColor: 'white',
						strokeOpacity: 1,
						fillColor: '#EE7432',
						fillOpacity: 1,
						scaledSize: new window.google.maps.Size(30, 30),
						anchor: { x: 20, y: 30, equals: () => false },
					}}
					key={index}
					title={`Stop ${index}`}
					zIndex={99}
					onClick={() => handleToggleOpen(data.gps_latitude, data.gps_longitude, index)}
				>
					{openStoppageIndex === index && <CustomInfoWindow data={data} handleToggleClose={handleToggleClose} index={index} />}
				</Marker>
			);
		})
	) : (
		<></>
	);
};

const CustomInfoWindow = ({ data, handleToggleClose, index }: { data: RawData; handleToggleClose: () => void; index: number }) => {
	return (
		<InfoWindow key={index} position={{ lat: data?.gps_latitude, lng: data?.gps_longitude }} onCloseClick={() => handleToggleClose()}>
			<div className='text-xs  text-gray-800  flex flex-col gap-1 overflow-hidden'>
				<div className='flex justify-between absolute top-5'>
					<p className='font-medium text-base'>Check In {index + 1}</p>
				</div>
				<div className='absolute top-14 grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-1 font-medium text-neutral-700 '>Location:</div>{' '}
					<Tooltip title={data.geostreet ? `${data.geostreet?.replaceAll('_', ' ')}` : ''} mouseEnterDelay={1}>
						<div className='col-span-4 cursor-pointer'>
							{data.geostreet ? `${data.geostreet?.replaceAll('_', ' ').slice(0, 35)}${data.geostreet.length > 35 ? '...' : ''}` : ''}{' '}
						</div>
					</Tooltip>
					<div className='col-span-1 font-medium text-neutral-700 '>Time:</div>
					<div className='col-span-4'>{data.gps_time}</div>
				</div>
				<div className='h-10 w-80'></div>
			</div>
		</InfoWindow>
	);
};
