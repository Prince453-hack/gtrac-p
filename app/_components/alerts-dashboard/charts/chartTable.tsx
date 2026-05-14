import React, { Dispatch, SetStateAction } from 'react';

import TableN from '../table';
import { Button, Card, Select, Spin } from 'antd';
import BarChart, { BarChartDataProps } from './barChart';
import { dateFilters } from '../view';

function ChartTable({
	setDateRange,
	title,
	data,
	isLoading,
}: {
	setDateRange: Dispatch<SetStateAction<{ startDate: string; endDate: string }>>;
	title: string;
	isLoading: boolean;
	data: { tableHead: string[]; tableData: Record<string, any>[]; barChartData: BarChartDataProps };
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
						<BarChart barCharData={data.barChartData} />
					</div>
					<div className='col-span-2'>
						<TableN isStripped={true} tableHead={data.tableHead} tableData={data.tableData} />
					</div>
				</div>
			)}
		</Card>
	);
}

export default ChartTable;
