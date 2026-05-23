'use client';
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PieChartData } from './pieChartTable';

// Register required Chart.js components and the datalabels plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = ({ pieChartData }: { pieChartData: PieChartData }) => {
	const options = {
		responsive: true,
		maintainAspectRatio: true,
		plugins: {
			legend: {
				display: false,

				// position: 'bottom',
			},
			datalabels: {
				color: '#fff',
				formatter: (value: number, context: any) => {
					const total = context.chart.data.datasets[0].data.reduce((a: any, b: any) => a + b, 0);
					const percentage = ((value / total) * 100).toFixed(2) + '%';
					return percentage;
				},
			},
			title: {
				display: true,
				text: 'Fruit Distribution',
			},
		},
	};

	// Render the Pie chart within a styled div
	return (
		<div style={{ width: '190px', height: '190px' }}>
			<Pie data={pieChartData} options={options} />
		</div>
	);
};

export default PieChart;
