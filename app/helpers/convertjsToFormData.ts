export function getFormData(object: any) {
	const formData = new FormData();
	Object.keys(object).forEach((key) => {
		if (typeof object[key] !== 'object') formData.append(key, object[key]);
		else formData.append(key, JSON.stringify(object[key]));
	});
	return formData;
}
