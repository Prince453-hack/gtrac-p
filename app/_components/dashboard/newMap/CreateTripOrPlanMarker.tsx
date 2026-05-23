'use client';

import { RootState } from '@/app/_globalRedux/store';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedVehicleBySelectElement } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { useEffect } from 'react';
import { useGetVehicleCurrentLocationQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { setVehicleItnaryWithPath, vehicleItnaryWithPathInitialState } from '@/app/_globalRedux/dashboard/vehicleItnaryWithPathSlice';
import { setCenterOfMap } from '@/app/_globalRedux/dashboard/mapSlice';
import { getNormalOrControllerId } from '../utils/getNormalOrControllerId';

export const CreateTripOrPlanMarker = () => {
	const dispatch = useDispatch();
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const historyReplay = useSelector((state: RootState) => state.historyReplay);
	const auth = useSelector((state: RootState) => state.auth);
	const { type: createTripOrPlanningTripActive } = useSelector((state: RootState) => state.createTripOrPlanningTripActive);
	const { isGetNearbyVehiclesActive } = useSelector((state: RootState) => state.nearbyVehicles);
	const { type: vehicleListType } = useSelector((state: RootState) => state.isVehicleStatusOrTripStatusActive);

	const {
		data: currentVehicleLocationData,
		isLoading,
		isFetching: isFetchingCurrentVehicleLocation,
	} = useGetVehicleCurrentLocationQuery(
		{
			userId: Number(auth.userId),
			vehId: auth.accessLabel === 6 ? getNormalOrControllerId(selectedVehicle) : selectedVehicle.vId,
		},
		{ skip: selectedVehicle.vId === 0 || historyReplay.isHistoryReplayMode, pollingInterval: 10000 }
	);

	useEffect(() => {
		if (createTripOrPlanningTripActive !== '') {
			// dispatch(setHistoryReplayModeToggle(false));
		}
	}, [createTripOrPlanningTripActive]);

	useEffect(() => {
		if (
			!isLoading &&
			!isFetchingCurrentVehicleLocation &&
			!historyReplay.isHistoryReplayMode &&
			selectedVehicle &&
			selectedVehicle?.vId &&
			selectedVehicle.vId !== 0 &&
			isGetNearbyVehiclesActive === false &&
			(vehicleListType == 'trip' || vehicleListType == 'vehicle-allocation-trip')
		) {
			if (currentVehicleLocationData?.success === true) {
				dispatch(
					setSelectedVehicleBySelectElement({
						...selectedVehicle,
						gpsDtl: {
							...selectedVehicle.gpsDtl,
							latLngDtl: {
								...selectedVehicle.gpsDtl.latLngDtl,
								lat: currentVehicleLocationData.list.latLngDtl.lat,
								lng: currentVehicleLocationData.list.latLngDtl.lng,
								addr: currentVehicleLocationData.list.latLngDtl.addr,
								gpstime: currentVehicleLocationData.list.latLngDtl.gpstime,
							},
							mode: currentVehicleLocationData.list.mode,
							speed: currentVehicleLocationData.list.speed,
						},
					})
				);
				dispatch(setVehicleItnaryWithPath(vehicleItnaryWithPathInitialState));
				dispatch(
					setCenterOfMap({ lat: Number(currentVehicleLocationData.list.latLngDtl.lat), lng: Number(currentVehicleLocationData.list.latLngDtl.lng) })
				);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentVehicleLocationData, isLoading, isFetchingCurrentVehicleLocation]);

	return <></>;
};
