'use client';

import { useLazyGetAlertsByDateQuery, useLazyGetCurrentMonthReportQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import moment from 'moment';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { AlertByDateLorryData } from '@/app/_globalRedux/services/types/alerts';
import { ArrowDownOutlined, ArrowUpOutlined, CalendarOutlined, CarOutlined } from '@ant-design/icons';

interface VehicleNumberKm {
	vehicleNo: string;
	km: number;
}

interface VehiclesWithAlerts {
	vehicleNo: string;
	alertsType: string[];
	alertsCount: number;
}

const getAdjustedAlerts = ({
	data,
	setVehicleWithMostAlerts,
}: {
	data: AlertByDateLorryData[];
	setVehicleWithMostAlerts: Dispatch<SetStateAction<VehiclesWithAlerts[]>>;
}) => {
	if (data && data.length) {
		const alert = data[0];
		const tempAlerts = [
			...(alert.contineousDrive ? alert.contineousDrive : []),
			...(alert.padlock ? alert.padlock : []),
			...(alert.freewheeling ? alert.freewheeling : []),
			...(alert.freewheelingWrong ? alert.freewheelingWrong : []),
			...(alert.harshBreak ? alert.harshBreak : []),
			...(alert.harshacc ? alert.harshacc : []),
			...(alert.highenginetemperature ? alert.highenginetemperature : []),
			...(alert.idle
				? alert.idle.map((idleAlert) => ({
						...idleAlert,
						AlertStatus: idleAlert.remark ? 'Closed' : 'Open',
				  }))
				: []),
			...(alert.internalPower ? alert.internalPower : []),
			...(alert.lowengineoilpressure ? alert.lowengineoilpressure : []),
			...(alert.mainpower ? alert.mainpower : []),
			...(alert.MainpowerConnected ? alert.MainpowerConnected : []),
			...(alert.nightdrive ? alert.nightdrive : []),
			...(alert.overspeed ? alert.overspeed : []),
			...(alert.overspeedKMT ? alert.overspeedKMT : []),
			...(alert.panic ? alert.panic : []),
			...(alert.services ? alert.services : []),
			...(alert.document ? alert.document : []),
			...(alert.transitdelay ? alert.transitdelay : []),
			...(alert.unlockonmove ? alert.unlockonmove : []),
			...(alert.PoscoOverspeed ? alert.PoscoOverspeed : []),
			...(alert.geofence ? alert.geofence : []),
		];

		let getAlertsByVehicleNumber: { vehicleNo: string; alertsCount: number; alertsType: string[] }[] = [];

		tempAlerts.forEach((alert) => {
			const existingVehicle = getAlertsByVehicleNumber.find((v) => v.vehicleNo === alert.vehicle_no);
			if (existingVehicle) {
				existingVehicle.alertsType = existingVehicle.alertsType.some((p) => p === alert.exception_type)
					? [...existingVehicle.alertsType]
					: [...existingVehicle.alertsType, alert.exception_type];
				existingVehicle.alertsCount++;
			} else {
				getAlertsByVehicleNumber.push({
					vehicleNo: alert.vehicle_no,
					alertsType: [alert.exception_type],
					alertsCount: 1,
				});
			}
		});
		getAlertsByVehicleNumber.sort((a, b) => b.alertsCount - a.alertsCount);
		setVehicleWithMostAlerts(getAlertsByVehicleNumber.slice(0, 5));
	}
};

const classifyVehiclesBasedOnTheirKm = (vehicles: VehicleNumberKm[]) => {
	const maxKm = Math.max(...vehicles.map((v) => v.km));

	// Define thresholds (using 33% and 66% of max as breakpoints)
	const lowThreshold = maxKm * 0.33;
	const highThreshold = maxKm * 0.66;

	let tempPieChartLeastUsedVehicles: VehicleNumberKm[] = [];
	let tempPieChartMediumUsedVehicles: VehicleNumberKm[] = [];
	let tempPieChartMostUsedVehicles: VehicleNumberKm[] = [];

	// Classify each vehicle based on its km.
	vehicles.forEach((vehicle) => {
		if (vehicle.km < lowThreshold) {
			tempPieChartLeastUsedVehicles.push(vehicle);
		} else if (vehicle.km >= lowThreshold && vehicle.km <= highThreshold) {
			tempPieChartMediumUsedVehicles.push(vehicle);
		} else {
			tempPieChartMostUsedVehicles.push(vehicle);
		}
	});

	return {
		leastUsedVehicles: tempPieChartLeastUsedVehicles,
		mediumUsedVehicles: tempPieChartMediumUsedVehicles,
		mostUsedVehicles: tempPieChartMostUsedVehicles,
	};
};

export const dateFilters = [
	{
		label: 'Last 7 days',
		value: 'last7days',
		startDate: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm'),
		endDate: moment().format('YYYY-MM-DD HH:mm'),
	},
	{
		label: 'Last Month',
		value: 'lastmonth',
		startDate: moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm'),
		endDate: moment().format('YYYY-MM-DD HH:mm'),
	},
	{
		label: 'Last 14 days',
		value: 'last14days',
		startDate: moment().subtract(14, 'days').format('YYYY-MM-DD HH:mm'),
		endDate: moment().format('YYYY-MM-DD HH:mm'),
	},
];

export const View = () => {
	const { userId, groupId } = useSelector((state: RootState) => state.auth);
	const [leastUsedVehicles, setLeastUsedVehicles] = useState<VehicleNumberKm[]>([]);

	const [pieChartLeastUsedVehicles, setPieChartLeastUsedVehicles] = useState<VehicleNumberKm[]>([]);
	const [pieChartMediumUsedVehicles, setPieChartMediumUsedVehicles] = useState<VehicleNumberKm[]>([]);
	const [pieChartMostUsedVehicles, setPieChartMostUsedVehicles] = useState<VehicleNumberKm[]>([]);

	const [vehiclesWithMostAlerts, setVehiclesWithMostAlerts] = useState<VehiclesWithAlerts[]>([]);

	const [leastUserVehiclesDateRange, setLeastUsedVehiclesDateRange] = useState<{ startDate: string; endDate: string }>({
		startDate: dateFilters[0].startDate,
		endDate: dateFilters[0].endDate,
	});

	const [productivityMeterDateRange, setProductivityMeterDateRange] = useState<{ startDate: string; endDate: string }>({
		startDate: dateFilters[0].startDate,
		endDate: dateFilters[0].endDate,
	});

	const [vehiclesWithMostAlertsDateRange, setVehiclesWithMostAlertsDateRange] = useState<{
		startDate: string;
		endDate: string;
	}>({
		startDate: dateFilters[0].startDate,
		endDate: dateFilters[0].endDate,
	});

	const [isLeastVehiclessLoading, setIsLeastVehiclesLoading] = useState(true);
	const [isProductivityMeterLoading, setIsProductivityMeterLoading] = useState(true);

	const [getCurrentMonthReportTrigger] = useLazyGetCurrentMonthReportQuery();
	const [getAlertsByDateTrigger] = useLazyGetAlertsByDateQuery();

	const isGetAlertsLoading = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((query) => query && query.endpointName === 'getAlertsByDate' && query.status === 'pending')
	);

	const tableData = [
		{
			vehicleNo: '12345',
			km: '12345',
		},
		{
			vehicleNo: '12345',
			km: '12345',
		},
		{
			vehicleNo: '12345',
			km: '12345',
		},
		{
			vehicleNo: '12345',
			km: '12345',
		},
		{
			vehicleNo: '12345',
			km: '12345',
		},
	];

	useEffect(() => {
		if (!userId || !groupId) return;

		setIsLeastVehiclesLoading(true);
		getCurrentMonthReportTrigger({
			groupId: groupId,
			startDateTime: leastUserVehiclesDateRange.startDate,
			endDateTime: leastUserVehiclesDateRange.endDate,
		}).then((res) => {
			if (res.data && res.data.list.length > 0) {
				const tempData = res.data.list.map((item) => {
					return {
						vehicleNo: item.vehicleNum,
						km: Number(item.km.toFixed(2)),
					};
				});
				const sortedVehicleTempData = tempData.sort((a, b) => Number(a.km) - Number(b.km));
				const sortedVehicleTempDataWithoutZeroKm = sortedVehicleTempData.filter((item) => Number(item.km) > 10);

				setLeastUsedVehicles(sortedVehicleTempDataWithoutZeroKm.slice(0, 5));

				setIsLeastVehiclesLoading(false);
			}
		});

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId, groupId, leastUserVehiclesDateRange]);

	useEffect(() => {
		if (!userId || !groupId) return;

		setIsProductivityMeterLoading(true);
		// setIsProductivityMeterLoading(true);
		getCurrentMonthReportTrigger({
			groupId: groupId,
			startDateTime: productivityMeterDateRange.startDate,
			endDateTime: productivityMeterDateRange.endDate,
		}).then((res) => {
			if (res.data && res.data.list.length > 0) {
				const tempData = res.data.list.map((item) => {
					return {
						vehicleNo: item.vehicleNum,
						km: Number(item.km.toFixed(2)),
					};
				});
				const sortedVehicleTempData = tempData.sort((a, b) => Number(a.km) - Number(b.km));
				const sortedVehicleTempDataWithoutZeroKm = sortedVehicleTempData.filter((item) => Number(item.km) > 10);

				const vehiclesByClassification = classifyVehiclesBasedOnTheirKm(sortedVehicleTempDataWithoutZeroKm);

				setPieChartLeastUsedVehicles(vehiclesByClassification.leastUsedVehicles);
				setPieChartMediumUsedVehicles(vehiclesByClassification.mediumUsedVehicles);
				setPieChartMostUsedVehicles(vehiclesByClassification.mostUsedVehicles);

				setIsProductivityMeterLoading(false);
			}
		});
	}, [userId, groupId, productivityMeterDateRange]);

	useEffect(() => {
		if (!userId || !groupId) return;

		const data = {
			userId: userId,
			startDateTime: vehiclesWithMostAlertsDateRange.startDate,
			endDateTime: vehiclesWithMostAlertsDateRange.endDate,
			alertType: 'All',
			token: groupId,
			vehReg: 0,
			vehId: 0,
		};
		getAlertsByDateTrigger(data).then((res) => {
			if (res.data) {
				getAdjustedAlerts({ data: res.data.list, setVehicleWithMostAlerts: setVehiclesWithMostAlerts });
			}
		});

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId, groupId, vehiclesWithMostAlertsDateRange]);

	const VehiclePerformance = () => {
		return (
			<>
				<p className='text-lg font-medium'>Total</p>
				<p className='text-2xl mt-1 font-semibold'>500</p>
				<div className='mt-1.5 flex items-center justify-between'>
					<p className='text-neutral-400'>Total Vehicles </p>
					<div className='px-1.5 py-0.5 text-lg bg-blue-50 text-blue-500 rounded-md'>
						<div className='rotate-45 w-full'>
							<ArrowUpOutlined />
						</div>
					</div>
				</div>
			</>
		);
	};

	return (
		<div className='p-6 space-y-2'>
			<div className='flex justify-between items-center w-full '>
				<div className='flex gap-4 items-center'>
					<h3 className='text-xl font-semibold'>Dashboard</h3>
					<div>
						<span className='font-thin text-neutral-800'>Show:</span> Today <ArrowDownOutlined />
					</div>
				</div>
			</div>
			<div className='grid grid-cols-3 w-full gap-4'>
				<div className='text-sm w-full items-center col-span-2'>
					<div className='bg-white py-2 px-2  flex justify-between'>
						<div className='flex gap-2 items-center'>
							<CarOutlined />
							Vehicle
						</div>
						<div className='flex gap-2 items-center'>
							<CalendarOutlined />
							<p>Jan 18 - Jan 16 </p>
						</div>
					</div>
					<div className='flex items-center gap-2 mt-2'>
						{new Array(4).fill(0).map((item: number, index) => {
							return (
								<div className='bg-white rounded-md hover:shadow-md transition-shadow py-2 px-4 w-full' key={index}>
									<VehiclePerformance />
								</div>
							);
						})}
					</div>
				</div>
				<div className='bg-white py-2 px-2 text-sm flex justify-between w-full items-center col-span-1'>
					<div className='flex gap-2 items-center'>
						<CarOutlined />
						Vehicle
					</div>
					<div className='flex gap-2 items-center'>
						<CalendarOutlined />
						<p>Jan 18 - Jan 16 </p>
					</div>
				</div>
			</div>
		</div>
	);
};
