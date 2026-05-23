'use client';

import { Button, ConfigProvider, Row, Table, TableColumnsType } from 'antd';
import { DownloadReportsModal } from '../../common';
import { useState } from 'react';
import { DownloadReportTs } from '../../common/CustomTableN';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import getExtraKm from '@/app/helpers/getExtraKm';
import { useLazyGetRawWithDateQuery } from '@/app/_globalRedux/services/trackingDashboard';
import useWindowSize from '@/app/hooks/useWindowSize';

export const CustomDetailedReport = ({
	columns,
	selectedVehicleOption,
	data,
	scroll_y,
	startDate,
	endDate,
	interval,
	isLoading,
}: {
	columns: TableColumnsType<RawData>;
	selectedVehicleOption: number;
	data: RawData[];
	scroll_y: string;
	isLoading: boolean;
	startDate: string;
	endDate: string;
	interval: string;
}) => {
	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const { extra, userId } = useSelector((state: RootState) => state.auth);
	const totalWidth = columns.reduce((sum, column) => sum + (Number(column.width) || 100), 0);
	const [downloadReportLoading, setDownloadReportLoading] = useState(false);
	const windowHeight = useWindowSize().height;
	const windowHeightMinusExtra = windowHeight - 320;

	const [fetchGetRawWithDateWithLocation] = useLazyGetRawWithDateQuery();

	return (
		<div className={`h-[${scroll_y}]`}>
			<ConfigProvider
				theme={{
					components: {
						Table: {
							headerBg: '#F6F8F6',
							borderColor: '#dddddd',
							rowHoverBg: '#E9EFEB',
							// wireframe:
						},
						Pagination: {
							itemBg: '#E9EFEB',
						},
					},
				}}
			>
				<Table
					columns={columns}
					dataSource={data}
					rowClassName='bg-[#F6F8F6]'
					loading={isLoading || downloadReportLoading}
					className='mx-2'
					virtual={true}
					bordered={true}
					pagination={false}
					scroll={{ y: windowHeightMinusExtra, x: totalWidth }}
					footer={() => (
						<Row justify='space-between'>
							<div className='flex gap-4'>
								<Button
									onClick={() => {
										setDownloadReportLoading(true);

										fetchGetRawWithDateWithLocation({ userId: Number(userId), vehId: selectedVehicleOption, startDate, endDate, interval })
											.then((data) => {
												const tempData = data.data;
												if (tempData) {
													const rows = tempData.rawdata.map((vehicle, index: number) => {
														const additionalData = {
															RPM: vehicle?.rpm ? `${vehicle?.rpm} rpm` : '0 rpm',
															Ignition:
																(Array.isArray(vehicle?.tel_input_0?.data) &&
																	vehicle?.tel_input_0?.data.length > 0 &&
																	vehicle?.tel_input_0?.data[0]) ||
																((typeof vehicle?.tel_input_0 === 'string' || typeof vehicle?.tel_input_0 === 'number') &&
																	Number(vehicle?.tel_input_0) === 1)
																	? 'True'
																	: 'False',
															Panic:
																(Array.isArray(vehicle?.tel_input_1) && vehicle?.tel_input_1.length > 0 && vehicle?.tel_input_1[0]) ||
																((typeof vehicle?.tel_input_1 === 'string' || typeof vehicle?.tel_input_1 === 'number') &&
																	Number(vehicle?.tel_input_1) === 1)
																	? 'True'
																	: 'False',
															Ac:
																(Array.isArray(vehicle?.tel_input_2) && vehicle?.tel_input_2.length > 0 && vehicle?.tel_input_2[0]) ||
																((typeof vehicle?.tel_input_2 === 'string' || typeof vehicle?.tel_input_2 === 'number') &&
																	Number(vehicle?.tel_input_2) === 1)
																	? 'True'
																	: 'False',
															Door:
																(Array.isArray(vehicle?.tel_input_3) && vehicle?.tel_input_3.length > 0 && vehicle?.tel_input_3[0]) ||
																((typeof vehicle?.tel_input_3 === 'string' || typeof vehicle?.tel_input_3 === 'number') &&
																	Number(vehicle?.tel_input_3) === 1)
																	? 'True'
																	: 'False',
															Temperature: vehicle?.tel_temperature,
															Fuel: vehicle?.tel_fuel ? vehicle?.tel_fuel.toFixed(2) : '',
															Voltage: vehicle?.tel_voltage ? vehicle?.tel_voltage.toFixed(2) : '',
															['Main Power Voltage']: vehicle?.main_powervoltage ? vehicle?.main_powervoltage.toFixed(2) : '',
															['OBD Odometer']: vehicle?.tel_odometer ? vehicle?.tel_odometer.toFixed(2) : '',
														};
														return {
															'S. No.': index + 1,
															'Vehicle No.': selectedVehicleOption,
															'GPS Time': vehicle?.gpstimeformatted,
															Location: vehicle?.location ? vehicle?.location?.replaceAll('_', ' ') : '',
															'Lat-Lng': `${vehicle?.gps_latitude.toFixed(2)}-${vehicle?.gps_longitude.toFixed(2)}`,
															Speed: vehicle?.gps_speed ? `${vehicle?.gps_speed.toFixed(2)} Km/h` : '0 Km/h',
															Distance: vehicle?.jny_distance ? `${vehicle?.jny_distance.toFixed(2)} km` : '0 km',
															Odometer: vehicle?.jny_status
																? `${
																		Number(extra) === 0 || isNaN(Number(extra))
																			? Number(vehicle?.jny_status)?.toFixed(2)
																			: getExtraKm(Number(vehicle?.jny_status) ?? 0, extra).toFixed(2)
																  } km`
																: '0 km',
															...(Number(userId) !== 87318 && Number(userId) !== 87101 ? additionalData : {}),
														};
													});

													const head = Object.keys(rows[0]);

													const body = rows.map((row) => Object.values(row));

													setDownloadReport({
														title: 'Detailed Report',
														excel: { title: 'Detailed Report', rows, footer: [] },
														pdf: {
															head: [head],
															body: body,
															title: 'Detailed Report',
															pageSize: 'a2',
															userOptions: {
																columnStyles: {
																	0: { cellWidth: 15 },
																},
															},
														},
													});
												}
											})
											.finally(() => setDownloadReportLoading(false));
									}}
								>
									Download Details Report
								</Button>
								<DownloadReportsModal downloadReport={downloadReport} setDownloadReport={setDownloadReport} />
							</div>

							{data && data.length > 1 ? <span className='font-bold text-gray-700'>Total Records: {data?.length}</span> : null}
						</Row>
					)}
				/>
			</ConfigProvider>
		</div>
	);
};

interface Rows {
	'S. No.': number;
	'Vehicle No.': string | undefined;
	'GPS Time': string;
	Location: string;
	'Lat-Lng': string;
	Distance: string;
	Odometer: string;
	Ignition: string;
	Panic: string;
	Ac: string;
	Door: string;
	Temperature: number | null;
	Fuel: string;
	Voltage: string;
	['Main Power Voltage']: string;
	['OBD Odometer']: string;
}
