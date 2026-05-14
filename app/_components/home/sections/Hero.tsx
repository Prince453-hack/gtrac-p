'use client';

import { LoginsForm } from '../LoginsForm';
import { useState } from 'react';
import { ForgetPasswordForm } from '../ForgetPasswordForm';
import InfoBanner from '../../common/InfoBanner';

export const HeroSection = () => {
	const [forgetPasswordPage, setForgetPasswordPage] = useState(false);

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

			<video autoPlay loop muted className='min-h-[100vh] min-w-[100vw] object-cover absolute top-0 right-0 left-0 -z-10'>
				<source src='/assets/videos/bg-video.mp4' type='video/mp4' className='min-h-[100vh] min-w-[100vw]' />
			</video>
		</div>
	);
};
