import { useMap } from '@vis.gl/react-google-maps';
import { useCallback, useRef, useEffect } from 'react';

function usePolylineDrawer() {
	const map = useMap(); // Get the Google Maps instance
	const polylineRef = useRef<google.maps.Polyline | null>(null);

	const drawPolyline = useCallback(
		(path: google.maps.LatLngLiteral[], options: google.maps.PolylineOptions = {}) => {
			if (!map) return; // Wait until the map is loaded

			// Remove the previous polyline from the map
			polylineRef.current?.setMap(null);

			// Create a new polyline
			const newPolyline = new google.maps.Polyline({
				path: path,
				...options,
			});

			// Add the polyline to the map
			newPolyline.setMap(map);

			// Store the new polyline in the ref
			polylineRef.current = newPolyline;
		},
		[map]
	);

	// Cleanup: Remove the polyline when the component unmounts
	useEffect(() => {
		return () => {
			polylineRef.current?.setMap(null);
		};
	}, []);

	return drawPolyline;
}

export default usePolylineDrawer;
