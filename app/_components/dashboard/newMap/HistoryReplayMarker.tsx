'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { RootState } from '@/app/_globalRedux/store';
import { useMap } from '@vis.gl/react-google-maps';
import { setHistoryReplayJustStartedPlaying } from '@/app/_globalRedux/dashboard/historyReplaySlice';

export const HistoryReplayMarker = () => {
	const map = useMap();
	const dispatch = useDispatch();

	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const { isGetNearbyVehiclesActive } = useSelector((state: RootState) => state.nearbyVehicles);

	const markerRef = useRef<google.maps.Marker | null>(null);
	const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

	const infoWindowManuallyClosedRef = useRef<boolean>(false);

	const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		infoWindowManuallyClosedRef.current = false;
	}, [historyReplay.isHistoryReplayMode, selectedVehicle.vId]);

	useEffect(() => {
		if (!infoWindowRef.current && map) {
			const newInfoWindow = new google.maps.InfoWindow();

			newInfoWindow.addListener('closeclick', () => {
				infoWindowManuallyClosedRef.current = true;
			});

			infoWindowRef.current = newInfoWindow;
		}

		// Clean up on unmount
		return () => {
			if (markerRef.current) {
				markerRef.current.setMap(null);
				markerRef.current = null;
			}

			if (infoWindowRef.current) {
				infoWindowRef.current.close();
			}

			prevPositionRef.current = null;
		};
	}, [map]);

	useEffect(
		() => {
			if (!map) return;

			const shouldShowMarker =
				vehicleItnaryWithPath.patharry &&
				vehicleItnaryWithPath.patharry.length >= 2 &&
				historyReplay.isHistoryReplayMode &&
				selectedVehicle.vId !== 0 &&
				isGetNearbyVehiclesActive === false;

			if (shouldShowMarker) {
				const manualPathIndex = Math.floor((historyReplay.manualPath / 100) * (vehicleItnaryWithPath.patharry.length - 2));
				const pathIndex = historyReplay.currentPathArrayIndex + manualPathIndex;
				const pathPoint = pathIndex >= 0 && pathIndex < vehicleItnaryWithPath.patharry.length ? vehicleItnaryWithPath.patharry[pathIndex] : null;

				if (pathPoint) {
					const position = { lat: pathPoint.lat, lng: pathPoint.lng };

					if (!markerRef.current) {
						const newMarker = new google.maps.Marker({
							position,
							map,
							icon: {
								url: '/assets/images/map/moving-vehicle.png',
								scaledSize: new google.maps.Size(60, 60),
								anchor: new google.maps.Point(30, 30),
							},
							optimized: false,
						});

						newMarker.addListener('click', () => {
							if (infoWindowRef.current) {
								infoWindowRef.current.open(map, newMarker);
								infoWindowManuallyClosedRef.current = false;
							}
						});

						markerRef.current = newMarker;
						prevPositionRef.current = position;

						if (historyReplay.isHistoryReplayPlaying && !infoWindowManuallyClosedRef.current && infoWindowRef.current) {
							infoWindowRef.current.setContent(getInfoWindowContent(pathPoint));
							infoWindowRef.current.open(map, newMarker);
						}
					} else {
						if (infoWindowRef.current && historyReplay.justStartedPlaying) {
							infoWindowRef.current.setContent(getInfoWindowContent(pathPoint));
							infoWindowRef.current.open(map, markerRef.current);

							dispatch(setHistoryReplayJustStartedPlaying(false));
						}

						if (prevPositionRef.current) {
							smoothlyAnimateMarker(markerRef.current, prevPositionRef.current, position, 300);
							map && infoWindowRef.current?.isOpen && map.setCenter({ lat: position.lat, lng: position.lng });
						} else {
							markerRef.current.setPosition(position);
						}
						prevPositionRef.current = position;

						if (infoWindowRef.current) {
							infoWindowRef.current.setContent(getInfoWindowContent(pathPoint));
						}
					}
				}
			} else {
				if (markerRef.current) {
					markerRef.current.setMap(null);
					markerRef.current = null;
				}

				if (infoWindowRef.current) {
					infoWindowRef.current.close();
				}

				prevPositionRef.current = null;
				infoWindowManuallyClosedRef.current = false;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[map, vehicleItnaryWithPath, historyReplay, selectedVehicle]
	);

	const smoothlyAnimateMarker = (
		marker: google.maps.Marker,
		startPosition: { lat: number; lng: number },
		endPosition: { lat: number; lng: number },
		duration: number
	) => {
		const startTime = new Date().getTime();
		const animateStep = () => {
			const elapsed = new Date().getTime() - startTime;
			const percentage = elapsed / duration;

			if (percentage < 1) {
				const lat = startPosition.lat + (endPosition.lat - startPosition.lat) * percentage;
				const lng = startPosition.lng + (endPosition.lng - startPosition.lng) * percentage;
				marker.setPosition({ lat, lng });

				requestAnimationFrame(animateStep);
			} else {
				marker.setPosition(endPosition);
			}
		};
		animateStep();
	};

	const getInfoWindowContent = (pathPoint: any) => {
		return `
      <div class="text-xs text-gray-800 flex flex-col gap-1 max-w-80">
        <div class="flex justify-between mb-1 absolute top-5">
          <p class="font-medium text-lg">Movement Information</p>
        </div>
        <div class="grid grid-cols-5 gap-1 grid-flow-row-dense text-sm font-normal">
          <div class="col-span-2 font-medium text-neutral-700">Date Time:</div>
          <div class="col-span-3">${moment(pathPoint.datetime).format('Do MMM, YYYY HH:mm')}</div>
          <div class="col-span-2 font-medium text-neutral-700">Position:</div>
          <div class="col-span-3">${String(pathPoint.lat).slice(0, 5)}, ${String(pathPoint.lng).slice(0, 5)}</div>
          <div class="col-span-2 font-medium text-neutral-700">KM Covered:</div>
          <div class="col-span-3">${pathPoint.distance.toFixed(2)} Km</div>
          <div class="col-span-2 font-medium text-neutral-700">Speed:</div>
          <div class="col-span-3">${pathPoint.speed} Km/h</div>
        </div>
      </div>
    `;
	};

	return null;
};
