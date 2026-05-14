import { Bar } from 'react-chartjs-2';

export const BarChart = ({
	series,
	data,
}: {
	series: Array<{ name: string; color: string }>;
	data: { day: string | number; values: number[] }[];
	fill: boolean;
}) => {
	const chartData = {
		labels: data.map((item) => item.day.toString()),
		datasets: series.map((s, index) => ({
			label: s.name,
			data: data.map((item) => item.values[index]),
			backgroundColor: s.color,
			borderRadius: 5,
		})),
	};

	const options = {
		plugins: {
			legend: { display: false },
			datalabels: {
				opacity: 0,
			},
		},

		scales: {
			x: { grid: { color: '#f2f4f7' } },
			y: { grid: { color: '#f2f4f7' } },
		},
	};

	return (
		<div>
			<div>
				<Bar data={chartData} options={options} />
			</div>
			<div className='flex justify-center gap-4 text-sm mt-1'>
				{series.map((s, i) => (
					<div key={i} className='flex items-center gap-3 text-xs'>
						<div style={{ backgroundColor: s.color, width: '12px', height: '12px', borderRadius: '2px' }}></div>
						<span className='text-gray-600'>{s.name}</span>
					</div>
				))}
			</div>
		</div>
	);
};
