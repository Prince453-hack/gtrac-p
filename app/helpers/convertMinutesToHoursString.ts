const convertMinutesToHoursString = (n: number) => {
	const num = n;
	const hours = num / 60;
	const rHours = Math.floor(hours);
	const minutes = (hours - rHours) * 60;
	const rMinutes = Math.round(minutes);

	if (rHours === 0) {
		return rMinutes + 'm';
	} else if (rMinutes === 0) {
		return rHours + 'h';
	} else if (rHours === 0 && rMinutes === 0) {
		return '0m';
	} else {
		return rHours + 'h ' + rMinutes + 'm';
	}
};

export default convertMinutesToHoursString;
