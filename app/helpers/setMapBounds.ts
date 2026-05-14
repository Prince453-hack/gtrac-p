import { GetItnaryWithMapResponse } from '../_globalRedux/services/types';

export const setMapBounds = (vehicleItnaryWithPath: GetItnaryWithMapResponse) => {
	const tempMap = document.getElementById('map');
	if (tempMap) {
		let map = new google.maps.Map(tempMap);
		if (window.google.maps) {
			if (vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length >= 2) {
				const bounds = new window.google.maps.LatLngBounds();

				const point1 = new window.google.maps.LatLng(vehicleItnaryWithPath.patharry[2].lat, vehicleItnaryWithPath.patharry[2].lng);
				const point2 = new window.google.maps.LatLng(
					vehicleItnaryWithPath.patharry[vehicleItnaryWithPath.patharry.length - 2].lat,
					vehicleItnaryWithPath.patharry[vehicleItnaryWithPath.patharry.length - 2].lng
				);
				bounds.extend(point1);
				bounds.extend(point2);

				bounds.getCenter();

				if (window.google.maps) {
					map.fitBounds(bounds);
				}
			}
		}
	}
};
