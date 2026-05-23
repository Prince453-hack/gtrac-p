'use client';

import { RootState } from '@/app/_globalRedux/store';
import { Card, Tooltip } from 'antd';
import { useSelector } from 'react-redux';

const NearbyVehicleDetailsCard = ({ vehicle }: { vehicle: GetNearbyVehiclesResponse }) => {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	return (
		<div className='bg-white shadow-s-light rounded-xl'>
			<Card className='px-2'>
				<div className='flex justify-start items-center gap-2'>
					<div
						className={`h-6 w-6 ${
							selectedVehicle.vId === Number(vehicle.sys_service_id) ? 'bg-orange-500' : 'bg-primary-green'
						} rounded-full flex items-center justify-center`}
					></div>
					<div>
						<p className='font-bold text-base'>{vehicle.veh_reg}</p>
					</div>
				</div>
				<div className='mt-2 grid grid-cols-5 gap-1'>
					<div className='col-span-2 font-medium text-neutral-700'>Distance:</div>
					<div className='col-span-3'>{vehicle.distance}</div>
					<div className='col-span-2 font-medium text-neutral-700'>Speed:</div>
					<div className='col-span-3'>{vehicle.gps_speed} KM</div>
					<div className='col-span-2 font-medium text-neutral-700'>Position:</div>
					<div className='col-span-3'>
						{vehicle.gps_latitude ? Number(vehicle.gps_latitude).toFixed(2) : null} Lat :{' '}
						{vehicle.gps_longitude ? Number(vehicle.gps_longitude).toFixed(2) : null} Lng
					</div>

					<div className='col-span-2 font-medium text-neutral-700'>Driver Name:</div>
					<Tooltip title={vehicle.drivername} mouseEnterDelay={1}>
						<div className='col-span-3 cursor-pointer'>
							{vehicle.drivername?.slice(0, 25) + (vehicle.drivername?.length > 25 ? '...' : '') || 'NA'}
						</div>
					</Tooltip>

					<div className='col-span-2 font-medium text-neutral-700'>Driver:</div>
					<div className='col-span-3'>{vehicle.drivercontact || 'NA'}</div>
				</div>
			</Card>
		</div>
	);
};

export default NearbyVehicleDetailsCard;
