interface GetCurrentLocationResponse {
	message: string;
	success: boolean;
	list: {
		latLngDtl: {
			lat: number;
			lng: number;
			latlong: string;
			addr: string;
			poi: string;
			gpstime: string;
			epochtime: number;
		};
		speed: number;
		ignState: 'Off' | 'On';
		volt: null;
		fuel: 0 | 1;
		mode: 'RUNNING' | 'IDLE' | 'NOT WORKING';
		modeTime: string;
		angle: number;
		cellId: number;
		gpsStatus: number;
		main_powervoltage: number;
		aconoff: 'Off' | 'On';
		tel_rfid: string;
		tel_odometer: number;
		vehid: string;
		veh_reg: string;
		alcoholtext: string;
		alcoholLbl: string;
	};
}
