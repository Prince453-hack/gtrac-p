'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { PathArrayItem } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';

export const PolylineMarkersImperative = () => {
	const map = useMap();
	const userId = useSelector((state: RootState) => state.auth.userId);
	const parentUser = useSelector((state: RootState) => state.auth.parentUser);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);

	useEffect(() => {
		if (!map) return;

		// Check if the user is one of the specified IDs (Amanbus, KMT, KMTGGN, Mehtas, Giriraj Tours)
		const isSpecialUser =
			Number(userId) === 3356 ||
			Number(parentUser) === 3356 ||
			Number(userId) === 87470 ||
			Number(parentUser) === 87470 ||
			Number(userId) === 82815 ||
			Number(parentUser) === 82815 ||
			Number(userId) === 85380 ||
			Number(userId) === 6265 ||
			Number(userId) === 6264 ||
			Number(userId) === 83213;

		// Check all conditions for rendering markers
		if (
			!isSpecialUser ||
			selectedVehicle.vId === 0 ||
			!vehicleItnaryWithPath ||
			!vehicleItnaryWithPath.patharry ||
			vehicleItnaryWithPath.patharry.length < 2 ||
			!historyReplay.isHistoryReplayMode
		) {
			return;
		}

		// Create an InfoWindow instance to reuse for all markers
		const infoWindow = new google.maps.InfoWindow({
			pixelOffset: new google.maps.Size(0, -30), // Match original offset
		});

		// Create markers for each point in the polyline
		const markers = vehicleItnaryWithPath.patharry.map((marker: PathArrayItem, index: number) => {
			const gmMarker = new google.maps.Marker({
				position: { lat: marker.lat, lng: marker.lng },
				map: map,
				icon: {
					url: '/assets/images/transparent.png', // Use a 1x1 transparent PNG
					scaledSize: new google.maps.Size(1, 1), // Tiny size to make it effectively invisible
				},
				title: `Point ${index}`, // Optional: for debugging or accessibility
			});

			// Add click listener to open the InfoWindow
			gmMarker.addListener('click', () => {
				infoWindow.setContent(generateInfoWindowContent(marker));
				infoWindow.setPosition({ lat: marker.lat, lng: marker.lng });
				infoWindow.open(map, gmMarker);
			});

			return gmMarker;
		});

		// Cleanup function to remove markers and close InfoWindow
		return () => {
			markers.forEach((gmMarker) => gmMarker.setMap(null));
			infoWindow.close();
		};
	}, [map, userId, parentUser, selectedVehicle, vehicleItnaryWithPath, historyReplay]);

	return null; // This component doesn't render anything in the React DOM
};

// Function to generate InfoWindow content as an HTML string
function generateInfoWindowContent(marker: PathArrayItem): string {
	return `
    <div class="text-xs text-gray-800 flex flex-col gap-1 max-w-80">
      <div class="absolute top-5">
        <p class="font-medium text-lg">Polyline Information</p>
      </div>
      <div class="grid grid-cols-5 gap-2 grid-flow-row-dense text-sm font-normal">
        <div class="col-span-2 font-medium text-neutral-700">Date Time:</div>
        <div class="col-span-3">${marker.datetime}</div>
        <div class="col-span-2 font-medium text-neutral-700">Distance:</div>
        <div class="col-span-3">${marker.distance.toFixed(2)} KM</div>
        <div class="col-span-2 font-medium text-neutral-700">Location:</div>
        <div class="col-span-3">${marker.lat.toFixed(4)} ⎪ ${marker.lng.toFixed(4)}</div>
        <div class="col-span-2 font-medium text-neutral-700">Speed:</div>
        <div class="col-span-3">${marker.speed} Km/h</div>
      </div>
    </div>
  `;
}
