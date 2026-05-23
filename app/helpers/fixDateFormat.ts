import moment from 'moment';

export const fixDateFormat = (date: string, format: string, returnType: 'date' | 'No Info') => {
	const formattedDate = moment(new Date(date));

	if (!formattedDate.isValid() || formattedDate.isBefore([2020, 10, 21], 'year')) {
		if (returnType === 'No Info') {
			return 'No Info';
		} else {
			return moment(new Date()).format(format);
		}
	} else {
		return formattedDate.format(format);
	}
};
