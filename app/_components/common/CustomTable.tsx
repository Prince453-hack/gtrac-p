'use client';

import { ConfigProvider, Table } from 'antd';

export type PanelRender<RecordType> = (data: readonly RecordType[]) => React.ReactNode;

export const CustomTable = ({
	columns,
	data,
	scroll_y,
	type,
	Footer,
	loading,
}: {
	columns: any;
	type: string;
	data: any;
	scroll_y: string;
	Footer?: React.ReactNode;
	loading?: boolean;
}) => {
	return (
		<div>
			<ConfigProvider
				theme={{
					components: {
						Table: {
							headerBg: '#F6F8F6',
							borderColor: '#dddddd',
							rowHoverBg: '#E9EFEB',
						},
						Pagination: {
							itemBg: '#E9EFEB',
						},
					},
				}}
			>
				<Table
					// columns={columns.map((item: any) => (item.title === 'S.No.' ? { ...item } : { ...item, ...getColumnSearchProps(item.dataIndex) }))}
					columns={columns}
					pagination={false}
					dataSource={data}
					rowClassName='bg-[#F6F8F6]'
					loading={loading !== undefined ? loading : false}
					className='mx-2'
					bordered={true}
					scroll={{ y: scroll_y }}
					// pagination={
					// 	currentPageState
					// 		? {
					// 				pageSize: 50,
					// 				showSizeChanger: false,
					// 				size: 'small',
					// 				rootClassName: 'my-2',
					// 				current: currentPageState.currentPage,
					// 				onChange(page) {
					// 					currentPageState.setCurrentPage(page);
					// 				},
					// 				showTotal(total) {
					// 					return (
					// 						<span className='font-bold text-gray-700'>
					// 							Total {type}: {total}
					// 						</span>
					// 					);
					// 				},
					// 		  }
					// 		: false
					// }
					footer={() => (Footer ? Footer : false)}
				/>
			</ConfigProvider>
		</div>
	);
};
