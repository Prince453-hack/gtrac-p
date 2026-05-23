import { GetServiceOrDocumentAlertResponse } from '@/app/_globalRedux/services/types/post/alert';
import { convertServerKeysToTitle } from '@/app/helpers/stringManipulation';
import React from 'react';

export const NestedGetInfo = ({
	type,
	title,
	data,
}: {
	type: keyof GetServiceOrDocumentAlertResponse;
	title: string;
	data: GetServiceOrDocumentAlertResponse;
}) => {
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
