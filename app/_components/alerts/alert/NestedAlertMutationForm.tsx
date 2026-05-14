import {
	useLazyCreateServiceOrDocumentAlertQuery,
	useLazyEditServiceOrDocumentAlertQuery,
	useLazyGetServiceOrDocumentAlertQuery,
} from '@/app/_globalRedux/services/yatayaat';

import { Markers } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { GetServiceOrDocumentAlertResponse } from '@/app/_globalRedux/services/types/post/alert';
import { useLazyCreateAlertClientQuery, useLazyCreateAlertQuery, useLazyEditAlertQuery } from '@/app/_globalRedux/services/yatayaat';
import { RootState } from '@/app/_globalRedux/store';
import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Radio, Select } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import React from 'react';

type AlertType =
	| 'OverSpeed'
	| 'Main Power Disconnect'
	| 'AC'
	| 'GPS Disconnect'
	| 'Temperature'
	| 'Panic'
	| 'Idling'
	| 'Ignition'
	| 'Ignition Night'
	| 'Service'
	| 'Document';

type AlertTypeOptions = { value: AlertType; label: AlertType }[];

const alertTypeOptions: AlertTypeOptions = [
	{ value: 'OverSpeed', label: 'OverSpeed' },
	{ value: 'Main Power Disconnect', label: 'Main Power Disconnect' },
	{ value: 'Service', label: 'Service' },
	{ value: 'Document', label: 'Document' },
	{ value: 'AC', label: 'AC' },
	{ value: 'GPS Disconnect', label: 'GPS Disconnect' },
	{ value: 'Temperature', label: 'Temperature' },
	{ value: 'Panic', label: 'Panic' },
	{ value: 'Idling', label: 'Idling' },
	{ value: 'Ignition', label: 'Ignition' },
	{ value: 'Ignition Night', label: 'Ignition Night' },
];

