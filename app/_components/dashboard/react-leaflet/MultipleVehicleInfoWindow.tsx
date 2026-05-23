import { Markers } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { Tooltip } from 'antd';
import React from 'react';

export default function MultipleVehicleInfoWindow({ marker }: { marker: Markers }) {
	return (
		<div className=' text-gray-800 flex flex-col gap-1 w-80'>
			<div className='font-medium text-lg mb-1'>Vehicle Information</div>

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
	);
}
