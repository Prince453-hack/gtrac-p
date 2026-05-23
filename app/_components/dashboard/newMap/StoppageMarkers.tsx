'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import paths from '../../../_assets/stoppagesPaths';
import convertMinutesToHoursString from '@/app/helpers/convertMinutesToHoursString';

export const StoppageMarkersImperative = () => {
	const map = useMap();
	const { userId } = useSelector((state: RootState) => state.auth);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const selectedVehicleHistoryTab = useSelector((state: RootState) => state.selectedVehicle.selectedVehicleHistoryTab);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	useEffect(() => {
		if (!map) return;
		if (historyReplay.isHistoryReplayPlaying) return;

		let dataSource;
		if (
			selectedVehicleHistoryTab === 'Diagnostic' ||
			selectedVehicleHistoryTab === 'Running' ||
			selectedVehicleHistoryTab === 'Stoppages' ||
			Number(userId) === 5457 ||
			Number(userId) === 3183
		) {
			dataSource = vehicleItnaryWithPath.diagnosticData || [];
		} else {
			dataSource = vehicleItnaryWithPath.data || [];
		}

		const stoppages = dataSource
			.filter((item) => item.mode === 'Idle')
			.reverse()
			.slice(0, 200);

		const shouldCreateMarkers =
			vehicleItnaryWithPath.patharry &&
			vehicleItnaryWithPath.patharry.length > 0 &&
			vehicleItnaryWithPath.patharry[0].lat !== 0 &&
			(selectedVehicle.vId !== 0 || selectedVehicle.vehicleTrip.sys_service_id !== 0) &&
			historyReplay.isHistoryReplayMode;

		if (shouldCreateMarkers && stoppages.length > 0) {
			let markers: any = [];
			let infoWindow: any = null;
			const timeoutId = setTimeout(() => {
				markers = stoppages.map((stoppage, index) => {
					const path = `M43.6392 22.0002C43.6392 33.9484 33.9533 43.6343 22.0051 43.6343C10.057 43.6343 0.371094 33.9484 0.371094 22.0002C0.371094 10.0521 10.057 0.366211 22.0051 0.366211C33.9533 0.366211 43.6392 10.0521 43.6392 22.0002Z${paths[index]}`;

					const marker = new google.maps.Marker({
						position: { lat: stoppage.fromLat, lng: stoppage.fromLng },
						map: map,
						icon: {
							path: path,
							scale: 0.6,
							strokeWeight: 0.7,
							strokeColor: 'white',
							strokeOpacity: 1,
							fillColor: '#FC7873',
							fillOpacity: 1,
							scaledSize: new window.google.maps.Size(30, 30),
							anchor: { x: 20, y: 30, equals: () => false },
						},
						title: `Stop ${index}`,
						zIndex: 99,
					});

					marker.addListener('click', () => {
						map.setCenter({ lat: stoppage.fromLat, lng: stoppage.fromLng });
						infoWindow.setContent(generateInfoWindowContent(stoppage));
						infoWindow.open(map, marker);
					});

					return marker;
				});

				infoWindow = new google.maps.InfoWindow();
			}, 2000);

			return () => {
				clearTimeout(timeoutId);
				markers.forEach((marker: any) => marker.setMap(null));
				if (infoWindow) infoWindow.close();
			};
		}
	}, [map, vehicleItnaryWithPath, selectedVehicleHistoryTab, historyReplay, selectedVehicle]);

	return null;
};

function generateInfoWindowContent(stoppage: any) {
	return `
    <div class="text-xs text-gray-800 flex flex-col gap-1 max-w-80">
      <div class="flex justify-between mb-2 absolute top-5">
        <p class="font-medium text-lg">Stoppage Information</p>
      </div>
      <div class="grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal">
        <div class="col-span-2 font-medium text-neutral-700">Start Time:</div>
        <div class="col-span-3">${stoppage.fromTime}</div>
        <div class="col-span-2 font-medium text-neutral-700">To Time:</div>
        <div class="col-span-3">${stoppage.toTime}</div>
        <div class="col-span-2 font-medium text-neutral-700">Stopped Time:</div>
        <div class="col-span-3">${convertMinutesToHoursString(stoppage.totalTimeInMIN)}</div>
        <div class="col-span-2 font-medium text-neutral-700">Lat | Lng:</div>
        <div class="col-span-3">
          <a href="https://www.google.com/maps/search/${stoppage.fromLat},${stoppage.fromLng}" target="_blank" rel="noreferrer">
            ${stoppage.fromLat.toFixed(2)} | ${stoppage.fromLng.toFixed(2)}
          </a>
        </div>
        <div class="col-span-2 font-medium text-neutral-700">Address:</div>
        <div class="col-span-3">${stoppage.startLocation ? stoppage.startLocation.replaceAll('_', ' ') : ''}</div>
      </div>
    </div>
  `;
}
