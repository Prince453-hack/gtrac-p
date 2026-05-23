interface TripDetails {
	sys_service_id: number;
	lorry_no: string;
	lat: number;
	lng: number;
	addr: string;
	estimateHour: number | null;
	estimateTime: string;
	travelledHours: number;
	party_name: string;
	challan_no: string;
	departure_date: string;
	source_reach_time: string;
	station_from_location: string;
	station_to_location: string;
	STA: string;
	ETA: string;
	totaltripkmbygoogle: number;
	trip_complted_datebysystem: string;
	delay: number | null;
	driver_name: string;
	driver_number: string | null;
	trip_status: string;
	kmTravelled: number;
	KMfromDestination: number;
	RemainingKM: number;
	SourceOut: string;
	vaiOne: string;
	vaiOneHalting: string;
	vaiOneInTime: string;
	vaiOneOutTime: string;
	vaiOneactHalting: number | null;
	vaiTwo: string;
	vaiTwoHalting: string;
	vaiTwoInTime: string;
	vaiTwoOutTime: string;
	vaiTwoactHalting: number | null;
	vaiThree: string;
	vaiThreeHalting: string;
	vaiThreeInTime: string;
	vaiThreeOutTime: string;
	vaiThreeactHalting: number | null;
	vaiFour: string;
	vaifourHalting: string;
	vaiFourInTime: string;
	vaiFourOutTime: string;
	vaifoureactHalting: number | null;
	destinationIn: string;
}

interface SingleTripResponse {
	message: string;
	success: boolean;
	list: TripDetails[];
}
