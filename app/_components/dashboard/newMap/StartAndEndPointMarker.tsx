'use client';

import { RootState } from '@/app/_globalRedux/store';
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PathArrayItem } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';

function addStartAndEndMarkers(
	map: google.maps.Map | null,
	startPosition: { lat: number; lng: number } | undefined,
	startPathItem: PathArrayItem | undefined,
	endPosition: { lat: number; lng: number } | undefined,
	endPathItem: PathArrayItem | undefined
) {
	// Define marker icon URLs (replace with your actual image paths)
	const startIconUrl = `/assets/images/map/start-end-flags/start-flag.png`;
	const endIconUrl = '/assets/images/map/start-end-flags/end-flag.png';

	// Define the size for the icons (20px by 20px)
	const iconSize = new google.maps.Size(60, 60);

	// Create the start marker with scaled icon
	const startMarker = new google.maps.Marker({
		position: startPosition,
		map: map,
		icon: {
			url: startIconUrl,
			scaledSize: iconSize,
			anchor: new google.maps.Point(30, 43),
		},
		title: 'Start',
	});

	// Create the end marker if endPosition is provided
	let endMarker;
	if (endPosition) {
		endMarker = new google.maps.Marker({
			position: endPosition,
			map: map,
			icon: {
				url: endIconUrl,
				scaledSize: iconSize,
				anchor: new google.maps.Point(30, 43),
			},
			title: 'End',
		});
	}

	// Create a single InfoWindow instance to ensure only one is open at a time
	const infoWindow = new google.maps.InfoWindow();

	// Helper function to generate InfoWindow content
	function generateInfoWindowContent(pathItem: PathArrayItem) {
		return `
        <div class="grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal">
          <div class="col-span-2 font-medium text-neutral-700">Date Time:</div>
          <div class="col-span-3">${pathItem.datetime}</div>
          <div class="col-span-2 font-medium text-neutral-700">Distance:</div>
          <div class="col-span-3">${pathItem.distance.toFixed(2)} KM</div>
          <div class="col-span-2 font-medium text-neutral-700">Lat | Lng:</div>
          <div class="col-span-3">${pathItem.lat.toFixed(4)} ⎪ ${pathItem.lng.toFixed(4)}</div>
          <div class="col-span-2 font-medium text-neutral-700">Address:</div>
          <div class="col-span-3">${pathItem.location?.replaceAll('_', ' ')}</div>
          <div class="col-span-2 font-medium text-neutral-700">Nearest POI:</div>
          <div class="col-span-3">${pathItem.nearestPoi}</div>
        </div>
      `;
	}

	// Add click listener to start marker
	if (startPathItem) {
		startMarker.addListener('click', () => {
			infoWindow.setContent(generateInfoWindowContent(startPathItem));
			infoWindow.open(map, startMarker);
		});
	}

	// Add click listener to end marker if it exists
	if (endPathItem) {
		if (endMarker) {
			endMarker.addListener('click', () => {
				infoWindow.setContent(generateInfoWindowContent(endPathItem));
				infoWindow.open(map, endMarker);
			});
		}
	}

	// Return markers for cleanup
	return [startMarker, endMarker].filter(Boolean);
}

export const StartAndEndPointMarker = () => {
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const liveVehicleItnaryWithPath = useSelector((state: RootState) => state.liveVehicleData);
	const { type: createTripOrPlanningTripActive } = useSelector((state: RootState) => state.createTripOrPlanningTripActive);
	const { isGetNearbyVehiclesActive } = useSelector((state: RootState) => state.nearbyVehicles);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const { patharry: path } = vehicleItnaryWithPath;
	const map = useMap();

	useEffect(() => {
		if (!map) return;

		let markers: (google.maps.Marker | undefined)[] = [];

		// Condition to show markers
		const shouldShowMarkers =
			(createTripOrPlanningTripActive !== 'create-trip' &&
				createTripOrPlanningTripActive !== 'trip-planning' &&
				historyReplay.isHistoryReplayMode &&
				isGetNearbyVehiclesActive === false &&
				path.length > 0) ||
			liveVehicleItnaryWithPath.patharry.length > 0;

		if (shouldShowMarkers) {
			let startPosition, startPathItem, endPosition, endPathItem;

			if (historyReplay.isHistoryReplayMode && path.length > 0) {
				// History replay mode: show both start and end markers
				startPosition = { lat: path[0].lat, lng: path[0].lng };
				startPathItem = path[0];
				endPosition = {
					lat: path[path.length - 1].lat,
					lng: path[path.length - 1].lng,
				};
				endPathItem = path[path.length - 1];
			} else if (liveVehicleItnaryWithPath.patharry.length > 0) {
				// Live mode: show only start marker
				startPosition = {
					lat: liveVehicleItnaryWithPath.patharry[0].lat,
					lng: liveVehicleItnaryWithPath.patharry[0].lng,
				};
				startPathItem = liveVehicleItnaryWithPath.patharry[0];
				// endPosition and endPathItem remain undefined
			}

			markers = addStartAndEndMarkers(map, startPosition, startPathItem, endPosition, endPathItem);
		}

		// Cleanup function to remove markers when conditions change or component unmounts
		return () => {
			if (markers.length > 0) {
				markers.forEach((marker) => marker && marker.setMap(null));
			}
		};
	}, [map, createTripOrPlanningTripActive, historyReplay.isHistoryReplayMode, path, liveVehicleItnaryWithPath.patharry]);

	return <></>;
};
