// lib/oidcCookieStorage.ts
import Cookies from 'universal-cookie';
import { WebStorageStateStore } from 'oidc-client-ts';

export class CookieStorage implements Storage {
	private _cookies: Cookies;
	constructor(cookieHeader?: string | string[]) {
		this._cookies = new Cookies(cookieHeader);
	}

	// Return the number of cookies stored
	get length(): number {
		return Object.keys(this._cookies.getAll()).length;
	}

	// Return the key at the given index
	key(index: number): string | null {
		const keys = Object.keys(this._cookies.getAll());
		return keys[index] || null;
	}

	// Remove all cookies
	clear(): void {
		const allCookies = Object.keys(this._cookies.getAll());
		allCookies.forEach((key) => {
			this._cookies.remove(key);
		});
	}

	getItem(key: string): string | null {
		return this._cookies.get(encodeURIComponent(key), { doNotParse: true });
	}

	setItem(key: string, value: string): void {
		// Set a maxAge of 1000 seconds; adjust as needed
		this._cookies.set(encodeURIComponent(key), value, { maxAge: 1000 });
	}

	removeItem(key: string): void {
		this._cookies.remove(encodeURIComponent(key));
	}
}

export function config(cookieHeaders?: string | string[]) {
	const cookieStorage = new CookieStorage(cookieHeaders);
	return {
		userStore: new WebStorageStateStore({ store: cookieStorage }),
		stateStore: new WebStorageStateStore({ store: cookieStorage }),
	};
}
