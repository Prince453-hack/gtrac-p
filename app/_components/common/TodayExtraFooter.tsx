import { Button } from 'antd';
import { Dispatch, SetStateAction } from 'react';
import { NoUndefinedRangeValueType } from '../dashboard/CustomRangePicker';
import React from 'react';
import dayjs from 'dayjs';

const checkIfRangePickerStartOrEnd = () => {
	if (!window) return;

	const rangePickerArrow = window.document.querySelector('.ant-picker-range-arrow') as HTMLElement;

	if (rangePickerArrow) {
		const StartOrEnd = rangePickerArrow.style.left > '0px' ? 'end' : 'start';
		return StartOrEnd;
	}
};
export const TodayExtraFooter = ({
	localCustomDateRange,
	setCustomDateRange,
	callback,
}: {
	localCustomDateRange: NoUndefinedRangeValueType<dayjs.Dayjs>;
	setCustomDateRange: Dispatch<SetStateAction<NoUndefinedRangeValueType<dayjs.Dayjs>>>;
	callback?: () => {};
}) => {
	return (
		<>
			{checkIfRangePickerStartOrEnd() === 'end' ? (
				<Button
					className='text-xs text-gray-500'
					type='text'
					onClick={() => {
						if (checkIfRangePickerStartOrEnd() === 'start') {
							setCustomDateRange((prev) =>
								prev[1] !== null ? [dayjs(new Date()), localCustomDateRange[1]] : [dayjs(new Date()), localCustomDateRange[1]]
							);
						} else {
							setCustomDateRange((prev) =>
								prev[0] !== null ? [localCustomDateRange[0], dayjs(new Date())] : [localCustomDateRange[0], dayjs(new Date())]
							);
						}
					}}
				>
					Today
				</Button>
			) : null}
		</>
	);
};
