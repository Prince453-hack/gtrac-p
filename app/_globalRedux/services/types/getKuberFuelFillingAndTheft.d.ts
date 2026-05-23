interface GetKuberFuelFillingAndTheftPoints {
	sys_service_id: number;
	type: string;
	latitude: number;
	longitude: number;
	typeId: string;
	value: string;
	fillingTime: string;
	event_address: string;
}

interface GetKuberFuelFillingAndTheftResponse {
	message: string;
	success: boolean;
	list: GetKuberFuelFillingAndTheftPoints[];
}
