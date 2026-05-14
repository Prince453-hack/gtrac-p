'use client';

import { Button, message, Modal } from 'antd';
import { CsvUploaderMultipleTrips } from '../../common';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { useState } from 'react';
import { useCreateTripFormMutation, usePlanTripFormMutation } from '@/app/_globalRedux/services/trackingDashboard';
import moment from 'moment';
import { getJourneyHours, getLatLong } from '@/app/helpers/api';
import { checkLatLngExists } from '@/app/helpers/checkIfLatLngExists';
import React from 'react';

export const MultipleTripUpload = () => {
	const { groupId, userId, extra } = useSelector((state: RootState) => state.auth);
	const { type: createTripOrPlanningTripType } = useSelector((state: RootState) => state.createTripOrPlanningTripActive);
	const [createTrip, { isLoading: isCreateTripLoading }] = useCreateTripFormMutation();
	const [planTrip, { isLoading: isPlanTripLoading }] = usePlanTripFormMutation();

	const [csvData, setCsvData] = useState<Record<string, string>[]>([]);

	const [messageApi, contextHolder] = message.useMessage();

	const getAddressLatLong = async (address: string) => {
		const isLatLongExists = checkLatLngExists(address);

		if (isLatLongExists) return address;

		let tempAdd = '';

		try {
			const data = await getLatLong({
				userId: userId,
				groupId: groupId,
				address,
			});
			tempAdd = `${address}${data}`;
		} catch (err) {}

		return tempAdd;
	};

	const success = ({ tripType }: { tripType: string }) => {
		messageApi.open({
			type: 'success',
			content: `Successfully ${tripType} trip`,
			duration: 10,
		});
	};

	const error = ({ tripType }: { tripType: string }) => {
		messageApi.open({
			type: 'error',
			content: `Failed to ${tripType} trip`,
			duration: 10,
		});
	};

	const handleSubmit = async (tripType: string) => {
		csvData.forEach(async (data) => {
			let viaCounter = 0;
			if (data['Via 4']) {
				viaCounter = 4;
			} else if (data['Via 3']) {
				viaCounter = 3;
			} else if (data['Via 2']) {
				viaCounter = 2;
			} else if (data['Via 1']) {
				viaCounter = 1;
			}

			const source = await getAddressLatLong(data['Source']);

			const destination = await getAddressLatLong(data['Destination']);
			const viaOne = data['Via 1'] ? await getAddressLatLong(data['Via 1']) : '';
			const viaTwo = data['Via 2'] ? await getAddressLatLong(data['Via 2']) : '';
			const viaThree = data['Via 3'] ? await getAddressLatLong(data['Via 3']) : '';
			const viaFour = data['Via 4'] ? await getAddressLatLong(data['Via 4']) : '';

			getJourneyHours({
				userId: Number(userId),
				source,
				destination,
				via: viaCounter > 0 ? true : false,
				viaOne,
				viaTwo,
				viaThree,
				viaFour,
				routeType: data['Route Type'],
				viaOneHaltHr: data['Via 1 Halt Hr'],
				viaTwoHaltHr: data['Via 2 Halt Hr'],
				viaThreeHaltHr: data['Via 3 Halt Hr'],
				viaFourHaltHr: data['Via 4 Halt Hr'],
				groupId,
				extra: extra,
			})
				.then(async (res) => {
					if (res) {
						let tempResultAsArray = res.split('##');
						let adjustedArray: string[] = tempResultAsArray.map((part: string) => {
							let adjustedString = part.match(/\d+(?:\.\d+)?/);
							return adjustedString ? `${adjustedString[0]}` : '0';
						});
						const selectedStartDate = data['Challan Date'] ? new Date(data['Challan Date']) : new Date();

						const tempEta = selectedStartDate.setTime(selectedStartDate.getTime() + parseFloat(adjustedArray[0]) * 60 * 60 * 1000);

						const formSubmitObj = {
							CustomerName: data['Customer Name'],
							Destination: '',
							DestinationOr: destination,
							DriverName: data['Driver Name'],
							ETA: moment(tempEta).format('YYYY-MM-DD HH:mm:ss'),
							RouteType: data['Route Type'],
							Source: '',
							SourceOr: source,
							Via1: '',
							Via2: '',
							Via3: '',
							Via4: '',
							Via1Or: viaOne,
							Via2Or: viaTwo,
							Via3Or: viaThree,
							Via4Or: viaFour,
							cargo_weight: data['Cargo Weight'],
							challan_date: data['Challan Date'],
							challan_no: data['Challan No'],
							destination_party_name: data['Destination Party Name'],
							journey_KM: adjustedArray[0],
							journey_hours: adjustedArray[1],
							lorry_no: data['Lorry No'],
							lorry_type: data['Lorry Type'],
							sys_service_id: data['Vehicle Service Id'],
							sys_user_id: userId,
							to_and_fro: data['Trip Type'].includes('Dynamic') ? '1' : '0',
							viaone_halthr_input: data['Via 1 Halt'],
							viaone_party_name: data['Via 1 Party Name'],
							viatwo_halthr_input: data['Via 2 Halt'],
							viatwo_party_name: data['Via 2 Party Name'],
							viathree_halthr_input: data['Via 3 Halt'],
							viathree_party_name: data['Via 3 Party Name'],
							viafour_halthr_input: data['Via 4 Halt'],
							viafour_party_name: data['Via 4 Party Name'],
							createdBy: '',
						};

						if (tripType === 'trip_create') {
							const data = await createTrip({ body: { ...formSubmitObj, extraInfo: '' }, token: groupId });

							if (data.error) {
								error({ tripType: 'Create' });
							} else {
								success({ tripType: 'Create' });
							}
							setCsvData([]);
						} else {
							const data = await planTrip({ body: { ...formSubmitObj }, token: groupId });

							if (data.error) {
								error({ tripType: 'Planned' });
							} else {
								success({ tripType: 'Planned' });
							}
							setCsvData([]);
						}
					}
				})
				.catch((err) => {
					let result = err as any;
				});
		});
	};

	return (
		<>
			{contextHolder}
			<CsvUploaderMultipleTrips setCsvData={setCsvData} />
			<Modal
				open={csvData.length > 0 && createTripOrPlanningTripType === ''}
				onCancel={() => setCsvData([])}
				title={`Are you sure you want to create ${csvData.length} trips?`}
				footer={false}
			>
				<div className='flex gap-2 justify-end mt-10'>
					<Button onClick={() => setCsvData([])}>Cancel</Button>
					<Button
						type='primary'
						onClick={() => {
							handleSubmit('trip_create');
						}}
						loading={isCreateTripLoading}
					>
						Create Trips
					</Button>
					<Button
						type='primary'
						onClick={() => {
							handleSubmit('trip_planning');
						}}
						loading={isPlanTripLoading}
					>
						Plan Trips
					</Button>
				</div>
			</Modal>
		</>
	);
};
