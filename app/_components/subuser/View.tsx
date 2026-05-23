'use client';

import { Card, Tooltip } from 'antd';
import { SubUserManagement } from './SubUserManagement';
import { PlusCircleFilled } from '@ant-design/icons';
import { useState } from 'react';

export type ModalViewType = 'CREATE' | 'DETAILS' | 'EDIT' | 'MANAGE VEHICLES' | 'DELETE' | '';

export const View = () => {
	const [isEditCreateViewModalActive, setIsEditCreateViewModalActive] = useState<ModalViewType>('');
	return (
		<div>
			<Card
				styles={{ body: { padding: 0, background: '#F6F8F6', borderRadius: '15px', border: 0 } }}
				style={{ borderRadius: '15px', background: '#F6F8F6', border: 0 }}
			>
				<div className='w-full flex items-center justify-between'>
					<span className='text-3xl font-semibold m-5'>Manage Subusers</span>
					<Tooltip title='Create Subuser' mouseEnterDelay={1}>
						<PlusCircleFilled
							className='text-xl mr-5'
							onClick={() => {
								setIsEditCreateViewModalActive('CREATE');
								// setModalViewToggle('CREATE');
							}}
						/>
					</Tooltip>
				</div>

				<SubUserManagement
					isEditCreateViewModalActive={isEditCreateViewModalActive}
					setIsEditCreateViewModalActive={setIsEditCreateViewModalActive}
				/>
			</Card>
		</div>
	);
};
