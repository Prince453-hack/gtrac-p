'use client';

import { AlertDetails } from '@/app/_globalRedux/services/types/alerts';
import { RootState } from '@/app/_globalRedux/store';
import { useEffect, useState } from 'react';
import { Marker } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { iconFactory } from './utils/iconFactory';

interface AlertValuesWithIcon extends AlertDetails {
	icons: string;
}

export const ReactLeafletAlertMarkers = () => {
	const mapAlertIcons = useSelector((state: RootState) => state.mapAlertsIcons);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const [alertIconDisplayData, setAlertIconsDisplayData] = useState<AlertValuesWithIcon[] | []>([]);

	useEffect(() => {
		if (mapAlertIcons && mapAlertIcons.length > 0 && mapAlertIcons[0]) {
			const alertIcons = mapAlertIcons[0];
			const alertValues = Object.keys(alertIcons)
				.map((alertKey: string) => alertIcons[alertKey as keyof typeof alertIcons])
				.flat()
				.filter((alert) => typeof alert !== 'string');

			const alertValuesWithIcon: AlertValuesWithIcon[] = alertValues
				.map((alert) => {
					if (typeof alert !== 'string' && 'exception_type' in alert) {
						let tempIcon: string = '';

						switch (alert.exception_type) {
							case 'Ignition Night':
								tempIcon = '/assets/images/alerts/react-leaflet/nightDriveMap.png';
								break;
							case 'Ignition':
								tempIcon = '/assets/images/alerts/react-leaflet/nightDriveMap.png';
								break;
							case 'Harsh Braking':
								tempIcon = '/assets/images/alerts/react-leaflet/harshBreakMap.png';
								break;
							case 'OverSpeed':
								tempIcon = '/assets/images/alerts/react-leaflet/overspeedMap.png';
								break;
							case 'OverSpeed':
								tempIcon = '/assets/images/alerts/react-leaflet/overspeedMap.png';
								break;
							case 'Harsh Acceleration':
								tempIcon = '/assets/images/alerts/react-leaflet/harshAccelerationMap.png';
								break;
							case 'Main power disconnected':
								tempIcon = '/assets/images/alerts/react-leaflet/mainPowerMap.png';
								break;
							case 'Main Power Disconnected':
								tempIcon = '/assets/images/alerts/react-leaflet/mainPowerMap.png';
								break;
							case 'High Engine Temperature':
								tempIcon = '/assets/images/alerts/react-leaflet/high-temp.svg';
								break;
							case 'idle':
								tempIcon = '/assets/images/alerts/react-leaflet/idleIcon.png';
								break;
							case 'Idling':
								tempIcon = '/assets/images/alerts/react-leaflet/idleIcon.png';
								break;
							case 'Low Engine Oil Pressure':
								tempIcon = '/assets/images/alerts/react-leaflet/high-oil.png';
								break;
							case 'Main Power Disconnect':
								tempIcon = '/assets/images/alerts/react-leaflet/mainPowerMap.png';
								break;
							case 'Panic':
								tempIcon = '/assets/images/alerts/react-leaflet/panic.svg';
								break;
							case 'Unlock on move':
								tempIcon = '/assets/images/alerts/react-leaflet/unlock-on-move.svg';
								break;
							case 'Services':
								tempIcon = '/assets/images/alerts/react-leaflet/services.svg';
								break;
							case 'Document':
								tempIcon = '/assets/images/alerts/react-leaflet/document.svg';
								break;
							case 'freewheeling':
								tempIcon = '/assets/images/alerts/react-leaflet/freeWheelMap.png';
								break;
							case 'Free Wheeling':
								tempIcon = '/assets/images/alerts/react-leaflet/freeWheelMap.png';
								break;
							case 'Internal battery disconnected':
								tempIcon = '/assets/images/alerts/react-leaflet/internalBatteryMap.png';
								break;
							case 'Transit Delay':
								tempIcon = '/assets/images/alerts/react-leaflet/transit-delay.png';
								break;
							case 'Continuous Driving':
								tempIcon = '/assets/images/alerts/react-leaflet/continuousDrivingMap.png';
								break;
							case 'NightDrive':
								tempIcon = '/assets/images/alerts/nightDriveMap.png';
								break;

							default:
								tempIcon = '/assets/images/alerts/react-leaflet/overspeedMap.png';
								break;
						}

						return {
							...alert,
							icons: tempIcon,
							startlat: Number(Number(alert.startlat).toFixed(5)),
							startLong: Number(Number(alert.startLong).toFixed(5)),
						};
					}
					return null; // Handle invalid alerts or return null
				})
				.filter(
					(alert): alert is AlertValuesWithIcon =>
						alert !== null && ((alert.startlat != 0 && alert.startLong != 0) || (alert.endlat != 0 && alert.endLong != 0))
				);

			setAlertIconsDisplayData(alertValuesWithIcon);
		} else {
			setAlertIconsDisplayData([]); // Reset state if no valid data
		}
	}, [mapAlertIcons]);

	return (
		<>
			<>
				{alertIconDisplayData.length && historyReplay.isHistoryReplayMode
					? alertIconDisplayData.map((alert, index) => (
							<Marker
								position={{ lat: +alert.startlat, lng: +alert.startLong || 0 }}
								icon={alert.exception_type === 'NightDrive' ? iconFactory(alert.icons, [30, 30]) : iconFactory(alert.icons)}
								key={index}
								title={`${(alert.exception_type || '') + index}`}
							></Marker>
					  ))
					: null}
			</>
		</>
	);
};
