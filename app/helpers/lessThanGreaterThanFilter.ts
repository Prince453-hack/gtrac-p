const lessThanGreaterThanFilter = (filterValue: string | number, dataIndex: string | string[], data: any, dataPoint?: number) => {
	const sign = filterValue.toString()[0];

	filterValue = Number(filterValue.toString().slice(1).trim());

	if (!dataPoint) {
		const keys = Array.isArray(dataIndex) ? dataIndex : [dataIndex];

		let value: any = data;
		for (const key of keys) {
			if (value && value[key] !== undefined) {
				value = value[key];
			} else {
				return false;
			}
		}

		if (sign !== '<' && sign !== '>') {
			return value.toString().includes(filterValue.toString());
		}

		if (!isNaN(Number(value))) {
			if (sign === '>') {
				return value >= filterValue;
			}
			if (sign === '<') {
				return value <= filterValue;
			}
		}
	} else {
		let value = dataPoint;
		if (!isNaN(Number(value))) {
			if (sign === '>') {
				return value >= filterValue;
			}
			if (sign === '<') {
				return value <= filterValue;
			}
		}
	}
	return false;
};

export default lessThanGreaterThanFilter;
