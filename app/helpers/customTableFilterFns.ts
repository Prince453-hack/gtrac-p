import { Row } from '@tanstack/react-table';

const operators = [
	{
		name: 'contains',
		value: '=',
		fn: (rowValue: number, id: string, filterValue: string) => {
			return rowValue.toString().includes(filterValue);
		},
	},
	{
		name: 'does not contain',
		value: '!=',
		fn: (rowValue: number, id: string, filterValue: string) => {
			return !rowValue.toString().includes(filterValue);
		},
	},
	{
		name: 'greater than',
		value: '>',
		fn: (rowValue: number, id: string, filterValue: string) => {
			return rowValue > Number(filterValue);
		},
	},
	{
		name: 'less than',
		value: '<',
		fn: (rowValue: number, id: string, filterValue: string) => {
			return rowValue < Number(filterValue);
		},
	},
];
export const operatorFilterFn = (row: Row<any> | number | string, id: string, filterValue: any) => {
	let rowValue: number | string | Row<any> = 0;
	if (typeof row === 'number' || typeof row === 'string') {
		rowValue = row;
	} else {
		rowValue = row.getValue(id) as string | number;
	}

	if (!isNaN(Number(rowValue))) {
		if (isNaN(Number(filterValue))) {
			const operatorObj = operators.find((operator) => filterValue.includes(operator.value));
			if (operatorObj) {
				const operatorIndex = filterValue.indexOf(operatorObj.value);

				if (isNaN(Number(filterValue.slice(operatorIndex + 1)))) {
					return rowValue
						?.toString()
						?.replaceAll('_', ' ')
						.toLowerCase()
						.includes(filterValue.toLowerCase().slice(operatorIndex + 1));
				} else {
					return operatorObj.fn(Number(rowValue), id, filterValue.slice(operatorIndex + 1));
				}
			} else {
				return rowValue?.toString()?.replaceAll('_', ' ').toLowerCase().includes(filterValue.toLowerCase());
			}
		} else {
			return rowValue?.toString()?.replaceAll('_', ' ').toLowerCase().includes(filterValue.toLowerCase());
		}
	} else {
		return rowValue?.toString()?.replaceAll('_', ' ').toLowerCase().includes(filterValue.toLowerCase());
	}
};
