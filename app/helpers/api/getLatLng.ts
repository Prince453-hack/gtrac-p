export const getLatLong = async ({ address, groupId, userId }: { groupId: string; userId: string; address: string }): Promise<string> => {
	if (!address) return '';
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_YATAYAAT_NEWTRACKING_API}reports/gelatlong.php?token=${groupId}&userid=${userId}&address=${encodeURIComponent(address)}`
		);
		const textResponse = await response.text();

		return textResponse;
	} catch (error) {
		throw error;
	}
};
