import { VehicleData } from '../_globalRedux/services/types/getListVehiclesmobTypes';

const keywordOrder: { ACTIVE: number; INACTIVE: number } = {
	ACTIVE: 1,
	INACTIVE: 2,
};

function compareActiveInActiveCategories(a: VehicleData, b: VehicleData) {
	const categoryA = new Date(a.GPSInfo.gpstime).getDate() === new Date().getDate() ? 'ACTIVE' : 'INACTIVE';
	const categoryB = new Date(b.GPSInfo.gpstime).getDate() === new Date().getDate() ? 'ACTIVE' : 'INACTIVE';

	// Get the rank of each category or assign a high rank for unknown categories
	const rankA = keywordOrder[categoryA] || Infinity;
	const rankB = keywordOrder[categoryB] || Infinity;

	// Compare ranks first
	if (rankA !== rankB) {
		return rankA - rankB; // Sort by rank
	} else {
		// If ranks are the same, sort alphabetically within the same category
		return categoryA.localeCompare(categoryB);
	}
}

export default compareActiveInActiveCategories;
