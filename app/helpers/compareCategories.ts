import { VehicleData } from '../_globalRedux/services/types/getListVehiclesmobTypes';

const keywordOrder: { RUNNING: number; IDLE: number; STOPPED: number; 'NOT WORKING': number } = {
	RUNNING: 1,
	IDLE: 2,
	STOPPED: 3,
	'NOT WORKING': 4,
};

function compareCategories(a: VehicleData, b: VehicleData) {
	const categoryA = a.gpsDtl.mode;
	const categoryB = b.gpsDtl.mode;

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

export default compareCategories;
