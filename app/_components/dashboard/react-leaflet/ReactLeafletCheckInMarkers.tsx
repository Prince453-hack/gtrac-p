'use client';

import { RootState } from '@/app/_globalRedux/store';
import { useSelector } from 'react-redux';
import { Tooltip } from 'antd';
import { Marker, Popup } from 'react-leaflet';
import { iconFactory } from './utils/iconFactory';

export const ReactLeafletCheckInMarkers = () => {
	const checkInData = useSelector((state: RootState) => state.checkIndData);
	const { openStoppageIndex } = useSelector((state: RootState) => state.map);

	return checkInData && Array.isArray(checkInData) && checkInData.length > 0 ? (
		checkInData?.map((data, index) => {
			return (
				<Marker
					position={{ lat: data?.gps_latitude, lng: data?.gps_longitude }}
					icon={iconFactory(`/assets/images/check-in/${index + 1}.png`)}
					key={index}
					title={`Stop ${index}`}
				>
					<CustomInfoWindow data={data} index={index} />
				</Marker>
			);
		})
	) : (
		<></>
	);
};

const CustomInfoWindow = ({ data, index }: { data: RawData; index: number }) => {
	return (
		<Popup key={index}>
			<div className='text-xs  text-gray-800  flex flex-col gap-1 w-80'>
				<span className='font-medium text-lg my-1'>Check In {index + 1}</span>
				<div className='grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal'>
					<div className='col-span-2 font-medium text-neutral-700 '>Location:</div>{' '}
					<Tooltip title={data.geostreet ? `${data.geostreet?.replaceAll('_', ' ')}` : ''} mouseEnterDelay={1}>
						<div className='col-span-3 cursor-pointer'>
							{data.geostreet ? `${data.geostreet?.replaceAll('_', ' ').slice(0, 35)}${data.geostreet.length > 35 ? '...' : ''}` : ''}{' '}
						</div>
					</Tooltip>
					<div className='col-span-2 font-medium text-neutral-700 '>Time:</div>
					<div className='col-span-3'>{data.gps_time}</div>
				</div>
			</div>
		</Popup>
	);
};
