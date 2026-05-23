'use client';

import { AlertDetails } from '@/app/_globalRedux/services/types/alerts';
import { RootState } from '@/app/_globalRedux/store';
import { Marker } from '@/@react-google-maps/api';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

interface AlertValuesWithIcon extends AlertDetails {
	icons: string;
}

export const AlertMarkers = () => {
	const mapAlertIcons = useSelector((state: RootState) => state.mapAlertsIcons);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const [alertIconDisplayData, setAlertIconsDisplayData] = useState<AlertValuesWithIcon[] | []>([]);

	const isGetAlertsLoading = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((query) => query && query.endpointName === 'getKmtAlertVehicleWise' && query.status === 'pending')
	);

	useEffect(() => {
		if (historyReplay.isHistoryReplayPlaying) return;
		if (mapAlertIcons && mapAlertIcons.length > 0 && mapAlertIcons[0] && isGetAlertsLoading === false) {
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
								tempIcon = '/assets/images/alerts/nightDriveMap.png';
								break;
							case 'Ignition':
								tempIcon = '/assets/images/alerts/nightDriveMap.png';
								break;
							case 'Harsh Braking':
								tempIcon = '/assets/images/alerts/harshBreakMap.png';
								break;
							case 'OverSpeed':
								tempIcon = '/assets/images/alerts/overspeedMap.png';
								break;
							case 'OverSpeed':
								tempIcon = '/assets/images/alerts/overspeedMap.png';
								break;
							case 'Harsh Acceleration':
								tempIcon = '/assets/images/alerts/harshAccelerationMap.png';
								break;
							case 'Main power disconnected':
								tempIcon = '/assets/images/alerts/mainPowerMap.png';
								break;
							case 'Main Power Disconnected':
								tempIcon = '/assets/images/alerts/mainPowerMap.png';
								break;
							case 'High Engine Temperature':
								tempIcon = '/assets/images/alerts/high-temp.svg';
								break;
							case 'idle':
								tempIcon = '/assets/images/alerts/idleIcon.png';
								break;
							case 'Idling':
								tempIcon = '/assets/images/alerts/idleIcon.png';
								break;
							case 'Low Engine Oil Pressure':
								tempIcon = '/assets/images/alerts/high-oil.svg';
								break;
							case 'Main Power Disconnect':
								tempIcon = '/assets/images/alerts/mainPowerMap.png';
								break;
							case 'Panic':
								tempIcon = '/assets/images/alerts/panic.svg';
								break;
							case 'Unlock on move':
								tempIcon = '/assets/images/alerts/unlock-on-move.svg';
								break;
							case 'Services':
								tempIcon = '/assets/images/alerts/services.svg';
								break;
							case 'Document':
								tempIcon = '/assets/images/alerts/document.svg';
								break;
							case 'freewheeling':
								tempIcon = '/assets/images/alerts/freeWheelMap.png';
								break;
							case 'Free Wheeling':
								tempIcon = '/assets/images/alerts/freeWheelMap.png';
								break;

							case 'Internal battery disconnected':
								tempIcon = '/assets/images/alerts/internalBatteryMap.png';
								break;
							case 'Transit Delay':
								tempIcon = '/assets/images/alerts/transit-delay.svg';
								break;
							case 'Continuous Driving':
								tempIcon = '/assets/images/alerts/continuousDrivingMap.png';
								break;
							case 'NightDrive':
								tempIcon = '/assets/images/alerts/nightDriveMap.png';
								break;

							default:
								tempIcon = '/assets/images/alerts/overspeedMap.png';
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
	}, [mapAlertIcons, isGetAlertsLoading]);

	return (
		<>
			<>
				{alertIconDisplayData.length && historyReplay.isHistoryReplayMode
					? alertIconDisplayData.map((alert, index) => (
							<Marker
								position={{ lat: +alert.startlat, lng: +alert.startLong || 0 }}
								icon={{
									url: alert.icons,
									scale: 1,
									scaledSize: new window.google.maps.Size(30, 30),
									size: alert.exception_type === 'NightDrive' ? new window.google.maps.Size(30, 30) : new window.google.maps.Size(60, 60),
								}}
								key={index}
								zIndex={9999999}
								title={`${(alert.exception_type || '') + index}`}
							></Marker>
					  ))
					: null}
			</>
		</>
	);
};
