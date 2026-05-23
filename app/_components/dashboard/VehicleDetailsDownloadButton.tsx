'use client';

import { RootState } from '@/app/_globalRedux/store';
import { Tooltip } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DownloadReportsModal } from '../common';
import { VehicleItinaryData } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';
import excelDownload from '@/public/assets/svgs/common/excel-download.svg';
import Image from 'next/image';
import { DownloadReportTs } from '../common/CustomTableN';
import convertMinutesToHoursString from '@/app/helpers/convertMinutesToHoursString';
const VehicleDetailsDownloadButton = () => {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const { extra } = useSelector((state: RootState) => state.auth);

	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();

	return (
		<>
			<Tooltip
				title={selectedVehicle.selectedVehicleHistoryTab === 'Diagnostic' ? 'Download Diagnostic Report' : 'Download Journey Report'}
				mouseEnterDelay={1}
			>
				<Image
					src={excelDownload}
					alt='excel download icon'
					width='28'
					height='28'
					className='cursor-pointer -ml-0.5 -mt-1 hover:opacity-80 transition-opacity duration-300'
					onClick={() => {
						let totalStoppage = 0;
						let totalRunning = 0;

						const getReport = (path: VehicleItinaryData) => {
							totalStoppage += path.mode === 'Idle' ? Number(path.totalTimeInMIN) : 0;
							totalRunning += path.mode === 'Running' ? Number(path.totalTimeInMIN) : 0;

							return {
								'Vehicle No.': selectedVehicle.vehReg,
								Status: path.mode,
								'Start Location': path.startLocation?.replaceAll('_', ' '),
								'From Time': path.fromTime,
								'End Location': path.endLocation?.replaceAll('_', ' '),
								'To Time': path.toTime,
								'Time Taken': convertMinutesToHoursString(path.totalTimeInMIN),
								'Running Distance': path.totalDistance,
							};
						};

						const rows =
							selectedVehicle.selectedVehicleHistoryTab !== 'All'
								? vehicleItnaryWithPath.diagnosticData.map((path) => getReport(path))
								: vehicleItnaryWithPath.data.map((path) => getReport(path));

						const totalDistance =
							isNaN(Number(extra)) || Number(extra) == 0
								? Number(vehicleItnaryWithPath.totalDistance.split(' ')[0])
								: Number(vehicleItnaryWithPath.totalDistance.split(' ')[0]) +
								  (Number(vehicleItnaryWithPath.totalDistance.split(' ')[0]) * Number(extra)) / 100;
						// Create the footer row
						const footerRow = {
							'Vehicle No.': '',
							Status: '',
							'Start Location': '',
							'From Time': '',
							'End Location': '',
							'To Time': `${convertMinutesToHoursString(totalRunning)} Running`,
							'Time Taken': `${convertMinutesToHoursString(totalStoppage)} Stoppage`,
							'Running Distance': `${totalDistance.toFixed(0)} KM`,
						};

						const head = Object.keys(rows[0]);

						const body = rows.map((row) => Object.values(row));

						const bodyWithFooter = [...body, Object.values(footerRow)];

						setDownloadReport({
							title: `${selectedVehicle.selectedVehicleHistoryTab}Report`,
							excel: { title: `${selectedVehicle.selectedVehicleHistoryTab}Report`, rows, footer: footerRow },
							pdf: {
								head: [head],
								body: bodyWithFooter,
								title: `${selectedVehicle.selectedVehicleHistoryTab}Report`,
								pageSize: 'a3',
								userOptions: {
									columnStyles: {
										3: {
											cellWidth: 30,
										},
										5: {
											cellWidth: 30,
										},
										6: {
											cellWidth: 30,
										},
									},
								},
							},
						});
					}}
				/>
			</Tooltip>
			<DownloadReportsModal downloadReport={downloadReport} setDownloadReport={setDownloadReport} />
		</>
	);
};

export default VehicleDetailsDownloadButton;

interface Rows {
	'Vehicle No.': string;
	Status: 'Idle' | 'Running';
	'Start Location': string;
	'From Time': string;
	'End Location': string;
	'To Time': string;
	'Time Taken': string;
	'Running Distance': string;
}
