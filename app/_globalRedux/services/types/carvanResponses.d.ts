// Location data structure
interface Location {
	lat: number;
	lng: number;
	address: string;
}

// Response for GET /location-requests/:token
interface GetLocationsResponse {
	status: boolean;
	locations: Array<{ userId: string; location: Location }>;
	pendingUserIds: string[];
}

// Response for GET /location-requests/need/:userId
interface CheckLocationNeededResponse {
	isNeeded: boolean;
}

// Response for POST /location-requests and PUT /locations/:userId
interface SuccessResponse {
	message: string;
}
