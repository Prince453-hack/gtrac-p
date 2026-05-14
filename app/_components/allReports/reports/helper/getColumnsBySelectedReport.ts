import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip } from 'antd';
interface TableRow {
	[key: string]: any;
}

export const getColumnsBySelectedReport = ({ selectedReport }: { selectedReport: { label: string; value: number } }): ColumnDef<TableRow>[] => {
	switch (selectedReport.label) {
		case 'Journey Report':
		case 'Diagnostic Report':
			return [
				{
					accessorKey: 'mode',
					id: 'mode',
					cell: (info) => info.getValue(),
					header: 'Mode',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'fromTime',
					id: 'from-time',
					cell: (info) => info.getValue(),
					header: 'Start Time',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'startLocation',
					id: 'from-location',
					cell: ({ getValue }) => {
						return (getValue() as string)?.replaceAll('_', ' ');
					},
					header: 'Start Location',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'toTime',
					id: 'to-time',
					cell: (info) => info.getValue(),
					header: 'End Time',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'endLocation',
					id: 'to-location',
					cell: ({ getValue }) => {
						return (getValue() as string)?.replaceAll('_', ' ');
					},
					header: 'End Location',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'totalTimeInMIN',
					id: 'duration',
					cell: (info) => info.getValue(),
					header: 'Duration',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'totalDistance',
					id: 'distance',
					cell: (info) => info.getValue(),
					header: 'Distance',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
			];

		case 'Temperature Report':
			return [
				{
					accessorKey: 'date',
					id: 'date',
					cell: (info) => info.getValue(),
					header: 'Date',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'temperature',
					id: 'temperature',
					cell: (info) => (info.getValue() as number).toFixed(2),
					header: 'Temperature',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'distance',
					id: 'distance',
					cell: (info) => (info.getValue() as number).toFixed(2),
					header: 'Distance',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'odometer',
					id: 'odometer',
					cell: (info) => (info.getValue() as number).toFixed(2),
					header: 'Odometer',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				{
					accessorKey: 'latLng',
					id: 'latLng',
					cell: (info) => `${(info.getValue() as number)?.toFixed(2)} ⎪ ${(info.getValue() as number)?.toFixed(2)}`,
					header: 'Lat ⎪ Long',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				// {
				// 	title: 'Location',
				// 	key: 'Location',
				// 	dataIndex: 'location',
				// 	width: '270px',
				// 	render: (value) => (
				// 		<Tooltip title={value ? value?.replaceAll('_', ' ') : ''} mouseEnterDelay={1}>
				// 			{value ? value?.replaceAll('_', ' ').slice(0, 55) : ''}
				// 			{value && value.length > 55 ? '...' : ''}
				// 		</Tooltip>
				// 	),
				// },
				{
					accessorKey: 'location',
					id: 'location',
					cell: ({ cell, row }) => {
						return row.original;
					},
					header: 'Location',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
				// {
				// 	title: 'Nearest POI',
				// 	key: 'Nearest POI',
				// 	dataIndex: 'nearestPoi',
				// 	width: '270px',
				// 	render: (value) => (
				// 		<Tooltip title={value ? value?.replaceAll('_', ' ') : ''} mouseEnterDelay={1}>
				// 			{value ? value?.replaceAll('_', ' ').slice(0, 55) : ''}
				// 			{value && value.length > 55 ? '...' : ''}
				// 		</Tooltip>
				// 	),
				// },
				{
					accessorKey: 'nearestPoi',
					id: 'nearestPoi',
					cell: (info) => info.getValue(),
					header: 'Nearest POI',
					footer: (props) => props.column.id,
					filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				},
			];
		default:
			return [];
	}
};
