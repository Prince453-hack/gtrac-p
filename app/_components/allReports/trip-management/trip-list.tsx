'use client';

import React from 'react';
import { TripCard } from './trip-card';

export const TripList = ({ type, isLoading, tripData }: { type: 'planning' | 'history'; isLoading: boolean; tripData: any[] | undefined }) => {
	return (
		<div className='flex flex-col gap-4 overflow-scroll h-[66vh] relative'>
			{isLoading ? (
				new Array(6).fill(0).map((_, index) => (
					<div key={index}>
						<TripCard type={type} data={undefined} />
					</div>
				))
			) : tripData?.length ? (
				tripData.map((data, index) => (
					<div key={index}>
						<TripCard type={type} data={data} />
					</div>
				))
			) : (
				<p>No trips found</p>
			)}
		</div>
	);
};
