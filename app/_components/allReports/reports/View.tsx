'use client';

import { Button, ConfigProvider } from 'antd';
import React, { useState } from 'react';
import CustomDatePicker from '../../common/datePicker';
import { setHours, setMinutes } from 'date-fns';
import AllVehiclesSelect from '../../common/AllVehiclesSelect';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import {
	useLazyGetItineraryvehIdBDateNwStQuery,
	useLazyGetpathwithDateDaignosticQuery,
	useLazyGetTempWithDateQuery,
} from '@/app/_globalRedux/services/trackingDashboard';
import moment from 'moment';
import CustomTableN, { DownloadReportTs } from '../../common/CustomTableN';
import { ReportSelect } from '../../common/ReportSelect';
import { downloadReportHandler } from './helper/downloadReportHandler';
import { getColumnsBySelectedReport } from './helper/getColumnsBySelectedReport';
import IntervalSelect from './helper/intervalSelect';

export const View = () => {
	const { userId } = useSelector((state: RootState) => state.auth);

	const [getVehicleItinerary] = useLazyGetItineraryvehIdBDateNwStQuery();
	const [getPathDiagnostic] = useLazyGetpathwithDateDaignosticQuery();
	const [fetchCurrentMonth] = useLazyGetTempWithDateQuery();

	const [customDateRange, setCustomDateRange] = useState([setHours(setMinutes(new Date(), 0), 0), new Date()]);
	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [selectedVehicleOption, setSelectedVehicleOption] = useState<{ label: string; value: number } | undefined>(undefined);
	const [selectedReport, setSelectedReport] = useState({ label: 'Journey Report', value: 0 });

	const [selectedReportData, setSelectedReportData] = useState<any[]>([]);
	const [reportsLoading, setReportsLoading] = useState(false);
	const [selectedInterval, setSelectedInterval] = useState<{ label: string; value: number }>({ value: 5, label: '5 minutes' });

	const getSelectedReportData = async (selectedReport: { label: string; value: number }) => {
		if (!selectedVehicleOption) return;
		setReportsLoading(true);
		switch (selectedReport.label) {
			case 'Journey Report':
				const { data: vehicleListData } = await getVehicleItinerary({
					userId: userId,
					vId: selectedVehicleOption.value,
					startDate: customDateRange[0] ? moment(customDateRange[0]).format('YYYY-MM-DD HH:mm') : '',
					endDate: customDateRange[1] ? moment(customDateRange[1]).format('YYYY-MM-DD HH:mm') : '',
					requestFor: 0,
				});
				vehicleListData && setSelectedReportData(vehicleListData.data);
				setReportsLoading(false);
				break;
			case 'Diagnostic Report':
				const { data: diagnosticData } = await getPathDiagnostic({
					userId: userId,
					vId: selectedVehicleOption.value,
					startDate: customDateRange[0] ? moment(customDateRange[0]).format('YYYY-MM-DD HH:mm') : '',
					endDate: customDateRange[1] ? moment(customDateRange[1]).format('YYYY-MM-DD HH:mm') : '',
				});
				diagnosticData && setSelectedReportData(diagnosticData.data);
				setReportsLoading(false);
				break;
			case 'Temperature Report':
				const temperatureReportData = await fetchCurrentMonth({
					userId: Number(userId),
					vId: selectedVehicleOption ? selectedVehicleOption.value : 0,
					startDateTime: moment(customDateRange[0]).format('YYYY-MM-DD HH:mm'),
					endDateTime: moment(customDateRange[1]).format('YYYY-MM-DD HH:mm'),
					interval: selectedInterval.value,
				});
				temperatureReportData.data && setSelectedReportData(temperatureReportData.data.rawdata);

				setReportsLoading(false);
			default:
				setSelectedReportData([]);
				setReportsLoading(false);
				break;
		}
	};

	return (
		<div className='p-5'>
			<div className='w-full flex items-end justify-between mb-10'>
				<ReportSelect selectedReport={selectedReport} setSelectedReport={setSelectedReport} />

				<div className='flex items-start gap-3'>
					{selectedReport.label === 'Temperature Report' && (
						<IntervalSelect selectedInterval={selectedInterval} setSelectedInterval={setSelectedInterval} />
					)}
					<div>
						<CustomDatePicker dateRange={customDateRange} setDateRange={setCustomDateRange} datePickerStyles='py-[5px] text-sm' />
					</div>
					<AllVehiclesSelect selectedVehicleOption={selectedVehicleOption} setSelectedVehicleOption={setSelectedVehicleOption} />
					<ConfigProvider
						theme={{
							components: {
								Button: {
									borderRadiusLG: 6,
									paddingLG: 0,
									fontSizeLG: 14,
								},
							},
						}}
					>
						<div>
							<Button
								type='primary'
								onClick={() => getSelectedReportData(selectedReport)}
								size='middle'
								disabled={!selectedVehicleOption}
								loading={reportsLoading}
							>
								Submit
							</Button>
						</div>
					</ConfigProvider>
				</div>
			</div>

			<CustomTableN
				columns={getColumnsBySelectedReport({ selectedReport })}
				data={selectedReportData}
				loading={reportsLoading}
				onDownloadBtnClick={() => downloadReportHandler({ selectedReportLabel: selectedReport.label, data: selectedReportData, setDownloadReport })}
				downloadReport={downloadReport}
				setDownloadReport={setDownloadReport}
				height='max-h-[calc(100vh-220px)]'
			/>
		</div>
	);
};
