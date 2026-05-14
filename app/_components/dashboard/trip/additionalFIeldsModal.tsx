'use client';

import { PlusCircleTwoTone } from '@ant-design/icons';
import { Input, Modal } from 'antd';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';

function AdditionalFieldsModal({ isModalActive, setIsModalActive }: { isModalActive: boolean; setIsModalActive: Dispatch<SetStateAction<boolean>> }) {
	const [additionalColumns, setAdditionalColumns] = useState<string[]>([]);
	const [additionalColumnsCount, setAdditionalColumnsCount] = useState(0);
	const auth = JSON.parse(localStorage.getItem('auth-session') || '');

	useEffect(() => {
		if (auth) {
			const extraInfo = JSON.parse(auth?.extraInfo || '[]');
			if (extraInfo && typeof extraInfo === 'object' && extraInfo.length > 0) {
				setAdditionalColumns(extraInfo);
				setAdditionalColumnsCount(extraInfo.length);
			}
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isModalActive]);

	const handleNewFieldAddition = () => {
		setAdditionalColumns((prev) => [...prev, '']);
		setAdditionalColumnsCount(additionalColumnsCount + 1);
	};

	const handleCancel = () => {
		setAdditionalColumns(['']);
		setIsModalActive(false);
	};

	const handleSave = () => {
		localStorage.setItem('auth-session', JSON.stringify({ ...auth, extraInfo: JSON.stringify(additionalColumns.filter((column) => column !== '')) }));
		setIsModalActive(false);
	};

	return (
		<Modal
			open={isModalActive}
			centered
			onCancel={handleCancel}
			style={{ top: -100 }}
			title={
				<div className='flex items-center gap-4'>
					<p>Customize Additional Fields</p>
					<div onClick={() => handleNewFieldAddition()} className='cursor-pointer'>
						<PlusCircleTwoTone twoToneColor={'#4FB090'} />
					</div>
				</div>
			}
			okText='Save'
			onOk={() => {
				handleSave();
			}}
		>
			<div className='space-y-4'>
				{additionalColumnsCount > 0 && additionalColumns
					? additionalColumns.map((column, index) => (
							<div key={index}>
								<Input
									type='text'
									placeholder='Field Name'
									className='w-full'
									value={additionalColumns[index]}
									onChange={(e) =>
										setAdditionalColumns([...additionalColumns.slice(0, index), e.target.value, ...additionalColumns.slice(index + 1)])
									}
								/>
							</div>
					  ))
					: null}
			</div>
		</Modal>
	);
}

export default AdditionalFieldsModal;
