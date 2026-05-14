'use client';

import * as L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-polylinedecorator';
export function PolylineDecorator({ patterns, polyline }: { patterns: any; polyline: any }) {
	const map = useMap();

	useEffect(() => {
		if (!map || typeof window === 'undefined') return;

		L.polyline(polyline).addTo(map);
		L.polylineDecorator(polyline, {
			patterns,
		}).addTo(map);
	}, [map, window]);

	return null;
}
