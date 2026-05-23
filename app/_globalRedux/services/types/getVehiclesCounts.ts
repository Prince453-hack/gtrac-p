export interface GetVehiclesCountsResponse {
	message: string;
	success: boolean;
	list: List[];
}

export interface List {
	mode: string;
	count: number;
}
