'use client';

import React, { useEffect, useState } from 'react';
import { RootState } from '@/app/_globalRedux/store';
import { ConfigProvider, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenStoppageIndex } from '@/app/_globalRedux/dashboard/mapSlice';
import { initialSelectedVehicleState, setSelectedVehicleBySelectElement } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';

type SelectedStyles = {
	selectorBg: string;
	colorBorder: string;
	fontSize: number;
	optionFontSize: number;
	optionPadding: string;
	optionSelectedColor: string;
	width?: string;
};

export const AllVehiclesSelect = ({ selectedStyles }: { selectedStyles: SelectedStyles }) => {
	const dispatch = useDispatch();

	const markers = useSelector((state: RootState) => state.markers);
	const allVehicles = useSelector((state: RootState) => state.allVehicles);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);

	const filterOption = (input: string, option?: { label: string; value: number }) =>
		(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

	const [customSelectOptions, setCustomSelectOptions] = useState<{ label: string; value: number }[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (allVehicles.length > 0 && allVehicles[0].id !== 0) {
			setCustomSelectOptions(
				allVehicles.map((vehicle: GetAllVehiclesListResponse['list'][0]) => ({
					label: vehicle.veh_reg,
					value: vehicle.id,
				}))
			);
			setIsLoading(false);
		}
	}, [allVehicles]);

	const searchSelectedVehicles = (e: number) => {
		const vehicleSelectedByFilter = markers.find((marker) => marker.vId === e);

		if (vehicleSelectedByFilter) {
			const vehicleController = allVehicles.find((vehicle) => vehicle.id === vehicleSelectedByFilter.vId)?.veh_body;
			dispatch(setOpenStoppageIndex(-1));
			dispatch(
				setSelectedVehicleBySelectElement({
					...vehicleSelectedByFilter,
					gpsDtl: { ...vehicleSelectedByFilter.gpsDtl, controllernum: vehicleController ?? '' },
					searchType: '',
					selectedVehicleHistoryTab: 'All',
					nearbyVehicles: [],
					prevVehicleSelected: selectedVehicle.prevVehicleSelected,
				})
			);
		} else {
			const vehicleIdAndReg = allVehicles.find((vehicle) => vehicle.id === e);

			if (!vehicleIdAndReg) return;

			dispatch(setOpenStoppageIndex(-1));

			dispatch(
				setSelectedVehicleBySelectElement({
					...initialSelectedVehicleState,
					vId: vehicleIdAndReg.id,
					vehReg: vehicleIdAndReg.veh_reg,
					gpsDtl: { ...initialSelectedVehicleState.gpsDtl, controllernum: vehicleIdAndReg.veh_body },
					searchType: '',
					selectedVehicleHistoryTab: 'All',
					nearbyVehicles: [],
				})
			);
		}
	};

	return (
		<ConfigProvider
			theme={{
				components: {
					Button: { borderRadius: 0 },
					Select: {
						...selectedStyles,
						paddingContentVertical: 0,
						borderRadius: 6,
					},
					Dropdown: {
						paddingBlock: 10,
					},
				},
				token: {
					colorTextPlaceholder: '#aaa',
				},
			}}
		>
			<div className='relative flex items-center'>
				<div className='border border-[#468B8] rounded-md'>
					<Select
						value={selectedVehicle?.vId !== 0 ? selectedVehicle?.vId : undefined}
						className={`${selectedStyles.width ? selectedStyles.width : 'w-[400px]'}`}
						placeholder='Search Vehicles'
						onChange={(e) => {
							searchSelectedVehicles(e);
						}}
						onClear={() => {
							dispatch(setSelectedVehicleBySelectElement(initialSelectedVehicleState));
						}}
						allowClear={true}
						options={customSelectOptions}
						showSearch
						filterOption={filterOption}
						disabled={isLoading}
						notFoundContent={'No Vehicles Found'}
						suffixIcon
					></Select>
				</div>
			</div>
		</ConfigProvider>
	);
};
