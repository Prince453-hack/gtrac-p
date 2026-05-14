import { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import calculateDistanceBetweenTwoPoints from './calculateDistanceBetweenTwoPoints';
import { VehicleItnaryWithPath } from '../_globalRedux/services/types/getItnaryWithMapResponse';
import { setLiveVehicleItnaryWithPath } from '../_globalRedux/dashboard/liveVehicleSlice';
import { setAllMarkers } from '../_globalRedux/dashboard/markersSlice';
import { Markers } from '../_globalRedux/services/types/getListVehiclesmobTypes';
import { SelectedVehicleState, setSelectedVehicleBySelectElement } from '../_globalRedux/dashboard/selectedVehicleSlice';

const updateSingleVehicleMovement = ({
	dispatch,
	vehicleItnaryWithPath,
	currentVehicleLocationData,
	liveVehicleItnaryWithPath,
	markers,
	selectedVehicle,
}: {
	dispatch: Dispatch<UnknownAction>;
	vehicleItnaryWithPath: VehicleItnaryWithPath;
	currentVehicleLocationData: GetCurrentLocationResponse;
	liveVehicleItnaryWithPath: VehicleItnaryWithPath;
	markers: Markers[];
	selectedVehicle: SelectedVehicleState;
}) => {
	if (liveVehicleItnaryWithPath.patharry.length === 0) {
		dispatch(
			setLiveVehicleItnaryWithPath({
				...vehicleItnaryWithPath,

				patharry: [
					{
						lat: currentVehicleLocationData.list.latLngDtl.lat,
						lng: currentVehicleLocationData.list.latLngDtl.lng,
						bearing: currentVehicleLocationData.list.angle,
						distance: 0,
						location: currentVehicleLocationData.list.latLngDtl.addr,
						nearestPoi: '',
						datetime: currentVehicleLocationData.list.latLngDtl.gpstime,
						speed: currentVehicleLocationData.list.speed,
					},
				],
			})
		);
	} else if (liveVehicleItnaryWithPath.patharry.length > 0) {
		const totalDistance = calculateDistanceBetweenTwoPoints(
			{
				lat: liveVehicleItnaryWithPath.patharry[liveVehicleItnaryWithPath.patharry.length - 1].lat,
				lng: liveVehicleItnaryWithPath.patharry[liveVehicleItnaryWithPath.patharry.length - 1].lng,
			},
			{ lat: currentVehicleLocationData.list.latLngDtl.lat, lng: currentVehicleLocationData.list.latLngDtl.lng }
		);

		// dispatch(
		// 	setVehicleItnaryWithPath({
		// 		...vehicleItnaryWithPath,

		// 		patharry: [
		// 			...(vehicleItnaryWithPath.patharry.length >= 1 && vehicleItnaryWithPath.patharry[0].lat !== 0 && vehicleItnaryWithPath.patharry[0].lng !== 0
		// 				? vehicleItnaryWithPath.patharry
		// 				: []),
		// 			{
		// 				lat: currentVehicleLocationData.list.latLngDtl.lat,
		// 				lng: currentVehicleLocationData.list.latLngDtl.lng,
		// 				bearing: vehicleItnaryWithPath.patharry[vehicleItnaryWithPath.patharry.length - 1].bearing,
		// 				distance: totalDistance,
		// 				location: currentVehicleLocationData.list.latLngDtl.addr,
		// 				nearestPoi: vehicleItnaryWithPath.patharry[vehicleItnaryWithPath.patharry.length - 1].nearestPoi,
		// 				datetime: currentVehicleLocationData.list.latLngDtl.gpstime,
		// 				speed: currentVehicleLocationData.list.speed,
		// 			},
		// 		],
		// 	})
		// );

		dispatch(
			setLiveVehicleItnaryWithPath({
				...vehicleItnaryWithPath,

				patharry: [
					...(liveVehicleItnaryWithPath.patharry.length >= 1 &&
					liveVehicleItnaryWithPath.patharry[0].lat !== 0 &&
					liveVehicleItnaryWithPath.patharry[0].lng !== 0
						? liveVehicleItnaryWithPath.patharry
						: []),
					{
						lat: currentVehicleLocationData.list.latLngDtl.lat,
						lng: currentVehicleLocationData.list.latLngDtl.lng,
						bearing: currentVehicleLocationData.list.angle,
						distance: totalDistance,
						location: currentVehicleLocationData.list.latLngDtl.addr,
						nearestPoi: '',
						datetime: currentVehicleLocationData.list.latLngDtl.gpstime,
						speed: currentVehicleLocationData.list.speed,
					},
				],
			})
		);

		dispatch(
			setSelectedVehicleBySelectElement({
				...selectedVehicle,
				gpsDtl: { ...selectedVehicle.gpsDtl, latLngDtl: currentVehicleLocationData.list.latLngDtl },
			})
		);
	}

	setTimeout(() => {
		dispatch(
			setAllMarkers(
				markers.map((vehicle) =>
					Number(vehicle.vId) === Number(selectedVehicle.vId)
						? {
								...vehicle,
								vehicleState: currentVehicleLocationData.list.mode,
								visibility: true,
								isMarkerInfoWindowOpen: false,
								gpsDtl: {
									...vehicle.gpsDtl,
									latLngDtl: currentVehicleLocationData.list.latLngDtl,
									speed: currentVehicleLocationData.list.speed,
									ignState: currentVehicleLocationData.list.ignState,
									acState: currentVehicleLocationData.list.aconoff,
									volt: currentVehicleLocationData.list.volt,
									fuel: currentVehicleLocationData.list.fuel,
									mode: currentVehicleLocationData.list.mode,
									modeTime: currentVehicleLocationData.list.modeTime,
									modeTimeFormat: '',
									angle: currentVehicleLocationData.list.angle,
									cellId: currentVehicleLocationData.list.cellId,
									gpsStatus: currentVehicleLocationData.list.gpsStatus,
									main_powervoltage: currentVehicleLocationData.list.main_powervoltage,
									tel_rfid: currentVehicleLocationData.list.tel_rfid,
									tel_odometer: currentVehicleLocationData.list.tel_odometer,
								},
						  }
						: { ...vehicle, visibility: false, isMarkerInfoWindowOpen: false }
				)
			)
		);
	}, 1000);
};

export default updateSingleVehicleMovement;
