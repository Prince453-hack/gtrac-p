export const convertMilliSecondToHours = (milliSecond: number) => {
	const hours = Math.floor(milliSecond / (1000 * 60 * 60));

	return hours;
};
