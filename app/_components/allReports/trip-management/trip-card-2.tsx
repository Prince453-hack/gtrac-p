'use client';

import { DownCircleOutlined, MoreOutlined, UpCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps } from 'antd';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { setCreateTripOrTripPlanningActive, setPlanId } from '@/app/_globalRedux/dashboard/createTripOrTripPlanningActive';
import { setEditTripOrEditPlanActive } from '@/app/_globalRedux/dashboard/editTripOrEditPlanningActive';
import { Timeline2 } from '../../common/Temeline-2';
import { MergedGatewayRailTrip } from '@/app/helpers/mergeGatewayRailTrips';

export const TripCard2 = ({ type, data }: { type: 'planning' | 'history'; data: MergedGatewayRailTrip | undefined }) => {
	const dispatch = useDispatch();
	const [showDetails, setShowDetails] = useState(false);

	const createOrEditTripFromPlanned = async ({ type }: { type: 'create-trip' | 'edit-trip' | 'edit-plan' }) => {
		if (type === 'edit-trip') {
			dispatch(setEditTripOrEditPlanActive({ type: 'edit-trip' }));
		} else if (type === 'edit-plan') {
			dispatch(setEditTripOrEditPlanActive({ type: 'edit-plan' }));
		} else {
			dispatch(setCreateTripOrTripPlanningActive({ type: 'create-trip' }));
		}

		dispatch(setPlanId(data?.id || null));
	};

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
					Edit Trip
				</div>
			),
		},
	];

	return (
		<div className={`bg-white shadow-sm rounded-md ${showDetails ? 'min-h-[200px]' : ''}`}>
			<div className={`p-6 text-[14px] grid grid-cols-8 items-center justify-center`}>
				<div className='col-span-2 font-medium items-center justify-end'>
					<div className='flex items-center gap-2 mb-2'>
						<p>Vehicle Number:</p>
						<div className='text-neutral-600 font-normal'>
							{data ? <p>{data.vehicle_no}</p> : <div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-40 rounded'></div>}
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<p>GR Number:</p>
						<div className='text-neutral-600 font-normal'>
							{data ? <p>{data.gr_no}</p> : <div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-40 rounded'></div>}
						</div>
					</div>
				</div>
				<div className='col-span-4 font-medium flex items-center justify-center'>
					<div className='flex items-center gap-2'>
						<div className='text-primary-green  font-semibold text-base'>
							{data ? <p>{data.route}</p> : <div className='animate-pulse h-[18px] my-[2.5px] bg-neutral-200 w-40 rounded'></div>}
						</div>
					</div>
				</div>

				<div className='col-span-2 flex justify-end items-center gap-2 relative'>
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
			{showDetails && data && data.legs.length > 0 && (
				<div className='p-6 text-[14px] '>
					<Timeline2 items={data.legs} vehId={data.vehId} vehReg={data.vehicle_no} />
				</div>
			)}
		</div>
	);
};
