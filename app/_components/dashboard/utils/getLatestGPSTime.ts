import { Markers, VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';

export const getLatestGPSTime = (data: VehicleData | Markers): 'GPS' | 'ELOCK' => {
	const gpsTime = data.GPSInfo.gpstime;
	const elockTime = data.ELOCKInfo.gpstime;
	const gpsTimeInMillis = new Date(gpsTime).getTime();
	const elockTimeInMillis = new Date(elockTime).getTime();

	return gpsTimeInMillis > elockTimeInMillis ? 'GPS' : 'ELOCK';
};
