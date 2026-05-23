import moment from 'moment';

export type GroupedVehicleEntry = {
	vehicleNum: string;
	NoGpsKM: number;
	datesWithKm: Record<string, number | string>;
};

export type TransformedData = Record<number, GroupedVehicleEntry>;

type CurrentMonthVehicleDetails = {
	vehicleNum: string;
	km: number;
	kmshow: number | string;
	dateof: string;
	NoGpsKM: number;
};

const transformedData: TransformedData = {};

const matchDateFormat = (date: string): string => {
	return moment(new Date(date)).subtract('1', 'day').format('DD-MM-YYYY');
};
const groupVehicleEntries = (entries: CurrentMonthVehicleDetails[], startDate: string, endDate: string): GroupedVehicleEntry[] => {
	endDate = matchDateFormat(endDate);
	entries.forEach((item, index) => {
		const { vehicleNum, dateof, NoGpsKM, kmshow } = item;
		if (!transformedData[vehicleNum as unknown as number]) {
			transformedData[vehicleNum as unknown as number] = {
				vehicleNum,
				datesWithKm: {},
				NoGpsKM: 0,
			};
		}

		transformedData[vehicleNum as unknown as number].NoGpsKM = NoGpsKM;

		transformedData[vehicleNum as unknown as number].datesWithKm[dateof] = kmshow;
	});
	return Object.values(transformedData);
};

export default groupVehicleEntries;
