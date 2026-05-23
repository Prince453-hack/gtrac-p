'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { Card, Tooltip } from 'antd';
import Image from 'next/image';
import { useGetKmtAlertVehicleWiseQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { AlertDetails, KmtAlerts, KMTAlertsResponse } from '@/app/_globalRedux/services/types/alerts';
import { setKmtAlerts } from '@/app/_globalRedux/dashboard/mapAlertIcons';

import overspeedMap from '@/app/_assets/mapsimg/alerts/overspeedMap.png';
import harshBreakMap from '@/app/_assets/mapsimg/alerts/harshBreakMap.png';
import harshAccelerationMap from '@/app/_assets/mapsimg/alerts/harshAccelerationMap.png';
import freeWheelMap from '@/app/_assets/mapsimg/alerts/freeWheelMap.png';
import continuousDrivingMap from '@/app/_assets/mapsimg/alerts/continuousDrivingMap.png';
import mainPowerMap from '@/app/_assets/mapsimg/alerts/mainPowerMap.png';
import internalBatteryMap from '@/app/_assets/mapsimg/alerts/internalBatteryMap.png';
import nightDriveMap from '@/app/_assets/mapsimg/alerts/nightDriveMap.png';
import idleIcon from '@/app/_assets/mapsimg/alerts/idleIcon.png';
import highTemp from '@/app/_assets/mapsimg/alerts/high-temp.svg';
import highOil from '@/app/_assets/mapsimg/alerts/high-oil.svg';
import panic from '@/app/_assets/mapsimg/alerts/panic.svg';
import transitDelay from '@/app/_assets/mapsimg/alerts/transit-delay.svg';
import unlockOnMove from '@/app/_assets/mapsimg/alerts/unlock-on-move.svg';
import services from '@/app/_assets/mapsimg/alerts/services.svg';

import backArrow from '@/public/assets/svgs/common/back-arrow.svg';
import { getStartEndDate } from './VehicleDetails';
import { FolderOpenOutlined } from '@ant-design/icons';

interface KmtAlertsData {
	title: string;
	type:
		| 'overspeed'
		| 'overspeedKMT'
		| 'harshacc'
		| 'harshBreak'
		| 'freewheeling'
		| 'contineousDrive'
		| 'mainpower'
		| 'internalPower'
		| 'nightdrive'
		| 'idle'
		| 'panic'
		| 'lowengineoilpressure'
		| 'highenginetemperature'
		| 'services'
		| 'document'
		| 'transitdelay'
		| 'unlockonmove';
	img: any;
}

const kmtAlertsData: KmtAlertsData[] = [
	{ title: 'Overspeed Alert', type: 'overspeed', img: overspeedMap },
	{ title: 'Overspeed Alert', type: 'overspeedKMT', img: overspeedMap },
	{ title: 'Harsh Breaking Alert', type: 'harshBreak', img: harshBreakMap },
	{ title: 'Harsh Acceleration Alert', type: 'harshacc', img: harshAccelerationMap },
	{ title: 'Unlock On Move', type: 'unlockonmove', img: unlockOnMove },
	{ title: 'Free Wheeling Alert', type: 'freewheeling', img: freeWheelMap },
	{ title: 'Continuous Drive Alert', type: 'contineousDrive', img: continuousDrivingMap },
	{ title: 'Main Power Alert', type: 'mainpower', img: mainPowerMap },
	{ title: 'Transit Delay', type: 'transitdelay', img: transitDelay },
	{ title: 'Internal Battery Alert', type: 'internalPower', img: internalBatteryMap },
	{ title: 'Night Drive', type: 'nightdrive', img: nightDriveMap },
	{ title: 'Panic', type: 'panic', img: panic },
	{ title: 'Idling Alert', type: 'idle', img: idleIcon },
	{ title: 'Low Engine Oil Pressure', type: 'lowengineoilpressure', img: highOil },
	{ title: 'High Engine Temperature', type: 'highenginetemperature', img: highTemp },
	{ title: 'Services', type: 'services', img: services },
	{ title: 'Document', type: 'document', img: services },
];

interface KmtAlertsResponse {
	list: KmtAlerts[];
}

function hasValidCoordinates(alert: AlertDetails): boolean {
	return (alert.endlat != 0 && alert.endLong != 0) || (alert.startlat != 0 && alert.startLong != 0);
}

function filterKmtAlerts(kmtAlerts: KmtAlertsResponse['list']): KmtAlertsResponse['list'] {
	return kmtAlerts.map((alert) => {
		const filteredAlert: KmtAlerts = {
			...alert,
			harshBreak: alert.harshBreak ? alert.harshBreak.filter(hasValidCoordinates) : [],
			harshacc: alert.harshacc ? alert.harshacc.filter(hasValidCoordinates) : [],
			mainpower: alert.mainpower ? alert.mainpower.filter(hasValidCoordinates) : [],
			internalPower: alert.internalPower ? alert.internalPower.filter(hasValidCoordinates) : [],
			overspeed: alert.overspeed ? alert.overspeed.filter(hasValidCoordinates) : [],
			overspeedKMT: alert.overspeedKMT ? alert.overspeedKMT.filter(hasValidCoordinates) : [],
			freewheeling: alert.freewheeling ? alert.freewheeling.filter(hasValidCoordinates) : [],
			contineousDrive: alert.contineousDrive ? alert.contineousDrive.filter(hasValidCoordinates) : [],
			nightdrive: alert.nightdrive ? alert.nightdrive.filter(hasValidCoordinates) : [],
			highenginetemperature: alert.highenginetemperature ? alert.highenginetemperature.filter(hasValidCoordinates) : [],
			idle: alert.idle ? alert.idle.filter(hasValidCoordinates) : [],
			lowengineoilpressure: alert.lowengineoilpressure ? alert.lowengineoilpressure.filter(hasValidCoordinates) : [],
			overSpeed: alert.overSpeed ? alert.overSpeed.filter(hasValidCoordinates) : [],
			panic: alert.panic ? alert.panic.filter(hasValidCoordinates) : [],
			services: alert.services ? alert.services.filter(hasValidCoordinates) : [],
			document: alert.document ? alert.document.filter(hasValidCoordinates) : [],
			transitdelay: alert.transitdelay ? alert.transitdelay.filter(hasValidCoordinates) : [],
			unlockonmove: alert.unlockonmove ? alert.unlockonmove.filter(hasValidCoordinates) : [],
		};

		return filteredAlert;
	});
}

export const VehicleAlertCards = () => {
	const dispatch = useDispatch();
	const { userId, parentUser } = useSelector((state: RootState) => state.auth);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const customRange = useSelector((state: RootState) => state.customRange);
	const { type: vehicleListType } = useSelector((state: RootState) => state.isVehicleStatusOrTripStatusActive);
	const selectedTrip = useSelector((state: RootState) => state.selectedTrip);

	const [selectedAlert, setSelectedAlert] = useState<KmtAlertsData['type'] | null>(null);
	const [alertCount, setAlertCount] = useState(0);
	const [filteredAlerts, setFilteredAlerts] = useState<KmtAlertsResponse['list']>([
		{
			sys_service_id: '',
			lorry_no: '',
			harshBreak: [],
			harshacc: [],
			mainpower: [],
			internalPower: [],
			overspeed: [],
			overspeedKMT: [],
			freewheeling: [],
			contineousDrive: [],
			nightdrive: [],
			highenginetemperature: [],
			idle: [],
			lowengineoilpressure: [],
			overSpeed: [],
			panic: [],
			services: [],
			document: [],
			transitdelay: [],
			unlockonmove: [],
		},
	]);

	const { data: kmtAlerts } = useGetKmtAlertVehicleWiseQuery(
		{
			userId: userId,
			vehReg: selectedVehicle.vehReg,
			vehId: selectedVehicle.vId,
			startDateTime:
				customRange.dateRangeForDataFetching.startDate ||
				getStartEndDate(selectedTrip.departure_date, 'start', 'YYYY-MM-DD HH:mm', 'date', vehicleListType),
			endDateTime:
				customRange.dateRangeForDataFetching.endDate ||
				getStartEndDate(selectedTrip.trip_complted_datebysystem, 'end', 'YYYY-MM-DD HH:mm', 'date', vehicleListType),
		},
		{ skip: !selectedVehicle.vId }
	);

	const handleAlertClick = (alertType: KmtAlertsData['type'] | null) => {
		setSelectedAlert(alertType);
	};

	useEffect(() => {
		if (kmtAlerts && kmtAlerts.success) {
			let tempAlertCount = 0;

			const filteredKmtAlerts = filterKmtAlerts(kmtAlerts.list);

			kmtAlertsData.forEach((alert) => {
				tempAlertCount += filteredKmtAlerts[0][alert.type].length;
			});

			setFilteredAlerts(filteredKmtAlerts);
			setAlertCount(tempAlertCount || 0);
			dispatch(setKmtAlerts(filteredKmtAlerts));
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [kmtAlerts]);

	return (
		<>
			{selectedAlert !== null ? (
				<SpecificAlertView data={filteredAlerts} selectedAlert={selectedAlert} setSelectedAlert={setSelectedAlert} />
			) : (
				<>
					<div className='bottom-1 w-fit z-10 relative text-gray-600 font-semibold'>
						Total Alerts: {alertCount < 10 && alertCount > 0 ? `0${alertCount}` : alertCount}
					</div>

					{kmtAlertsData
						.filter((alert) => {
							if (alert.type === 'overspeed') {
								return Number(userId) !== 3356 && Number(parentUser) !== 3356 && Number(userId) !== 87470 && Number(parentUser) !== 87470;
							} else if (alert.type === 'overspeedKMT') {
								return Number(userId) === 3356 || Number(parentUser) === 3356 || Number(userId) === 87470 || Number(parentUser) === 87470;
							}
							return false;
						})
						.map((alert, index) => (
							<span key={alert.type + index}>
								<VehicleAlertCard
									imgSrc={alert.img}
									setSelectedAlert={handleAlertClick}
									alertType={alert.type}
									title={alert.title}
									alertCount={filteredAlerts[0][alert.type].length || 0}
								/>
							</span>
						))}

					{kmtAlertsData
						.filter((alert) => alert.type !== 'overspeedKMT' && alert.type !== 'overspeed')
						.map((alert, index) => (
							<span key={alert.type + index}>
								<VehicleAlertCard
									imgSrc={alert.img}
									setSelectedAlert={handleAlertClick}
									alertType={alert.type}
									title={alert.title}
									alertCount={filteredAlerts[0][alert.type].length || 0}
								/>
							</span>
						))}
				</>
			)}
		</>
	);
};

const VehicleAlertCard = ({
	imgSrc,
	setSelectedAlert,
	alertType,
	title,
	alertCount,
}: {
	imgSrc: string;
	setSelectedAlert: (alertType: KmtAlertsData['type'] | null) => void;
	alertType?: KmtAlertsData['type'];
	title: string;
	alertCount: number;
}) => {
	return (
		<>
			{alertCount > 0 ? (
				<Card className='shadow-xl shadow-s-light'>
					<div className='flex items-center gap-2'>
						<i>
							<Image width={25} height={25} src={imgSrc} alt='alert icon' />
						</i>
						<div className='text-sm font-bold'>{title}</div>
					</div>
					<div className='flex mt-4 items-center'>
						<div className='text-sm font-medium text-gray-800 w-full'>Number of Alerts: {alertCount}</div>
						<div
							className='text-sm font-semibold w-full text-right text-gray-500 cursor-pointer'
							onClick={() => alertType && setSelectedAlert(alertType)}
						>
							Details
						</div>
					</div>
				</Card>
			) : null}
		</>
	);
};

const SpecificAlertView = ({
	data,
	selectedAlert,
	setSelectedAlert,
}: {
	data: KMTAlertsResponse['list'] | undefined;
	selectedAlert: KmtAlertsData['type'] | null;
	setSelectedAlert: (alertType: KmtAlertsData['type'] | null) => void;
}) => {
	const convertAlertTypeToTItle = () => {
		switch (selectedAlert) {
			case 'overspeed':
				return 'OverSpeed';
			case 'contineousDrive':
				return 'Continuous Drive';
			case 'freewheeling':
				return 'Free Wheeling';
			case 'harshBreak':
				return 'Harsh Break';
			case 'harshacc':
				return 'Harsh Acceleration';
			case 'internalPower':
				return 'Internal Battery';
			case 'mainpower':
				return 'Main Power';
			case 'nightdrive':
				return 'Night Drive';
			case 'highenginetemperature':
				return 'High Engine Temperature';
			case 'idle':
				return 'Idle';
			case 'lowengineoilpressure':
				return 'Low Engine Oil Pressure';
			case 'panic':
				return 'Panic';
			case 'transitdelay':
				return 'Transit Delay';
			case 'services':
				return 'Services';
			case 'document':
				return 'Document';
			case 'unlockonmove':
				return 'Unlock On Move';

			default:
				return null;
		}
	};
	return (
		<>
			<div className='flex items-center gap-4'>
				<Tooltip title='Go to all alerts' mouseEnterDelay={1} placement='left'>
					<Image alt='navigate back arrow icon' width={10} height={10} src={backArrow} onClick={() => setSelectedAlert(null)} />
				</Tooltip>
				<p className='font-semibold text-xl'>{convertAlertTypeToTItle()} Alert</p>
			</div>

			{data && data.length && selectedAlert ? (
				data[0][selectedAlert].map((alert, index) => (
					<Card key={index}>
						{alert.endlat ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>End Latitude: </span>
								{Number(alert.endlat).toFixed(5)}
							</p>
						) : null}
						{alert.endLong ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>End Longitude: </span>
								{Number(alert.endLong).toFixed(5)}
							</p>
						) : null}

						{alert.startlat ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>Start Latitude: </span>
								{Number(alert.startlat).toFixed(5)}
							</p>
						) : null}
						{alert.startLong ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>Start Longitude: </span>
								{Number(alert.startLong).toFixed(5)}
							</p>
						) : null}

						{alert.endlocation ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>End Location: </span>
								{alert.endlocation}
							</p>
						) : null}

						{alert.starttime ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>Start Time: </span>
								{alert.starttime}
							</p>
						) : null}

						{alert.endtime ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>End Time: </span>
								{alert.endtime}
							</p>
						) : null}

						{alert.journey_statusfinal ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>Journey Status Final: </span>
								{alert.journey_statusfinal}
							</p>
						) : null}

						{alert.speed ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>Speed: </span>
								{alert.speed}
							</p>
						) : null}

						{alert.startlocation ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>Start Location: </span>
								{alert.startlocation}
							</p>
						) : null}

						{alert.KM ? (
							<p className='text-gray-500 font-medium'>
								<span className='text-gray-600 font-semibold'>KM: </span>
								{alert.KM}
							</p>
						) : null}
					</Card>
				))
			) : (
				<div className='text-4xl text-neutral-400 w-full h-[200px] flex gap-2 justify-center items-center'>
					<div>
						<div className='flex items-center justify-center w-full'>
							<FolderOpenOutlined />
						</div>
						<p className='text-lg text-neutral-500 font-semibold'>No Data Found</p>
					</div>
				</div>
			)}
		</>
	);
};
