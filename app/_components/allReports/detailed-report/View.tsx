'use client';

import {
	useGetVehiclesByStatusQuery,
	useLazyConvertLatLngToAddressQuery,
	useLazyGetRawWithDateWithoutLocationQuery,
} from '@/app/_globalRedux/services/trackingDashboard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { Markers } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { Card, DatePickerProps, Select, TableColumnsType, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { setAllMarkers } from '@/app/_globalRedux/dashboard/markersSlice';
import moment from 'moment';
import { CopyFilled, SearchOutlined } from '@ant-design/icons';
import { CustomDetailedReport } from './CustomDetailedReport';
import lessThanGreaterThanFilter from '@/app/helpers/lessThanGreaterThanFilter';
import CustomDatePicker from '../../common/datePicker';
import { setHours, setMinutes } from 'date-fns';
import React from 'react';
import getExtraKm from '@/app/helpers/getExtraKm';

export const View = () => {
	const dispatch = useDispatch();

	const { groupId, userId, parentUser: pUserId, extra } = useSelector((state: RootState) => state.auth);
	const markers = useSelector((state: RootState) => state.markers);

	const [fetchGetRawWithDateWithoutLocation, { data, isLoading, isFetching }] = useLazyGetRawWithDateWithoutLocationQuery();

	const [convertLatLngToAddress] = useLazyConvertLatLngToAddressQuery();

	const customSelectOptions: { label: string; value: number }[] = markers.map((marker: Markers) => ({
		label: marker.vehReg,
		value: marker.vId,
	}));
	const filterOption = (input: string, option?: { label: string; value: number }) =>
		(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

	const [selectedVehicleOption, setSelectedVehicleOption] = useState<{ label: string; value: number }>();
	const [customDateRange, setCustomDateRange] = useState([setHours(setMinutes(new Date(), 0), 0), new Date()]);

	const { data: markersData, isLoading: isMarkersLoading } = useGetVehiclesByStatusQuery(
		{
			userId,
			token: groupId,
			pUserId,
			mode: '',
		},
		{
			skip: !groupId || !userId || markers.length > 0,
		}
	);

	useEffect(() => {
		if (markersData && markersData.list.length > 1 && markers.length === 0) {
			dispatch(setAllMarkers(markersData.list.map((vehicle) => ({ ...vehicle, visibility: true, isMarkerInfoWindowOpen: false }))));
		}
	}, [markersData, dispatch, markers.length]);

	const [isFiltering, setIsFiltering] = useState(false);
	const [filteredData, setFilteredData] = useState<RawData[]>([]);

	const [addressMap, setAddressMap] = useState<Record<string, string>>({});
	const pendingFetches = useRef(new Set<string>());

	const vehicleNumberRef = useRef<HTMLInputElement>(null);
	const gpsTimeRef = useRef<HTMLInputElement>(null);
	const locationRef = useRef<HTMLInputElement>(null);
	const latLngRef = useRef<HTMLInputElement>(null);
	const distanceRef = useRef<HTMLInputElement>(null);
	const odometerRef = useRef<HTMLInputElement>(null);
	const ignitionRef = useRef<HTMLInputElement>(null);
	const panicRef = useRef<HTMLInputElement>(null);
	const acRef = useRef<HTMLInputElement>(null);
	const doorRef = useRef<HTMLInputElement>(null);
	const temperatureRef = useRef<HTMLInputElement>(null);
	const fuelRef = useRef<HTMLInputElement>(null);
	const voltageRef = useRef<HTMLInputElement>(null);
	const mainPowerVoltageRef = useRef<HTMLInputElement>(null);
	const obdOdometer = useRef<HTMLInputElement>(null);

	const [filterColumns, setFilterColumns] = useState([
		{ title: 'Vehicle No', dataIndex: '', width: '200px', filterValue: '', ref: vehicleNumberRef },
		{ title: 'GPS Time', dataIndex: 'gpstimeformatted', width: '200px', filterValue: '', ref: gpsTimeRef },
		{ title: 'Location', dataIndex: 'location', width: '300px', filterValue: '', ref: locationRef },
		{ title: 'Lat ⎪ Lng', dataIndex: '', width: '200px', filterValue: '', ref: latLngRef },
		{ title: 'Distance', dataIndex: 'jny_distance', width: '200px', filterValue: '', ref: distanceRef },
		{ title: 'Odometer', dataIndex: 'jny_status', width: '200px', filterValue: '', ref: odometerRef },
		{ title: 'Ignition', dataIndex: ['tel_input_0', 'data'], width: '200px', filterValue: '', ref: ignitionRef },
		{ title: 'Panic', dataIndex: ['tel_input_1', 'data'], width: '200px', filterValue: '', ref: panicRef },
		{ title: 'AC', dataIndex: ['tel_input_2', 'data'], width: '200px', filterValue: '', ref: acRef },
		{ title: 'Door', dataIndex: ['tel_input_3', 'data'], width: '200px', filterValue: '', ref: doorRef },
		{ title: 'Temperature', dataIndex: 'tel_temperature', width: '200px', filterValue: '', ref: temperatureRef },
		{ title: 'Fuel', dataIndex: 'tel_fuel', width: '200px', filterValue: '', ref: fuelRef },
		{ title: 'Voltage', dataIndex: 'tel_voltage', width: '200px', filterValue: '', ref: voltageRef },
		{ title: 'Main Power Voltage', dataIndex: 'main_powervoltage', width: '200px', filterValue: '', ref: mainPowerVoltageRef },
		{ title: 'OBD Odometer', dataIndex: 'tel_odometer', width: '200px', filterValue: '', ref: obdOdometer },
	]);

	useEffect(() => {
		if (Number(userId) === 87318 || Number(userId) === 87101 || Number(userId) === 83199) {
			setFilterColumns([
				{ title: 'Vehicle No', dataIndex: '', width: '200px', filterValue: '', ref: vehicleNumberRef },
				{ title: 'GPS Time', dataIndex: 'gpstimeformatted', width: '200px', filterValue: '', ref: gpsTimeRef },
				{ title: 'Location', dataIndex: 'location', width: '300px', filterValue: '', ref: locationRef },
				{ title: 'Lat ⎪ Lng', dataIndex: '', width: '200px', filterValue: '', ref: latLngRef },
				{ title: 'Distance', dataIndex: 'jny_distance', width: '200px', filterValue: '', ref: distanceRef },
				{ title: 'Odometer', dataIndex: 'jny_status', width: '200px', filterValue: '', ref: odometerRef },
			]);
		}
	}, [userId]);

	const intervalOptions: { label: string; value: string }[] = [
		{ value: '1', label: 'All' },
		{ value: '5', label: '5 Minutes' },
		{ value: '15', label: '15 Minutes' },
		{ value: '30', label: '30 Minutes' },
		{ value: '60', label: '60 Minutes' },
	];
	const [selectedInterval, setSelectedInterval] = useState<{ label: string; value: string }>({ value: '30', label: '30 Minutes' });

	const getRawReport = async () => {
		if (customDateRange[0] && customDateRange[1]) {
			await fetchGetRawWithDateWithoutLocation({
				userId: Number(userId),
				vehId: selectedVehicleOption && selectedVehicleOption.value ? selectedVehicleOption.value : 0,
				startDate: moment(customDateRange[0]).format('YYYY-MM-DD HH:mm'),
				endDate: moment(customDateRange[1]).format('YYYY-MM-DD HH:mm'),
				interval: selectedInterval.value,
			});
		}
	};

	const columns: TableColumnsType<RawData> = [
		{
			title: 'Vehicle No',
			key: 'vehicle no',
			width: 250,
			render: () => <>{selectedVehicleOption?.label}</>,
		},
		{
			title: 'GPS Time',
			key: 'gps time',
			width: 200,
			dataIndex: 'gps_time',
			render: (value) => <div>{value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : ''}</div>,
		},
		{
			title: 'Location',
			key: 'location',
			width: 300,
			dataIndex: 'location',
			render: (_, record) => {
				const key = `${record.gps_latitude}-${record.gps_longitude}`;
				const address = addressMap[key];
				if (address) {
					return (
						<Tooltip title={address.replaceAll('_', ' ')} mouseEnterDelay={1} className='cursor-pointer'>
							<div>
								{address.replaceAll('_', ' ').slice(0, 45)}
								{address.length > 45 ? '...' : ''}
							</div>
						</Tooltip>
					);
				} else {
					if (!pendingFetches.current.has(key)) {
						pendingFetches.current.add(key);
						convertLatLngToAddress({ userId: Number(userId), latitude: record.gps_latitude, longitude: record.gps_longitude })
							.then((data) => {
								const newAddress = data?.data?.loc || '';
								setAddressMap((prev) => ({ ...prev, [key]: newAddress }));
							})
							.catch(() => {
								setAddressMap((prev) => ({ ...prev, [key]: '' }));
							})
							.finally(() => {
								pendingFetches.current.delete(key);
							});
					}
					return <div>Loading...</div>;
				}
			},
		},
		{
			title: 'Lat ⎪ Lng',
			key: 'location',
			width: 180,
			render: (_, record) => (
				<Typography.Text
					copyable={{
						text: `${record.gps_latitude} | ${record.gps_longitude}`,
						icon: <CopyFilled style={{ color: 'rgb(38,38,38)' }} size={12} />,
					}}
				>
					{record.gps_latitude.toFixed(2)} ⎪ {record.gps_longitude.toFixed(2)}
				</Typography.Text>
			),
		},
		{
			title: 'Speed',
			key: 'speed',
			dataIndex: 'gps_speed',
			width: 130,
			render: (value) => <>{value ? value : 0} Km/h</>,
		},
		{
			title: 'Distance',
			key: 'distance',
			width: 150,
			dataIndex: 'jny_distance',
			render: (value) => <>{value.toFixed(2)} KM</>,
		},
		{
			title: 'Odometer',
			key: 'odometer',
			width: 150,
			dataIndex: 'jny_status',
			render: (value) => <>{Number(extra) === 0 || isNaN(Number(extra)) ? value?.toFixed(2) : getExtraKm(value ?? 0, extra).toFixed(2)} KM</>,
		},
		...(Number(userId) !== 87318 && Number(userId) !== 87101 && Number(userId) !== 83199
			? [
					{
						title: 'RPM',
						key: 'rpm',
						dataIndex: 'rpm',
						width: 130,
					},
					{
						title: 'Ignition',
						key: 'ignition',
						dataIndex: ['tel_input_0', 'data'],
						render: (value: any) => (
							<>
								{(Array.isArray(value) && value.length > 0 && value[0]) ||
								((typeof value === 'string' || typeof value === 'number') && Number(value) === 1)
									? 'True'
									: 'False'}
							</>
						),
						width: 130,
					},
					{
						title: 'Panic',
						key: 'panic',
						dataIndex: ['tel_input_1'],
						render: (value: any) => (
							<>
								{(Array.isArray(value) && value.length > 0 && value[0]) ||
								((typeof value === 'string' || typeof value === 'number') && Number(value) === 1)
									? 'True'
									: 'False'}
							</>
						),
						width: 130,
					},
					{
						title: 'AC',
						key: 'ac',
						dataIndex: ['tel_input_2'],
						render: (value: any) => (
							<>
								{(Array.isArray(value) && value.length > 0 && value[0]) ||
								((typeof value === 'string' || typeof value === 'number') && Number(value) === 1)
									? 'True'
									: 'False'}
							</>
						),
						width: 130,
					},
					{
						title: 'Door',
						key: 'door',
						dataIndex: ['tel_input_3'],
						render: (value: any) => (
							<>
								{(Array.isArray(value) && value.length > 0 && value[0]) ||
								((typeof value === 'string' || typeof value === 'number') && Number(value) === 1)
									? 'True'
									: 'False'}
							</>
						),
						width: 130,
					},
					{
						title: 'Temperature',
						dataIndex: 'tel_temperature',
						key: 'temperature',
						width: 130,
						render: (value: any) => <>{value ? value.toFixed(2) : ''}℃</>,
					},
					{
						title: 'Fuel',
						dataIndex: 'tel_fuel',
						key: 'fuel',
						width: 130,
						render: (value: any) => <>{value ? value.toFixed(2) : ''}</>,
					},
					{
						title: 'Voltage',
						dataIndex: 'tel_voltage',
						key: 'voltage',
						width: 130,
						render: (value: any) => <>{value ? value.toFixed(2) : ''}</>,
					},
					{
						title: 'Main Power Voltage',
						dataIndex: 'main_powervoltage',
						key: 'main_powervoltage',
						width: 130,
						render: (value: any) => <>{value ? value.toFixed(2) : ''}</>,
					},
					{
						title: 'OBD Odometer',
						dataIndex: 'tel_odometer',
						render: (value: any) => <>{value ? value.toFixed(2) : ''}</>,
						key: 'obd odometer',
						width: 150,
					},
			  ]
			: []),
	];

	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent, dataIndex: string[]) => {
			setIsFiltering(true);
			if (event.key === 'Enter' && data && data.rawdata && data.rawdata.length > 0) {
				const filteredList = data.rawdata.filter((vehicle: any) => {
					return filterColumns.every((filterColumn: any) => {
						let value: any = vehicle;
						const currentDataIndex = filterColumn.dataIndex;
						if (Array.isArray(currentDataIndex)) {
							for (const key of currentDataIndex) {
								if (value && value[key] !== undefined) {
									value = value[key];
								}
							}
						} else {
							value = value[currentDataIndex];
						}
						const filterValue = filterColumn.filterValue;
						if (isNaN(Number(filterValue.slice(1).trim())) || filterValue === '') {
							const includesCheck = String(value).toLowerCase()?.replaceAll('_', ' ').includes(filterValue.toLowerCase());
							return includesCheck;
						} else {
							const comparisonCheck = lessThanGreaterThanFilter(filterValue, currentDataIndex, vehicle);
							return comparisonCheck;
						}
					});
				});
				setFilteredData(filteredList as any);
			}
			setIsFiltering(false);
		};

		const vehicleNumber = vehicleNumberRef.current;
		const mainPowerVoltage = mainPowerVoltageRef.current;
		const fuel = fuelRef.current;
		const voltage = voltageRef.current;
		const odometer = odometerRef.current;
		const gpsTime = gpsTimeRef.current;
		const location = locationRef.current;
		const latLng = latLngRef.current;
		const distance = distanceRef.current;
		const ignition = ignitionRef.current;
		const panic = panicRef.current;
		const ac = acRef.current;
		const door = doorRef.current;
		const temperature = temperatureRef.current;

		if (
			vehicleNumber &&
			mainPowerVoltage &&
			fuel &&
			voltage &&
			odometer &&
			gpsTime &&
			location &&
			latLng &&
			distance &&
			ignition &&
			panic &&
			ac &&
			door &&
			temperature
		) {
			mainPowerVoltage.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['main_powervoltage']));
			fuel.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['tel_fuel']));
			voltage.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['tel_voltage']));
			odometer.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['jny_status']));
			gpsTime.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['gpstimeformatted']));
			location.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['location']));
			distance.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['jny_distance']));
			temperature.addEventListener('keypress', (event) => event.key === 'Enter' && handleKeyPress(event, ['tel_temperature']));
		}
	}, [filterColumns, data]);

	useEffect(() => {
		if (data) {
			setFilteredData(data.rawdata.map((vehicle: any) => ({ ...vehicle })));
		}
	}, [data]);

	const disabled3DaysDate: DatePickerProps['disabledDate'] = (current, { from }) => {
		if (from) {
			return Math.abs(current.diff(from, 'days')) >= 3;
		}
		return false;
	};

	return (
		<div>
			<Card
				styles={{ body: { padding: 0, background: '#F6F8F6', borderRadius: '15px', border: 0 } }}
				style={{ borderRadius: '15px', background: '#F6F8F6', border: 0 }}
			>
				<div className='w-full flex items-center justify-between p-5'>
					<p className='text-3xl font-semibold'>Detailed Report</p>
					<div className='flex items-end flex-col gap-2'>
						<div className='flex justify-center items-center gap-2'>
							<Select
								value={selectedInterval.value}
								className='w-[200px]'
								onChange={(_, option) => {
									if (!Array.isArray(option) && option) {
										setSelectedInterval(option);
									}
								}}
								placeholder='Select Interval'
								options={intervalOptions}
								disabled={isMarkersLoading}
								showSearch
								loading={isMarkersLoading}
								size='middle'
								suffixIcon
							/>
							<Select
								value={selectedVehicleOption?.value}
								className='w-[200px]'
								onChange={(_, option) => {
									if (!Array.isArray(option)) {
										setSelectedVehicleOption(option);
									}
								}}
								filterOption={filterOption}
								placeholder='Select Vehicle'
								options={customSelectOptions}
								showSearch
								loading={isMarkersLoading}
								size='middle'
								suffixIcon
							/>
							<div className='w-[380px] max-w-[380px]'>
								<CustomDatePicker dateRange={customDateRange} setDateRange={setCustomDateRange} datePickerStyles='h-[32px] max-h-[32px]' />
							</div>
							<button
								className={`${
									isMarkersLoading || selectedVehicleOption === undefined ? 'bg-primary-green opacity-75 cursor-not-allowed' : 'bg-primary-green'
								} rounded-full px-2 py-1`}
								onClick={() => selectedVehicleOption !== undefined && getRawReport()}
								disabled={isMarkersLoading || selectedVehicleOption === undefined}
							>
								<SearchOutlined style={{ color: '#F5F8F6' }} />
							</button>
						</div>
					</div>
				</div>

				<div>
					<div className='overflow-x-scroll max-w-[calc(100vw-85px)]'>
						<div className='flex items-center gap-2 px-3 py-2'>
							{filterColumns.map((filter, index) => (
								<input
									key={filter.title}
									ref={filter.ref}
									style={{ minWidth: `${Number(filter.width.split('px')[0]) - 10}px` }}
									placeholder={`Search ${filter.title}`}
									className='border border-gray-300 rounded px-2 py-1'
									disabled={filter.title === 'Vehicle No' || filter.title === 'Lat ⎪ Lng'}
									value={filter.filterValue}
									onChange={(e) => {
										setFilterColumns((prevFilterColumns) => {
											const newFilterColumns = [...prevFilterColumns];
											newFilterColumns[index] = {
												...newFilterColumns[index],
												filterValue: e.target.value,
											};
											return newFilterColumns;
										});
									}}
								/>
							))}
						</div>
					</div>

					<CustomDetailedReport
						columns={columns}
						selectedVehicleOption={selectedVehicleOption?.value ?? 0}
						startDate={moment(customDateRange[0]).format('YYYY-MM-DD HH:mm')}
						endDate={moment(customDateRange[1]).format('YYYY-MM-DD HH:mm')}
						interval={selectedInterval.value}
						scroll_y='calc(100vh - 400px)'
						isLoading={isLoading || isFetching || isFiltering}
						data={filteredData.length ? filteredData : []}
					/>
				</div>
			</Card>
		</div>
	);
};
