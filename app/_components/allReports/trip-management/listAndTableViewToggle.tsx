import { Tooltip } from 'antd';
import Image from 'next/image';
import React from 'react';

import TableView from '@/public/assets/svgs/common/table_view.svg';
import ListView from '@/public/assets/svgs/common/list_view.svg';
import { ViewContext } from './tripReportAndPlanningToggle';

function ListAndTableViewToggle({
	setActiveView,
	activeViewData,
}: {
	setActiveView: React.Dispatch<React.SetStateAction<'LIST' | 'TABLE'>>;
	activeViewData?: 'LIST' | 'TABLE';
}) {
	const activeViewContext = React.useContext(ViewContext);
	const activeView = activeViewData ?? activeViewContext;
	return (
		<div className='flex items-center gap-2'>
			<div
				className={`hover:opacity-75 transition-opacity duration-300 cursor-pointer p-3  rounded-full ${
					activeView === 'TABLE' ? 'bg-neutral-200' : 'bg-transparent'
				}`}
				onClick={() => setActiveView('TABLE')}
			>
				<Tooltip title='Table View' mouseEnterDelay={1}>
					<Image src={TableView} alt='TableView' width={16} height={16} />
				</Tooltip>
			</div>
			<div
				className={`hover:opacity-75 transition-opacity duration-300 cursor-pointer p-3 rounded-full ${
					activeView === 'LIST' ? 'bg-neutral-200' : 'bg-transparent'
				}`}
				onClick={() => setActiveView('LIST')}
			>
				<Tooltip title='List View' mouseEnterDelay={1}>
					<Image src={ListView} alt='ListView' width={16} height={16} />
				</Tooltip>
			</div>
		</div>
	);
}

export default ListAndTableViewToggle;
