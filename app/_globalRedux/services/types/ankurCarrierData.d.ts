interface AnukurCarrierData {
	vehicleId: number;
	todayKm: 0;
	cMonth: [
		{
			km: number;
		}
	];
	pMonth: [
		{
			km: number;
		}
	];
	yesterdayKm: [
		{
			km: number;
		}
	];
	minusTwodays: [
		{
			km: number;
		}
	];
	minusThreedays: [
		{
			km: number;
		}
	];
	minusFourdays: [
		{
			km: number;
		}
	];
}

interface AnukurCarrierResponse {
	message: string;
	success: boolean;
	list: AnukurCarrierData[];
}
