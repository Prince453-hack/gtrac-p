import React from 'react';

import TableN from '../table';
import { Card, Select, Spin } from 'antd';
import PieChart from './pieChart';
import { dateFilters } from '../view';

export interface PieChartData {
	labels: string[];
	datasets: {
		data: number[];
		backgroundColor: string[];
	}[];
}

function PieChartTable({
	setDateRange,
	title,
	isLoading,
	data,
}: {
	setDateRange: React.Dispatch<React.SetStateAction<{ startDate: string; endDate: string }>>;
	title: string;
	isLoading: boolean;
	data: { tableHead: string[]; pieChartData: PieChartData; tableData: Record<string, any>[] };
}) {
	const [selectedDateRange, setSelectedDateRange] = React.useState<{ value: string; label: string }>({
		value: dateFilters[0].value,
		label: dateFilters[0].label,
	});
	return (
		<Card
			title={
				<div className='flex items-center justify-between gap-2'>
					<div>
						<p className='font-medium text-xl'>{title}</p>
					</div>
					<Select
						options={dateFilters}
						value={selectedDateRange}
						onChange={(v: any) => {
							const date = dateFilters.find((item) => item.value === v);

							if (date) {
								setDateRange({ startDate: date.startDate, endDate: date.endDate });
								setSelectedDateRange({ label: date.label, value: date.value });
							}
						}}
						className='w-[180px]'
					/>
				</div>
			}
			style={{ height: '345px', overflow: 'hidden' }}
		>
			{isLoading ? (
				<div className='flex items-center justify-center w-full h-[200px]'>
					<Spin className='relative' size='large' />
				</div>
			) : (
				<div className='grid grid-cols-6'>
					<div className='col-span-4'>
						<div className='w-full flex items-center justify-center'>
							<PieChart pieChartData={data.pieChartData} />
						</div>
					</div>

					<div className='flex flex-col gap-2 mt-[12px] col-span-2'>
						<div className='flex items-center gap-2'>
							<div className='bg-[#4FB090] w-3 h-3 rounded-full' />
							<p className='font-medium'>Least Used Vehicles</p>
						</div>
						<div className='flex items-center gap-2'>
							<div className='bg-[#84E7C7] w-3 h-3 rounded-full' />
							<p className='font-medium'>Moderate Used Vehicles</p>
						</div>
						<div className='flex items-center gap-2'>
							<div className='bg-[#84C5AF] w-3 h-3 rounded-full' />
							<p className='font-medium'>Most Used Vehicles</p>
						</div>
					</div>
				</div>
			)}
		</Card>
	);
}

export default PieChartTable;
