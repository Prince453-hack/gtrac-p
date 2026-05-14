import React from 'react';
import Vehicles from '@/public/assets/svgs/map/cluster-off.svg';
import Image from 'next/image';

export const Timeline = ({ items }: { items: { date: string; location: string }[] }) => {
	return (
		<ol className='flex justify-between w-full relative'>
			<div className='w-full flex justify-center absolute left-0 right-0 top-3'>
				<div className='bg-primary-green w-[calc(100%-20px)] h-[2px]'></div>
			</div>

			{items.map((item, index) => (
				<li key={index} className='relative flex-1 max-w-[200px] min-w-[200px]'>
					<div className='flex items-center justify-center'>
						{/* Icon */}
						<div className='z-10 flex items-center justify-center w-8 h-8 bg-blue-100 shadow-md rounded-full ring-0 ring-white dark:bg-white shrink-0'>
							<Image src={Vehicles} alt='Vehicles' width={24} height={24} className='rounded-full' />
						</div>
					</div>

					{/* Date and location centered around the icon */}
					<div className='mt-4 text-center'>
						<time className='block text-sm font-semibold text-gray-400 dark:text-gray-500'>{item.date}</time>
						<p className='text-sm mt-2 font-normal text-gray-500 dark:text-gray-400'>{item.location}</p>
					</div>
				</li>
			))}
		</ol>
	);
};
