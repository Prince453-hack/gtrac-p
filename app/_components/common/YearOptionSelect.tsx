'use client';

import { Select } from 'antd';
import React from 'react';

const yearOptions = [
	{
		value: '2025',
		label: '2025',
	},
	{
		value: '2024',
		label: '2024',
	},
	{
		value: '2023',
		label: '2023',
	},
	{
		value: '2022',
		label: '2022',
	},
	{
		value: '2021',
		label: '2021',
	},
	{
		value: '2020',
		label: '2020',
	},
	{
		value: '2019',
		label: '2019',
	},
	{
		value: '2018',
		label: '2018',
	},
	{
		value: '2017',
		label: '2017',
	},
	{
		value: '2016',
		label: '2016',
	},
	{
		value: '2015',
		label: '2015',
	},
];

export default function YearOptionsSelect({
	selectedYear,
	setSelectedYear,
}: {
	selectedYear: string | undefined;
	setSelectedYear: React.Dispatch<React.SetStateAction<string | undefined>>;
}) {
	return (
		<Select
			options={yearOptions}
			className='w-[200px] max-w-[200px]'
			value={selectedYear}
			onChange={(value) => setSelectedYear(value)}
			placeholder='Select Year'
			allowClear
			onClear={() => setSelectedYear(undefined)}
		/>
	);
}
