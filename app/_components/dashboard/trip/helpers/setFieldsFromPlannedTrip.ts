import { initialSelectedVehicleState, setSelectedVehicleBySelectElement } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { Dispatch as ReduxDispatch, UnknownAction } from '@reduxjs/toolkit';
import { FormInstance } from 'antd';
import { Dispatch, SetStateAction } from 'react';

export const setFieldsFromPlannedTrips = ({
	data,
	form,
	setIsSourceAuto,
	setIsDestinationAuto,
	setViaCounter,
	setIsCurrentViaAuto,
	setCurrentViaValue,
	setViaHaltHrs,
	setDestinationValue,
	setSourceValue,
	setSelectedTripType,
	dispatch,
}: {
	data: PlannedTrips;
	form: FormInstance<any>;
	setIsSourceAuto: Dispatch<SetStateAction<boolean>>;
	setIsDestinationAuto: Dispatch<SetStateAction<boolean>>;
	setViaCounter: Dispatch<SetStateAction<number>>;
	setIsCurrentViaAuto: Dispatch<SetStateAction<boolean[]>>;
	setCurrentViaValue: Dispatch<SetStateAction<string[]>>;
	setViaHaltHrs: Dispatch<SetStateAction<number[]>>;
	setDestinationValue: Dispatch<SetStateAction<string>>;
	setSourceValue: Dispatch<SetStateAction<string>>;
	setSelectedTripType: Dispatch<SetStateAction<'Dynamic' | 'Fixed'>>;
	dispatch: ReduxDispatch<UnknownAction>;
}) => {
	if (data.lorry_no) {
		dispatch(
			setSelectedVehicleBySelectElement({
				...initialSelectedVehicleState,
				vId: data.sys_service_id,
				vehReg: data.lorry_no,
				searchType: '',
				selectedVehicleHistoryTab: 'All',
				nearbyVehicles: [],
			})
		);
	}
	setIsSourceAuto(true);
	setIsDestinationAuto(true);
	form.setFieldsValue({
		customer_name: data.party_name,
		source: '',
		sourceOr: data.station_from_location,
		destination: '',
		destinationOr: data.station_to_location,
		weight: '', // todo add weight in get plan
		trip_type: '', // todo add trip type in get plan
		selectedRouteType: '', // todo add selected route type in get plan
		destination_party_name: data.party_name,
		via: {
			via1: {
				halt: data.vaiOneHalting,
				party_name: data.vaiOne,
			},
			via2: {
				halt: data.vaiTwoHalting,
				party_name: data.vaiTwo,
			},
			via3: {
				halt: data.vaiThreeHalting,
				party_name: data.vaiThree,
			},
			via4: {
				halt: data.vaifourHalting,
				party_name: data.vaiFour,
			},
		},

		['driver']: { name: data.driver_name, number: isNaN(Number(data.driver_number)) ? 0 : Number(data.driver_number) },
	});

	setDestinationValue(data.station_to_location);
	setSourceValue(data.station_from_location);

	// add trip type here after get plan
	// setSelectedTripType(data.tripType === 'Dynamic' || data.tripType === 'Fixed' ? data.tripType : 'Dynamic');

	if (data.vaiFour) {
		setViaCounter(4);
		setCurrentViaValue([data.vaiOne, data.vaiTwo, data.vaiThree, data.vaiFour]);
		setIsCurrentViaAuto([true, true, true, true]);
		setViaHaltHrs([
			isNaN(Number(data.vaiOneHalting)) ? 0 : Number(data.vaiOneHalting),
			isNaN(Number(data.vaiTwoHalting)) ? 0 : Number(data.vaiTwoHalting),
			isNaN(Number(data.vaiThreeHalting)) ? 0 : Number(data.vaiThreeHalting),
			isNaN(Number(data.vaifourHalting)) ? 0 : Number(data.vaifourHalting),
		]);
	} else if (data.vaiThree) {
		setViaCounter(3);
		setCurrentViaValue([data.vaiOne, data.vaiTwo, data.vaiThree, '']);
		setIsCurrentViaAuto([true, true, true, false]);

		setViaHaltHrs([
			isNaN(Number(data.vaiOneHalting)) ? 0 : Number(data.vaiOneHalting),
			isNaN(Number(data.vaiTwoHalting)) ? 0 : Number(data.vaiTwoHalting),
			isNaN(Number(data.vaiThreeHalting)) ? 0 : Number(data.vaiThreeHalting),
			0,
		]);
	} else if (data.vaiTwo) {
		setViaCounter(2);
		setCurrentViaValue([data.vaiOne, data.vaiTwo, '', '']);
		setIsCurrentViaAuto([true, true, false, false]);

		setViaHaltHrs([
			isNaN(Number(data.vaiOneHalting)) ? 0 : Number(data.vaiOneHalting),
			isNaN(Number(data.vaiTwoHalting)) ? 0 : Number(data.vaiTwoHalting),
			0,
			0,
		]);
	} else if (data.vaiOne) {
		setViaCounter(1);
		setCurrentViaValue([data.vaiOne, '', '', '']);
		setIsCurrentViaAuto([true, false, false, false]);
		setViaHaltHrs([isNaN(Number(data.vaiOneHalting)) ? 0 : Number(data.vaiOneHalting), 0, 0, 0]);
	}
};
