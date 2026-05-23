// app/auth/login/page.tsx
'use client';

import { useEffect } from 'react';
import userManager from '@/app/lib/oidc/oidcClient';

export default function LoginPage() {
	useEffect(() => {
		userManager.signinRedirect().catch((error) => {
			console.error('Error during sign-in redirect:', error);
		});
	}, []);

	return <p>Redirecting to login...</p>;
}
