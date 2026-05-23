export const checkIfVehicleStandingForMoreThan3Days = (lastTrip: any) => {
	if (!lastTrip) return false;
	const lastTripDate = new Date(lastTrip);
	const currentDate = new Date();
	const diffTime = Math.abs(currentDate.getTime() - lastTripDate.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays > 3;
};
