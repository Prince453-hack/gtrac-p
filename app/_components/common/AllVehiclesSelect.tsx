'use client';

import { useGetAllVehiclesQuery } from '@/app/_globalRedux/services/trackingDashboard';
import { RootState } from '@/app/_globalRedux/store';
import { ConfigProvider, Select } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

function AllVehiclesSelect({
	selectedVehicleOption,
	setSelectedVehicleOption,
	allowClear = false,
}: {
	selectedVehicleOption: { label: string; value: number } | undefined;
	setSelectedVehicleOption: React.Dispatch<
		React.SetStateAction<
			| {
					label: string;
					value: number;
			  }
			| undefined
		>
	>;
	allowClear?: boolean;
}) {
	const { groupId: token } = useSelector((state: RootState) => state.auth);

	const { data, isLoading: isAllVehiclesListLoading } = useGetAllVehiclesQuery({
		token,
	});

	const customSelectOptions = data
		? [...data.list.map((vehicle: GetAllVehiclesListResponse['list'][0]) => ({ label: vehicle.veh_reg, value: vehicle.id }))]
		: [];

	const filterOption = (input: string, option?: { label: string; value: number }) =>
		(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

	return (
		<ConfigProvider
			theme={{
				components: {
					Select: {
						borderRadiusLG: 6,
					},
				},
				token: {
					colorTextPlaceholder: '#aaa',
				},
			}}
		>
			<Select
				value={selectedVehicleOption?.value}
				className='w-[200px]'
				onChange={(_, option) => {
					if (!Array.isArray(option)) {
						setSelectedVehicleOption(option);
					}
				}}
				placeholder='Select Vehicle'
				options={customSelectOptions}
				filterOption={filterOption}
				showSearch
				loading={isAllVehiclesListLoading}
				size='middle'
				allowClear={allowClear}
				onClear={() => setSelectedVehicleOption(undefined)}
			/>
		</ConfigProvider>
	);
}

export default AllVehiclesSelect;
