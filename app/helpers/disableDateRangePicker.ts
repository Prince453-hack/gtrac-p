import { Dayjs } from 'dayjs';

const disabledDateRangePicker = (current: Dayjs, from: Dayjs | undefined, maxLength: number) => {
	if (!from) return false;

	return Math.abs(current.diff(from, 'days')) >= maxLength;
};

export default disabledDateRangePicker;
