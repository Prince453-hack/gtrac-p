import { Feature, Map } from 'ol';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export class OlMarker {
	constructor(public map: Map) {
		this.map = map;
		this.createMarker = this.createMarker.bind(this);
	}

	createMarker(featurePoints: Feature<Point>[], title: string) {
		// Define the number of features (points) to be generated
		// const count = 2000;
		// const features = new Array(count); // Create an array to store features
		// const e = 4500000; // Extent for random coordinate generation

		// // Generate random points to simulate the features to be clustered
		// for (let i = 0; i < count; ++i) {
		// 	// Randomly generate coordinates within a given extent
		// 	const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
		// 	// Create a new feature with the generated coordinates
		// 	features[i] = new Feature(new Point(coordinates));
		// }

		const source = new VectorSource({
			features: featurePoints,
		});

		const markerLayer = new VectorLayer({
			map: this.map,
			source: source,
		});

		markerLayer.set('name', title);
	}

	removeMarker(title: string) {
		this.map.getLayers().forEach((layer) => {
			if (layer.get('name') && layer.get('name') == title) {
				this.map.removeLayer(layer);
			}
		});
	}
}
