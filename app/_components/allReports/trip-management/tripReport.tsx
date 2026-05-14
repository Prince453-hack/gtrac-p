'use client';

import React, { useState } from 'react';
import { TripHeader2 } from './tripHeader2';
import { TripReportTable } from './tripReportTable';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { useGetTripCompletedVehiclesQuery, useGetTripVehiclesQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { Tabs } from 'antd';
import { TripList } from './trip-list';
import ListAndTableViewToggle from './listAndTableViewToggle';

export const TripReport = () => {
	const [customDateRange, setCustomDateRange] = useState<Date[]>([moment().subtract(15, 'days').startOf('date').toDate(), new Date()]);
	const { groupId, userId } = useSelector((state: RootState) => state.auth);
	const [selectedTab, setSelectedTab] = useState('On Trip');
	const [activeView, setActiveView] = useState<'TABLE' | 'LIST'>('TABLE');
	const isManualRefetch = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some(
			(query) =>
				(query && query.endpointName === 'getTripVehicles' && query.status === 'pending') ||
				(query && query.endpointName === 'getTripCompletedVehicles' && query.status === 'pending')
		)
	);

	const {
		isLoading: isTripLoading,
		data: trip,
		refetch: refetchTrip,
	} = useGetTripVehiclesQuery(
		{
			userId,
			token: groupId,
			startDate: moment(customDateRange[0]).format('YYYY-MM-DD HH:mm'),
			endDate: moment(customDateRange[1]).format('YYYY-MM-DD HH:mm'),
			tripStatus: selectedTab,
			tripStatusBatch: selectedTab,
		},
		{
			skip: !groupId || !userId || selectedTab !== 'On Trip',
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
		}
	);

	const {
		isLoading: isTripHistoryLoading,
		data: tripHistory,
		refetch: refetchTripHistory,
	} = useGetTripCompletedVehiclesQuery(
		{
			userId,
			token: groupId,
			startDate: moment(customDateRange[0]).format('YYYY-MM-DD HH:mm'),
			endDate: moment(customDateRange[1]).format('YYYY-MM-DD HH:mm'),
			tripStatus: selectedTab,
			tripStatusBatch: selectedTab,
		},
		{
			skip: !groupId || !userId || selectedTab !== 'Trip Completed',
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
		}
	);

	return (
		<div className='py-4 relative'>
			<div className='flex justify-between items-start gap-4'>
				<TripHeader2
					setCustomDateRange={setCustomDateRange}
					refetch={selectedTab === 'On Trip' ? refetchTrip : refetchTripHistory}
					isLoading={isTripLoading || isManualRefetch}
				/>

				<ListAndTableViewToggle setActiveView={setActiveView} activeViewData={activeView} />
			</div>

			<Tabs
				defaultActiveKey='1'
				onChange={(e) => {
					if (e === 'trips') {
						setSelectedTab('On Trip');
					} else {
						setSelectedTab('Trip Completed');
					}
				}}
				items={[
					{
						label: 'Trips',
						key: 'trips',
						children:
							activeView === 'TABLE' ? (
								<TripReportTable isLoading={isTripLoading || isManualRefetch} tripHistory={trip} refetch={refetchTrip} />
							) : (
								<TripList type='planning' tripData={trip?.list} isLoading={isTripLoading || isManualRefetch} />
							),
					},
					{
						label: 'Trip History',
						key: 'trip_history',
						children:
							activeView === 'TABLE' ? (
								<TripReportTable
									isLoading={isTripHistoryLoading || isManualRefetch}
									tripHistory={tripHistory}
									refetch={refetchTripHistory}
									isTripHistory={true}
								/>
							) : (
								<TripList type='planning' tripData={tripHistory?.list} isLoading={isTripLoading || isManualRefetch} />
							),
					},
				]}
			/>
		</div>
	);
};
