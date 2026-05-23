'use client';

import { RootState } from '@/app/_globalRedux/store';
import { ConfigProvider, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

type SelectedStyles = {
	selectorBg: string;
	colorBorder: string;
	fontSize: number;
	optionFontSize: number;
	optionPadding: string;
	optionSelectedColor: string;
	width: string;
};

export const VehicleDetailsSelectMultiple = ({
	selectedStyles,
	customSelectOptions,
	setCustomSelectOptions,
}: {
	selectedStyles: SelectedStyles;
	customSelectOptions: { label: string; value: number }[];
	setCustomSelectOptions: React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>;
}) => {
	const allVehicles = useSelector((state: RootState) => state.allVehicles);
	const [allOptions, setAllOptions] = useState<{ label: string; value: number }[]>([]);

	useEffect(() => {
		if (allVehicles.length > 0 && allVehicles[0].id !== 0) {
			setAllOptions(
				allVehicles.map((vehicle: GetAllVehiclesListResponse['list'][0]) => ({
					label: vehicle.veh_reg,
					value: vehicle.id,
				}))
			);
		}
	}, [allVehicles]);

	const filterOption = (input: string, option?: { label: string; value: number }) =>
		(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

	return (
		<ConfigProvider
			theme={{
				components: {
					Select: {
						...selectedStyles,
						paddingContentVertical: 0,
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
			<Select
				value={customSelectOptions}
				placeholder='Search Vehicles'
				onSelect={(e: unknown) => {
					const selectedVehicle = allOptions.find((item) => item.value === e);
					if (selectedVehicle) {
						setCustomSelectOptions([...customSelectOptions, selectedVehicle]);
					}
				}}
				className={`w-[${selectedStyles.width}]`}
				onDeselect={(value) => {
					setCustomSelectOptions(customSelectOptions.filter((item) => item.value !== value.value));
				}}
				onClear={() => {
					setCustomSelectOptions([]);
				}}
				maxTagCount='responsive'
				maxCount={55}
				allowClear={true}
				mode='multiple'
				filterOption={filterOption}
				options={allOptions}
				showSearch
				notFoundContent={'No Vehicles Found'}
				suffixIcon
			></Select>
		</ConfigProvider>
	);
};
