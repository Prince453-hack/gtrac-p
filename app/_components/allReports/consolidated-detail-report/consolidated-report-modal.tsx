'use client';

import { RootState } from '@/app/_globalRedux/store';
import { Modal } from 'antd';
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import StartAndEndMarkers from '../../dashboard/react-leaflet/StartAndEndMarkers';
import SelectedVehiclePolyline from '../../dashboard/react-leaflet/SelectedVehiclePolyline';
import { ReactLeafletHistoryReplaySlider } from '../../dashboard/react-leaflet/ReactLeafletHistoryReplaySlider';
import moment from 'moment';
import { useLazyGetItineraryvehIdBDateNwStQuery, useLazyGetpathwithDateDaignosticQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { updateVehicleItnaryWithPath } from '../../dashboard/VehicleDetails';
import { SelectedDataMarker } from './selectedDataMarker';
import {
	initialSelectedVehicleState,
	setSelectedVehicleHistoryTab,
	setSelectedVehicleStatus,
} from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import VehicleDetailsDownloadButton from '../../dashboard/VehicleDetailsDownloadButton';
import { ReactLeafletStoppageMarkers } from '../../dashboard/react-leaflet/ReactLeafletStoppageMarkers';
import ReactLeafletMapController from '../../dashboard/react-leaflet/ReactLeafletMapController';

const ResizeMap = () => {
	const map = useMap();
	useEffect(() => {
		map.invalidateSize();
	}, [map]);
	return null;
};

export const ConsolidatedReportModal = ({
	setSelectedData,
	selectedData,
}: {
	selectedData: any;
	setSelectedData: React.Dispatch<React.SetStateAction<any>>;
}) => {
	const dispatch = useDispatch();
	const { centerOfMap, zoomNo } = useSelector((state: RootState) => state.map);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const { userId, parentUser, extra } = useSelector((state: RootState) => state.auth);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	const [isLoading, setIsLoading] = React.useState(false);

	const [getPathWithDateDaignostic] = useLazyGetpathwithDateDaignosticQuery();
	const [getVehicleListItinerary] = useLazyGetItineraryvehIdBDateNwStQuery();

	const getPathWithDateDaignosticAndGetVehicleListItinerary = async () => {
		setIsLoading(true);

		dispatch(
			setSelectedVehicleStatus({
				...initialSelectedVehicleState,
				vId: selectedData.veh_id,
				searchType: '',
				selectedVehicleHistoryTab: 'Diagnostic',
				nearbyVehicles: [],
			})
		);

		getVehicleListItinerary({
			userId: userId,
			vId: selectedData.veh_id,
			startDate: moment(selectedData.Start_Time).format('YYYY-MM-DD HH:mm'),
			endDate: moment(selectedData.End_Time).format('YYYY-MM-DD HH:mm'),
			requestFor: 0,
		}).then(({ data: vehicleListDataArgs }) => {
			updateVehicleItnaryWithPath({
				vehicleListDataArgs: vehicleListDataArgs,
				pathwithDateDataArgs: undefined,
				vehicleItnaryWithPath,
				dispatch,
				userId,
				parentUser,
				extra,
			});

			getPathWithDateDaignostic({
				vId: selectedData.veh_id,
				startDate: moment(selectedData.Start_Time).format('YYYY-MM-DD HH:mm'),
				endDate: moment(selectedData.End_Time).format('YYYY-MM-DD HH:mm'),
				userId: userId,
			})
				.then(({ data: pathwithDateDataArgs }) => {
					updateVehicleItnaryWithPath({
						vehicleListDataArgs: vehicleListDataArgs,
						pathwithDateDataArgs: pathwithDateDataArgs,
						vehicleItnaryWithPath,
						dispatch,
						userId,
						parentUser,
						extra,
					});
				})
				.then(() => {
					setIsLoading(false);
				});
		});
	};

	useEffect(() => {
		selectedData && getPathWithDateDaignosticAndGetVehicleListItinerary();
		dispatch(setSelectedVehicleHistoryTab('Trip'));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedData]);

	return (
		<>
			{selectedData ? (
				<Modal
					open={!!selectedData}
					onCancel={() => setSelectedData(null)}
					width='850px'
					destroyOnClose
					loading={isLoading}
					style={{ top: 30, position: 'relative' }}
					footer={
						selectedVehicle.selectedVehicleHistoryTab === 'All' || selectedVehicle.selectedVehicleHistoryTab === 'Diagnostic' ? (
							<div className='relative h-10'>
								<div className='float-right'>
									<VehicleDetailsDownloadButton />
								</div>
							</div>
						) : null
					}
				>
					<div className='w-[600px] h-[600px] relative'>
						{vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length > 1 ? (
							<div className='w-[600px] h-[600px] relative'>
								<MapContainer center={[centerOfMap.lat, centerOfMap.lng]} zoom={zoomNo} scrollWheelZoom={true} style={{ width: 800, height: 600 }}>
									<ResizeMap />
									<TileLayer
										url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
										attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
									/>
									<ReactLeafletMapController />
									<ReactLeafletStoppageMarkers />
									<SelectedDataMarker selectedData={selectedData} />
									<StartAndEndMarkers vehicleAllocationReport={true} />
									<SelectedVehiclePolyline vehicleAllocationReport={true} />

									<ReactLeafletHistoryReplaySlider vehicleAllocationReport={true} />
								</MapContainer>
							</div>
						) : (
							<p className='font-semibold text-lg'>No data found for the selected dates</p>
						)}
					</div>
				</Modal>
			) : null}
		</>
	);
};
