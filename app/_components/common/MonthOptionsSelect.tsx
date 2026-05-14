'use client';

import { Select } from 'antd';
import React from 'react';

const monthOptions = [
	{
		value: 'january',
		label: 'January',
	},
	{
		value: 'february',
		label: 'February',
	},
	{
		value: 'march',
		label: 'March',
	},
	{
		value: 'april',
		label: 'April',
	},
	{
		value: 'may',
		label: 'May',
	},
	{
		value: 'june',
		label: 'June',
	},
	{
		value: 'july',
		label: 'July',
	},
	{
		value: 'august',
		label: 'August',
	},
	{
		value: 'september',
		label: 'September',
	},
	{
		value: 'october',
		label: 'October',
	},
	{
		value: 'november',
		label: 'November',
	},
	{
		value: 'december',
		label: 'December',
	},
];

export default function MonthOptionsSelect({
	selectedMonth,
	setSelectedMonth,
}: {
	selectedMonth: string | undefined;
	setSelectedMonth: React.Dispatch<React.SetStateAction<string | undefined>>;
}) {
	return (
		<Select
			options={monthOptions}
			className='w-[200px] max-w-[200px]'
			value={selectedMonth}
			onChange={(value) => setSelectedMonth(value)}
			placeholder='Select Month'
			allowClear
			onClear={() => setSelectedMonth(undefined)}
		/>
	);
}
