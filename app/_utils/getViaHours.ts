export const getViaHours = (numberOfViaPoints: number, selectedVehicle: PlannedTrips): { startTime: string; endTime: string }[] => {
	if (numberOfViaPoints === 1) {
		return [
			{ startTime: selectedVehicle.departure_date, endTime: selectedVehicle.vaiOneInTime },
			{ startTime: selectedVehicle.vaiOneInTime, endTime: selectedVehicle.trip_complted_datebysystem },
		];
	} else if (numberOfViaPoints === 2) {
		return [
			{ startTime: selectedVehicle.departure_date, endTime: selectedVehicle.vaiOneInTime },
			{ startTime: selectedVehicle.vaiOneInTime, endTime: selectedVehicle.vaiTwoInTime },
			{ startTime: selectedVehicle.vaiTwoInTime, endTime: selectedVehicle.trip_complted_datebysystem },
		];
	} else if (numberOfViaPoints === 3) {
		return [
			{ startTime: selectedVehicle.departure_date, endTime: selectedVehicle.vaiOneInTime },
			{ startTime: selectedVehicle.vaiOneInTime, endTime: selectedVehicle.vaiTwoInTime },
			{ startTime: selectedVehicle.vaiTwoInTime, endTime: selectedVehicle.vaiThreeInTime },
			{ startTime: selectedVehicle.vaiThreeInTime, endTime: selectedVehicle.trip_complted_datebysystem },
		];
	} else if (numberOfViaPoints === 4) {
		return [
			{ startTime: selectedVehicle.departure_date, endTime: selectedVehicle.vaiOneInTime },
			{ startTime: selectedVehicle.vaiOneInTime, endTime: selectedVehicle.vaiTwoInTime },
			{ startTime: selectedVehicle.vaiTwoInTime, endTime: selectedVehicle.vaiThreeInTime },
			{ startTime: selectedVehicle.vaiThreeInTime, endTime: selectedVehicle.vaiFourInTime },
			{ startTime: selectedVehicle.vaiFourInTime, endTime: selectedVehicle.trip_complted_datebysystem },
		];
	} else {
		return [{ startTime: selectedVehicle.departure_date, endTime: selectedVehicle.trip_complted_datebysystem }];
	}
};
