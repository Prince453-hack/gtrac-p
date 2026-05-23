function customComparator(a: string, b: string) {
	// Extract the numerical part of each string using regular expressions

	var numA = parseInt((a.match(/\d+/) !== null && a.match(/\d+/)![0]) || '0');
	var numB = parseInt((b.match(/\d+/) !== null && b.match(/\d+/)![0]) || '0');

	// Compare the numerical parts
	if (numA < numB) {
		return -1;
	} else if (numA > numB) {
		return 1;
	} else {
		// If numerical parts are equal, compare the full strings
		return a.localeCompare(b);
	}
}

export const importMultipleAssets = (assetsObj: any) => {
	return assetsObj.keys().sort(customComparator).map(assetsObj);
};
