import L from 'leaflet';

export const iconFactory = (url: string, size: [number, number] = [60, 60]) => {
	return L.icon({
		iconUrl: url,
		iconSize: size,
		shadowSize: [50, 64],
		iconAnchor: [30, 30],
		shadowAnchor: [4, 62],
		popupAnchor: [0, -20],
	});
};
