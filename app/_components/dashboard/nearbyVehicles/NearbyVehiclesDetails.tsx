'use client';

import { Button, Input, Skeleton, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import { useEffect, useState } from 'react';
import { trackingDashboard, useLazyGetVehiclesByStatusQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { useLazyGetNearbyVehiclesQuery } from '@/app/_globalRedux/services/yatayaat';
import { removeSelectedVehicle, setNearbyVehicles, setSelectedVehicleBySelectElement } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { setIsGetNearbyVehiclesActive, setRadiusInKilometers, setSelectedVehicleOption } from '@/app/_globalRedux/dashboard/nearbyVehicleSlice';
import { CloseOutlined } from '@ant-design/icons';
import { setIsVehicleDetailsCollapsed } from '@/app/_globalRedux/dashboard/isVehicleDetailsCollapsedSlice';
import { NearbyVehicleDetailsSelect } from './NearbyVehicleDetailsSelect';
import NearbyVehicleDetailsCard from './NearbyVehicleDetailsCard';

const selectedStyles = {
	selectorBg: 'transparent',
	colorBorder: 'transparent',
	fontSize: 19,
	optionFontSize: 14,
	optionPadding: '5px',
	optionSelectedColor: '#000',
};

const NearbyVehiclesDetails = () => {
	const dispatch = useDispatch();

	const { groupId, userId, parentUser: pUserId } = useSelector((state: RootState) => state.auth);

	const markers = useSelector((state: RootState) => state.markers);

	const collapseVehicleStatusToggle = useSelector((state: RootState) => state.collapseVehicleStatusToggle);
	const { selectedVehicleOption, radiusInKilometers } = useSelector((state: RootState) => state.nearbyVehicles);
	const selectedVehicleListTab = useSelector((state: RootState) => state.selectedVehicleListTab);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	const [tirggerRefetchOfVehicleListBasedOnTabSelected] = useLazyGetVehiclesByStatusQuery();

	const [visibleDetailsStyling, setVisibleDetailsStyling] = useState('');

	useEffect(() => {
		if (selectedVehicle.vId === 0) {
			if (collapseVehicleStatusToggle) {
				setVisibleDetailsStyling('-translate-x-[442px]');
			} else {
				setVisibleDetailsStyling('-translate-x-[20px]');
			}
		} else if (selectedVehicle.vId !== 0) {
			if (collapseVehicleStatusToggle) {
				setVisibleDetailsStyling('translate-x-[20px]');
			} else {
				setVisibleDetailsStyling('translate-x-[442px]');
			}
		}
	}, [selectedVehicle, collapseVehicleStatusToggle]);

	const [fetchNearbyVehicles, { data: searchedNearbyVehicles, isLoading: nearbyVehiclesLoading, isFetching: nearbyVehiclesFetching }] =
		useLazyGetNearbyVehiclesQuery();

	const onFinish = async () => {
		const tempSelectedVehicle = markers.find((marker) => marker.vId === selectedVehicleOption?.value);

		if (tempSelectedVehicle) {
			await fetchNearbyVehicles({
				token: Number(groupId),
				latitude: tempSelectedVehicle.gpsDtl.latLngDtl.lat,
				longitude: tempSelectedVehicle.gpsDtl.latLngDtl.lng,
				km: radiusInKilometers,
			});
		}
	};

	useEffect(() => {
		const tempSelectedVehicle = markers.find((marker) => marker.vId === selectedVehicleOption?.value);

		if (tempSelectedVehicle) {
			if (searchedNearbyVehicles && searchedNearbyVehicles?.length > 0) {
				dispatch(
					setSelectedVehicleBySelectElement({
						...tempSelectedVehicle,
						searchType: '',
						selectedVehicleHistoryTab: selectedVehicle.selectedVehicleHistoryTab,
						nearbyVehicles: searchedNearbyVehicles.map((vehicle) => ({ ...vehicle, isInfoWindowOpen: false })),
						prevVehicleSelected: selectedVehicle.prevVehicleSelected,
					})
				);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchedNearbyVehicles]);

	const isVehicleByStatusPending = useSelector((state: RootState) =>
		Object.values(state.allTripApi.queries).some((query) => query && query.endpointName === 'getVehiclesByStatus' && query.status === 'pending')
	);

	useEffect(() => {
		if (!isVehicleByStatusPending) {
			dispatch(setIsVehicleDetailsCollapsed(false));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVehicleByStatusPending]);

	return (
		<>
			<div
				className={`ml-2 absolute py-[22px] z-20 ${visibleDetailsStyling} min-w-[450px] w-[450px] bg-white h-[calc(100vh-60px)] transition-transform duration-300`}
			>
				<div className='flex items-start justify-between px-5'>
					<div className='mb-4 flex items-center gap-2'>
						<NearbyVehicleDetailsSelect selectedStyles={selectedStyles} />
					</div>
					<Tooltip title='Close' placement='right' mouseEnterDelay={1}>
						<div
							className='mt-1 pr-1'
							onClick={() => {
								dispatch(trackingDashboard.util.invalidateTags(['Vehicles-List-By-Status']));
								dispatch(setIsVehicleDetailsCollapsed(true));
								dispatch(removeSelectedVehicle());

								tirggerRefetchOfVehicleListBasedOnTabSelected({
									userId,
									token: groupId,
									pUserId,
									mode: selectedVehicleListTab.toUpperCase() === 'ALL' ? '' : selectedVehicleListTab.toUpperCase(),
								});

								dispatch(setSelectedVehicleOption(undefined));
								dispatch(setRadiusInKilometers(0));
								dispatch(setIsGetNearbyVehiclesActive(false));
								dispatch(setNearbyVehicles(undefined));
							}}
						>
							<CloseOutlined className='cursor-pointer' />
						</div>
					</Tooltip>
				</div>

				<div className='flex items-start justify-between flex-col w-full px-5 select-none gap-5'>
					<div className='w-full'>
						<p className=' text-neutral-600 text-sm font-bold mt-1'>Add Radius by Kilometers:</p>
						<div className='mt-1'>
							<Input
								className='w-full'
								placeholder='Add Radius Kilometers'
								value={radiusInKilometers}
								onChange={(e) => {
									if (!isNaN(Number(e.target.value))) {
										dispatch(setRadiusInKilometers(Number(e.target.value)));
									}
								}}
							/>
						</div>
					</div>

					<div className='flex gap-2 justify-end w-full'>
						<Button type='primary' loading={nearbyVehiclesLoading} onClick={() => onFinish()}>
							Submit
						</Button>

						<Button
							onClick={() => {
								dispatch(setSelectedVehicleOption(undefined));
								dispatch(setRadiusInKilometers(0));
								dispatch(setIsGetNearbyVehiclesActive(false));
								dispatch(setNearbyVehicles(undefined));
							}}
						>
							Cancel
						</Button>
					</div>
				</div>

				{nearbyVehiclesLoading || nearbyVehiclesFetching ? (
					<div className='px-5'>
						<Skeleton active />
					</div>
				) : selectedVehicle.nearbyVehicles && selectedVehicle.nearbyVehicles.length > 0 ? (
					<div className='flex gap-2 flex-col px-5 mt-5'>
						<div className='flex items-center justify-center gap-2 mb-5'>
							<div className='h-0.5 bg-neutral-200 w-full rounded-full'></div>
							<div className='text-nowrap text-sm font-semibold text-neutral-600'>
								{String(selectedVehicle.nearbyVehicles.length - 1).padStart(2, '0')} Vehicles Found
							</div>
							<div className='h-0.5 bg-neutral-200 w-full rounded-ful'></div>
						</div>
						<div className='h-[calc(100vh-310px)] w-full overflow-x-scroll scrollbar-thumb-thumb-green scrollbar-w-2 scrollbar-thumb-rounded-md scrollbar flex flex-col gap-2.5 '>
							{selectedVehicle.nearbyVehicles.map((vehicle) => (
								<div key={vehicle.sys_service_id} className='rounded-xl'>
									<NearbyVehicleDetailsCard vehicle={vehicle} />
								</div>
							))}
						</div>
					</div>
				) : (
					<p className='px-5 font-semibold text-gray-700 text-sm mt-5'>No data found, try changing the radius</p>
				)}
			</div>
		</>
	);
};

export default NearbyVehiclesDetails;
