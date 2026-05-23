'use client';

import { RootState } from '@/app/_globalRedux/store';
import { Modal, Tabs } from 'antd';
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
import { VehicleHistoryCardListItnary } from '../../dashboard';
import DiagnosticCardList from '../../dashboard/Diagnostic/DiagnosticCardList';
import { setSelectedVehicleHistoryTab } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import VehicleDetailsDownloadButton from '../../dashboard/VehicleDetailsDownloadButton';
import { TemperatureReport } from './temperature-report';

const ResizeMap = () => {
	const map = useMap();
	useEffect(() => {
		map.invalidateSize();
	}, [map]);
	return null;
};

export const VehicleAllocationReportModal = ({
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
		getVehicleListItinerary({
			userId: userId,
			vId: selectedData.sys_service_id,
			startDate: moment(selectedData.departure_date).format('YYYY-MM-DD HH:mm'),
			endDate: moment(selectedData.trip_complted_datebysystem).format('YYYY-MM-DD HH:mm'),
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
				vId: selectedData.sys_service_id,
				startDate: moment(selectedData.departure_date).format('YYYY-MM-DD HH:mm'),
				endDate: moment(selectedData.trip_complted_datebysystem).format('YYYY-MM-DD HH:mm'),
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
					width='1000px'
					destroyOnClose
					loading={isLoading}
					style={{ top: 20, position: 'relative' }}
					footer={
						<>
							{selectedVehicle.selectedVehicleHistoryTab === 'All' || selectedVehicle.selectedVehicleHistoryTab === 'Diagnostic' ? (
								<div className='relative h-10'>
									<div className='float-right'>
										<VehicleDetailsDownloadButton />
									</div>
								</div>
							) : null}
						</>
					}
				>
					<Tabs
						defaultActiveKey='1'
						onChange={(e) => {
							if (e === 'journey-report') {
								dispatch(setSelectedVehicleHistoryTab('All'));
							} else if (e === 'diagnostic-report') {
								dispatch(setSelectedVehicleHistoryTab('Diagnostic'));
							} else {
								dispatch(setSelectedVehicleHistoryTab('Trip'));
							}
						}}
						items={[
							{
								key: 'map-view',
								label: `Map View`,

								children: (
									<div className='w-[950px] h-[600px] relative'>
										{vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length > 1 ? (
											<div className='w-[950px] h-[600px] relative'>
												<MapContainer
													center={[centerOfMap.lat, centerOfMap.lng]}
													zoom={zoomNo}
													scrollWheelZoom={true}
													style={{ width: 950, height: 600 }}
												>
													<ResizeMap />
													<TileLayer
														url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
														attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
														maxZoom={18}
													/>
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
								),
							},
							{
								key: 'journey-report',
								label: `Journey Report`,
								children: (
									<div className='w-[950px] h-[600px] relative'>
										{vehicleItnaryWithPath.patharry && vehicleItnaryWithPath.patharry.length > 1 ? (
											<>
												<VehicleHistoryCardListItnary type='All' data={vehicleItnaryWithPath} view={'VehicleAllocationReport'} />
											</>
										) : (
											<p className='font-semibold text-lg'>No data found for the selected dates</p>
										)}
									</div>
								),
							},
							{
								key: 'diagnostic-report',
								label: `Diagnostic Report`,
								children: (
									<div className='w-[950px] h-[600px] relative'>
										{vehicleItnaryWithPath.diagnosticData && vehicleItnaryWithPath.diagnosticData.length > 1 ? (
											<>
												<DiagnosticCardList view='VehicleAllocationReport' />
											</>
										) : (
											<p className='font-semibold text-lg'>No data found for the selected dates</p>
										)}
									</div>
								),
							},
							...(Number(userId) === 87162 || Number(parentUser) === 87162
								? [
										{
											key: 'temperature-report',
											label: `Temperature Report`,
											children: (
												<div className='w-[950px] h-[600px] relative'>
													{selectedData ? (
														<>
															<TemperatureReport selectedData={selectedData} />
														</>
													) : (
														<p className='font-semibold text-lg'>No data found for the selected dates</p>
													)}
												</div>
											),
										},
								  ]
								: []),
						]}
					/>
				</Modal>
			) : null}
		</>
	);
};
