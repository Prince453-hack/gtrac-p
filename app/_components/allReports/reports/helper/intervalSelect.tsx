import { Select } from 'antd';
import React from 'react';

function IntervalSelect({
	selectedInterval,
	setSelectedInterval,
}: {
	selectedInterval: {
		label: string;
		value: number;
	};
	setSelectedInterval: React.Dispatch<React.SetStateAction<{ label: string; value: number }>>;
}) {
	const intervalOptions: { label: string; value: number }[] = [
		{ value: 5, label: '5 Minutes' },
		{ value: 15, label: '15 Minutes' },
		{ value: 30, label: '30 Minutes' },
		{ value: 60, label: '60 Minutes' },
	];

	return (
		<Select
			value={selectedInterval.value}
			className='w-[200px]'
			onChange={(_, option) => {
				if (!Array.isArray(option) && option) {
					setSelectedInterval(option);
				}
			}}
			placeholder='Select Interval'
			options={intervalOptions}
			showSearch
			size='middle'
			suffixIcon
		/>
	);
}

export default IntervalSelect;
