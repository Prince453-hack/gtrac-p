// lib/oidcClient.ts
import { UserManager } from 'oidc-client-ts';
import { config } from './oidcCookieStorage';

const oidcConfig = {
	authority: process.env.NEXT_PUBLIC_API_URL ?? '',
	client_id: process.env.NEXT_PUBLIC_CLIENT_ID ?? '',
	redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/openiddict`,
	post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}`,
	response_type: 'code',
	scope: 'openid profile email',
	...config(),
};

const userManager = new UserManager(oidcConfig);

export default userManager;
