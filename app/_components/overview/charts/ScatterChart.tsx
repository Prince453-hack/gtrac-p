import { Scatter } from 'react-chartjs-2';

export const ScatterChart = ({
	series,
	data,
}: {
	series: Array<{ name: string; color: string }>;
	data: { day: string; name: string; values: string }[];
}) => {
	const chartData = {
		datasets: series.map((s, index) => ({
			label: s.name,
			data: data.map((item) => ({ x: item.day, y: item.values[index] })),
			backgroundColor: s.color,
			pointRadius: 5,
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
		<div className='space-y-4'>
			<div>
				<Scatter data={chartData} options={options} />
			</div>
			<div className='flex justify-center gap-4 text-sm mt-1'>
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
