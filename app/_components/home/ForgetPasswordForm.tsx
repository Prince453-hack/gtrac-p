'use client';

import { useForgetPasswordMutation } from '@/app/_globalRedux/services/tracking';
import { LeftOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { NoticeType } from 'antd/es/message/interface';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export const ForgetPasswordForm = ({ setForgetPasswordPage }: { setForgetPasswordPage: Dispatch<SetStateAction<boolean>> }) => {
	const [messageApi, contextHolder] = message.useMessage();

	const [triggerForgetPassword, { isLoading, error, isError, isSuccess }] = useForgetPasswordMutation();
	const [errorMessage, setErrorMessage] = useState('');

	const createMessage = ({ type, content }: { type: NoticeType; content: string }) => {
		messageApi.open({
			type: type,
			content,
		});
	};

	useEffect(() => {
		if (isError) {
			setErrorMessage('Failed to send email, Please try again!');
		}
	}, [isError, error]);

	useEffect(() => {
		if (isSuccess) {
			setErrorMessage('');
			createMessage({ type: 'success', content: 'Email sent successfully!' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSuccess]);

	return (
		<div className='w-[400px] h-[460px] bg-white  rounded-2xl shadow  md:mt-0 sm:max-w-md xl:p-0  '>
			{contextHolder}
			<div className='p-6 space-y-4 md:space-y-6 sm:p-10 pb-14'>
				<h1 className='text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-3xl'>Get Password</h1>
				<p>Your password will be sent to your email</p>

				<form
					className='space-y-4 md:space-y-6'
					// action={(formData) =>
					// 	triggerForgetPassword({
					// 		username: formData.get('username')?.toString() || '',
					// 		emailId: formData.get('email')?.toString() || '',
					// 	})
					// }
					action={(formData) => {
						triggerForgetPassword({
							username: formData.get('username')?.toString() || '',
							emailId: formData.get('email')?.toString() || '',
						});
					}}
				>
					<div>
						<label htmlFor='email' className='block mb-2 text-sm font-medium text-gray-900 '>
							Email
						</label>
						<input
							type='email'
							name='email'
							id='email'
							className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5'
							placeholder='Email'
							required={true}
						/>
					</div>
					<div>
						<label htmlFor='username' className='block mb-2 text-sm font-medium text-gray-900 '>
							Username
						</label>
						<input
							type='username'
							name='username'
							id='username'
							placeholder='Username'
							className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5'
							required={true}
						/>
					</div>

					{isError && <p className='text-sm text-red-500'>{errorMessage}</p>}

					<Button
						htmlType='submit'
						style={{
							background: 'rgb(218,94,26)',
							color: 'white',
							width: '100%',
							borderRadius: '8px',
						}}
						type='primary'
						size='large'
						loading={isLoading}
					>
						Submit
					</Button>
					<div className='w-full flex justify-end'>
						<Button type='link' size='small' onClick={() => setForgetPasswordPage(false)}>
							<LeftOutlined />
							Go back
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
