import { AlertManagement } from '@/app/_globalRedux/services/types/alerts';
import { Modal } from 'antd';
import { Dispatch, SetStateAction } from 'react';
import { GetInfo } from './GetInfo';
import { AlertsManagement } from '../AlertsManagement';
import { AlertMutationForm } from './AlertMutationForm';
import React from 'react';

export const ModalView = ({
	selectedAlert,
	open,
	setOpen,
	modalViewToggle,
	isServiceAlertExists,
	isDocumentAlertExists,
}: {
	selectedAlert: AlertManagement | undefined;
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	modalViewToggle: 'DETAILS' | 'EDIT' | 'CREATE';
	setModalViewToggle: Dispatch<SetStateAction<'DETAILS' | 'EDIT' | 'CREATE'>>;
	isServiceAlertExists: boolean;
	isDocumentAlertExists: boolean;
}) => {
	const handleCancel = () => {
		setOpen(false);
	};

	return (
		<>
			<Modal
				title={modalViewToggle === 'DETAILS' ? 'View Details' : modalViewToggle === 'CREATE' ? 'Create Alert' : 'Edit Alert'}
				open={open}
				onCancel={handleCancel}
				centered
				footer={false}
			>
				<div className='min-h-[450px] max-h-[450px] overflow-scroll'>
					{selectedAlert && modalViewToggle === 'DETAILS' ? (
						<div>
							{(Object.keys(selectedAlert) as Array<keyof typeof AlertsManagement>).map((info) => (
								<span key={info}>
									<GetInfo title={info} type={info} data={selectedAlert} />
								</span>
							))}
						</div>
					) : (
						<AlertMutationForm
							handleModalCancel={handleCancel}
							modalViewToggle={modalViewToggle}
							selectedAlert={selectedAlert}
							isServiceAlertExists={isServiceAlertExists}
							isDocumentAlertExists={isDocumentAlertExists}
						/>
					)}
				</div>
			</Modal>
		</>
	);
};
