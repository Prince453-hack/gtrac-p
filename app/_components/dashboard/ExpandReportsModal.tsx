'use client';

import { Modal, Switch } from 'antd';
import { useContext } from 'react';
import { VehicleHistoryTabs } from './VehicleHistoryTabs';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import VehicleDetailsDownloadButton from './VehicleDetailsDownloadButton';
import { VehicleDetailsContext } from './View';

export const ExpandReportsModal = () => {
	const { reportsModalState } = useContext(VehicleDetailsContext);
	const vehicleItnaryWithPath = useSelector((state: RootState) => state.vehicleItnaryWithPath);
	const { selectedView, setSelectedView, setIsReportsExpanded } = reportsModalState;

	const onClose = () => {
		setIsReportsExpanded(false);
		setSelectedView('Column');
	};

	return (
		<Modal
			open={reportsModalState.isReportsExpanded}
			onCancel={() => onClose()}
			footer={null}
			width='80vw'
			style={{ top: 30 }}
			styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 95)' }, body: { minHeight: 'calc(100vh - 300px)' } }}
			title={
				<div className='flex gap-5'>
					<div>
						<p className='text-2xl'>Journey Reports</p>
						<p className='text-sm'>Expanded view</p>
					</div>
					<VehicleDetailsDownloadButton />
				</div>
			}
		>
			<div className='flex flex-col items-end '>
				<div className='flex gap-2 items-center font-semibold'>
					<p className={`text-sm ${selectedView === 'Column' ? 'text-primary-green' : ''}`}>Column</p>
					<Switch
						className='text-xl hover:opacity-70 transition-opacity duration-500'
						value={selectedView === 'Table'}
						onClick={() => setSelectedView(selectedView === 'Column' ? 'Table' : 'Column')}
					/>
					<p className={`text-sm ${selectedView === 'Table' ? 'text-primary-green' : ''}`}>Table</p>
				</div>
			</div>

			<div className=''>
				<VehicleHistoryTabs data={vehicleItnaryWithPath} view='ExpandedReportsModal' />
			</div>
		</Modal>
	);
};
