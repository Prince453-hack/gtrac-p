'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { KmtAlerts } from '@/app/_globalRedux/services/types/alerts';

export const AlertMarkersImperative = () => {
	const map = useMap();
	const mapAlertIcons = useSelector((state: RootState) => state.mapAlertsIcons);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const isGetAlertsLoading = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((query) => query && query.endpointName === 'getKmtAlertVehicleWise' && query.status === 'pending')
	);

	useEffect(() => {
		if (historyReplay.isHistoryReplayPlaying) return;
		// Exit if prerequisites are not met
		if (!map || isGetAlertsLoading || !historyReplay.isHistoryReplayMode || !mapAlertIcons || mapAlertIcons.length === 0) {
			return;
		}

		// Extract and flatten alert data
		const alertIcons = mapAlertIcons[0];
		const alertValues = Object.keys(alertIcons)
			.map((alertKey: unknown) => alertIcons[alertKey as keyof KmtAlerts])
			.flat()
			.filter((alert) => typeof alert !== 'string');

		// Process alerts to include icons and format coordinates
		const alertValuesWithIcon = alertValues
			.map((alert) => {
				if (typeof alert !== 'string' && 'exception_type' in alert) {
					let tempIcon = '';
					switch (alert.exception_type) {
						case 'Ignition Night':
						case 'Ignition':
							tempIcon = '/assets/images/alerts/nightDriveMap.png';
							break;
						case 'Harsh Braking':
							tempIcon = '/assets/images/alerts/harshBreakMap.png';
							break;
						case 'OverSpeed':
							tempIcon = '/assets/images/alerts/overspeedMap.png';
							break;
						case 'Harsh Acceleration':
							tempIcon = '/assets/images/alerts/harshAccelerationMap.png';
							break;
						case 'Main power disconnected':
						case 'Main Power Disconnected':
						case 'Main Power Disconnect':
							tempIcon = '/assets/images/alerts/mainPowerMap.png';
							break;
						case 'High Engine Temperature':
							tempIcon = '/assets/images/alerts/high-temp.svg';
							break;
						case 'idle':
						case 'Idling':
							tempIcon = '/assets/images/alerts/idleIcon.png';
							break;
						case 'Low Engine Oil Pressure':
							tempIcon = '/assets/images/alerts/high-oil.svg';
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
				return null;
			})
			.filter((alert) => alert !== null && ((alert.startlat != 0 && alert.startLong != 0) || (alert.endlat != 0 && alert.endLong != 0)));

		// Create markers imperatively
		const markers = alertValuesWithIcon.map((alert, index) => {
			if (!alert) return null;

			const iconSize = alert.exception_type === 'NightDrive' ? new google.maps.Size(30, 30) : new google.maps.Size(60, 60);

			const marker = new google.maps.Marker({
				position: { lat: alert.startlat, lng: alert.startLong },
				map: map,
				icon: {
					url: alert.icons,
					scaledSize: new google.maps.Size(30, 30),
					anchor: new google.maps.Point(15, 30),
					size: iconSize,
				},
				title: `${alert.exception_type || ''}${index}`,
				zIndex: 9999999,
			});

			return marker;
		});

		// Cleanup function to remove markers
		return () => {
			markers.forEach((marker) => marker && marker.setMap(null));
		};
	}, [map, mapAlertIcons, historyReplay.isHistoryReplayMode, isGetAlertsLoading]);

	return null;
};
