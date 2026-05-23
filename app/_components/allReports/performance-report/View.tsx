'use client';

import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Spin, Tabs } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { operatorFilterFn } from '@/app/helpers/customTableFilterFns';
import { useLazyGetPerformanceKmQuery } from '@/app/_globalRedux/services/trackingReport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header';
import { RootState } from '@/app/_globalRedux/store';
import { useSelector } from 'react-redux';
import NoData from '@/public/assets/svgs/common/no_data.svg';
import moment from 'moment';
import Image from 'next/image';
import CustomTableN, { DownloadReportTs } from '../../common/CustomTableN';
import { DownloadReportsModal } from '../../common';

interface TableRow {
	[key: string]: any;
}

interface GetPerformanceReportFormattedData extends GetPerformanceReportResponse {
	list: (GetPerfromanceReportList & { title: string })[];
}

export const View = () => {
	const { groupId, userId, parentUser } = useSelector((state: RootState) => state.auth);

	const [formatedData, setFormatedData] = useState<GetPerformanceReportFormattedData['list']>([]);
	const [getPerformanceKMTrigger, { isLoading: isPerformanceKmLazyLoading }] = useLazyGetPerformanceKmQuery();
	const [isLocalLoading, setIsLocalLoading] = useState(false);
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [downloadReport, setDownloadReport] = useState<DownloadReportTs | undefined>();
	const [selectedVehicleOption, setSelectedVehicleOption] = useState<{ label: string; value: number } | undefined>(undefined);

	const columns = useMemo(() => {
		const cols: ColumnDef<TableRow>[] = [
			{
				id: 'vehicleNum',
				header: 'Vehicle No',
				cell: () => <div>{selectedVehicleOption?.label}</div>,
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'km',
				id: 'km',
				header: 'Km',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
			{
				accessorKey: 'dateof',
				id: 'dateof',
				header: 'Date',
				footer: (props) => props.column.id,
				filterFn: (row, id, value) => operatorFilterFn(row, id, value),
			},
		];
		return cols;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formatedData]);

	// const onDownloadBtnClick = (vehicles: ContinuousJourneyReportFormattedData['list']) => {
	// 	const rows = vehicles.map((vehicle, index: number) => {
	// 		const obj = {
	// 			['Vehicle Number']: vehicle.vehicleNum,
	// 			['Start Date Time']: vehicle.Start_Time,
	// 			['End Date Time']: vehicle.End_Time,
	// 			['Start Location']: vehicle.Start_Location,
	// 			['End Location']: vehicle.End_Location,
	// 			['Duratrion']: vehicle.duration,
	// 			['Km Run in this duration']: vehicle.Total_KM ? `${vehicle.Total_KM.toFixed(2)}` : '0',
	// 		};

	// 		const result: { [key: string]: any } = {};
	// 		columns.forEach((column) => {
	// 			if (column.header) {
	// 				result[column.header.toString()] = obj[column.header.toString() as keyof typeof obj];
	// 			}
	// 		});
	// 		return result;
	// 	});

	// 	const head = Object.keys(rows[0]);

	// 	const body = rows.map((row) => Object.values(row));

	// 	setDownloadReport({
	// 		title: `Continuous Journey Report`,
	// 		excel: { title: `Continuous Journey Report`, rows, footer: [] },
	// 		pdf: { head: [head], body: body, title: `Continuous Journey Report`, pageSize: 'a3' },
	// 	});
	// };

	const onSubmit = async ({
		selectedMonth,
		selectedVehicle,
		selectedYear,
		yearOrMonth,
	}: {
		selectedMonth: string | undefined;
		selectedVehicle: { label: string; value: number } | undefined;
		selectedYear: string | undefined;
		yearOrMonth: { value: string; label: string };
	}) => {
		if (!selectedYear || !yearOrMonth || !selectedVehicle) return;
		if (yearOrMonth.value === 'month' && !selectedMonth) return;

		setIsLocalLoading(true);
		setFormatedData([]);
		let startDate = '';
		let endDate = '';

		if (yearOrMonth.value === 'year') {
			startDate = `${selectedYear}-01-01`;
			endDate = `${selectedYear}-12-31`;
		} else if (yearOrMonth.value === 'month') {
			startDate = moment(`${selectedYear}-${selectedMonth}-01`).startOf('month').format('YYYY-MM-DD');
			endDate = moment(`${selectedYear}-${selectedMonth}-01`).endOf('month').format('YYYY-MM-DD');
		}

		await getPerformanceKMTrigger({
			token: groupId,
			userId: userId,
			startDate,
			endDate,
			vId: selectedVehicle ? `${selectedVehicle.value}` : '',
			kmType: yearOrMonth.value.toUpperCase(),
		}).then(({ data }) => {
			if (!data) return;

			setFormatedData(data.list.map((vehicle) => ({ ...vehicle, title: `${moment(vehicle.dateof).get('date')}` })));
		});

		setTimeout(() => {
			setIsLocalLoading(false);
		}, 2000);
	};

	const onDownloadBtnClick = () => {
		const rows = formatedData.map((data, index) => {
			const obj = {
				['Vehicle No']: selectedVehicleOption?.label,
				['Km']: data.km,
				['Date']: data.dateof,
			};

			const result: { [key: string]: any } = {};
			columns.forEach((column) => {
				if (column.header) {
					result[column.header.toString()] = obj[column.header.toString() as keyof typeof obj];
				}
			});
			return result;
		});

		const head = Object.keys(rows[0]);

		const body = rows.map((row) => Object.values(row));

		setDownloadReport({
			title: `${selectedVehicleOption?.label}: Performance Report`,
			excel: { title: `${selectedVehicleOption?.label}: Performance Report`, rows, footer: [] },
			pdf: { head: [head], body: body, title: `${selectedVehicleOption?.label}: Performance Report`, pageSize: 'a3' },
		});
	};

	return (
		<div className='h-[calc(100vh-204px)] relative'>
			<Header
				onSubmit={onSubmit}
				handleDownloadBtnClick={() => onDownloadBtnClick()}
				selectedVehicleOption={selectedVehicleOption}
				setSelectedVehicleOption={setSelectedVehicleOption}
			/>
			<DownloadReportsModal downloadReport={downloadReport} setDownloadReport={setDownloadReport} />
			{isLocalLoading || isPerformanceKmLazyLoading ? (
				<div className='w-full h-full flex justify-center items-center'>
					<Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
				</div>
			) : (
				<div className='px-5'>
					<Tabs
						defaultActiveKey='1'
						items={[
							{
								label: 'Bar View',
								key: 'bar-view',
								children:
									formatedData.length === 0 ? (
										<div className='w-full h-full flex flex-col justify-center items-center mt-40'>
											<div>
												<Image src={NoData} alt='TableView' width={60} height={60} />
											</div>
											<div>
												<p className='text-lg font-medium text-center mt-3 text-[#4FB090]'>No Data, try a different filter.</p>
											</div>
										</div>
									) : (
										<div className='w-[calc(100%-100px)] h-[calc(100vh-300px)] mt-10 flex flex-col justify-center items-center'>
											<ResponsiveContainer width='100%' height='100%'>
												<BarChart
													data={formatedData}
													margin={{
														top: 5,
														right: 30,
														left: 20,
														bottom: 5,
													}}
													barSize={30}
												>
													{formatedData.length > 12 ? (
														<XAxis dataKey='title' scale='point' padding={{ left: 10, right: 10 }} />
													) : (
														<XAxis dataKey='dateof' scale='point' padding={{ left: 10, right: 10 }} />
													)}

													<YAxis />
													<RechartsTooltip />
													<Legend />
													<CartesianGrid strokeDasharray='3 3' />
													<Bar dataKey='km' fill='#4FB090' background={{ fill: '#eee' }} />
												</BarChart>
											</ResponsiveContainer>
										</div>
									),
							},
							{
								label: 'Table View',
								key: 'table-view',
								children:
									formatedData.length === 0 ? (
										<div className='w-full h-full flex flex-col justify-center items-center  mt-40'>
											<div>
												<Image src={NoData} alt='TableView' width={60} height={60} />
											</div>
											<div>
												<p className='text-lg font-medium text-center mt-3 text-[#4FB090]'>No Data, try a different filter.</p>
											</div>
										</div>
									) : (
										<div className='w-[500px] max-w-[500px]'>
											<CustomTableN
												columns={columns}
												data={formatedData}
												loading={isLocalLoading || isPerformanceKmLazyLoading}
												height={'h-[calc(100vh-270px)]'}
												onDownloadBtnClick={() => {}}
												downloadReport={undefined}
												setDownloadReport={() => {}}
												showDownloadBtn={false}
											/>
										</div>
									),
							},
						]}
					/>
				</div>
			)}
		</div>
	);
};
