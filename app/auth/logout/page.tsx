// app/auth/logout/page.tsx
'use client';

import { useEffect } from 'react';
import userManager from '@/app/lib/oidc/oidcClient';

export default function LogoutPage() {
	useEffect(() => {
		userManager.signoutRedirect().catch((error) => {
			console.error('Error during sign-out redirect:', error);
		});
	}, []);

	return <p>Redirecting to logout...</p>;
}
