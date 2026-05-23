import { AlertManagement } from '@/app/_globalRedux/services/types/alerts';
import { Drawer } from 'antd';
import { Dispatch, SetStateAction } from 'react';
import { GetInfo } from './GetInfo';
import { AlertsManagement } from '../AlertsManagement';
import React from 'react';

export const DrawerView = ({
	selectedAlert,
	open,
	setOpen,
}: {
	selectedAlert: AlertManagement | undefined;
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	const handleCancel = () => {
		setOpen(false);
	};

	return (
		<>
			<Drawer title='Alert Details' open={open} onClose={handleCancel} placement='left' footer={false}>
				<div className='overflow-scroll'>
					{selectedAlert ? (
						<div>
							{(Object.keys(selectedAlert) as Array<keyof typeof AlertsManagement>).map((info) => (
								<span key={info}>
									<GetInfo title={info} type={info} data={selectedAlert} />
								</span>
							))}
						</div>
					) : null}
				</div>
			</Drawer>
		</>
	);
};
