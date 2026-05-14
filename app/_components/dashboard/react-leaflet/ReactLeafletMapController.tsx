'use client';

import { RootState } from '@/app/_globalRedux/store';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as L from 'leaflet';
import { LatLngBounds } from 'leaflet';

import { useMap } from 'react-leaflet';
import { isCheckInAccount } from '@/app/helpers/isCheckInAccount';
import { setCenterOfMap, setZoomNo } from '@/app/_globalRedux/dashboard/olMapSlice';

export default function ReactLeafletMapController() {
	const dispatch = useDispatch();
	const mapRef = useMap();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing
	const { userId } = useSelector((state: RootState) => state.auth);

	const { type: createTripOrPlanningTripActive } = useSelector((state: RootState) => state.createTripOrPlanningTripActive);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const selectedDashboardVehicle = useSelector((state: RootState) => state.selectedDashboardVehicle);
	const markers = useSelector((state: RootState) => state.markers);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const checkInData = useSelector((state: RootState) => state.checkIndData);

	const isGetVehicleCurrentLocationLoading = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((q) => q && q.endpointName === 'getVehicleCurrentLocation' && q.status === 'pending')
	);

	const isGetItineraryLoading = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((q) => q && q.endpointName === 'GetItineraryvehIdBDateNwStmeh' && q.status === 'pending')
	);

	// Update map view with debounce
	const updateMapViewWithDebounce = (lat: number, lng: number) => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			if (mapRef) {
				const currentCenter = mapRef.getCenter();
				if (currentCenter.lat !== lat || currentCenter.lng !== lng) {
					mapRef.setView(new L.LatLng(lat, lng), mapRef.getZoom());
					dispatch(setCenterOfMap({ lat, lng }));
				}
			}
		}, 200); // Adjust the debounce delay as needed
	};

	useEffect(() => {
		let bounds: LatLngBounds | null = null;

		if (createTripOrPlanningTripActive === '') {
			if (mapRef && selectedDashboardVehicle.length === 0) {
				if (selectedVehicle.vId === 0) {
					if (markers.length > 0) {
						bounds = L.latLngBounds(markers.map((marker) => new L.LatLng(marker.gpsDtl.latLngDtl.lat, marker.gpsDtl.latLngDtl.lng)));

						mapRef.fitBounds(bounds);
					} else {
						updateMapViewWithDebounce(21.7679, 78.8718);
					}
				} else if (selectedVehicle.vId !== 0) {
					if (isCheckInAccount(Number(userId))) {
						if (checkInData && checkInData.length > 0) {
							bounds = L.latLngBounds(
								new L.LatLng(checkInData[0].gps_latitude, checkInData[0].gps_longitude),
								new L.LatLng(checkInData[checkInData.length - 1].gps_latitude, checkInData[checkInData.length - 1].gps_longitude)
							);

							mapRef.fitBounds(bounds);
						}
					} else if (historyReplay.isHistoryReplayMode && vehicleItnaryWithPath.patharry.length > 0) {
						if (!isGetItineraryLoading) {
							bounds = L.latLngBounds(
								new L.LatLng(vehicleItnaryWithPath.patharry[0].lat, vehicleItnaryWithPath.patharry[0].lng),
								new L.LatLng(
									vehicleItnaryWithPath.patharry[vehicleItnaryWithPath.patharry.length - 1].lat,
									vehicleItnaryWithPath.patharry[vehicleItnaryWithPath.patharry.length - 1].lng
								)
							);

							mapRef.fitBounds(bounds);
						}
					} else {
						if (!isGetVehicleCurrentLocationLoading) {
							if (selectedVehicle) {
								const { lat, lng } = selectedVehicle.gpsDtl.latLngDtl;

								const baseZoom = 20;
								const zoomOutLevels = 2;
								const targetZoom = Math.max(baseZoom - zoomOutLevels, 0);

								mapRef.setView(new L.LatLng(lat, lng), targetZoom);
								dispatch(setCenterOfMap({ lat, lng }));
								dispatch(setZoomNo(targetZoom));
							}
						}
					}
				}
			} else if (mapRef) {
				if (selectedVehicle.vId === 0) {
					if (selectedDashboardVehicle.length > 0) {
						const selectedMarkers = markers.filter((marker) => selectedDashboardVehicle.some((v) => v.vehicleData.vId === marker.vId));
						const positions = selectedMarkers.map((marker) => L.latLng(marker.gpsDtl.latLngDtl.lat, marker.gpsDtl.latLngDtl.lng));
						if (positions.length === 1) {
							const { lat, lng } = positions[0];

							const baseZoom = 16;
							const zoomOutLevels = 2;

							const targetZoom = Math.max(baseZoom - zoomOutLevels, 0);

							mapRef.setView(new L.LatLng(lat, lng), targetZoom);
							dispatch(setCenterOfMap({ lat, lng }));
							dispatch(setZoomNo(targetZoom));
						} else if (positions.length > 1) {
							const bounds = L.latLngBounds(positions);
							mapRef.fitBounds(bounds);
						}
					} else if (markers.length > 0) {
						const firstMarker = markers[0];
						const { lat, lng } = firstMarker.gpsDtl.latLngDtl;
						mapRef.setView([lat, lng], mapRef.getZoom() || 10);
						dispatch(setCenterOfMap({ lat, lng }));
					} else {
						mapRef.setView([21.7679, 78.8718], 5);
						dispatch(setCenterOfMap({ lat: 21.7679, lng: 78.8718 }));
					}
				} else if (selectedVehicle.vId !== 0) {
					if (!isGetVehicleCurrentLocationLoading) {
						const filteredMarker = markers.find((marker) => marker.vId === selectedVehicle.vId);
						if (!filteredMarker) return;
						const { lat, lng } = filteredMarker.gpsDtl.latLngDtl;

						const baseZoom = 20;
						const zoomOutLevels = 2;
						const targetZoom = Math.max(baseZoom - zoomOutLevels, 0);

						mapRef.setView([lat, lng]);
						mapRef.setZoom(targetZoom);
						dispatch(setCenterOfMap({ lat, lng }));

						if (!historyReplay.isHistoryReplayMode) {
							dispatch(setZoomNo(targetZoom));
						}
					}
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedVehicle, vehicleItnaryWithPath, checkInData]);

	return <div></div>;
}
