'use client';

import { useGetVehiclesByStatusQuery, useLazyGetCurrentMonthReportQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { Alert, Button, Card, message } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import groupVehicleEntries, { GroupedVehicleEntry } from './helper/groupVehicleEntries';
import { setAllMarkers } from '@/app/_globalRedux/dashboard/markersSlice';
import { getFlatObjFromNestedObj } from '@/app/helpers/getFlatObjFromNestedObj';
import getExtraKm from '@/app/helpers/getExtraKm';
import CustomTableN, { DownloadReportTs } from '../../common/CustomTableN';
import { ColumnDef } from '@tanstack/react-table';
import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import moment from 'moment';
import CustomDatePicker from '../../common/datePicker';
import { setDate, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';
import { NoticeType } from 'antd/es/message/interface';
import { VehicleDetailsSelectMultiple } from '../../dashboard/VehicleDetailsSelectMultiple';
import { InfoCircleFilled } from '@ant-design/icons';

interface TableRow {
	serial?: number;
	vehicleNum: number;
	NoGpsKM: number;
	[key: string]: any;
}

const selectedStyles = {
	selectorBg: '#fff',
	colorBorder: '#ddd',
	fontSize: 14,
	optionFontSize: 14,
	optionPadding: '5px',
	optionSelectedColor: '#000',
	width: '400px',
};
export const View = () => {
	const dispatch = useDispatch();
	const [messageApi, contextHolder] = message.useMessage();

	const createMessage = ({ type, content }: { type: NoticeType; content: string }) => {
		messageApi.open({
			type: type,
			content,
		});
	};

	const markers = useSelector((state: RootState) => state.markers);
	const { groupId, userId, extra } = useSelector((state: RootState) => state.auth);
	const isGetCurrentMonthReportFetching = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some(
			(queries) => queries && queries.endpointName === 'getCurrentMonthReport' && queries.status === 'pending'
		)
	);

	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [customDateRange, setCustomDateRange] = useState([setDate(setHours(setMinutes(new Date(), 0), 0), 1), new Date()]);
	const [vehiclesByDates, setVehiclesByDates] = useState<GroupedVehicleEntry[]>([]);
	const [filteredVehiclesByDates, setFilteredVehiclesByDates] = useState<GroupedVehicleEntry[]>([]);
	const [customSelectOptions, setCustomSelectOptions] = useState<{ label: string; value: number }[]>([]);

	const [getCurrentMonthReportTrigger] = useLazyGetCurrentMonthReportQuery();
	const [currentMonthData, setCurrentMonthData] = useState<GetCurrentMonthResponse | undefined>();

	const { data: markersData } = useGetVehiclesByStatusQuery(
		{
			userId: userId,
			token: groupId,
			pUserId: userId,
			mode: '',
		},
		{
			skip: !groupId || !userId || markers.length > 0,
		}
	);

	const dateKeys = useMemo(() => {
		if (currentMonthData && currentMonthData.success) {
			let tempArr = Array.from(new Set(currentMonthData.list.map((item) => item.dateof)));

			tempArr = tempArr.sort((a, b) => {
				return new Date(moment(a, 'DD-MM-YYYY').format('YYYY-MM-DD')).getTime() - new Date(moment(b, 'DD-MM-YYYY').format('YYYY-MM-DD')).getTime();
			});

			return tempArr;
		}

		return [];
	}, [currentMonthData]);

	const columns = useMemo(() => {
		const cols: ColumnDef<TableRow>[] = [
			{
				accessorKey: 'vehicleNum',
				id: 'vehicle number',
				cell: (info) => info.getValue(),
				header: 'Vehicle No',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
				meta: {
					pinned: true,
				},
			},

			...dateKeys.map((date) => ({
				accessorFn: (row: any) => row.datesWithKm[date],
				id: date,
				cell: ({ row }: { row: any }) =>
					isNaN(Number(row.original.datesWithKm[date])) ? '-' : `${getExtraKm(row.original.datesWithKm[date], extra).toFixed(2)}`,
				header: moment(new Date(date.split('-').reverse().join('-'))).format('DD-MM'),
				footer: (props: any) => props.column.id,
				filterFn: (row: any, id: string, value: string) => operatorFilterFn(row, id, value),
			})),

			{
				accessorFn: (row: any) => row.NoGpsKM,
				id: 'no_gps_km',
				cell: ({ row }) => (
					<p className='font-semibold text-nowrap'>
						{' '}
						{row.original.NoGpsKM && row.original.NoGpsKM < 3000
							? `${getExtraKm(row.original.NoGpsKM, extra).toFixed(2)}`
							: row.original.NoGpsKM > 3000
							? '0'
							: '-'}
					</p>
				),
				header: () => (
					<div className='text-yellow-400 flex items-center justify-center gap-2'>
						<InfoCircleFilled />
						<p className='text-black'>No GPS KM</p>
					</div>
				),
				footer: (props: any) => props.column.id,
				filterFn: (row: any, id: string, value: string) => operatorFilterFn(row, id, value),
			},

			{
				accessorFn: (row: any) => row.datesWithKm,
				id: 'total km',
				cell: ({ row }: { row: any }) => (
					<p className='font-semibold text-nowrap'>
						{currentMonthData?.success
							? dateKeys
									.reduce(
										(acc, date) =>
											isNaN(Number(row.original.datesWithKm[date])) ? acc : acc + getExtraKm(Number(row.original.datesWithKm[date]), extra),
										0
									)
									.toFixed(2)
							: 0.0}{' '}
					</p>
				),
				header: 'Total KM',
				footer: (props: any) => props.column.id,
				filterFn: (row: any, id: string, value: string) => {
					let totalKm = dateKeys.reduce(
						(acc, date) => (isNaN(Number(row.original.datesWithKm[date])) ? acc : acc + getExtraKm(Number(row.original.datesWithKm[date]), extra)),
						0
					);

					totalKm = totalKm;
					return operatorFilterFn(totalKm.toFixed(2), id, value);
				},
			},
		];
		return cols;
	}, [dateKeys, currentMonthData, extra]);

	useEffect(() => {
		if (currentMonthData && currentMonthData.list.length > 1 && customDateRange[0] && customDateRange[1]) {
			let tempVehicles = groupVehicleEntries(
				currentMonthData.list,
				moment(customDateRange[0]).format('YYYY-MM-DD'),
				moment(customDateRange[1]).format('YYYY-MM-DD')
			);
			setVehiclesByDates(tempVehicles);

			if (customSelectOptions.length > 0) {
				tempVehicles = tempVehicles.filter((vehicle) => customSelectOptions.find((item) => item.label === vehicle.vehicleNum));
			}

			setFilteredVehiclesByDates(tempVehicles);
		}
	}, [currentMonthData, customDateRange, customSelectOptions]);

	useEffect(() => {
		if (markersData && markersData.list.length > 1 && markers.length === 0) {
			dispatch(setAllMarkers(markersData.list.map((vehicle) => ({ ...vehicle, visibility: true, isMarkerInfoWindowOpen: false }))));
		}
	}, [markersData, markers.length, dispatch]);

	const downloadReportHandler = () => {
		const rows = filteredVehiclesByDates.map((vehicle: GroupedVehicleEntry) => {
			return {
				'Vehicle No.': vehicle.vehicleNum,
				...getFlatObjFromNestedObj(
					dateKeys.map((date) => ({
						[date]: typeof vehicle.datesWithKm[date] === 'number' ? `${getExtraKm(vehicle.datesWithKm[date], extra).toFixed(2)}` : '-',
					}))
				),
				'No GPS Km':
					vehicle.NoGpsKM && vehicle.NoGpsKM < 3000 ? `${getExtraKm(vehicle.NoGpsKM, extra).toFixed(2)}` : vehicle.NoGpsKM > 3000 ? '0' : '-',
				'Total Km': dateKeys
					.reduce((acc, date) => (isNaN(Number(vehicle.datesWithKm[date])) ? acc : acc + getExtraKm(Number(vehicle.datesWithKm[date]), extra)), 0)
					.toFixed(2),
			};
		});

		const head = Object.keys(rows[0]);

		const body = rows.map((row) => Object.values(row));

		setDownloadReport({
			title: 'Current Month Report',
			excel: { title: 'Current Month Report', rows, footer: [] },
			pdf: {
				head: [head],
				body: body,
				title: 'Current Month Report',
				userOptions: {
					styles: { cellPadding: 2, fontSize: 9 },
					rowPageBreak: 'auto',
					bodyStyles: { valign: 'middle' },
					margin: { left: 5, right: 5, top: 10, bottom: 25 },
				},
				pageSize:
					Number(vehiclesByDates.length) < 20 ? 'a4' : Number(vehiclesByDates.length) < 25 ? 'a3' : Number(vehiclesByDates.length) < 30 ? 'a2' : 'a1',
			},
		});
	};

	return (
		<div>
			{contextHolder}
			<Card
				styles={{ body: { padding: 0, background: '#F6F8F6', borderRadius: '15px', border: 0 } }}
				style={{ borderRadius: '15px', background: '#F6F8F6', border: 0 }}
			>
				<div className='w-full flex items-start justify-between p-5'>
					<p className='text-3xl font-semibold'>Current Month Report</p>

					<div className='flex items-center gap-3'>
						<VehicleDetailsSelectMultiple
							selectedStyles={selectedStyles}
							customSelectOptions={customSelectOptions}
							setCustomSelectOptions={setCustomSelectOptions}
						/>

						<div className='w-[250px] max-w-[250px]'>
							<CustomDatePicker
								dateRange={customDateRange}
								disabled={isGetCurrentMonthReportFetching}
								setDateRange={setCustomDateRange}
								datePickerStyles='h-[32px]  max-h-[32px]'
								format='dd/MM/yyyy'
								showTimeSelect={false}
							/>
						</div>
						<div>
							<Button
								type='primary'
								loading={isGetCurrentMonthReportFetching}
								disabled={isGetCurrentMonthReportFetching}
								onClick={() => {
									let moreThan31Days;

									if (!customDateRange[0] || !customDateRange[1]) return;

									// if (moment(customDateRange[0]).isBefore(moment().subtract(6, 'months'))) {
									// 	createMessage({ content: 'Start date before 6 months is not allowed', type: 'error' });
									// 	return;
									// }

									if (moment(customDateRange[1]).diff(moment(customDateRange[0]), 'days') > 31) {
										moreThan31Days = true;
										setCustomDateRange((prev) => [prev[0], moment(customDateRange[0]).add(30, 'days').toDate()]);
										createMessage({
											type: 'error',
											content: 'We have adjusted the date range to 31 days from the start date as the selected date range is more than 31 days',
										});
									}

									getCurrentMonthReportTrigger({
										groupId,
										startDateTime: customDateRange[0]
											? moment(setSeconds(setMilliseconds(customDateRange[0], 0), 0)).format('YYYY-MM-DD HH:mm:ss')
											: '',
										endDateTime: moreThan31Days
											? moment(customDateRange[0]).add(30, 'days').format('YYYY-MM-DD HH:mm:ss')
											: customDateRange[1]
											? moment(setSeconds(setMilliseconds(customDateRange[1], 0), 0)).format('YYYY-MM-DD HH:mm:ss')
											: '',
									}).then(({ data }) => {
										if (!data) return;

										setCurrentMonthData(data);
									});
								}}
							>
								Submit
							</Button>
						</div>
					</div>
				</div>
				<div className='overflow-scroll'>
					<CustomTableN
						columns={columns}
						data={filteredVehiclesByDates.length >= 1 ? filteredVehiclesByDates : []}
						loading={isGetCurrentMonthReportFetching}
						onDownloadBtnClick={downloadReportHandler}
						downloadReport={downloadReport}
						setDownloadReport={setDownloadReport}
						width='none'
						fontSize='12px'
						densityProp='sm'
						height='h-[calc(100vh-280px)]'
					/>
				</div>
			</Card>
			<div className='z-20 absolute left-0 bottom-0 w-full text-sm'>
				<Alert
					type='warning'
					message={
						<p>
							The NO GPS calculated km&apos;s are purely based on assumption and approximation.
							<br /> The km&apos;s are not added in the total month km&apos;s and we leave the same to the user to validate the same with the manual
							data.
						</p>
					}
					banner
				/>
			</div>
		</div>
	);
};
