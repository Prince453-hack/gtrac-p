'use client';
import { RootState } from '@/app/_globalRedux/store';
import React from 'react';
import { Polyline } from 'react-leaflet';
import { useSelector } from 'react-redux';
import * as L from 'leaflet';
import 'leaflet-polylinedecorator';

function SelectedVehiclePolyline({ vehicleAllocationReport }: { vehicleAllocationReport?: boolean }) {
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const liveVehicleItnaryWithPath = useSelector((state: RootState) => state.liveVehicleData);

	const arrow = [
		{
			offset: '100%',
			repeat: 40,
			symbol: L.Symbol.arrowHead({
				pixelSize: 15,
				polygon: false,
				pathOptions: { stroke: true },
			}),
		},
	];

	const polylineOptions = { color: '#3388ff', weight: 4 };
	const polylinePositions = historyReplay.isHistoryReplayMode ? vehicleItnaryWithPath.patharry : liveVehicleItnaryWithPath.patharry;

	return (
		<>
			{vehicleAllocationReport || selectedVehicle.vId !== 0 ? (
				<>
					<Polyline pathOptions={polylineOptions} positions={polylinePositions} />
				</>
			) : null}
		</>
	);
}

export default SelectedVehiclePolyline;
