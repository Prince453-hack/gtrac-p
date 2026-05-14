export const getIsPadlock = ({ userId }: { userId: string }) => {
	// UserId= 85916
	// group Id-58132

	// UserId= 87124
	// group Id-59352

	// UserId= 85965
	// group Id-58176

	// UserId= 87084
	// group Id-59312

	if (userId == '85916' || userId == '85965' || userId == '87124' || userId == '87084') {
		return true;
	} else {
		return false;
	}
};
