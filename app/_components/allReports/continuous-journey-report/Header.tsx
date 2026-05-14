'use client';

import { Button } from 'antd';
import CustomDatePicker from '../../common/datePicker';

import AllVehiclesSelect from '../../common/AllVehiclesSelect';
export default function Header({
	customDateRange,
	setCustomDateRange,
	onSubmit,
	selectedVehicleOption,
	setSelectedVehicleOption,
}: {
	customDateRange: Date[];
	setCustomDateRange: React.Dispatch<React.SetStateAction<Date[]>>;
	onSubmit: () => void;
	selectedVehicleOption: { label: string; value: number } | undefined;
	setSelectedVehicleOption: React.Dispatch<
		React.SetStateAction<
			| {
					label: string;
					value: number;
			  }
			| undefined
		>
	>;
}) {
	return (
		<div className='flex justify-between items-center p-5'>
			<p className='text-3xl font-semibold'>Continuous Journey Report</p>
			<div className='flex items-center gap-3'>
				<AllVehiclesSelect selectedVehicleOption={selectedVehicleOption} setSelectedVehicleOption={setSelectedVehicleOption} allowClear={true} />
				<div className='w-[250px] max-w-[250px]'>
					<CustomDatePicker
						dateRange={customDateRange}
						setDateRange={setCustomDateRange}
						datePickerStyles='h-[32px]  max-h-[32px]'
						format='dd/MM/yyyy'
						showTimeSelect={false}
					/>
				</div>
				<Button type='primary' onClick={() => onSubmit()}>
					Submit
				</Button>
			</div>
		</div>
	);
}
