interface SaveMapChoiceResponse {
	status: boolean;
	TripSaved: string;
	message: string;
	data: number;
}

interface SaveMapBody {
	userid: number;
	isgooglemap: number;
}
