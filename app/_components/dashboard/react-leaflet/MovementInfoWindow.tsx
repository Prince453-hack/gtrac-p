import { SelectedVehicleState } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import moment from 'moment';

export const MovementInfoWindow = ({
	vehicleItnaryWithPath,
	historyReplay,
	manualPathIndex,
	selectedVehicle,
}: {
	vehicleItnaryWithPath: any;
	historyReplay: any;
	manualPathIndex: number;
	selectedVehicle: SelectedVehicleState;
}) => {
	return (
		<div className='text-xs  text-gray-800  flex flex-col gap-1 w-80'>
			<div className='font-medium text-lg mb-1'>Movement Information</div>

			<div className='grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal'>
				<div className='col-span-2 font-medium text-neutral-700 '>Vehicle Number:</div>
				<div className='col-span-3'>{selectedVehicle.vehReg}</div>
				<div className='col-span-2 font-medium text-neutral-700 '>Date Time:</div>
				<div className='col-span-3'>
					{moment(vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].datetime).format('Do MMM, YYYY HH:mm')}
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
				<div className='col-span-3'>{vehicleItnaryWithPath.patharry[historyReplay.currentPathArrayIndex + manualPathIndex].speed} Km/h</div>
			</div>
		</div>
	);
};
