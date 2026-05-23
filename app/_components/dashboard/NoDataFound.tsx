import { FolderOpenOutlined } from '@ant-design/icons';
import React from 'react';

function NoDataFound() {
	return (
		<div className='text-5xl text-neutral-300 w-full h-[200px] flex gap-2 justify-center items-center'>
			<div>
				<div className='flex items-center justify-center w-full'>
					<FolderOpenOutlined />
				</div>
				<p className='text-sm text-neutral-500 font-semibold mt-2'>No Data Found</p>
			</div>
		</div>
	);
}

export default NoDataFound;
