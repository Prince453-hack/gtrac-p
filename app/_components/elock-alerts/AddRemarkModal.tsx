'use client';

import { Button, Form, Input, Modal } from 'antd';
import React from 'react';

export default function AddRemarkModal({
	isModalOpen,
	setIsModalOpen,
	selectedRow,
	onSubmit,
	isLoading,
	setSelectedRow,
}: {
	isModalOpen: boolean;
	setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	selectedRow: ElockAlertByDate | null;
	onSubmit: () => void;
	isLoading: boolean;
	setSelectedRow: React.Dispatch<React.SetStateAction<ElockAlertByDate | null>>;
}) {
	return (
		<Modal open={isModalOpen} onCancel={() => setIsModalOpen(false)} title={`Add Remark: ${selectedRow?.vehicle_no}`} footer={null}>
			<Form onFinish={() => onSubmit()} className='space-y-4'>
				<div>
					<p className='text-sm font-semibold mt-4 mb-1 ml-1 text-neutral-600'>Remark: </p>

					<Input
						className='w-full'
						value={selectedRow?.remark}
						onChange={(e) => {
							if (selectedRow) {
								setSelectedRow({ ...selectedRow, remark: e.target.value });
							}
						}}
					/>
				</div>
				<div className='flex justify-end items-center space-x-2'>
					<Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
					<Button type='primary' htmlType='submit' loading={isLoading}>
						Submit
					</Button>
				</div>
			</Form>
		</Modal>
	);
}
