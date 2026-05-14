'use client';

import { DownCircleOutlined, MoreOutlined, UpCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLazyPlanDeleteQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import moment from 'moment';
import { fixDateFormat } from '@/app/helpers/fixDateFormat';
import { setCreateTripOrTripPlanningActive, setPlanId } from '@/app/_globalRedux/dashboard/createTripOrTripPlanningActive';
import { setEditTripOrEditPlanActive } from '@/app/_globalRedux/dashboard/editTripOrEditPlanningActive';
import { Timeline } from '../../common';

export const TripCard = ({ type, data }: { type: 'planning' | 'history'; data: getTripVehiclesResponse['list'][0] | undefined }) => {
	const dispatch = useDispatch();
	const { userId, groupId } = useSelector((state: RootState) => state.auth);
	const [showDetails, setShowDetails] = useState(false);
	const [timelineData, setTimelineData] = useState<{ date: string; location: string }[]>([]);

	const [deletePlannedTrip] = useLazyPlanDeleteQuery();

	const createOrEditTripFromPlanned = async ({ type }: { type: 'create-trip' | 'edit-trip' | 'edit-plan' }) => {
		if (type === 'edit-trip') {
			dispatch(setEditTripOrEditPlanActive({ type: 'edit-trip' }));
		} else if (type === 'edit-plan') {
			dispatch(setEditTripOrEditPlanActive({ type: 'edit-plan' }));
		} else {
			dispatch(setCreateTripOrTripPlanningActive({ type: 'create-trip' }));
		}

		dispatch(setPlanId(data?.trip_id || null));
	};

	useEffect(() => {
		if (data) {
			const TempTimelineData = [
				{
					date: fixDateFormat(data.departure_date, 'Do MMM YYYY hh:mm A', 'date'),
					location: data.station_from_location,
				},

				{
					date: fixDateFormat(data.trip_complted_datebysystem, 'Do MMM YYYY hh:mm A', 'No Info'),
					location: data.station_to_location,
				},
			];

			data.vaiOne
				? TempTimelineData.splice(1, 0, { date: fixDateFormat(data.vaiOneInTime, 'Do MMM YYYY hh:mm A', 'No Info'), location: data.vaiOne })
				: '';
			data.vaiTwo
				? TempTimelineData.splice(1, 0, { date: fixDateFormat(data.vaiTwoInTime, 'Do MMM YYYY hh:mm A', 'No Info'), location: data.vaiTwo })
				: '';
			data.vaiThree
				? TempTimelineData.splice(1, 0, { date: fixDateFormat(data.vaiThreeInTime, 'Do MMM YYYY hh:mm A', 'No Info'), location: data.vaiThree })
				: '';
			data.vaiFour
				? TempTimelineData.splice(1, 0, { date: fixDateFormat(data.vaiFourInTime, 'Do MMM YYYY hh:mm A', 'No Info'), location: data.vaiFour })
				: '';

			setTimelineData(TempTimelineData);
		}
	}, [data]);

	const items: MenuProps['items'] = [
		type === 'history'
			? null
			: {
					key: '1',
					label: (
						<>
							<div
								onClick={(e) => {
									createOrEditTripFromPlanned({ type: 'create-trip' });
								}}
							>
								Convert To Trip
							</div>
						</>
					),
			  },

		{
			key: '2',
			label: (
				<div
					onClick={(e) => {
						createOrEditTripFromPlanned({ type: type === 'planning' ? 'edit-plan' : 'edit-trip' });
					}}
				>
					Edit {type === 'planning' ? 'Plan' : 'Trip'}
				</div>
			),
		},
		type === 'history'
			? null
			: {
					key: '3',

					label: (
						<>
							<div
								onClick={async (e) => {
									await deletePlannedTrip({
										tripId: data?.trip_id ? data?.trip_id : 0,
										userId,
										token: groupId,
										startDate: moment().subtract(15, 'days').startOf('date').format('YYYY-MM-DD HH:mm'),
										endDate: moment().format('YYYY-MM-DD HH:mm'),
										tripStatus: 'On Trip',
										tripStatusBatch: 'On Trip',
									});
								}}
							>
								Delete Plan
							</div>
						</>
					),
			  },
	];

	return (
		<div className={`bg-white shadow-sm rounded-md ${showDetails ? 'min-h-[200px]' : 'min-h-[100px]'}`}>
			<div className={`p-6 text-[14px] grid grid-cols-8 items-center`}>
				<div className='col-span-2 font-medium'>
					<div className='flex items-center gap-2'>
						{/* Vehicle Number:{' '} */}
						<div className='text-primary-green  font-semibold text-base'>
							{data ? <p>{data.lorry_no}</p> : <div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-40 rounded'></div>}
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<p>Trip Number:</p>
						<div className='text-neutral-600 font-normal'>
							{data ? <p>{data.trip_id}</p> : <div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-40 rounded'></div>}
						</div>
					</div>
				</div>
				<div className='flex flex-col justify-center items-center w-full col-span-4 gap-2'>
					<div className='font-semibold text-neutral-600'>
						{data ? (
							<p>
								{fixDateFormat(data.departure_date, 'Do MMM YYYY hh:mm A', 'date')} -{' '}
								{fixDateFormat(data.trip_complted_datebysystem, 'Do MMM YYYY hh:mm A', 'No Info')}
							</p>
						) : (
							<div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-56 rounded'></div>
						)}
					</div>
					<div className='text-neutral-700 font-medium'>
						{data ? (
							<p>
								{data.station_from_location} ~ {data.station_to_location}
							</p>
						) : (
							<div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-56 rounded'></div>
						)}
					</div>
				</div>
				<div className='col-span-2 flex justify-end items-center gap-2 relative'>
					{data ? (
						<>
							{data.delay ? (
								<Tag color='red' style={{ fontSize: '13px', padding: '8px', borderRadius: '8px' }}>
									{data.delay} hrs
								</Tag>
							) : null}
						</>
					) : (
						<div className='animate-pulse h-[31px] bg-neutral-200 w-40 rounded'></div>
					)}
					{type === 'history' ? (
						data ? (
							<>
								{data.trip_status_batch ? (
									<Tag color='green' style={{ fontSize: '13px', padding: '8px', borderRadius: '8px' }}>
										{data.trip_status_batch}
									</Tag>
								) : null}
							</>
						) : (
							<div className='animate-pulse h-[31px] bg-neutral-200 w-40 rounded'></div>
						)
					) : null}

					<Dropdown menu={{ items }} placement='topLeft' trigger={['click']} arrow={false} overlayStyle={{ minWidth: '160px' }}>
						<div className='cursor-pointer hover:bg-neutral-100 rounded-full w-8 h-8 flex items-center justify-center'>
							<MoreOutlined style={{ fontSize: 20, color: '#478C83' }} />
						</div>
					</Dropdown>

					<div onClick={() => setShowDetails(!showDetails)} className='cursor-pointer'>
						{showDetails ? (
							<Button
								type='text'
								icon={<UpCircleOutlined style={{ fontSize: 20, color: '#478C83' }} />}
								className='rounded-full'
								disabled={data === undefined}
							></Button>
						) : (
							<Button
								type='text'
								icon={<DownCircleOutlined style={{ fontSize: 20, color: '#478C83' }} />}
								className='rounded-full'
								disabled={data === undefined}
							></Button>
						)}
					</div>
				</div>
			</div>
			{showDetails && (
				<div className='p-6 text-[14px] '>
					<Timeline items={timelineData} />
				</div>
			)}
		</div>
	);
};
