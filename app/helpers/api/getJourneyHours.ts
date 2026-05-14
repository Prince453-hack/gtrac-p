export const getJourneyHours = async ({
	userId,
	source,
	destination,
	via,
	viaOne,
	viaTwo,
	viaThree,
	viaFour,
	routeType,
	viaOneHaltHr,
	viaTwoHaltHr,
	viaThreeHaltHr,
	viaFourHaltHr,
	groupId,
	extra,
}: GetJourneyHoursParams): Promise<string> => {
	const url = `${process.env.NEXT_PUBLIC_YATAYAAT_NEWTRACKING_API}reports/getjourney_hours_viareact.php`;
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_YATAYAAT_NEWTRACKING_API}reports/getjourney_hours_viareact.php?token=${groupId}&userid=${userId}&extra=${extra}&source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&via=${encodeURIComponent(via)}&viaone=${encodeURIComponent(viaOne)}&viatwo=${encodeURIComponent(viaTwo)}&viathree=${encodeURIComponent(viaThree)}&viafour=${encodeURIComponent(viaFour)}&routetype=${encodeURIComponent(routeType)}&viaone_halthr_input=${encodeURIComponent(viaOneHaltHr)}&viatwo_halthr_input=${encodeURIComponent(viaTwoHaltHr)}&viathree_halthr_input=${encodeURIComponent(viaThreeHaltHr)}&viafour_tillkm=${encodeURIComponent(viaFourHaltHr)}`
		);
		const textResponse = await response.text();

		return textResponse;
	} catch (error) {
		throw error;
	}
};
