'use client';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { ConfigProvider, MappingAlgorithm, Select } from 'antd';
import { ComponentToken } from 'antd/es/select/style';
import { AliasToken } from 'antd/es/theme/internal';
import { useState } from 'react';

const selectedStyles:
	| (Partial<ComponentToken> &
			Partial<AliasToken> & {
				algorithm?: boolean | MappingAlgorithm | MappingAlgorithm[];
			})
	| undefined = {
	selectorBg: 'transparent',
	colorBorder: 'transparent',
	fontSizeLG: 24,
	optionFontSize: 16,
	optionPadding: '10px',
	optionSelectedColor: '#000',
};

const reports = [
	{
		label: 'Journey Report',
		value: 0,
	},
	{
		label: 'Diagnostic Report',
		value: 1,
	},
	// {
	// 	label: 'Temperature Report',
	// 	value: 2,
	// },
	// {
	// 	label: 'Consolidated Report',
	// 	value: 3,
	// },
	// {
	// 	label: 'A/C Report',
	// 	value: 4,
	// },
];

export const ReportSelect = ({
	selectedReport,
	setSelectedReport,
}: {
	selectedReport: { label: string; value: number };
	setSelectedReport: React.Dispatch<React.SetStateAction<{ label: string; value: number }>>;
}) => {
	const [isDropdownVisible, setIsDropDownVisible] = useState(false);
	const filterOption = (input: string, option?: { label: string; value: number }) =>
		(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

	return (
		<ConfigProvider
			theme={{
				components: {
					Select: { ...selectedStyles, padding: 10 },
				},
				token: {
					colorTextPlaceholder: 'transparent',
				},
			}}
		>
			<div className='relative border rounded-lg'>
				<Select
					value={selectedReport.value}
					className={`w-[300px]`}
					size='large'
					options={reports}
					showSearch
					filterOption={filterOption}
					notFoundContent={'No Vehicles Found'}
					onChange={(value) => {
						setSelectedReport(reports.find((report) => report.value === value) as { label: string; value: number });
					}}
					onDropdownVisibleChange={setIsDropDownVisible}
					suffixIcon={isDropdownVisible ? <UpOutlined className='text-lg' /> : <DownOutlined className='text-lg' />}
				></Select>
			</div>
		</ConfigProvider>
	);
};
