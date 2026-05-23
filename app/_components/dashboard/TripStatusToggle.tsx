'use client';

import { Tabs } from 'antd';
import { TabsProps } from 'antd';
import { useEffect, useState } from 'react';
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { RootState } from '@/app/_globalRedux/store';
import { useDispatch, useSelector } from 'react-redux';
import { setCollapseTripStatusToggle } from '@/app/_globalRedux/dashboard/collapseTripStatusToggleSlice';
import { setContainerStyle } from '@/app/_globalRedux/dashboard/mapSlice';
import { initialSelectedVehicleState, setSelectedVehicleStatus } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { stopHistoryReplayInterval } from '@/app/_globalRedux/dashboard/historyReplaySlice';
import { setSelectedVehicleListTab } from '@/app/_globalRedux/dashboard/selectedVehicleListTab';
import { trackingDashboard } from '@/app/_globalRedux/services/trackingDashboard';
import { setDashboardSelectedVehicleStatus } from '@/app/_globalRedux/dashboard/dashboardVehicleDetailsSelect';
import { setClusterActive } from '@/app/_globalRedux/common/clusterSlice';
import { TripList } from './trip/TripList';
import React from 'react';

export const TripStatusToggle = () => {
	const [tabsLabelStyling, setTabsLabelStyling] = useState({ key: 'On Trip', style: 'bg-light-glow-green  border-dark-glow-green' });
	const collapseTripStatusToggle = useSelector((state: RootState) => state.collapseTripStatusToggle);
	const { containerStyle } = useSelector((state: RootState) => state.map);
	const markers = useSelector((state: RootState) => state.markers);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const isTripStatusToggleFetching = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((query) => query && query.endpointName === 'getTripVehicles' && query.status === 'pending')
	);
	const dispatch = useDispatch();

	const onChange = (key: string) => {
		if (markers.length > 0) {
			dispatch(trackingDashboard.util.invalidateTags(['Vehicles-List-By-Status']));
			if (key !== 'collapse') {
				setTabsLabelStyling((prev) => ({ ...prev, key }));
				dispatch(setSelectedVehicleListTab(key));
			}
		}
	};

	useEffect(() => {
		if (collapseTripStatusToggle && selectedVehicle.vId === 0) {
			dispatch(setContainerStyle({ ...containerStyle, width: '100%' }));
			dispatch(stopHistoryReplayInterval());
		} else if (selectedVehicle.vId === 0 && !collapseTripStatusToggle) {
			dispatch(setContainerStyle({ ...containerStyle, width: 'calc(100% - 450px)' }));
		} else if (selectedVehicle.vId !== 0 && collapseTripStatusToggle) {
			dispatch(setContainerStyle({ ...containerStyle, width: 'calc(100% - 450px)' }));
		} else if (!collapseTripStatusToggle && selectedVehicle.vId !== 0) {
			dispatch(setContainerStyle({ ...containerStyle, width: 'calc(100% - 900px)' }));
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [collapseTripStatusToggle, selectedVehicle, isTripStatusToggleFetching]);

	const items: TabsProps['items'] = [
		{
			key: 'On Trip',
			label: (
				<span
					className={`${tabsLabelStyling.key === 'On Trip' ? tabsLabelStyling.style : 'border-gray-300 text-gray-600'} ${
						markers.length === 0 ? 'cursor-not-allowed' : ''
					} px-4 py-3 rounded-full border mx-1 text-xs font-bold`}
					onClick={() => {
						if (markers.length > 0) {
							dispatch(setSelectedVehicleStatus(initialSelectedVehicleState));
							dispatch(setDashboardSelectedVehicleStatus([]));
						}
					}}
				>
					Trip
				</span>
			),
			children: <TripList selectedVehicleStatus={tabsLabelStyling.key} />,
		},
		{
			key: 'In Transit',
			label: (
				<span
					className={`${tabsLabelStyling.key === 'In Transit' ? tabsLabelStyling.style : 'border-gray-300 text-gray-600'} ${
						markers.length === 0 ? 'cursor-not-allowed' : ''
					} px-4 py-3 rounded-full border mx-1 text-xs font-bold`}
					onClick={() => {
						if (markers.length > 0) {
							dispatch(setSelectedVehicleStatus(initialSelectedVehicleState));
							dispatch(setDashboardSelectedVehicleStatus([]));
						}
					}}
				>
					Transit
				</span>
			),

			children: <TripList selectedVehicleStatus={tabsLabelStyling.key} />,
		},
		{
			key: 'Loading',
			label: (
				<span
					className={`${tabsLabelStyling.key === 'Loading' ? tabsLabelStyling.style : 'border-gray-300 text-gray-600'} ${
						markers.length === 0 ? 'cursor-not-allowed' : ''
					} px-4 py-3 rounded-full border mx-1 text-xs font-bold`}
					onClick={() => {
						if (markers.length > 0) {
							dispatch(setSelectedVehicleStatus(initialSelectedVehicleState));
							dispatch(setDashboardSelectedVehicleStatus([]));
						}
					}}
				>
					Loading
				</span>
			),
			children: <TripList selectedVehicleStatus={tabsLabelStyling.key} />,
		},
		{
			key: 'Unloading',
			label: (
				<span
					className={`${tabsLabelStyling.key === 'Unloading' ? tabsLabelStyling.style : 'border-gray-300 text-gray-600'} ${
						markers.length === 0 ? 'cursor-not-allowed' : ''
					} px-4 py-3 rounded-full border mx-1 text-xs font-bold `}
					onClick={() => {
						if (markers.length > 0) {
							dispatch(setSelectedVehicleStatus(initialSelectedVehicleState));
							dispatch(setDashboardSelectedVehicleStatus([]));
						}
					}}
				>
					Unloading
				</span>
			),
			children: <TripList selectedVehicleStatus={tabsLabelStyling.key} />,
		},
		// {
		// 	key: 'ffp',
		// 	label: (
		// 		<span
		// 			className={`${tabsLabelStyling.key === 'ffp' ? tabsLabelStyling.style : 'border-gray-300 text-gray-600'} ${
		// 				markers.length === 0 ? 'cursor-not-allowed' : ''
		// 			} px-4 py-3 rounded-full border mx-1 text-xs font-bold text-nowrap`}
		// 			onClick={() => {
		// 				if (markers.length > 0) {
		// 					dispatch(setSelectedVehicleStatus(initialSelectedVehicleState));
		// 					dispatch(setDashboardSelectedVehicleStatus([]));
		// 				}
		// 			}}
		// 		>
		// 			FFP
		// 		</span>
		// 	),
		// 	children: <TripList selectedVehicleStatus={tabsLabelStyling.key} />,
		// },

		{
			key: 'collapse',
			label: collapseTripStatusToggle ? (
				<DoubleRightOutlined
					className='absolute z-10 top-6 right-[5px] cursor-pointer text-lg hover:text-primary-green text-gray-800 transition-colors duration-300'
					onClick={() => dispatch(setCollapseTripStatusToggle(false))}
				/>
			) : (
				<DoubleLeftOutlined
					className='absolute z-10 top-6 right-[5px] cursor-pointer text-lg hover:text-primary-green text-gray-800 transition-colors duration-300'
					onClick={() => dispatch(setCollapseTripStatusToggle(true))}
				/>
			),
			children: <TripList selectedVehicleStatus={tabsLabelStyling.key} />,
		},
	];

	return (
		<span className='relative'>
			<Tabs
				defaultActiveKey='all'
				items={items}
				onChange={onChange}
				onClick={() => {
					dispatch(setClusterActive());
				}}
				activeKey={tabsLabelStyling.key}
				className={`z-30 absolute bg-white ${
					collapseTripStatusToggle ? '-translate-x-[425px]' : 'translate-x-0'
				} min-w-[450px] w-[450px] max-w-[450px]  transition duration-300`}
				renderTabBar={(e) => {
					return (
						<span className='flex ml-6 mt-2 mb-4 max-w-[400px] overflow-x-scroll scrollbar   scrollbar-thumb-thumb-green scrollbar-h-1 scrollbar-thumb-rounded-md'>
							{items.length ? (
								items.map((item) => (
									<div key={item.key} className='cursor-pointer' onClick={(event) => e.onTabClick(item.key, event)}>
										<div className='mt-5 mb-6'>{item.label}</div>
									</div>
								))
							) : (
								<></>
							)}
						</span>
					);
				}}
				tabBarStyle={{
					padding: '14px 0 14px 18px',
					margin: 0,
				}}
				indicator={{ size: () => 0, align: 'center' }}
			/>
		</span>
	);
};
