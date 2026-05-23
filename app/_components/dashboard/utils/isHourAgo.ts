import moment from 'moment';

export const isHourAgo = (gpsTimeData: string) => {
	const gpsTime = moment(gpsTimeData);
	const oneHourAgo = moment().subtract(1, 'hour');

	if (gpsTime.isBefore(oneHourAgo)) {
		return true;
	} else {
		return false;
	}
};
