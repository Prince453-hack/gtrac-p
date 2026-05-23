'use client';

import React from 'react';
import { TripCard2 } from './trip-card-2';
import { GatewayRailCurrentTrip } from '@/app/_globalRedux/services/types/gatewayRailCurrentTripsResponse';
import { MergedGatewayRailTrip, mergeRailTrips } from '@/app/helpers/mergeGatewayRailTrips';
import { VehicleData } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';

export const TripList2 = ({
	type,
	isLoading,
	tripData,
}: {
	type: 'planning' | 'history';
	isLoading: boolean;
	tripData: (GatewayRailCurrentTrip & { currentLocation: VehicleData | undefined })[] | undefined;
}) => {
	const [isLoading2, setIsLoading2] = React.useState(true);
	const [mergedTrips, setMergedTrips] = React.useState<MergedGatewayRailTrip[]>([]);

	React.useEffect(() => {
		if (!tripData) return;

		setIsLoading2(true);
		const tempMergeData = mergeRailTrips(tripData);
		setMergedTrips(tempMergeData);

		const timer = setTimeout(() => {
			setIsLoading2(false);
		}, 2000);

		return () => clearTimeout(timer);
	}, [tripData]);

	return (
		<div className='flex flex-col gap-4 overflow-scroll h-[calc(100vh-150px)] relative'>
			{isLoading || isLoading2 ? (
				new Array(6).fill(0).map((_, index) => (
					<div key={index}>
						<TripCard2 type={type} data={undefined} />
					</div>
				))
			) : mergedTrips?.length ? (
				mergedTrips.map((data, index) => (
					<div key={index}>
						<TripCard2 type={type} data={data} />
					</div>
				))
			) : (
				<p>No trips found</p>
			)}
		</div>
	);
};
