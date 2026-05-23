import { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { setAllMarkers } from '../_globalRedux/dashboard/markersSlice';
import { Markers } from '../_globalRedux/services/types/getListVehiclesmobTypes';

const updateMultiVehicleMovement = ({
	dispatch,
	currentVehicleLocationData,
	markers,
}: {
	dispatch: Dispatch<UnknownAction>;
	currentVehicleLocationData: GetCurrentLocationResponse;
	markers: Markers[];
}) => {
	setTimeout(() => {
		dispatch(
			setAllMarkers(
				markers.map((vehicle) =>
					Number(vehicle.vId) === Number(currentVehicleLocationData.list.vehid)
						? {
								...vehicle,
								vehicleState: currentVehicleLocationData.list.mode,
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
						: { ...vehicle }
				)
			)
		);
	}, 1000);
};

export default updateMultiVehicleMovement;
