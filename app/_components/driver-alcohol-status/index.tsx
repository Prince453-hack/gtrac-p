'use client';

import { useSelector } from 'react-redux';
import { Card, DatePicker, message, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { NoticeType } from 'antd/es/message/interface';
import { PlusOutlined } from '@ant-design/icons';
import { useLazyGetVehicleCurrentLocationQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { RootState } from '@/app/_globalRedux/store';
import CustomTableN from '../common/CustomTableN';
import { ColumnDef } from '@tanstack/react-table';
import { useGetDriverListAlcoholQuery, useGetDriverListQuery, useLazyGetDriverListAlcoholQuery } from '@/app/_globalRedux/services/masterData';
import dayjs from 'dayjs';
import { useSaveAlcoholReadingMutation } from '@/app/_globalRedux/services/trackingReport';
import { GetDriverAlcoholListResponse } from '@/app/_globalRedux/services/types/getDriverAlcoholList';

export const View = () => {
	const { userId, groupId: token } = useSelector((state: RootState) => state.auth);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState(dayjs());

	const { data: driverAlcoholStatusData, isFetching: isDriverAlcoholStatusFetching } = useGetDriverListAlcoholQuery(
		{
			token,
			date: dayjs().format('YYYY-MM-DD'),
		},
		{ skip: !token }
	);

	const [getVehicleCurrentLocation, { data: vehicleCurrentLocationData }] = useLazyGetVehicleCurrentLocationQuery();
	const [saveAlcoholReading, { isLoading: isSaveAlcoholReadingFetching }] = useSaveAlcoholReadingMutation();
	const [getDriverAlcoholList, { data: driverAlcoholStatusLazyData, isFetching: isDriverAlcoholStatusLazyFetching }] =
		useLazyGetDriverListAlcoholQuery();

	useEffect(() => {
		if (token) {
			getDriverAlcoholList({ token, date: selectedDate.format('YYYY-MM-DD') });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	useEffect(() => {
		getDriverAlcoholList({ token, date: selectedDate.format('YYYY-MM-DD') });
		setIsLazy(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDate]);

	const { data: driverList, isFetching: isDriverListFetching } = useGetDriverListQuery({ token }, { skip: !token || !userId });

	type formatedData = {
		vehId: string;
		driverId: string;
		driver_name: string;
		ms_update_time: string;
		ms_reading: string;
		ms_status: string;
		es_update_time: string;
		es_reading: string;
		es_status: string;
	};

	const [filteredData, setFilteredData] = useState<formatedData[]>([]);
	const [data, setData] = useState<formatedData[]>([]);
	const [driversListOptions, setDriversListOptions] = useState<{ label: string; value: string }[]>([]);
	const [selectedDriver, setSelectedDriver] = useState<{ label: string; value: string } | undefined>();

	const [messageApi, contextHolder] = message.useMessage();
	const [isLazy, setIsLazy] = useState(false);

	const dataFilter = (selectedDriverProp?: { value: string; label: string }) => {
		setIsFilteringData(true);
		let tempFilteredData = data;

		if (selectedDriverProp || selectedDriver) {
			tempFilteredData = tempFilteredData.filter(
				(data) => data.driver_name === selectedDriver?.value || data.driver_name === selectedDriverProp?.value
			);
		}

		if (activeAlcholStatusOption?.value === 'sober') {
			tempFilteredData = tempFilteredData.filter(
				(filterData) => filterData.es_status.toLowerCase() === 'sober' || filterData.ms_status.toLowerCase() === 'sober'
			);
		} else if (activeAlcholStatusOption?.value === 'drunk') {
			tempFilteredData = tempFilteredData.filter(
				(filterData) => filterData.es_status.toLowerCase() === 'drunk' || filterData.ms_status.toLowerCase() === 'drunk'
			);
		}
		setFilteredData(tempFilteredData);

		setTimeout(() => {
			setIsFilteringData(false);
		}, 1000);
	};

	useEffect(() => {
		if (driverList && driverList.list && Array.isArray(driverList.list) && driverList.list.length > 0) {
			let tempDriverData: GetDriverAlcoholListResponse['list'] = [];

			if (
				driverAlcoholStatusLazyData &&
				driverAlcoholStatusLazyData.list &&
				Array.isArray(driverAlcoholStatusLazyData.list) &&
				driverAlcoholStatusLazyData.list.length > 0
			) {
				tempDriverData = driverAlcoholStatusLazyData?.list || [];
			}

			if (
				driverAlcoholStatusData &&
				driverAlcoholStatusData.list &&
				Array.isArray(driverAlcoholStatusData.list) &&
				driverAlcoholStatusData.list.length > 0 &&
				isLazy == false
			) {
				tempDriverData = driverAlcoholStatusData?.list || [];
			}

			const tempData = driverList.list.map((driver) => {
				const driverData = tempDriverData.find((data) => data.sys_driver_id === driver.id);

				return {
					driverId: `${driver.id}`,
					vehId: `${driver?.sys_service_id}` || '',
					driver_name: driver.driver_name,
					ms_update_time: driverData?.readingtime || '',
					ms_reading: driverData?.readingvalue || '',
					ms_status: driverData?.readingtext || '',
					es_update_time: driverData?.readingtimeev || '',
					es_reading: driverData?.readingvalueev || '',
					es_status: driverData?.readingtextev || '',
				};
			});

			setData(tempData);

			const tempDriverListOptions = driverList.list.map((driver) => ({ label: driver.driver_name, value: driver.driver_name }));
			setDriversListOptions(tempDriverListOptions);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDriverAlcoholStatusLazyFetching, isDriverAlcoholStatusFetching, driverList]);
	const createMessage = ({ type, content }: { type: NoticeType; content: string }) => {
		messageApi.open({
			type: type,
			content,
		});
	};

	const shiftOptions = [
		{ label: 'All', value: 'all' },
		{ label: 'Morning Shift', value: 'morning' },
		{ label: 'Evening Shift', value: 'evening' },
	];

	const alcholDriverOptions = [
		{ label: 'All', value: 'all' },
		{ label: 'Sober', value: 'sober' },
		{ label: 'Drunk', value: 'drunk' },
	];
	const [activeShiftOption, setActiveShiftOption] = useState<{ label: string; value: string } | undefined>({
		label: 'All',
		value: 'all',
	});
	const [activeAlcholStatusOption, setActiveAlcoholStatusOption] = useState<{ label: string; value: string } | undefined>({
		label: 'All',
		value: 'all',
	});

	const addAlcoholReadingHandler = (data: formatedData) => {
		const auth = JSON.parse(localStorage.getItem('auth-session') || '');

		if (auth) {
			getVehicleCurrentLocation({
				userId: Number(auth.userId),
				vehId: Number(data.vehId),
			}).then(({ data: vehicleCurrentLocationData }) => {
				if (data) {
					saveAlcoholReading({
						sys_group_id: auth.groupId,
						sys_driver_id: Number(data.driverId),
						driver_name: data.driver_name,
						readingtime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
						readingvalue: vehicleCurrentLocationData?.list.alcoholLbl || '',
						readingtext: 'Sober',
						sift: dayjs().get('hour') > 12 ? 'evening' : 'morning',
						dateofreading: dayjs().format('YYYY-MM-DD'),
					}).then(() => {
						getDriverAlcoholList({ token: auth.groupId, date: dayjs().format('YYYY-MM-DD') });
					});
				}
			});
		}
	};

	const AllColumns: ColumnDef<any>[] = [
		{
			accessorKey: 'driver_name',
			id: 'driver_name',
			cell: (info) => info.getValue(),
			header: 'Driver Name',
			footer: (props) => props.column.id,
		},
		{
			accessorKey: 'ms_update_time',
			id: 'ms_update_time',
			cell: (info) => info.getValue(),
			header: 'M.S. Time',
			footer: (props) => props.column.id,
		},
		{
			accessorKey: 'ms_reading',
			id: 'ms_reading',
			cell: (info) => info.getValue(),
			header: 'M.S. Reading',
			footer: (props) => props.column.id,
		},
		{
			accessorKey: 'ms_status',
			id: 'ms_status',
			cell: (info) => info.getValue(),
			header: 'M.S. Status',
			footer: (props) => props.column.id,
		},
		{
			accessorKey: 'es_update_time',
			id: 'es_update_time',
			cell: (info) => info.getValue(),
			header: 'E.S. Time',
			footer: (props) => props.column.id,
		},
		{
			accessorKey: 'es_reading',
			id: 'es_reading',
			cell: (info) => info.getValue(),
			header: 'E.S. Reading',
			footer: (props) => props.column.id,
		},
		{
			accessorKey: 'es_status',
			id: 'es_status',
			cell: (info) => info.getValue(),
			header: 'E.S. Status',
			footer: (props) => props.column.id,
		},
		{
			id: 'action',
			cell: ({ cell }) => (
				<div className='w-full flex justify-center'>
					<div
						onClick={() => {
							addAlcoholReadingHandler(cell.row.original);
						}}
						className=' p-2 bg-neutral-200 border border-neutral-400 rounded-full flex  items-center justify-center w-6 h-6 '
					>
						{cell.row.original.vehId ? (
							<div className='text-neutral-600 font-lg font-medium'>
								<PlusOutlined />
							</div>
						) : (
							'Vehicle not assigned to this Driver'
						)}
					</div>
				</div>
			),
			header: 'Add Alcohol Reading',
			footer: (props) => props.column.id,
		},
	];

	const [activeColumns, setActiveColumns] = useState<ColumnDef<any>[]>(AllColumns);
	const [isFilteringData, setIsFilteringData] = useState(false);

	useEffect(() => {
		setIsFilteringData(true);
		if (activeShiftOption?.value === 'all') {
			setActiveColumns(AllColumns);
		} else if (activeShiftOption?.value === 'morning') {
			setActiveColumns(
				AllColumns.filter(
					(columns) =>
						columns.header === 'M.S. Time' ||
						columns.header === 'M.S. Reading' ||
						columns.header === 'M.S. Status' ||
						columns.header === 'Driver Name'
				)
			);
		} else if (activeShiftOption?.value === 'evening') {
			setActiveColumns(
				AllColumns.filter(
					(columns) =>
						columns.header === 'E.S. Time' ||
						columns.header === 'E.S. Reading' ||
						columns.header === 'E.S. Status' ||
						columns.header === 'Driver Name'
				)
			);
		}

		setTimeout(() => {
			setIsFilteringData(false);
		}, 1000);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeShiftOption]);

	useEffect(() => {
		if (driverList?.list && Array.isArray(driverList.list) && driverList.list.length > 0) {
			dataFilter();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeAlcholStatusOption, driverList, data]);

	return (
		<div>
			{contextHolder}
			<Card
				styles={{ body: { padding: 0, background: '#F6F8F6', borderRadius: '15px', border: 0 } }}
				style={{ borderRadius: '15px', background: '#F6F8F6', border: 0 }}
			>
				<div className='w-full flex items-start justify-between p-5'>
					<div className='flex items-center gap-3'>
						<p className='text-3xl font-semibold'>Driver Alcohol Status</p>
					</div>

					<div className='flex items-center gap-3 justify-end'>
						{/* <div className='flex flex-col gap-1'>
							<p className='text-sm font-semibold'>Driver Name</p>
							<Select
								options={driversListOptions}
								value={selectedDriver?.value}
								allowClear
								onChange={(value) => {
									setSelectedDriver({ label: value, value: value });
									dataFilter({ label: value, value: value });
								}}
								size='middle'
								className='w-[200px]'
								maxTagCount='responsive'
							/>
						</div> */}

						<div className='flex flex-col gap-1'>
							<p className='text-sm font-semibold'>Alcohol Status</p>
							<Select
								options={alcholDriverOptions}
								defaultValue={'all'}
								value={activeAlcholStatusOption?.value}
								onChange={(value) => setActiveAlcoholStatusOption({ label: value, value: value })}
								size='middle'
								className='w-[150px]'
							/>
						</div>

						<div className='flex flex-col gap-1'>
							<p className='text-sm font-semibold'>Shift</p>
							<Select
								options={shiftOptions}
								defaultValue={'all'}
								value={activeShiftOption?.label}
								onChange={(value) => setActiveShiftOption({ label: value, value: value })}
								size='middle'
								className='w-[150px]'
							/>
						</div>

						<div className='flex flex-col gap-1'>
							<p className='text-sm font-semibold'>Selected Date</p>
							<DatePicker
								format='DD/MM/YYYY'
								defaultValue={dayjs()}
								value={selectedDate}
								onChange={(date) => setSelectedDate(date)}
								className='w-[150px]'
							/>
						</div>
					</div>
				</div>
				<Modal open={isDrawerOpen} onCancel={() => setIsDrawerOpen(false)} title='Add Driver Entry' footer={null} width={500}>
					<div className='flex flex-col gap-2'>
						<div className='flex items-center gap-2'>
							<div className='font-semibold'>Alcohol Level: </div>
							<div>{vehicleCurrentLocationData?.list.alcoholLbl}</div>
						</div>
						<div className='flex items-center gap-2'>
							<div className='font-semibold'>Alcohol Reading: </div>
							<div>{vehicleCurrentLocationData?.list.alcoholtext}</div>
						</div>
					</div>
				</Modal>

				<div className='overflow-scroll '>
					<CustomTableN
						columns={activeColumns}
						data={filteredData && filteredData.length > 0 ? filteredData : []}
						loading={
							isDriverListFetching ||
							isDriverAlcoholStatusLazyFetching ||
							isSaveAlcoholReadingFetching ||
							isFilteringData ||
							isSaveAlcoholReadingFetching
						}
						onDownloadBtnClick={() => {}}
						downloadReport={undefined}
						setDownloadReport={() => {}}
						width={'100%'}
						height='h-[calc(100vh-220px)]'
						fontSize='14px'
						densityProp='sm'
						noFilter={true}
					/>
				</div>
			</Card>
		</div>
	);
};
