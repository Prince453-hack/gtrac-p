import { setSelectedMapTypeId } from '@/app/_globalRedux/dashboard/mapSlice';
import { useAppDispatch } from '@/app/_globalRedux/provider';
import { RootState } from '@/app/_globalRedux/store';
import React from 'react';
import { useSelector } from 'react-redux';

function MapTypeController() {
	const dispatch = useAppDispatch();

	const { selectedMapTypeId } = useSelector((state: RootState) => state.map);

	return (
		<div className='absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg top-4 left-4'>
			<button
				className='p-2 px-4 text-lg border-r border-gray-400'
				style={{ fontWeight: selectedMapTypeId === 'roadmap' ? 600 : 400 }}
				onClick={() => {
					dispatch(setSelectedMapTypeId('roadmap'));
				}}
			>
				Map
			</button>
			<button
				className='p-2 px-4 text-lg'
				style={{ fontWeight: selectedMapTypeId === 'hybrid' ? 600 : 400 }}
				onClick={() => {
					dispatch(setSelectedMapTypeId('hybrid'));
				}}
			>
				Satellite
			</button>
		</div>
	);
}

export default MapTypeController;
