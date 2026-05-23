'use client';

import { RootState } from '@/app/_globalRedux/store';
import { Tooltip } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DownloadReportsModal } from '../common';
import excelDownload from '@/public/assets/svgs/common/excel-download.svg';
import Image from 'next/image';
import { DownloadReportTs } from '../common/CustomTableN';

const CheckInAccountDownloadButton = () => {
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const checkInData = useSelector((state: RootState) => state.checkIndData);

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
					width='32'
					height='32'
					className='cursor-pointer hover:opacity-80 transition-opacity duration-300'
					onClick={() => {
						const getReport = (path: RawData) => {
							return {
								Username: selectedVehicle.vehReg?.split('_')?.join(' '),
								'Check-in Time': path.gps_time,
								'Check-in Location': path.geostreet?.split('_')?.join(' '),
							};
						};

						const rows = checkInData.map((path) => getReport(path));

						const head = Object.keys(rows[0]);

						const body = rows.map((row) => Object.values(row));

						setDownloadReport({
							title: `Check In Report`,
							excel: { title: `Check In Report`, rows, footer: undefined },
							pdf: {
								head: [head],
								body: body,
								title: `Check In Report`,
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

export default CheckInAccountDownloadButton;

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
