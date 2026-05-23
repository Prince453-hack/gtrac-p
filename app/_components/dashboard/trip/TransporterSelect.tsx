// TransportSelect.tsx
import React, { useState } from 'react';
import { Select } from 'antd';

const { Option } = Select;

export type TransporterOptions =
	| 'Vikas Transport'
	| 'Hari Om Transport'
	| 'V-Trans (India) Ltd.'
	| 'Hind Cargo Movers Pvt. Ltd.'
	| 'Safexpress Pvt. Ltd.'
	| 'Agarwal Packers & Movers Ltd.'
	| 'BLR Logistiks (I) Ltd.'
	| 'Parekh Integrated Services Pvt Ltd'
	| 'Express Roadways Pvt Ltd.'
	| 'Cosmo Carrying Private Limited'
	| 'TCI Cold Chain Solutions Limited';

// Transport options
const transportOptions = [
	'Vikas Transport',
	'Hari Om Transport',
	'V-Trans (India) Ltd.',
	'Hind Cargo Movers Pvt. Ltd.',
	'Safexpress Pvt. Ltd.',
	'Agarwal Packers & Movers Ltd.',
	'BLR Logistiks (I) Ltd.',
	'Parekh Integrated Services Pvt Ltd',
	'Express Roadways Pvt Ltd.',
	'Cosmo Carrying Private Limited',
	'TCI Cold Chain Solutions Limited',
];

export const TransporterSelect: React.FC<{ onChange: (value: TransporterOptions | null) => void }> = ({ onChange }) => {
	const [selectedTransport, setSelectedTransport] = useState<TransporterOptions | null>(null);

	const handleChange = (value: TransporterOptions) => {
		setSelectedTransport(value);
		onChange(value);
	};

	return (
		<Select
			style={{ width: '100%', maxWidth: 400, height: '36px' }}
			className='w-full h-9'
			showSearch
			placeholder='Select Transport'
			value={selectedTransport}
			onChange={handleChange}
			allowClear
			onDeselect={() => {
				setSelectedTransport(null);
				onChange(null);
			}}
			onClear={() => {
				setSelectedTransport(null);
				onChange(null);
			}}
		>
			{transportOptions.map((option) => (
				<Option key={option} value={option}>
					{option}
				</Option>
			))}
		</Select>
	);
};
