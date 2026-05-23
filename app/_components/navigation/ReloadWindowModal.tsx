'use client';

import { Button, Modal } from 'antd';
import React from 'react';

export const ReloadWindowModal = ({
	reloadWindowModal,
	setReloadWindowModal,
}: {
	reloadWindowModal: boolean;
	setReloadWindowModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const [loading, setLoading] = React.useState(false);
	return (
		<Modal open={reloadWindowModal} onCancel={() => setReloadWindowModal(false)} footer={false} title='Reload Window' width={700}>
			<div className='mt-1 mb-10'>To see changes you made, we need to reload the window</div>
			<div className='flex justify-end gap-2'>
				<Button danger onClick={() => setReloadWindowModal(false)}>
					Cancel
				</Button>
				<Button
					type='primary'
					onClick={() => {
						setLoading(true);
						window.location.reload();
					}}
				>
					Refresh
				</Button>
			</div>
		</Modal>
	);
};
