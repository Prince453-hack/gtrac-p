import { List, Skeleton } from 'antd'

export const VehicleOverviewCardSkeleton = () => {
	const listData = Array.from({ length: 10 }).map((_, i) => ({
		href: 'https://ant.design',
		title: `ant design part ${i + 1}`,
		avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
		description: 'Ant Design, a design language for background applications, is refined by Ant UED Team.',
		content:
			'We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently. We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
	}))

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
	)
}
