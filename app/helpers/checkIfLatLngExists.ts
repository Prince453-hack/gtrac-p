export const checkLatLngExists = (locationString: string) => {
	const parts = locationString.split('##');

	if (parts.length === 3) {
		const latitude = parts[1];
		const longitude = parts[2];

		if (latitude && longitude) {
			return true;
		}
	}

	return false;
};
