export const getAlphabetsFirstChr = (dateTime: string) => {
	return dateTime
		.split(' ')
		.map((time) => (isNaN(Number(time)) === true ? `${time[0].toLowerCase()} ` : time))
		.join('');
};

// * below functions cleans text with following formats to normal title with first letter caps => sys_user_id, vehicleNo
export const convertServerKeysToTitle = (text: string) => {
	let parts = text
		.match(/[A-Z](?:[a-z]+|[A-Z]*(?=[A-Z]|$))|\d+|\w+/g)
		?.join(' ')
		?.replaceAll('_', ' ')
		.split(' ');

	if (parts) {
		return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
	} else return text;
};
