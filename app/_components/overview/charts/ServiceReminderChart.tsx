export const ServiceReminderChart = ({ data }: { data: { color: string; service: string; vehicle: string; days: string }[] }) => {
	return (
		<div className='2xl:h-[280px] xl:h-[calc(100vh-550px)] overflow-y-scroll'>
			{data.map((reminder, index) => (
				<div key={index} className='flex items-center justify-between p-3 mt-1.5 bg-gray-50 rounded-lg'>
					<div className='flex items-center gap-3'>
						<div className={`w-2 h-2 rounded-full ${reminder.color}`}></div>
						<div>
							<p className='text-sm font-medium text-gray-900'>{reminder.service}</p>
							<p className='text-xs text-gray-500'>({reminder.vehicle})</p>
						</div>
					</div>
					<span className='text-xs text-gray-600'>{reminder.days}</span>
				</div>
			))}
		</div>
	);
};
