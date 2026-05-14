import React, { useState } from 'react';

import CustomDatePicker from '../common/datePicker';

import { TypedLazyQueryTrigger } from '@reduxjs/toolkit/query/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import moment from 'moment';

export default function Header({
	isGetAlertsByDateLoading,
	fetchElockAlerts,
	setFormatedData,
	customDateRange,
	setCustomDateRange,
}: {
	isGetAlertsByDateLoading: boolean;
	fetchElockAlerts: TypedLazyQueryTrigger<any, any, any>;
	setFormatedData: React.Dispatch<React.SetStateAction<ElockAlertByDate[]>>;
	customDateRange: Date[];
	setCustomDateRange: React.Dispatch<React.SetStateAction<Date[]>>;
}) {
	const { userId, groupId, parentUser } = useSelector((state: RootState) => state.auth);

	return (
		<div className='flex justify-between items-center p-5'>
			<p className='text-3xl font-semibold'>Elock Alerts</p>
			<div className='flex items-center gap-3'>
				<div className='w-[250px] max-w-[250px]'>
					<CustomDatePicker
						format='dd/MM/yyyy'
						dateRange={customDateRange}
						setDateRange={setCustomDateRange}
						datePickerStyles='h-[32px]  max-h-[32px]'
						showTimeSelect={false}
					/>
				</div>

				<button
					className='bg-[#4FB090] text-white h-[29px] px-4 hover:bg-[#73BDA3] rounded-md'
					disabled={isGetAlertsByDateLoading}
					onClick={() => {
						fetchElockAlerts({
							token: groupId,
							userId: userId,
							puserId: parentUser,
							startDate: moment(customDateRange[0]).format('YYYY-MM-DD'),
							endDate: moment(customDateRange[1]).format('YYYY-MM-DD'),
						}).then(({ data }) => {
							if (data && Array.isArray(data)) {
								setFormatedData(data);
							}
						});
					}}
				>
					Submit
				</button>
			</div>
		</div>
	);
}
