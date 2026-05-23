'use client';
import React, { useState } from 'react';
import { Modal, Button, Radio, Space, message, Spin } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { exportToExcel, exportToCSV } from '../utils/export-utils';

interface DownloadModalProps {
	open: boolean;
	onClose: () => void;
	data: any[];
	filename: string;
	formatData: (data: any[]) => any[];
	title?: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ open, onClose, data, filename, formatData, title = 'Download Report' }) => {
	const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
	const [isExporting, setIsExporting] = useState(false);

	const handleDownload = async () => {
		if (!data || data.length === 0) {
			message.warning('No data available to export');
			return;
		}

		setIsExporting(true);
		try {
			const formattedData = formatData(data);
			let success = false;

			if (exportFormat === 'excel') {
				success = exportToExcel(formattedData, filename);
			} else {
				success = exportToCSV(formattedData, filename);
			}

			if (success) {
				message.success(`Report downloaded successfully as ${exportFormat.toUpperCase()}`);
				onClose();
			} else {
				message.error('Failed to download report');
			}
		} catch (error) {
			console.error('Export error:', error);
			message.error('An error occurred while exporting data');
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Modal
			title={title}
			open={open}
			onCancel={onClose}
			footer={[
				<Button key='cancel' onClick={onClose} disabled={isExporting}>
					Cancel
				</Button>,
				<Button
					key='download'
					type='primary'
					icon={<DownloadOutlined />}
					onClick={handleDownload}
					loading={isExporting}
					disabled={!data || data.length === 0}
				>
					{isExporting ? 'Downloading...' : 'Download'}
				</Button>,
			]}
			width={400}
			destroyOnClose
		>
			<div className='space-y-4'>
				<div>
					<p className='text-sm text-gray-600 mb-3'>Select the format for your download:</p>
					<Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className='w-full'>
						<Space direction='vertical' className='w-full'>
							<Radio value='excel' className='flex items-center'>
								<Space>
									<FileExcelOutlined className='text-green-600' />
									<span>Excel (.xlsx)</span>
								</Space>
							</Radio>
							<Radio value='csv' className='flex items-center'>
								<Space>
									<FileTextOutlined className='text-blue-600' />
									<span>CSV (.csv)</span>
								</Space>
							</Radio>
						</Space>
					</Radio.Group>
				</div>

				{data && data.length > 0 && (
					<div className='bg-gray-50 p-3 rounded'>
						<p className='text-sm text-gray-600'>
							<strong>Records to export:</strong> {data.length}
						</p>
					</div>
				)}

				{(!data || data.length === 0) && (
					<div className='bg-yellow-50 border border-yellow-200 p-3 rounded'>
						<p className='text-sm text-yellow-700'>No data available to export. Please ensure there are records in the table.</p>
					</div>
				)}

				{isExporting && (
					<div className='flex items-center justify-center py-4'>
						<Spin size='small' />
						<span className='ml-2 text-sm text-gray-600'>Preparing your download...</span>
					</div>
				)}
			</div>
		</Modal>
	);
};
