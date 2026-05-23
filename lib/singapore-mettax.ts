// lib/tokenManager.js

import axios from 'axios';

let token: string | null = null;
let tokenExpiresAt = 0; // Timestamp in milliseconds

// Function to fetch a new token from your external API
async function fetchNewToken() {
	try {
		const { data } = await axios.post('https://mettahub.mettaxiot.com/gps/v2/openapi/system/createToken', {
			apiKey: process.env.NEXT_PUBLIC_METTAX_API_KEY,
			apiSecret: process.env.NEXT_PUBLIC_METTAX_API_SECRET,
		});
		if (data.msg !== '') {
			throw new Error(data.msg);
		}

		return data.data;
	} catch (error) {
		throw new Error('Failed to fetch new token');
	}
}

export async function getToken() {
	const now = Date.now();
	if (token && tokenExpiresAt > now) {
		// Token is still valid, return it
		return token;
	}

	// Token is expired or not present; fetch a new one
	token = await fetchNewToken();
	// Set expiration to 3 hours from now (4 * 60 * 60 * 1000 ms)
	tokenExpiresAt = now + 3 * 60 * 60 * 1000;

	return token;
}
