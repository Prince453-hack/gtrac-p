// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginsForm } from '@/app/_components/home';

export default function CallbackPage() {
	const searchParams = useSearchParams();
	const code = searchParams.get('code');

	const [message, setMessage] = useState('Processing login...');
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		if (code && code.length > 34) {
			setIsAuthenticated(true);
			setMessage('Login successful!');
			localStorage.setItem('auth-token', code);
		}
	}, [code]);

	return (
		<>
			{isAuthenticated ? (
				<div className='flex flex-col items-center justify-center h-screen bg-neutral-200'>
					<LoginsForm />
				</div>
			) : (
				message
			)}
		</>
	);
}
