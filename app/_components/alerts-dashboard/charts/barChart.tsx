import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register required Chart.js components and the datalabels plugin
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartDataLabels);

export interface BarChartDataProps {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor: string;
		datalabels: {
			display: boolean;
		};
		borderRadius: {
			topLeft: number;
			topRight: number;
			bottomLeft: number;
			bottomRight: number;
		};
	}[];
}

function BarChart({ barCharData }: { barCharData: BarChartDataProps }) {
	const options = {
		indexAxis: 'y' as const,
		responsive: true,
		maintainAspectRatio: true,
		legend: {
			display: false, // Hides the legend
		},
		scales: {
			x: {
				display: true,
			},
		},
		plugins: {
			datalabels: {
				rotation: 90,
				formatter: function (value: string, context: any) {
					return context.chart.data.labels?.at(context.dataIndex);
				},
			},
		},
	};

	return <Bar data={barCharData} options={options} height={180} />;
}

export default BarChart;
