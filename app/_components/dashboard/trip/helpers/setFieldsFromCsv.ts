import { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { Dispatch, SetStateAction } from 'react';

export const setFieldsFromCsv = ({
	data,
	form,
	setIsSourceAuto,
	setIsDestinationAuto,
	setViaCounter,
	setIsCurrentViaAuto,
	setCurrentViaValue,
	setViaHaltHrs,
	setDestinationValue,
	setSelectedTripType,
	setSourceValue,
	setSelectedRouteType,
	setDate,
}: {
	data: Record<string, string>;
	form: FormInstance<any>;
	setIsSourceAuto: Dispatch<SetStateAction<boolean>>;
	setIsDestinationAuto: Dispatch<SetStateAction<boolean>>;
	setViaCounter: Dispatch<SetStateAction<number>>;
	setIsCurrentViaAuto: Dispatch<SetStateAction<boolean[]>>;
	setSelectedTripType?: Dispatch<SetStateAction<'Dynamic' | 'Fixed'>>;
	setCurrentViaValue: Dispatch<SetStateAction<string[]>>;
	setViaHaltHrs: Dispatch<SetStateAction<number[]>>;
	setDestinationValue: Dispatch<SetStateAction<string>>;
	setSourceValue: Dispatch<SetStateAction<string>>;
	setSelectedRouteType?: Dispatch<SetStateAction<'None' | 'Express' | 'Normal' | 'Fix Hours'>>;
	setDate: Dispatch<SetStateAction<dayjs.Dayjs | undefined>>;
}) => {
	setIsSourceAuto(true);
	setIsDestinationAuto(true);
	form.setFieldsValue({
		customer_name: data['Customer Name'],
		source: '',
		sourceOr: data['Source'],
		destination: '',
		destinationOr: data['Destination'],
		weight: data['Cargo Weight'],
		trip_type: data['Lorry Type'],
		selectedRouteType: data['Trip Type'],
		destination_party_name: data['Destination Party Name'],
		via: {
			via1: {
				halt: data['Via 1 Halt'],
				party_name: data['Via 1 Party Name'],
			},
			via2: {
				halt: data['Via 2 Halt'],
				party_name: data['Via 2 Party Name'],
			},
			via3: {
				halt: data['Via 3 Halt'],
				party_name: data['Via 3 Party Name'],
			},
			via4: {
				halt: data['Via 4 Halt'],
				party_name: data['Via 4 Party Name'],
			},
		},

		['driver']: { name: data['Driver Name'], number: isNaN(Number(data['Driver Number'])) ? 0 : Number(data['Driver Number']) },
	});

	if (setSelectedTripType) {
		setSelectedTripType(data['Trip Type'] === 'Dynamic' || data['Trip Type'] === 'Fixed' ? data['Trip Type'] : 'Dynamic');
	}

	setDestinationValue(data['Destination']);
	setSourceValue(data['Source']);
	if (setSelectedRouteType) {
		setSelectedRouteType(
			data['Route Type'] === 'Express'
				? 'Express'
				: data['Route Type'] === 'Normal'
				? 'Normal'
				: data['Route Type'] === 'Fix Hours'
				? 'Fix Hours'
				: 'None'
		);
	}

	setDate(dayjs(data['Challan Date'], 'DD-MM-YYYY'));

	if (data.Via4) {
		setViaCounter(4);
		setCurrentViaValue([data.Via1, data.Via2, data.Via3, data.Via4]);
		setIsCurrentViaAuto([true, true, true, true]);
		setViaHaltHrs([
			isNaN(Number(data.viaone_halthr_input)) ? 0 : Number(data.viaone_halthr_input),
			isNaN(Number(data.viatwo_halthr_input)) ? 0 : Number(data.viatwo_halthr_input),
			isNaN(Number(data.viathree_halthr_input)) ? 0 : Number(data.viathree_halthr_input),
			isNaN(Number(data.viafour_halthr_input)) ? 0 : Number(data.viafour_halthr_input),
		]);
	} else if (data.Via3) {
		setViaCounter(3);
		setCurrentViaValue([data.Via1, data.Via2, data.Via3, '']);
		setIsCurrentViaAuto([true, true, true, false]);
		setViaHaltHrs([
			isNaN(Number(data.viaone_halthr_input)) ? 0 : Number(data.viaone_halthr_input),
			isNaN(Number(data.viatwo_halthr_input)) ? 0 : Number(data.viatwo_halthr_input),
			isNaN(Number(data.viathree_halthr_input)) ? 0 : Number(data.viathree_halthr_input),
			0,
		]);
	} else if (data.Via2) {
		setViaCounter(2);
		setCurrentViaValue([data.Via1, data.Via2, '', '']);
		setIsCurrentViaAuto([true, true, false, false]);
		setViaHaltHrs([
			isNaN(Number(data.viaone_halthr_input)) ? 0 : Number(data.viaone_halthr_input),
			isNaN(Number(data.viatwo_halthr_input)) ? 0 : Number(data.viatwo_halthr_input),
			0,
			0,
		]);
	} else if (data.Via1) {
		setViaCounter(1);
		setCurrentViaValue([data.Via1, '', '', '']);
		setIsCurrentViaAuto([true, false, false, false]);
		setViaHaltHrs([isNaN(Number(data.viaone_halthr_input)) ? 0 : Number(data.viaone_halthr_input), 0, 0, 0]);
	}
};
