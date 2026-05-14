'use client';

import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Select } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import moment from 'moment';
import { useAppDispatch } from '@/app/_globalRedux/provider';
import { setStopHistoryReplay } from '@/app/_globalRedux/dashboard/historyReplaySlice';
import { setSelectedVehicleCustomRangeSelected } from '@/app/_globalRedux/dashboard/selectedVehicleCustomRangeSlice';
import CustomDatePicker from '../common/datePicker';
import { SearchOutlined } from '@ant-design/icons';

export type NoUndefinedRangeValueType<DateType> = [start: DateType | null, end: DateType | null];

export type RangeValueType<DateType> = [start: DateType | null | undefined, end: DateType | null | undefined];

export const CustomRangePickerReuse = ({
	customDateRange,
	setCustomDateRange,
}: {
	customDateRange: Date[];
	setCustomDateRange: Dispatch<SetStateAction<Date[]>>;
}) => {
	const [selectOpen, setSelectOpen] = useState(false);

	const { customRangeSelected } = useSelector((state: RootState) => state.customRange);

	const isTodaySelected = useRef(false);

	const options = [
		{
			label: 'Today',
			value: 'Today',
		},
		{
			label: 'Yesterday',
			value: 'Yesterday',
		},
		{
			label: 'Last 3 Days',
			value: 'Last 3 Days',
		},
		{
			label: 'Last 7 Days',
			value: 'Last 7 Days',
		},
		{
			label: 'This Month',
			value: 'This Month',
		},
		{
			label: 'Last Month',
			value: 'Last Month',
		},
		{
			label: 'Custom Date Range',
			value: 'Custom Date Range',
		},
	];

	const dispatch = useAppDispatch();

	let localDateRange: { startDate: Date | undefined; endDate: Date | undefined } = { startDate: undefined, endDate: undefined };
	const getVehicleDetailsByDate = async (selectedDateType: string, customDateRange: Date[]) => {
		if (selectedDateType === 'Today') {
			isTodaySelected.current = true;
			localDateRange = {
				startDate: moment().startOf('day').toDate(),
				endDate: moment().toDate(),
			};
		} else if (selectedDateType === 'Yesterday') {
			localDateRange = {
				startDate: moment().startOf('day').subtract(1, 'day').toDate(),
				endDate: moment().endOf('day').subtract(1, 'day').toDate(),
			};
		} else if (selectedDateType === 'Last 7 Days') {
			localDateRange = {
				startDate: moment().subtract(7, 'days').toDate(),
				endDate: moment().toDate(),
			};
		} else if (selectedDateType === 'Last 3 Days') {
			localDateRange = {
				startDate: moment().subtract(3, 'days').toDate(),
				endDate: moment().toDate(),
			};
		} else if (selectedDateType === 'Last Month') {
			localDateRange = {
				startDate: moment().subtract(1, 'month').startOf('month').toDate(),
				endDate: moment().subtract(1, 'month').endOf('month').toDate(),
			};
		} else if (selectedDateType === 'This Month') {
			localDateRange = {
				startDate: moment().startOf('month').toDate(),
				endDate: moment().toDate(),
			};
		} else if (selectedDateType === 'Custom Date Range') {
			if (customDateRange) {
				localDateRange = {
					startDate: moment(customDateRange[0]?.toISOString()).toDate(),
					endDate: moment(customDateRange[1]?.toISOString()).toDate(),
				};
			}
		}
		if (localDateRange.startDate && localDateRange.endDate) setCustomDateRange([localDateRange.startDate, localDateRange.endDate]);
	};

	const getDataForNewRange = (e: Date[]) => {
		getVehicleDetailsByDate('Custom Date Range', e);
		dispatch(setStopHistoryReplay());
	};

	return (
		<div className={`${customRangeSelected === 'Custom Date Range' ? 'mb-6' : ''}`}>
			<Select
				className='w-full'
				size='large'
				options={options}
				open={selectOpen}
				value={customRangeSelected}
				onDropdownVisibleChange={(visible) => setSelectOpen(visible)}
				onChange={(e) => {
					dispatch(setSelectedVehicleCustomRangeSelected(e));
					if (e !== 'Custom Date Range') {
						getVehicleDetailsByDate(e, customDateRange);
						dispatch(setStopHistoryReplay());
					}
				}}
				optionRender={(e) => (
					<p
						onClick={() => {
							setSelectOpen(false);
						}}
					>
						{e.label}
					</p>
				)}
			/>
			{customRangeSelected === 'Custom Date Range' ? (
				<div className='mt-2.5 -mb-3 text-base flex gap-2 items-center'>
					<CustomDatePicker
						dateRange={customDateRange}
						setDateRange={setCustomDateRange}
						datePickerStyles='py-2'
						onComplete={() => {
							getDataForNewRange(customDateRange);
						}}
					/>
					<div className='bg-[#4FB090] text-white p-2 rounded-full flex justify-center items-center h-fit cursor-pointer hover:bg-[#62c5a4] transition-all duration-300'>
						<SearchOutlined onClick={() => getDataForNewRange(customDateRange)} />
					</div>
				</div>
			) : (
				<div className='w-[calc(100%-4px)] ml-0.5 mt-2 mb-[18px] rounded-md p-2 h-[38px] text-base bg-white'>
					{customDateRange[0] ? (
						<div className='flex justify-between px-2'>
							<p>{moment(customDateRange[0])?.format('DD-MM-YYYY HH:mm:ss')}</p> - <p>{moment(customDateRange[1])?.format('DD-MM-YYYY HH:mm:ss')}</p>
						</div>
					) : (
						<div className='flex justify-between px-2'>
							<p>{moment().startOf('day').format('Do MMM, YYYY HH:mm')}</p> - <p>{moment().format('Do MMM, YYY HH:mm')}</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
