import { Markers } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import moment from 'moment';

export const SelectedVehicleInfoWindow = ({ selectedVehicleMarker }: { selectedVehicleMarker: Markers }) => {
	return (
		<div className='text-xs  text-gray-800  flex flex-col gap-1 w-80'>
			<div className='font-medium text-lg mb-1'>Vehicle Information</div>

			<div className='grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal'>
				<div className='col-span-2 font-medium text-neutral-700 '>Date Time:</div>
				<div className='col-span-3'>{moment(selectedVehicleMarker.gpsDtl.latLngDtl.gpstime).format('Do MMM, YYYY HH:mm')}</div>
				<div className='col-span-2 font-medium text-neutral-700'>Position:</div>{' '}
				<div className='col-span-3'>
					{selectedVehicleMarker.gpsDtl.latLngDtl.lat.toFixed(4)}, {selectedVehicleMarker.gpsDtl.latLngDtl.lng.toFixed(4)}
				</div>
				<div className='col-span-2 font-medium text-neutral-700 '>KM Covered:</div>
				<div className='col-span-3'>{selectedVehicleMarker.gpsDtl.jny_distance} Km</div>
				<div className='col-span-2 font-medium text-neutral-700 '>Speed:</div>
				<div className='col-span-3'>{selectedVehicleMarker.gpsDtl.speed} Km/h</div>
			</div>
		</div>
	);
};
