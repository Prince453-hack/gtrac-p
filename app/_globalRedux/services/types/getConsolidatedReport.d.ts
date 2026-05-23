interface ConsolidatedReportResponse {
	message: string;
	success: boolean;
	list: ConsolidatedReportList[];
}

interface ConsolidatedReportList {
	vehicleNum: string;
	Start_Time: string;
	Start_Location: string;
	End_Time: string;
	End_Location: string;
	Total_KM: number;
	dateof: string;
	Running_Hours: string;
	Idle_Hours: string;
	veh_id: number;
}
