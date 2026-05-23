'use client';

import { RootState } from '@/app/_globalRedux/store';
import { ConfigProvider, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Markers } from '@/app/_globalRedux/services/types/getListVehiclesmobTypes';
import { setSelectedVehicleOption } from '@/app/_globalRedux/dashboard/nearbyVehicleSlice';
import { useEffect } from 'react';
import { setNearbyVehicles, setSelectedVehicleBySelectElement } from '@/app/_globalRedux/dashboard/selectedVehicleSlice';

type SelectedStyles = {
	selectorBg: string;
	colorBorder: string;
	fontSize: number;
	optionFontSize: number;
	optionPadding: string;
	optionSelectedColor: string;
};

export const NearbyVehicleDetailsSelect = ({ selectedStyles }: { selectedStyles: SelectedStyles }) => {
	const markers = useSelector((state: RootState) => state.markers);
	const selectedVehicle = useSelector((state: RootState) => state.selectedVehicle);
	const { selectedVehicleOption } = useSelector((state: RootState) => state.nearbyVehicles);

	const dispatch = useDispatch();

	const filterOption = (input: string, option?: { label: string; value: number }) =>
		(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

	const customSelectOptions: { label: string; value: number }[] = markers.map((marker: Markers) => ({ label: marker.vehReg, value: marker.vId }));
	customSelectOptions.unshift({ label: ' ', value: 0 });

	useEffect(() => {
		if (selectedVehicle.vId !== 0) {
			dispatch(setSelectedVehicleOption({ label: selectedVehicle.vehReg, value: selectedVehicle.vId }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedVehicle]);

	return (
		<ConfigProvider
			theme={{
				components: {
					Select: { ...selectedStyles, paddingContentVertical: 0 },
				},
				token: {
					colorTextPlaceholder: 'transparent',
				},
			}}
		>
			<div className='relative border rounded-lg'>
				<Select
					value={selectedVehicleOption?.value}
					className='w-[200px]'
					onChange={(_, option) => {
						const vehicleSelectedByFilter = markers.find((marker) => marker.vId === _);

						if (vehicleSelectedByFilter) {
							dispatch(
								setSelectedVehicleBySelectElement({
									...vehicleSelectedByFilter,
									searchType: '',
									selectedVehicleHistoryTab: selectedVehicle.selectedVehicleHistoryTab,
									nearbyVehicles: [],
									prevVehicleSelected: selectedVehicle.prevVehicleSelected,
								})
							);

							if (!Array.isArray(option)) {
								dispatch(setNearbyVehicles(undefined));
								dispatch(setSelectedVehicleOption(option));
							}
						}
					}}
					options={customSelectOptions}
					showSearch
					filterOption={filterOption}
					notFoundContent={'No vehicle found'}
					suffixIcon
				></Select>

				<div className='w-5 h-5 overflow-hidden absolute top-1.5 right-2'>
					<svg xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' viewBox='0 0 22 27.5' version='1.1' x='0px' y='0px'>
						<g stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
							<g fill='rgb(75, 85, 99)'>
								<path d='M15.4917684,14.0775548 L20.4885358,19.0743222 C20.8772627,19.4630492 20.8785283,20.0920344 20.4852814,20.4852814 C20.0947571,20.8758057 19.4559712,20.8701848 19.0743222,20.4885358 L14.0775548,15.4917684 C10.9391253,17.9342662 6.39944393,17.7131524 3.51471863,14.8284271 C0.390524292,11.7042328 0.390524292,6.63891296 3.51471863,3.51471863 C6.63891296,0.390524292 11.7042328,0.390524292 14.8284271,3.51471863 C17.7131524,6.39944393 17.9342662,10.9391253 15.4917684,14.0775548 L15.4917684,14.0775548 Z M13.4142136,13.4142136 C15.7573593,11.0710678 15.7573593,7.27207794 13.4142136,4.92893219 C11.0710678,2.58578644 7.27207794,2.58578644 4.92893219,4.92893219 C2.58578644,7.27207794 2.58578644,11.0710678 4.92893219,13.4142136 C7.27207794,15.7573593 11.0710678,15.7573593 13.4142136,13.4142136 Z' />
							</g>
						</g>
					</svg>
				</div>
			</div>
		</ConfigProvider>
	);
};