export const NestedAlertMutationForm = ({
	handleModalCancel,
	modalViewToggle,
	selectedAlert,
	isServiceAlertExists,
	isDocumentAlertExists,
}: {
	handleModalCancel: () => void;
	modalViewToggle: 'list' | 'details' | 'edit';
	selectedAlert: GetServiceOrDocumentAlertResponse | undefined;
	isServiceAlertExists: boolean;
	isDocumentAlertExists: boolean;
}) => {
	const markers = useSelector((state: RootState) => state.markers);
	const { userId, groupId, userName } = useSelector((state: RootState) => state.auth);
	const [serviceRadio, setServiceRadio] = useState('alert_by_date');
	const [selectedAlertType, setSelectedAlertType] = useState<
		| 'OverSpeed'
		| 'Main Power Disconnect'
		| 'AC'
		| 'GPS Disconnect'
		| 'Temperature'
		| 'Panic'
		| 'Idling'
		| 'Ignition'
		| 'Ignition Night'
		| 'Service'
		| 'Document'
	>('OverSpeed');
	const [selectedVehicle, setSelectedVehicle] = useState('');
	const [loading, setLoading] = useState(false);

	const vehicleOptions: { label: string; value: number }[] = markers.map((marker: Markers) => ({ label: marker.vehReg, value: marker.vId }));
	vehicleOptions.unshift({ label: '', value: 0 });

	const [createAlertTrigger] = useLazyCreateAlertQuery();
	const [editAlertTrigger] = useLazyEditAlertQuery();
	const [createAlertClientTrigger] = useLazyCreateAlertClientQuery();

	const [createServiceOrDocumentAlertTrigger] = useLazyCreateServiceOrDocumentAlertQuery();
	const [editServiceOrDocumentAlertTrigger] = useLazyEditServiceOrDocumentAlertQuery();

	const [getServiceOrDocumentAlertTrigger] = useLazyGetServiceOrDocumentAlertQuery();

	const [form] = Form.useForm();

	const onFinish = async (e: any) => {
		setLoading(true);
		let SetDynamicValue = '';
		if (e.SetSpeedValue !== '') {
			SetDynamicValue = e.SetSpeedValue;
		}

		const baseData = {
			id: modalViewToggle === 'edit' && selectedAlert ? selectedAlert.id : '',
			user_Id: userId,
			group_Id: groupId,
			sys_username: userName,
			SetDynamicValue,
			setMultipleOption2: selectedAlertType === 'Service' || selectedAlertType === 'Document' ? 'All' : selectedVehicle ? selectedVehicle : 'All',
			search_name_input: '',
			Email: e.Email,
			MobileNo: e.MobileNo,
			SetTempFromValue: e.SetTempFromValue ? e.SetTempFromValue : '',
			SetTempToValue: e.SetTempToValue ? e.SetTempToValue : '',
			SetSpeedValue: e.SetSpeedValue ? e.SetSpeedValue : '',
			SetGeoFanceValue: '',
			SetIdlingValue: '',
			SetAlertValue: selectedAlertType,
			checkEmail: selectedAlertType === 'Document' || selectedAlertType === 'Service' ? '' : e.alert_destination_email ? 'Email' : '',
			SMS: selectedAlertType === 'Document' || selectedAlertType === 'Service' ? '' : e.alert_destination_sms ? 'SMS' : '',
			Notification: selectedAlertType === 'Document' || selectedAlertType === 'Service' ? '' : e.alert_destination_popup ? 'Notification' : '',
		};

		if (selectedAlertType !== 'Service' && selectedAlertType !== 'Document') {
			if (modalViewToggle === 'edit') {
				editAlertTrigger(baseData)
					.then((res) =>
						createAlertClientTrigger({
							...baseData,
							alert_user_id: res.data[0]['user_id'],
							alert_group_id: res.data[0]['group_id'],
							alert_sys_username: res.data[0]['alert_sys_username'],
						})
					)
					.then(() => {
						getServiceOrDocumentAlertTrigger({
							token: groupId,
							alert_type: selectedAlert?.alert_type === 'Document' ? 'Document' : 'Service',
						});
						setLoading(false);
						handleModalCancel();
					});
			} else {
				createAlertTrigger(baseData)
					.then((res) =>
						createAlertClientTrigger({
							...baseData,
							alert_user_id: res.data[0]['user_id'],
							alert_group_id: res.data[0]['group_id'],
							alert_sys_username: res.data[0]['alert_sys_username'],
						})
					)
					.then(() => {
						getServiceOrDocumentAlertTrigger({
							token: groupId,
							alert_type: selectedAlert?.alert_type === 'Document' ? 'Document' : 'Service',
						});
						setLoading(false);
						handleModalCancel();
					});
			}
		} else {
			if ((!isServiceAlertExists && selectedAlertType === 'Service') || (!isDocumentAlertExists && selectedAlertType === 'Document')) {
				await createAlertClientTrigger({ ...baseData, alert_user_id: userId, alert_group_id: groupId, alert_sys_username: userName });
			}

			const data = {
				token: groupId,
				aid: selectedAlert?.id ? selectedAlert.id : '',
				alert_type: selectedAlertType,
				vehicle: selectedVehicle,
				currentodometer: e.service_current_km ? e.service_current_km : '100',
				email: e.Email,
				contact: e.MobileNo,
				type: selectedAlertType === 'Document' ? 'DATE' : serviceRadio === 'alert_by_date' ? 'DATE' : serviceRadio === 'alert_by_km' ? 'KM' : 'BOTH',
				service_date: e.document_date ? moment(new Date(e.document_date)).format('YYYY-MM-DD') : '',
				gap_service_date: e.document_gap_date ? moment(new Date(e.document_gap_date)).format('YYYY-MM-DD') : '',
				lastservice: e.service_last_km ? moment(new Date(e.service_last_km)).format('YYYY-MM-DD') : '',
				nextservice: e.service_expiration_km ? moment(new Date(e.service_expiration_km)).format('YYYY-MM-DD') : '',
				gapservice: e.service_gap_km ? moment(new Date(e.service_gap_km)).format('YYYY-MM-DD') : '',
			};
			if (modalViewToggle === 'edit') {
				editServiceOrDocumentAlertTrigger(data).then(() => {
					getServiceOrDocumentAlertTrigger({
						token: groupId,
						alert_type: selectedAlert?.alert_type === 'Document' ? 'Document' : 'Service',
					});
					setLoading(false);
					handleModalCancel();
				});
			} else {
				createServiceOrDocumentAlertTrigger(data).then(() => {
					getServiceOrDocumentAlertTrigger({
						token: groupId,
						alert_type: selectedAlert?.alert_type === 'Document' ? 'Document' : 'Service',
					});
					setLoading(false);
					handleModalCancel();
				});
			}
		}
	};

	useEffect(() => {
		form.resetFields();
		setSelectedVehicle('');
		setSelectedAlertType('OverSpeed');

		if (modalViewToggle === 'edit') {
			setSelectedAlertType(selectedAlert?.alert_type === 'Document' ? 'Document' : selectedAlert?.alert_type === 'Service' ? 'Service' : 'OverSpeed');

			form.setFieldsValue({
				SetAlertValue: selectedAlert?.alert_type,
				selectVehicle: selectedAlert?.veh_reg,
				SetSpeedValue: '',
				SetTempFromValue: '',
				SetTempToValue: '',
				Email: selectedAlert?.email,
				MobileNo: selectedAlert?.mobile,
				document_date: selectedAlert?.service_document_date ? dayjs(new Date(selectedAlert?.service_document_date)) : '',
				document_gap_date: selectedAlert?.gap_service_document_date ? dayjs(new Date(selectedAlert?.gap_service_document_date)) : '',
				service_expiration_km: selectedAlert?.next_service_km ? dayjs(new Date(selectedAlert?.next_service_km)) : '',
				service_gap_km: selectedAlert?.service_gap_km ? dayjs(new Date(selectedAlert?.service_gap_km)) : '',
				service_last_km: selectedAlert?.service_km ? dayjs(new Date(selectedAlert?.service_km)) : '',
			});
			if (selectedAlert?.veh_reg !== 'All') {
				let allSelectedVehicles = '';

				setSelectedVehicle(vehicleOptions.find((vehicleOption) => vehicleOption.label === selectedAlert?.veh_reg)?.label || '');
			} else if (selectedAlertType !== 'Service' && selectedAlertType !== 'Document') {
				setSelectedVehicle('All');
			} else {
				setSelectedVehicle('');
			}
		} else {
			setSelectedAlertType('OverSpeed');

			form.setFieldsValue({
				SetAlertValue: 'OverSpeed',
				selectVehicle: selectedAlertType === 'Service' || selectedAlertType === 'Document' ? '' : 'All',
				SetSpeedValue: '',
				SetTempFromValue: '',
				SetTempToValue: '',
				Email: '',
				MobileNo: '',
				document_date: '',
				document_gap_date: '',
				service_expiration_km: '',
				service_gap_km: '',
				service_last_km: '',
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modalViewToggle, selectedAlert]);

	return (
		<Form onFinish={(e) => onFinish(e)} layout='vertical' form={form}>
			<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Alert Type: </p>
			<Form.Item name='SetAlertValue' noStyle>
				<Select
					className='w-full text-left'
					options={alertTypeOptions}
					value={selectedAlertType}
					onChange={(e: AlertType) => {
						if (e === 'Service' || e === 'Document') {
							setSelectedVehicle('');
							form.setFieldValue('selectVehicle', '');
						} else {
							setSelectedVehicle('All');
							form.setFieldValue('selectVehicle', 'All');
						}

						setSelectedAlertType(e);
					}}
				></Select>
			</Form.Item>

			<NestedAlertOption selectedAlert={selectedAlertType} serviceRadio={serviceRadio} setServiceRadio={setServiceRadio} />

			<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Vehicles: </p>
			<Form.Item label={'Select Vehicle'} name='selectVehicle' noStyle>
				<Select
					options={vehicleOptions}
					filterOption={(inputValue, option) => (option && option.label.includes(inputValue)) || false}
					mode={selectedAlertType !== 'Service' && selectedAlertType !== 'Document' ? 'multiple' : undefined}
					className='w-full'
					onDeselect={(e: any) => {
						if (e === 'All') {
							setSelectedVehicle('');
						} else if (selectedAlertType !== 'Service' && selectedAlertType !== 'Document') {
							let tempCurrentSelected = selectedVehicle?.replace(`${vehicleOptions.find((vehicle) => vehicle.label === e)?.value}##${e},`, '');
							setSelectedVehicle(tempCurrentSelected);
						} else {
							let tempCurrentSelected = '';
							setSelectedVehicle(tempCurrentSelected);
						}
					}}
					onSelect={(e: any) => {
						if (e === 0 && selectedAlertType !== 'Service' && selectedAlertType !== 'Document') {
							setSelectedVehicle('All');
						} else if (e === 0 && (selectedAlertType === 'Service' || selectedAlertType === 'Document')) {
							setSelectedVehicle('');
						} else if (selectedAlertType !== 'Service' && selectedAlertType !== 'Document') {
							let tempCurrentSelected = `${selectedVehicle}${e}##${vehicleOptions.find((vehicle) => vehicle.value === e)?.label}, `;
							setSelectedVehicle(tempCurrentSelected);
						} else {
							let tempCurrentSelected = `${e}##${vehicleOptions.find((vehicle) => vehicle.value === e)?.label}`;
							setSelectedVehicle(tempCurrentSelected);
						}
					}}
				/>
			</Form.Item>

			<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Email: </p>
			<Form.Item name='Email' noStyle>
				<Input className='w-full' />
			</Form.Item>

			<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Phone Number: </p>
			<Form.Item name='MobileNo' noStyle>
				<Input style={{ width: '100%' }} />
			</Form.Item>

			<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Select Alert Destination: </p>
			<div className='flex gap-2'>
				<Form.Item name='alert_destination_email' valuePropName='checked'>
					<Checkbox>Email</Checkbox>
				</Form.Item>
				<Form.Item name='alert_destination_popup' valuePropName='checked'>
					<Checkbox>Popup</Checkbox>
				</Form.Item>
				<Form.Item name='alert_destination_sms' valuePropName='checked'>
					<Checkbox>SMS</Checkbox>
				</Form.Item>
			</div>

			<div className='flex gap-2  justify-end mt-6'>
				<Button onClick={handleModalCancel} className='w-full'>
					Cancel
				</Button>
				<Button htmlType='submit' type='primary' loading={loading} disabled={modalViewToggle === 'details'} className='w-full'>
					Submit
				</Button>
			</div>
		</Form>
	);
};

const NestedAlertOption = ({
	selectedAlert,
	serviceRadio,
	setServiceRadio,
}: {
	selectedAlert:
		| 'OverSpeed'
		| 'Main Power Disconnect'
		| 'AC'
		| 'GPS Disconnect'
		| 'Temperature'
		| 'Panic'
		| 'Idling'
		| 'Ignition'
		| 'Ignition Night'
		| 'Service'
		| 'Document';
	serviceRadio: string;
	setServiceRadio: Dispatch<SetStateAction<string>>;
}) => {
	switch (selectedAlert) {
		case 'OverSpeed':
			return (
				<>
					<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>OverSpeed: </p>
					<Form.Item name='SetSpeedValue' noStyle className='w-full'>
						<InputNumber style={{ width: '100%' }} min={30} placeholder='Enter OverSpeed Limit' />
					</Form.Item>
				</>
			);
		case 'Main Power Disconnect':
			return <></>;

		case 'AC':
			return <></>;
		case 'GPS Disconnect':
			return <></>;
		case 'Temperature':
			return (
				<>
					<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Temperature Range: </p>
					<div className='flex gap-2 ml-2 '>
						<div className='flex items-center gap-2 w-full'>
							<p className='text-xs font-semibold  text-neutral-600'>From:</p>
							<Form.Item name='SetTempFromValue' noStyle>
								<InputNumber style={{ width: '100%' }} />
							</Form.Item>
						</div>
						<div className='flex items-center gap-2 w-full'>
							<p className='text-xs font-semibold text-neutral-600'>To:</p>
							<Form.Item name='SetTempToValue' noStyle>
								<InputNumber style={{ width: '100%' }} />
							</Form.Item>
						</div>
					</div>
				</>
			);
		case 'Panic':
			return <></>;
		case 'Idling':
			return <></>;
		case 'Ignition':
			return <></>;
		case 'Ignition Night':
			return <></>;

		case 'Document':
			return (
				<>
					<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Expiration Date: </p>
					<Form.Item name='document_date' noStyle className='w-full'>
						<DatePicker format='Do MMM YYYY' className='w-full' />
					</Form.Item>
					<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Alert Gap Date: </p>
					<Form.Item name='document_gap_date' noStyle className='w-full'>
						<DatePicker format='Do MMM YYYY' className='w-full' />
					</Form.Item>
				</>
			);

		case 'Service':
			return (
				<>
					<div className='my-5'>
						<Radio.Group value={serviceRadio} onChange={(e) => setServiceRadio(e.target.value)}>
							<Radio value='alert_by_date'>Alert By Date</Radio>
							<Radio value='alert_by_km'>Alert By Distance</Radio>
							<Radio value='both'>Both </Radio>
						</Radio.Group>
					</div>

					{serviceRadio === 'alert_by_date' || serviceRadio === 'both' ? (
						<>
							<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Expiration Date: </p>
							<Form.Item name='document_date' noStyle className='w-full'>
								<DatePicker format='Do MMM YYYY' className='w-full' />
							</Form.Item>
							<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Alert Gap Date: </p>
							<Form.Item name='document_gap_date' noStyle className='w-full'>
								<DatePicker format='Do MMM YYYY' className='w-full' />
							</Form.Item>
						</>
					) : null}

					{serviceRadio === 'alert_by_km' || serviceRadio === 'both' ? (
						<>
							<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Total Km: </p>
							<Form.Item name='service_current_km' noStyle className='w-full'>
								<Input className='w-full' type='number' />
							</Form.Item>
							<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Last Service Km: </p>
							<Form.Item name='service_last_km' noStyle className='w-full'>
								<Input className='w-full' type='number' />
							</Form.Item>

							<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Next Service KM: </p>
							<Form.Item name='service_expiration_km' noStyle className='w-full'>
								<Input className='w-full' type='number' />
							</Form.Item>
							<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Alert Gap KM: </p>
							<Form.Item name='service_gap_km' noStyle className='w-full'>
								<Input className='w-full' type='number' />
							</Form.Item>
						</>
					) : null}
				</>
			);
		default:
			<></>;
	}
};
