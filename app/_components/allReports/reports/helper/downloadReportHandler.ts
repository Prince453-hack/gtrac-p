import { DownloadReportTs } from '@/app/_components/common/CustomTableN';
import { VehicleItinaryData } from '@/app/_globalRedux/services/types/getItnaryWithMapResponse';
import convertMinutesToHoursString from '@/app/helpers/convertMinutesToHoursString';

export const downloadReportHandler = ({
	selectedReportLabel,
	data,
	setDownloadReport,
}: {
	selectedReportLabel: string;
	data: any[];
	setDownloadReport: React.Dispatch<React.SetStateAction<DownloadReportTs | undefined>>;
}) => {
	let rows: { [key: string]: any }[] | undefined = [];
	let footerRow: { [key: string]: any } | undefined;
	let totalDistance = 0;
	let totalStoppage = 0;
	let totalRunning = 0;

	switch (selectedReportLabel) {
		case 'Journey Report':
			const getReport = (path: VehicleItinaryData) => {
				totalDistance += Number(path.totalDistance);
				totalStoppage += path.mode === 'Idle' ? Number(path.totalTimeInMIN) : 0;
				totalRunning += path.mode === 'Running' ? Number(path.totalTimeInMIN) : 0;
				return {
					'Vehicle No.': selectedReportLabel,
					Status: path.mode,
					'Start Location': path.startLocation?.replaceAll('_', ' '),
					'From Time': path.fromTime,
					'End Location': path.endLocation?.replaceAll('_', ' '),
					'To Time': path.toTime,
					'Time Taken': convertMinutesToHoursString(path.totalTimeInMIN),
					'Running Distance': path.totalDistance,
				};
			};
			rows = data.map((path) => getReport(path));
			if (!rows) return;

			break;
		case 'Diagnostic Report':
			break;
		case 'Temperature Report':
			break;
		case 'Consolidated Report':
			break;
		case 'A/C Report':
			break;
	}

	footerRow = {
		'Vehicle No.': '',
		Status: '',
		'Start Location': '',
		'From Time': '',
		'End Location': '',
		'To Time': `${convertMinutesToHoursString(totalRunning)} Running`,
		'Time Taken': `${convertMinutesToHoursString(totalStoppage)} Stoppage`,
		'Running Distance': `${totalDistance || 0}`,
	};

	const head = Object.keys(rows[0]);

	const body = rows.map((row) => Object.values(row));

	const bodyWithFooter = [...body, Object.values(footerRow)];

	setDownloadReport({
		title: selectedReportLabel,
		excel: { title: selectedReportLabel, rows, footer: footerRow },
		pdf: {
			head: [head],
			body: bodyWithFooter,
			title: selectedReportLabel,
			pageSize: 'a3',
			userOptions: {
				columnStyles: {
					3: {
						cellWidth: 30,
					},
					5: {
						cellWidth: 30,
					},
					6: {
						cellWidth: 30,
					},
				},
			},
		},
	});
};
