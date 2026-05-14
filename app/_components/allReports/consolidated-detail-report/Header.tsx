import React from 'react';

import { Button, DatePicker } from 'antd';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import CustomDatePicker from '../../common/datePicker';
import AllVehiclesSelect from '../../common/AllVehiclesSelect';

export default function Header({
	date,
	setDate,
	onSubmit,
	dateRange,
	setDateRange,
	selectedVehicleOption,
	setSelectedVehicleOption,
}: {
	date: Dayjs;
	setDate: React.Dispatch<React.SetStateAction<Dayjs>>;
	onSubmit: () => void;
	dateRange: Date[];
	setDateRange: React.Dispatch<React.SetStateAction<Date[]>>;
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
	const { userId } = useSelector((state: RootState) => state.auth);

	return (
		<div className='flex justify-between items-center p-5'>
			<p className='text-3xl font-semibold'>Consolidated Report</p>
			<div className='flex items-center gap-3'>
				{Number(userId) === 83171 ? (
					<AllVehiclesSelect selectedVehicleOption={selectedVehicleOption} setSelectedVehicleOption={setSelectedVehicleOption} allowClear={true} />
				) : null}
				{Number(userId) === 85380 || Number(userId) === 83171 ? (
					<CustomDatePicker dateRange={dateRange} setDateRange={setDateRange} datePickerStyles='h-[32px]  max-h-[32px]' />
				) : (
					<DatePicker format='Do MMM YYYY' value={date} width='200px' onChange={(e) => setDate(e)} />
				)}
				<Button type='primary' onClick={() => onSubmit()}>
					Submit
				</Button>
			</div>
		</div>
	);
}
