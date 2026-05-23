'use client';

import { VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import NoGps from '@/public/assets/svgs/common/no-gps.svg';
import { Tooltip } from 'antd';
import Image from 'next/image';

export const NoGpsKm = ({ data }: { data: VehicleData }) => {
	return (
		<>
			<>
				{data.gpsDtl.gpsStatus == 0 ? (
					<Tooltip title='No GPS' mouseEnterDelay={1}>
						<div className='w-[16px] h-[16px]'>
							<Image src={NoGps} alt='no gps' />
						</div>
					</Tooltip>
				) : null}
			</>
		</>
	);
};
