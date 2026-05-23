import { GatewayRailCurrentTrip } from '../_globalRedux/services/types/gatewayRailCurrentTripsResponse';
import { VehicleData } from '../_globalRedux/services/types/getListVehiclesmobTypes';

export interface MergedGatewayRailTrip {
	id: number;
	vehId: number;
	vehicle_no: string;
	TripStartDate: string;
	Driver_name: string;
	gr_no: string;
	billing_party_name: string;
	booking_type: string;
	document_no: string;
	container_no: string;
	['Importer NAME']: string;
	shipping_line_name: string;
	['Container Combination']: number;
	site_reporting_time: string;
	route: string;
	header_tripstatus: number;
	segment: number;
	timeupdate: string;
	TIMESTAMP: string;
	size: number;
	['gps Site parking IN DATE TIME']?: string;
	['gps Site parking OUT DATE TIME']?: string;
	legs: {
		location: string;
		inboundTime?: string;
		outboundTime?: string;
		legUpdateTime?: string;
		line_no: number;
		haltAtSource?: string;
		haltAtDestination?: string;
		transitTime: number;
		actualTransitTime: string;
		lat: number;
		lng: number;
	}[];
	totalTransitTime: number;
	locationToCheckTheToAgainst: string;
	currentLocation: string;
	currentTime: string;
}

export function mergeRailTrips(
	trips: (GatewayRailCurrentTrip & { currentLocation: VehicleData | undefined })[] | undefined
): MergedGatewayRailTrip[] {
	if (trips === undefined) return [];

	// Group trips by gr_no and ensure unique Line No_ per gr_no
	const tripMap = new Map<string, Map<number, GatewayRailCurrentTrip & { currentLocation: VehicleData | undefined }>>();
	for (const trip of trips) {
		if (!tripMap.has(trip.gr_no)) {
			tripMap.set(trip.gr_no, new Map());
		}
		tripMap.get(trip.gr_no)!.set(trip['Line No_'], trip);
	}

	const mergedTrips: MergedGatewayRailTrip[] = [];

	for (const [gr_no, legMap] of tripMap) {
		// Extract trips in sorted Line No_ order
		const lineNos = Array.from(legMap.keys()).sort((a, b) => a - b);
		const legs = lineNos.map((lineNo) => legMap.get(lineNo)!);

		const firstLeg = legs[0];
		let tempLocationToCheckTheToAgainst = '';
		// Build legs array with flatMap
		const mergedLegs = legs.flatMap((leg, index) => {
			const common = {
				legUpdateTime: leg.update_time,
				haltAtSource: leg.haltingAtsource,
				haltAtDestination: leg.haltingAtDestination,
				transitTime: leg['Transit TIME'],
				actualTransitTime: leg['Actual Transit TIME'],
			};
			if (leg['Active Leg'] === 1) {
				tempLocationToCheckTheToAgainst = leg['TO Location'];
			}
			if (index === 0) {
				// First leg: emit both FROM and TO points
				return [
					{
						location: leg['FROM Location'],
						inboundTime: leg['gps Site RELEASE IN DATE TIME'],
						outboundTime: leg['gps Site RELEASE OUT DATE TIME'],
						lat: leg.site_relase_gps_latitude,
						line_no: leg['Line No_'],
						lng: leg.site_realse_gps_longitude,
						...common,
					},
					{
						location: leg['TO Location'],
						inboundTime: leg['gps Site Reporting IN DATE TIME'],
						line_no: leg['Line No_'] + 10000,
						outboundTime: leg['gps Site Reporting OUT DATE TIME'],
						lat: leg.sitereporting_gps_latitude,
						lng: leg.sitereporting_gps_longitude,
						...common,
					},
				];
			}

			// Subsequent legs (including last): only emit the TO point
			return [
				{
					location: leg['TO Location'],
					inboundTime: leg['gps Site Reporting IN DATE TIME'],
					line_no: leg['Line No_'],
					outboundTime: leg['gps Site Reporting OUT DATE TIME'],
					lat: leg.sitereporting_gps_latitude,
					lng: leg.sitereporting_gps_longitude,
					...common,
				},
			];
		});

		// Sum up total transit time
		const totalTransitTime = legs.reduce((sum, leg) => sum + leg['Transit TIME'], 0);

		// Construct merged trip
		mergedTrips.push({
			id: firstLeg.id,
			vehId: firstLeg.vehId,
			vehicle_no: firstLeg.vehicle_no,
			TripStartDate: firstLeg.TripStartDate,
			Driver_name: firstLeg.Driver_name,
			gr_no: firstLeg.gr_no,
			billing_party_name: firstLeg.billing_party_name,
			booking_type: firstLeg.booking_type,
			document_no: firstLeg.document_no,
			container_no: firstLeg.container_no,
			route: firstLeg.route,
			header_tripstatus: firstLeg.header_tripstatus,
			timeupdate: firstLeg.timeupdate,
			TIMESTAMP: firstLeg.TIMESTAMP,
			size: firstLeg.size,
			legs: mergedLegs,
			['Importer NAME']: firstLeg['Importer NAME'],
			segment: firstLeg.segment,
			['Container Combination']: firstLeg['Container Combination'],
			['gps Site parking IN DATE TIME']: firstLeg['gps Site parking IN DATE TIME'],
			['gps Site parking OUT DATE TIME']: firstLeg['gps Site parking OUT DATE TIME'],
			shipping_line_name: firstLeg.shipping_line_name,
			site_reporting_time: firstLeg.site_reporting_time,
			totalTransitTime,
			locationToCheckTheToAgainst: tempLocationToCheckTheToAgainst,
			currentLocation: firstLeg.currentLocation?.gpsDtl.latLngDtl.addr?.replaceAll('_', ' ') || '',
			currentTime: firstLeg.currentLocation?.gpsDtl.latLngDtl.gpstime || '',
		});
	}

	return mergedTrips;
}
