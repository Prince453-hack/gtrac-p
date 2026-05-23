interface ContinuousJourneyResponse {
	message: string;
	success: boolean;
	list: ContinuousJourneyList[];
}

interface ContinuousJourneyList {
	vehicleNum: string;
	Start_Time: string;
	Start_Location: string;
	End_Time: string;
	End_Location: string;
	Total_KM: number;
	dateof: string;
}
