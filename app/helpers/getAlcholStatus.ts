'use client';

import { VehicleData } from '../_globalRedux/services/types/getListVehiclesmobTypes';

export const getAlcoholStatus = (vehicleData: VehicleData) => {
	const journeyDistance = Number(vehicleData.gpsDtl.alcoholLevel);

	if (vehicleData.gpsDtl.port === 12040) {
		if (journeyDistance <= 2) {
			return false;
		} else if (journeyDistance <= 3) {
			return true;
		} else if (journeyDistance <= 10) {
			return true;
		}
	} else {
		if (journeyDistance <= 250) {
			return false;
		} else if (journeyDistance > 250 && journeyDistance <= 350) {
			return true;
		} else {
			return true;
		}
	}
};
