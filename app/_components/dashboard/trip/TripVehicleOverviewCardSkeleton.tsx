import { List, Skeleton } from 'antd';

export const TripVehicleOverviewCardSkeleton = () => {
	const listData = Array.from({ length: 10 }).map((_, i) => ({
		href: 'https://gtrac:8080.in',
		title: `lorem ipsum ${i + 1}`,
		avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
		description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam, repellat',
		content:
			'Lorem ipsum dolor sit amet consectetur adipisicing elit. Minima in distinctio facilis velit, quibusdam iste fuga similique, optio dolorem consectetur labore assumenda rem vero nostrum et cupiditate? Porro voluptatum, cupiditate dolores a veniam odit laboriosam aut reiciendis quia illum obcaecati excepturi? Voluptas, aperiam minus vero porro voluptates corporis sint ipsam!',
	}));

	return (
		<div className='mb-2'>
			<>
				<List
					itemLayout='vertical'
					size='large'
					dataSource={listData}
					renderItem={(item) => (
						<List.Item key={item.title}>
							<Skeleton active paragraph={{ rows: 5, style: { marginBlock: '51px' } }} />
						</List.Item>
					)}
				/>
			</>
		</div>
	);
};
