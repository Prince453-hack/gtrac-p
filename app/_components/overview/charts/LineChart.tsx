import { Line } from 'react-chartjs-2';

export const LineChart = ({
	series,
	data,
	fill = false,
}: {
	series: Array<{ name: string; color: string }>;
	data: { day: string; values: string }[];
	fill: boolean;
}) => {
	const chartData = {
		labels: data.map((item) => item.day.toString()),
		datasets: series.map((s, index) => ({
			label: s.name,
			data: data.map((item) => item.values[index]),
			borderColor: s.color,
			backgroundColor: fill ? s.color.replace(')', ', 0.4)') : undefined,
			fill: fill,
			tension: 0.4,
			lineWidth: 1,
			borderWidth: 1.5,
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
		<div className='space-y-2'>
			<div>
				<Line data={chartData} options={options} />
			</div>
			<div className='flex justify-center gap-4 text-xs'>
				{series.map((s, i) => (
					<div key={i} className='flex items-center gap-3'>
						<div style={{ backgroundColor: s.color, width: '12px', height: '12px', borderRadius: '2px' }}></div>
						<span className='text-gray-600'>{s.name}</span>
					</div>
				))}
			</div>
		</div>
	);
};
