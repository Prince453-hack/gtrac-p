interface GetJourneyHoursParams {
	userId: number;
	source: string;
	destination: string;
	via: boolean;
	viaOne: string;
	viaTwo: string;
	viaThree: string;
	viaFour: string;
	routeType: string;
	viaOneHaltHr: string;
	viaTwoHaltHr: string;
	viaThreeHaltHr: string;
	viaFourHaltHr: string;
	groupId: string;
	extra: string;
}
