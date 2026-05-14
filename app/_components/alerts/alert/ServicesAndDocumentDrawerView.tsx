'use client';

import { AlertManagement } from '@/app/_globalRedux/services/types/alerts';
import { Card, Drawer, Dropdown, MenuProps, Tag } from 'antd';
import { Dispatch, SetStateAction, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { LeftOutlined, MoreOutlined } from '@ant-design/icons';
import { AlertsManagement } from '../AlertsManagement';
import { useGetServiceOrDocumentAlertQuery } from '@/app/_globalRedux/services/yatayaat';
import { GetServiceOrDocumentAlertResponse } from '@/app/_globalRedux/services/types/post/alert';
import { NestedAlertMutationForm } from './NestedAlertMutationForm';
import { NestedGetInfo } from './NestedGetInfo';
import React from 'react';

export const ServicesAndDocumentDrawerView = ({
	selectedAlert,
	open,
	setOpen,
	isServiceAlertExists,
	isDocumentAlertExists,
}: {
	selectedAlert: AlertManagement | undefined;
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	setModalViewToggle: Dispatch<SetStateAction<'DETAILS' | 'EDIT' | 'CREATE'>>;
	isServiceAlertExists: boolean;
	isDocumentAlertExists: boolean;
}) => {
	const { groupId } = useSelector((state: RootState) => state.auth);
	const handleCancel = () => {
		setOpen(false);

		setTimeout(() => {
			setView('list');
		}, 1000);
	};

	const { data } = useGetServiceOrDocumentAlertQuery(
		{ token: groupId, alert_type: selectedAlert?.SetAlertType as 'Service' | 'Document' },
		{ skip: selectedAlert?.SetAlertType !== 'Service' && selectedAlert?.SetAlertType !== 'Document' }
	);
	const [view, setView] = useState<'list' | 'details' | 'edit'>('list');
	const [selectedNestedAlert, setSelectedNestedAlert] = useState<GetServiceOrDocumentAlertResponse | undefined>(undefined);

	return (
		<>
			<Drawer
				title={
					view === 'list' ? (selectedAlert?.SetAlertType === 'Service' ? 'Services' : 'Documents') : view === 'edit' ? '✍️ Edit Alert' : '🔍 Details'
				}
				open={open}
				onClose={handleCancel}
				placement='left'
				footer={false}
				width={450}
				styles={{
					body: {
						padding: 10,
						paddingInline: 20,
					},
				}}
			>
				{view === 'details' || view === 'edit' ? (
					<div>
						<div
							className='flex items-center justify-end w-full font-semibold text-sm gap-1 text-primary-green hover:underline transition-all duration-300'
							onClick={() => setView('list')}
						>
							<LeftOutlined />
							<p>Back</p>
						</div>
						{view === 'edit' ? (
							<NestedAlertMutationForm
								handleModalCancel={handleCancel}
								modalViewToggle={view}
								selectedAlert={selectedNestedAlert}
								isServiceAlertExists={isServiceAlertExists}
								isDocumentAlertExists={isDocumentAlertExists}
							/>
						) : selectedNestedAlert ? (
							<div>
								{(Object.keys(selectedNestedAlert) as Array<keyof typeof AlertsManagement>).map((info) => (
									<span key={info}>
										<NestedGetInfo title={info} type={info} data={selectedNestedAlert} />
									</span>
								))}
							</div>
						) : null}
					</div>
				) : (
					<div className='overflow-scroll space-y-4'>
						{data && data.length > 0
							? data.map((item) => (
									<Card key={item.id}>
										<div className='flex items-center justify-between'>
											<p className='font-semibold text-primary-green text-lg mb-2'>{item.veh_reg}</p>
											<div className='flex items-center gap-0'>
												<Tag color='green' title='Odometer'>
													{item.odometer} km
												</Tag>
												<Dropdown
													menu={{ items: getItems(setView, item, setSelectedNestedAlert) }}
													overlayStyle={{ width: '180px' }}
													trigger={['click']}
													placement='topRight'
												>
													<div className='flex justify-center items-center cursor-pointer hover:bg-neutral-100 duration-300 transition-colors px-1 py-1 rounded-full'>
														<MoreOutlined className='text-xl' />
													</div>
												</Dropdown>
											</div>
										</div>
										{item.alert_type === 'Document' ? (
											<div className='text-neutral-600'>
												<p className='font-medium'>
													<span className='font-bold '>Document Date: </span>
													{item.service_document_date}
												</p>
												<p className='font-medium'>
													<span className='font-bold'>Alert Gap Date: </span>
													{item.gap_service_document_date}
												</p>
											</div>
										) : (
											<div className='text-neutral-600'>
												{item.service_km ? (
													<>
														<p className='font-medium'>
															<span className='font-bold'>Service Km: </span>
															{item.service_km} Km
														</p>
														<p className='font-medium'>
															<span className='font-bold'>Service Gap Km: </span>
															{item.service_gap_km} Km
														</p>
														<p className='font-medium'>
															<span className='font-bold'>Next Service Km: </span>
															{item.next_service_km} Km
														</p>
													</>
												) : null}
												{item.service_document_date ? (
													<div className='text-neutral-600'>
														<p className='font-medium'>
															<span className='font-bold '>Service Date: </span>
															{item.service_document_date}
														</p>
														<p className='font-medium'>
															<span className='font-bold'>Alert Gap Date: </span>
															{item.gap_service_document_date}
														</p>
													</div>
												) : null}
											</div>
										)}
									</Card>
							  ))
							: null}
					</div>
				)}
			</Drawer>
		</>
	);
};

const getItems = (
	setView: Dispatch<SetStateAction<'list' | 'details' | 'edit'>>,
	data: GetServiceOrDocumentAlertResponse,
	setSelectedNestedAlert: Dispatch<SetStateAction<GetServiceOrDocumentAlertResponse | undefined>>
): MenuProps['items'] | undefined => {
	return [
		{
			key: '1',
			label: (
				<div
					onClick={() => {
						setView('details');
						setSelectedNestedAlert(data);
					}}
				>
					View Details
				</div>
			),
		},
		{
			key: '2',
			label: (
				<div
					onClick={() => {
						setView('edit');
						setSelectedNestedAlert(data);
					}}
				>
					Edit Alert
				</div>
			),
		},
	];
};
