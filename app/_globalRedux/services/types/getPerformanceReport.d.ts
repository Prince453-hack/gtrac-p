interface GetPerformanceReportResponse {
	message: string;
	success: boolean;
	list: GetPerfromanceReportList[];
}

interface GetPerfromanceReportList {
	km: number;
	dateof: string;
}
