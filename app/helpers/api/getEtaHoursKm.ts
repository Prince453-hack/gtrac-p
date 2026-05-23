// getEtaHoursKm: builder.query<string, GetEtaHoursKmParams>({
//     query: ({ userId, sourceLat, sourceLong, destinationLat, destinationlong, groupId, extra }) => ({
//         url: `reports/eta_hours_km.php?ETA=true&sourceLat=${sourceLat}&sourceLong=${sourceLong}&destinationLat=${destinationLat}&destinationlong=${destinationlong}&token=${groupId}&userid=${userId}&extra=${extra}`,
//         method: 'GET',
//         mode: 'no-cors',
//         responseHandler: 'text',
//     }),
// }),

export const getEtaJourneyHrsKm = async ({
	userId,
	groupId,
	extra,
	sourceLat,
	sourceLong,
	destinationLat,
	destinationlong,
}: GetEtaHoursKmParams): Promise<string> => {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_YATAYAAT_NEWTRACKING_API}reports/eta_hours_km.php?ETA=true&sourceLat=${sourceLat}&sourceLong=${sourceLong}&destinationLat=${destinationLat}&destinationlong=${destinationlong}&token=${groupId}&userid=${userId}&extra=${extra}`
		);
		const textResponse = await response.text();

		return textResponse;
	} catch (error) {
		throw error;
	}
};
