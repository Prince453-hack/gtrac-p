'use client';

import { AlertManagement } from '@/app/_globalRedux/services/types/alerts';
import { useGetAlertsManagementQuery, useLazyActivateDeactivateAlertsQuery } from '@/app/_globalRedux/services/yatayaat';
import { RootState } from '@/app/_globalRedux/store';
import { ConfigProvider, Dropdown, MenuProps, Row, TableColumnsType } from 'antd';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CustomTable } from '../common';
import { MoreOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useGetVehiclesByStatusQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { setAllMarkers } from '@/app/_globalRedux/dashboard/markersSlice';
import { ModalView } from './alert/ModalVIew';
import { DrawerView } from './alert/DrawerView';
import { ServicesAndDocumentDrawerView } from './alert/ServicesAndDocumentDrawerView';
import React from 'react';

export const AlertsManagement = ({
	modalViewToggle,
	setModalViewToggle,
	isModalActive,
	setIsModalActive,
	isDrawerActive,
	setIsDrawerActive,
	isServicesAndDocumentsDrawerActive,
	setIsServicesAndDocumentsDrawerActive,
}: {
	modalViewToggle: 'DETAILS' | 'EDIT' | 'CREATE';
	setModalViewToggle: Dispatch<SetStateAction<'DETAILS' | 'EDIT' | 'CREATE'>>;
	isModalActive: boolean;
	setIsModalActive: Dispatch<SetStateAction<boolean>>;
	isDrawerActive: boolean;
	setIsDrawerActive: Dispatch<SetStateAction<boolean>>;
	isServicesAndDocumentsDrawerActive: boolean;
	setIsServicesAndDocumentsDrawerActive: Dispatch<SetStateAction<boolean>>;
}) => {
	const dispatch = useDispatch();

	const { userId, groupId: token, parentUser: pUserId } = useSelector((state: RootState) => state.auth);
	const [actionActiveIndex, setActionActiveIndex] = useState(-1);
	const [modalActiveIndex, setModalActiveIndex] = useState(-1);
	const [isActivateDiactivateAlertsModalActiveIndex, setIsActivateDiactivateAlertsModalActiveIndex] = useState(-1);
	const markers = useSelector((state: RootState) => state.markers);

	const [activateDeactivateAlertsTrigger] = useLazyActivateDeactivateAlertsQuery();

	const { data, refetch: refetchAlerts } = useGetAlertsManagementQuery(
		{
			userId: userId,
			token: token,
		},

		{ skip: !token || !userId }
	);

	const { data: markersData } = useGetVehiclesByStatusQuery(
		{
			userId: userId,
			token,
			pUserId,
			mode: '',
		},
		{
			skip: !token || !userId || markers.length > 0,
		}
	);

	useEffect(() => {
		if (markersData && markersData.list.length > 1 && markers.length === 0) {
			dispatch(setAllMarkers(markersData.list.map((vehicle) => ({ ...vehicle, visibility: true, isMarkerInfoWindowOpen: false }))));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [markersData]);

	const getItems = (record: AlertManagement): MenuProps['items'] | undefined => {
		return [
			{
				key: '1',
				label: (
					<div
						onClick={() => {
							setActionActiveIndex(-1);
							setModalViewToggle('DETAILS');
							// setIsModalActive(true);
							record.SetAlertType === 'Service' || record.SetAlertType === 'Document'
								? setIsServicesAndDocumentsDrawerActive(true)
								: setIsDrawerActive(true);

							setModalActiveIndex(Number(record.id));
						}}
					>
						View Details
					</div>
				),
			},
			record.SetAlertType === 'Service' || record.SetAlertType === 'Document'
				? null
				: {
						key: '2',
						label: (
							<div
								onClick={() => {
									setActionActiveIndex(-1);
									setModalViewToggle('EDIT');
									setIsModalActive(true);
									setModalActiveIndex(Number(record.id));
								}}
							>
								Edit Alert
							</div>
						),
				  },
		];
	};

	const columns: TableColumnsType<AlertManagement> = [
		{
			title: 'Alert Vehicle',
			dataIndex: 'VehicleNo',
			key: 'VehicleNo',
			render: (value) => <span className='font-bold'>{value?.replaceAll(',', ', ')}</span>,
		},
		{
			title: 'Alert Type',
			dataIndex: 'SetAlertType',
			key: 'SetAlertType',
		},

		{
			title: 'Created Date',
			dataIndex: 'created_at',
			key: 'created_at',
			width: '200px',
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			render: (value) => <>{value === '1' ? 'Active' : 'Not Active'}</>,
			width: '120px',
		},
		{
			title: 'Status Toggle',
			dataIndex: 'status',
			key: 'status_toggle',
			render: (value, record) => (
				<>
					{value === '1' ? (
						<ConfigProvider
							theme={{
								components: {
									Button: {
										colorPrimary: '#C02E3B',
										colorPrimaryHover: '#D16771',
									},
								},
							}}
						>
							<Button size='small' type='primary' onClick={() => setIsActivateDiactivateAlertsModalActiveIndex(Number(record.id))}>
								Deactivate
							</Button>
						</ConfigProvider>
					) : (
						<Button size='small' type='primary' onClick={() => setIsActivateDiactivateAlertsModalActiveIndex(Number(record.id))}>
							Activate
						</Button>
					)}

					<Modal
						open={isActivateDiactivateAlertsModalActiveIndex === Number(record.id)}
						onCancel={() => setIsActivateDiactivateAlertsModalActiveIndex(-1)}
						footer={null}
					>
						<p className='font-semibold text-gray-800 text-[15px]'>
							Are you sure you want to {value === '1' ? 'deactivate' : 'activate'} this alert?
						</p>
						<div className='flex gap-3 justify-end mt-8'>
							<Button
								size='middle'
								type='default'
								onClick={() => {
									setIsActivateDiactivateAlertsModalActiveIndex(-1);
								}}
							>
								Cancel
							</Button>
							<Button
								size='middle'
								type='primary'
								onClick={() => {
									activateDeactivateAlertsTrigger({
										token: token,
										user_id: userId,
										alert_type: record.SetAlertType,
										alert_status: value === '1' ? '2' : '1',
										alert_id: record.id,
									})
										.then(() => refetchAlerts())
										.then(() => setIsActivateDiactivateAlertsModalActiveIndex(-1));
								}}
							>
								Sure
							</Button>
						</div>
					</Modal>
				</>
			),
			width: '120px',
		},
		{
			title: 'Actions',
			key: 'actions',
			width: '120px',
			render: (value, record, index) => {
				return (
					<>
						<div
							className='w-fit ml-3 select-none'
							onClick={() => setActionActiveIndex((prev) => (prev !== Number(record.id) ? Number(record.id) : -1))}
						>
							<div className='relative'>
								<Dropdown
									open={actionActiveIndex === Number(record.id)}
									menu={{ items: getItems(record) }}
									overlayStyle={{ width: '200px' }}
									onOpenChange={() => setActionActiveIndex(-1)}
								>
									<div className='flex justify-center items-center cursor-pointer'>
										<MoreOutlined className='text-xl mr-6' />
									</div>
								</Dropdown>
							</div>
						</div>
					</>
				);
			},
		},
	];

	return (
		<div className='select-none'>
			<CustomTable
				columns={columns}
				scroll_y='calc(100vh - 340px)'
				data={data && (data.data.length > 0 ? data.data : null)}
				type='Alerts'
				Footer={
					<Row justify='space-between'>
						{data && data.data.length > 0 ? (
							<>
								<div className='flex gap-4'></div>
								<span className='font-bold text-gray-700'>Total Alert Types: {data.data.length || 0}</span>
							</>
						) : null}
					</Row>
				}
			/>
			<ModalView
				open={isModalActive}
				setOpen={setIsModalActive}
				modalViewToggle={modalViewToggle}
				setModalViewToggle={setModalViewToggle}
				selectedAlert={data && data.data.find((alert) => Number(alert.id) === modalActiveIndex)}
				isServiceAlertExists={data && data.data.find((alert) => alert.SetAlertType === 'Service') ? true : false}
				isDocumentAlertExists={data && data.data.find((alert) => alert.SetAlertType === 'Document') ? true : false}
			/>

			<DrawerView
				open={isDrawerActive}
				setOpen={setIsDrawerActive}
				selectedAlert={data && data.data.find((alert) => Number(alert.id) === modalActiveIndex)}
			/>

			<ServicesAndDocumentDrawerView
				open={isServicesAndDocumentsDrawerActive}
				setOpen={setIsServicesAndDocumentsDrawerActive}
				selectedAlert={data && data.data.find((alert) => Number(alert.id) === modalActiveIndex)}
				setModalViewToggle={setModalViewToggle}
				isServiceAlertExists={data && data.data.find((alert) => alert.SetAlertType === 'Service') ? true : false}
				isDocumentAlertExists={data && data.data.find((alert) => alert.SetAlertType === 'Document') ? true : false}
			/>
		</div>
	);
};
