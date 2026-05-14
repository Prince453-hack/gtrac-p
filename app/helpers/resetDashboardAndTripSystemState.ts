'use client';

import { resetSelectedVehicle } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';
import { resetCollapseVehicleStatusToggle } from '@/app/_globalRedux/dashboard/collapseVehicleStatusToggleSlice';
import { resetHistoryReplay } from '@/app/_globalRedux/dashboard/historyReplaySlice';
import { resetIsVehicleDetailsCollapsed } from '@/app/_globalRedux/dashboard/isVehicleDetailsCollapsedSlice';
import { resetKmtAlerts } from '@/app/_globalRedux/dashboard/mapAlertIcons';
import { resetMapStylingAndOpenStoppageIndex } from '@/app/_globalRedux/dashboard/mapSlice';
import { resetNearbyVehicles } from '@/app/_globalRedux/dashboard/nearbyVehicleSlice';
import { resetOption } from '@/app/_globalRedux/dashboard/optionsSlice';
import { resetSelectedVehicleCustomRange } from '@/app/_globalRedux/dashboard/selectedVehicleCustomRangeSlice';
import { resetSelectedVehicleListTab } from '@/app/_globalRedux/dashboard/selectedVehicleListTab';

import { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { resetMarkers, setAllMarkersInVisible } from '../_globalRedux/dashboard/markersSlice';

const resetDashboardAndTripSystemState = (dispatch: Dispatch<UnknownAction>) => {
	// reset all dashboard states
	dispatch(resetCollapseVehicleStatusToggle());
	dispatch(resetHistoryReplay());
	dispatch(resetIsVehicleDetailsCollapsed());
	dispatch(resetKmtAlerts());
	dispatch(resetMapStylingAndOpenStoppageIndex());
	dispatch(resetMarkers());
	dispatch(resetNearbyVehicles());
	dispatch(resetOption());
	dispatch(resetSelectedVehicle());
	dispatch(resetSelectedVehicleCustomRange());
	dispatch(resetSelectedVehicleListTab());
};

export default resetDashboardAndTripSystemState;
