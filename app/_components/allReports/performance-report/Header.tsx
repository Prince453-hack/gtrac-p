'use client';

import { Button, Select } from 'antd';

import AllVehiclesSelect from '../../common/AllVehiclesSelect';
import MonthOptionsSelect from '../../common/MonthOptionsSelect';
import { useEffect, useState } from 'react';
import YearOptionsSelect from '../../common/YearOptionSelect';
import { CloudDownloadOutlined } from '@ant-design/icons';

export default function Header({
	onSubmit,
	handleDownloadBtnClick,
	selectedVehicleOption,
	setSelectedVehicleOption,
}: {
	onSubmit: ({
		selectedMonth,
		selectedYear,
		selectedVehicle,
		yearOrMonth,
	}: {
		selectedMonth: string | undefined;
		selectedYear: string | undefined;
		selectedVehicle: { label: string; value: number } | undefined;
		yearOrMonth: { value: string; label: string };
	}) => void;
	handleDownloadBtnClick: () => void;
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
	const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
	const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
	const [yearOrMonth, setYearOrMonth] = useState<{ value: string; label: string }>({ value: 'year', label: 'Year' });

	return (
		<div className='flex justify-between items-center p-5'>
			<p className='text-3xl font-semibold'>Performance Report</p>
			<div className='flex items-center gap-3'>
				<div className='bg-white rounded-full p-1 px-2 cursor-pointer' onClick={() => handleDownloadBtnClick()}>
					<CloudDownloadOutlined />
				</div>
				<AllVehiclesSelect selectedVehicleOption={selectedVehicleOption} setSelectedVehicleOption={setSelectedVehicleOption} allowClear={true} />

				<Select
					value={yearOrMonth}
					className='w-[200px] max-w-[200px]'
					onChange={(e: unknown) => {
						if (e === 'year' || e === 'month') {
							setYearOrMonth({ value: e, label: e.slice(0, 1).toUpperCase() + e.slice(1) });
						}
					}}
					options={[
						{ value: 'year', label: 'Year' },
						{ value: 'month', label: 'Month' },
					]}
				/>

				{yearOrMonth.value === 'year' && <YearOptionsSelect selectedYear={selectedYear} setSelectedYear={setSelectedYear} />}
				{yearOrMonth.value === 'month' && (
					<>
						<MonthOptionsSelect selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
						<YearOptionsSelect selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
					</>
				)}

				<Button type='primary' onClick={() => onSubmit({ selectedMonth, selectedYear, selectedVehicle: selectedVehicleOption, yearOrMonth })}>
					Submit
				</Button>
			</div>
		</div>
	);
}
