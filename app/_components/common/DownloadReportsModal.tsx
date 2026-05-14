import exportPdf from '@/app/helpers/exportPdf';
import { exportXlsx } from '@/app/helpers/exportXlsx';
import { Modal } from 'antd';
import React, { Dispatch, SetStateAction } from 'react';
import { DownloadReportTs } from './CustomTableN';

export const DownloadReportsModal = ({
	downloadReport,
	setDownloadReport,
}: {
	downloadReport: DownloadReportTs | undefined;
	setDownloadReport: Dispatch<SetStateAction<DownloadReportTs | undefined>>;
}) => {
	const [downloadMode, setDownloadMode] = React.useState<'pdf' | 'excel'>('excel');
	const onConfirm = () => {
		if (downloadReport) {
			if (downloadMode === 'excel' && downloadReport.excel) {
				if (downloadReport.excel.footer) {
					exportXlsx(downloadReport.excel.rows, downloadReport.excel.title, `${downloadReport.excel.title}.xlsx`, downloadReport.excel.footer);
				} else {
					exportXlsx(downloadReport.excel.rows, downloadReport.excel.title, `${downloadReport.excel.title}.xlsx`);
				}
			} else if (downloadMode === 'pdf' && downloadReport.pdf) {
				const data = { head: downloadReport.pdf.head, body: downloadReport.pdf.body };

				exportPdf(
					data,
					downloadReport.pdf.title,
					`${downloadReport.pdf.title}.pdf`,
					undefined,
					downloadReport.pdf.userOptions ? downloadReport.pdf.userOptions : undefined,
					downloadReport.pdf.pageSize ? downloadReport.pdf.pageSize : undefined
				);
			}
		}
		setDownloadReport(undefined);
	};

	return (
		<Modal open={Boolean(downloadReport)} onCancel={() => setDownloadReport(undefined)} okText='Confirm Download' onOk={onConfirm}>
			Download {downloadReport ? downloadReport.title : 'Report'}
			<br />
			<br />
			<div className='flex items-center'>
				<button
					onClick={() => setDownloadMode('excel')}
					className={`mr-2 rounded border border-gray-300 p-1.5 text-sm ${downloadMode === 'excel' ? 'bg-primary-green text-white' : ''}
					`}
				>
					Excel
				</button>
				<button
					onClick={() => setDownloadMode('pdf')}
					className={`rounded border border-gray-300 p-1.5 text-sm ${downloadMode === 'pdf' ? 'bg-primary-green text-white' : ''}
					`}
				>
					PDF
				</button>{' '}
			</div>
		</Modal>
	);
};
