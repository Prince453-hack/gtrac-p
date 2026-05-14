'use client';

import React, { useEffect, useRef } from 'react';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import { OlMarker } from './repository/marker';
import { Point } from 'ol/geom';

function CustomOlMaps() {
	const { containerStyle, centerOfMap, zoomNo } = useSelector((state: RootState) => state.olMap);
	const markers = useRef<null | OlMarker>(null);

	useEffect(() => {
		const osmLayer = new TileLayer({
			preload: Infinity,
			source: new OSM(),
		});

		// const source = new VectorSource({
		// 	features: [],
		// });

		// const markerLayer = new VectorLayer({
		// 	source: source,
		// });

		// markerLayer.set('name', 'MARKER_LAYER');

		const map = new Map({
			target: 'map',
			layers: [
				osmLayer,
				// markerLayer
			],
			view: new View({
				center: fromLonLat([centerOfMap.lng, centerOfMap.lat]),
				zoom: zoomNo,
			}),
		});

		let markersFactory = new OlMarker(map);

		markers.current = markersFactory;

		// markers.current.createMarker([new Feature(new Point(fromLonLat([centerOfMap.lng, centerOfMap.lat])))], 'CENTER');
	}, [centerOfMap, zoomNo]);

	return (
		<>
			<div style={{ ...containerStyle, width: containerStyle.width }} id='map' className='map-container' />
			<div
				className='z-[99999]  absolute right-0 bottom-0 bg-red-500 p-2 rounded-md text-neutral-200 cursor-pointer hover:bg-red-600'
				onClick={() => markers.current?.removeMarker('CENTER')}
			>
				Remove Marker
			</div>

			<div
				className='z-[99999]  absolute right-0 bottom-20 bg-green-500 p-2 rounded-md text-neutral-200 cursor-pointer hover:bg-green-600'
				onClick={() => markers.current?.createMarker([new Feature(new Point(fromLonLat([centerOfMap.lng, centerOfMap.lat])))], 'CENTER')}
			>
				Create Marker
			</div>
		</>
	);
}

export default CustomOlMaps;
