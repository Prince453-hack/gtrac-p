'use client';

import { LoginsForm } from '../home/LoginsForm';
import { useState } from 'react';
import { ForgetPasswordForm } from '../home/ForgetPasswordForm';
import InfoBanner from '../common/InfoBanner';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/_globalRedux/store';
import Image from 'next/image';

export const HeroSection = () => {
	const [forgetPasswordPage, setForgetPasswordPage] = useState(false);
	const { userId } = useSelector((state: RootState) => state.auth);

	return (
		<div className='  min-h-[100vh] overflow-clip relative'>
			<div className='w-full flex  lg:px-36 justify-center lg:justify-end lg:mx-0 pt-48 lg:pt-40'>
				{forgetPasswordPage ? (
					<ForgetPasswordForm setForgetPasswordPage={setForgetPasswordPage} />
				) : (
					<LoginsForm setForgetPasswordPage={setForgetPasswordPage} />
				)}
			</div>
			<InfoBanner />

			<div>
				<Image
					src='/assets/images/bg.jpeg'
					alt='hero-img'
					width={1000}
					height={1000}
					className='absolute -bottom-10 right-0 min-h-[100vw] min-w-[100vw] object-cover -z-10'
				/>
			</div>
		</div>
	);
};
