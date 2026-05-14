'use client';

import { setHours, setMinutes } from 'date-fns';
import React, { useState } from 'react';
import CustomDatePicker from '../common/datePicker';
import { Button } from 'antd';
import moment from 'moment';

const dates: Date[] = new Array(10).fill(new Date());

export function View() {
	const [customDateRange, setCustomDateRange] = useState([setHours(setMinutes(new Date(), 0), 0), new Date()]);
	const [customDateRangeChanged, setCustomDateRangeChanged] = useState(false);

	return (
		<>
			<div className='w-full flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200'>
				<div className='flex items-center gap-3'>
					<h1 className='text-2xl font-bold text-gray-800 pl-4'>Adas Alerts</h1>
				</div>
				<div className='flex items-center gap-4'>
					<div className='flex gap-3 items-center'>
						<div className='w-[350px]'>
							<CustomDatePicker
								dateRange={customDateRange}
								setDateRange={(e) => {
									setCustomDateRange(e);
									setCustomDateRangeChanged(true);
								}}
								datePickerStyles='h-[30px] rounded-lg border-gray-300'
								// disabled={}
							/>
						</div>

						<Button
							type='primary'
							size='middle'
							className='bg-emerald-600 hover:bg-emerald-700 border-emerald-600 px-6'
							// disabled={}
							// onClick={() => fetchAllAlerts()}
						>
							Submit
						</Button>
					</div>
				</div>
			</div>
			<div className='bg-white grid grid-cols-10'>
				<div className='col-span-2 border-r'>
					<div className='p-1 border-b'>
						<p>Alert Dates</p>
					</div>

					<div className='space-y-3 my-4'>
						{dates.length
							? dates.map((d) => {
									return <div key={d.getTime()}>{moment(d).format('DD-MM-YYYY HH:mm')}</div>;
							  })
							: null}
					</div>
				</div>
				<div className='col-span-8 p-5'></div>
			</div>
		</>
	);
}
