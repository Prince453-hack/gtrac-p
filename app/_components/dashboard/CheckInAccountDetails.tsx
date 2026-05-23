import { setCheckInData } from '@/app/_globalRedux/dashboard/CheckInData';
import { useAppDispatch } from '@/app/_globalRedux/provider';
import { trackingDashboard, useGetRawWithDateQuery, useGetRawWithDateTodayQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { RootState } from '@/app/_globalRedux/store';
import { Card, Skeleton, Tooltip } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CustomRangePicker } from './CustomRangePicker';
import { CloseOutlined } from '@ant-design/icons';
import { setIsVehicleDetailsCollapsed } from '@/app/_globalRedux/dashboard/isVehicleDetailsCollapsedSlice';
import {
	initialSelectedVehicleState,
	removeSelectedVehicle,
	setSelectedVehicleBySelectElement,
} from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { setIsGetNearbyVehiclesActive } from '@/app/_globalRedux/dashboard/nearbyVehicleSlice';
import { setCreateTripOrTripPlanningActive } from '@/app/_globalRedux/dashboard/createTripOrTripPlanningActive';
import { VehicleDetailsSelect } from './VehicleDetailsSelect';
import CheckInAccountDownloadButton from './CheckInAccountDownloadButton';

const selectedStyles = {
	selectorBg: 'transparent',
	colorBorder: 'transparent',
	fontSize: 19,
	optionFontSize: 14,
	optionPadding: '5px',
	optionSelectedColor: '#000',
};

export const CheckInAccountDetails = () => {
	const dispatch = useAppDispatch();

	const { userId } = useSelector((state: RootState) => state.auth);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const checkInData = useSelector((state: RootState) => state.checkIndData);
	const { type: vehicleListType } = useSelector((state: RootState) => state.isVehicleStatusOrTripStatusActive);
	const collapseVehicleStatusToggle = useSelector((state: RootState) => state.collapseVehicleStatusToggle);
	const collapseTripStatusToggle = useSelector((state: RootState) => state.collapseTripStatusToggle);

	const [visibleDetailsStyling, setVisibleDetailsStyling] = useState('');

	const { data, isFetching } = useGetRawWithDateTodayQuery(
		{
			userId: Number(userId),
			vehId: selectedVehicle.vId,
			startDate: moment(new Date()).startOf('day').format('YYYY-MM-DD HH:mm'),
			endDate: moment(new Date()).format('YYYY-MM-DD HH:mm'),
			interval: 'All',
		},
		{ skip: !userId || !selectedVehicle.vId || selectedVehicle.vId === 0 }
	);
	useEffect(() => {
		if (!data) return;
		dispatch(setCheckInData(data.rawdata));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	useEffect(() => {
		if (selectedVehicle.vId === 0) {
			if (
				(vehicleListType === 'vehicle' && collapseVehicleStatusToggle) ||
				vehicleListType === 'trip' ||
				(vehicleListType === 'vehicle-allocation-trip' && collapseTripStatusToggle)
			) {
				setVisibleDetailsStyling('-translate-x-[442px]');
			} else {
				setVisibleDetailsStyling('-translate-x-[20px]');
			}
		} else if (selectedVehicle.vId !== 0) {
			if (
				(vehicleListType === 'vehicle' && collapseVehicleStatusToggle) ||
				vehicleListType === 'trip' ||
				(vehicleListType === 'vehicle-allocation-trip' && collapseTripStatusToggle)
			) {
				setVisibleDetailsStyling('translate-x-[20px]');
			} else {
				setVisibleDetailsStyling('translate-x-[442px]');
			}
		}
	}, [selectedVehicle, collapseVehicleStatusToggle, collapseTripStatusToggle, vehicleListType]);

	return (
		<div
			className={`ml-2 absolute py-[22px] z-20 ${visibleDetailsStyling} min-w-[450px] w-[450px] bg-white h-[calc(100vh-60px)] transition-transform duration-300`}
		>
			<div className='flex items-start justify-between px-5'>
				<div className='mb-4 flex items-center justify-between gap-3'>
					<VehicleDetailsSelect selectedStyles={selectedStyles} type='' />
					<CheckInAccountDownloadButton />
				</div>
				<Tooltip title='Close' placement='right' mouseEnterDelay={1}>
					<div
						className='mt-1 pr-1'
						onClick={() => {
							dispatch(setIsVehicleDetailsCollapsed(true));
							dispatch(trackingDashboard.util.invalidateTags(['Vehicles-List-By-Status']));
							setTimeout(() => dispatch(setIsVehicleDetailsCollapsed(false)), 1);
							dispatch(removeSelectedVehicle());
							dispatch(setIsGetNearbyVehiclesActive(false));

							// trip system state update
							dispatch(setSelectedVehicleBySelectElement(initialSelectedVehicleState));
							dispatch(setCreateTripOrTripPlanningActive({ type: '' }));
						}}
					>
						<CloseOutlined className='cursor-pointer' />
					</div>
				</Tooltip>
			</div>

			{isFetching ? (
				<div className='px-5'>
					<Skeleton active />
				</div>
			) : (
				<>
					<div className='px-5'>
						<CustomRangePicker />
					</div>

					<hr />

					<div className='px-5 mt-4 gap-3 flex flex-col '>
						<div>
							<h3 className='font-semibold text-lg text-primary-green ml-1'>Check In&apos;s</h3>
						</div>
						<div className='overflow-scroll h-[calc(100vh-310px)] gap-3 flex flex-col'>
							{checkInData && checkInData.length > 0 ? (
								checkInData.map((item, index) => (
									<Card className='shadow-xl shadow-s-light' key={item.des_movement_id}>
										<div className='flex flex-row items-center gap-3'>
											<div className='rounded-full p-1 w-6 h-6 text-sm bg-[#ef7432] text-white flex items-center justify-center'>{index + 1}</div>
											<div>
												<div className='flex items-center gap-2'>
													<p className='font-semibold'>Location:</p>
													<Tooltip title={item?.geostreet?.replaceAll('_', ' ')} mouseEnterDelay={1}>
														{item?.geostreet?.replaceAll('_', ' ').length > 30
															? item?.geostreet?.replaceAll('_', ' ').slice(0, 30) + '...'
															: item?.geostreet?.replaceAll('_', ' ')}
													</Tooltip>
												</div>
												<div className='flex items-center gap-2'>
													<p className='font-semibold'>Time:</p>
													<p>{item.gps_time}</p>
												</div>
											</div>
										</div>
									</Card>
								))
							) : (
								<Card className='shadow-xl shadow-s-light'>No Check-ins</Card>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
};
