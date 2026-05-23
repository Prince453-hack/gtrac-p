import { AlertManagement } from '@/app/_globalRedux/services/types/alerts';
import { convertServerKeysToTitle } from '@/app/helpers/stringManipulation';
import React from 'react';

export const GetInfo = ({ type, title, data }: { type: keyof AlertManagement; title: string; data: AlertManagement }) => {
	return (
		<>
			{data[type] ? (
				<div className='mb-2'>
					<span className='font-semibold text-gray-600'>{convertServerKeysToTitle(title)}: </span>
					<span className=''>{data[type]}</span>
				</div>
			) : null}
		</>
	);
};
