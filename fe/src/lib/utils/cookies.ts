/**
 * Cookie utility functions for secure client-side storage
 * Provides a safer alternative to localStorage with security features
 */

export interface CookieOptions {
	path?: string;
	domain?: string;
	maxAge?: number; // in days
	secure?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
}

const DEFAULT_OPTIONS: CookieOptions = {
	path: '/',
	maxAge: 7, // 7 days
	secure: false, // Set to true in production
	sameSite: 'Strict'
};

/**
 * Set a cookie with optional configuration
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options (path, domain, maxAge, secure, sameSite)
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
	if (typeof document === 'undefined') return;

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

	// Set expiration
	if (opts.maxAge) {
		const date = new Date();
		date.setTime(date.getTime() + opts.maxAge * 24 * 60 * 60 * 1000);
		parts.push(`expires=${date.toUTCString()}`);
	}

	// Set path
	if (opts.path) {
		parts.push(`path=${opts.path}`);
	}

	// Set domain
	if (opts.domain) {
		parts.push(`domain=${opts.domain}`);
	}

	// Set secure flag (HTTPS only)
	if (opts.secure) {
		parts.push('Secure');
	}

	// Set SameSite attribute (CSRF protection)
	if (opts.sameSite) {
		parts.push(`SameSite=${opts.sameSite}`);
	}

	document.cookie = parts.join('; ');
}

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;

	const nameEQ = `${encodeURIComponent(name)}=`;
	const cookies = document.cookie.split(';');

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		if (cookie.indexOf(nameEQ) === 0) {
			return decodeURIComponent(cookie.substring(nameEQ.length));
		}
	}

	return null;
}

/**
 * Delete a cookie by name
 * @param name - Cookie name
 * @param options - Cookie options (path, domain must match the original cookie)
 */
export function deleteCookie(name: string, options: Partial<CookieOptions> = {}): void {
	if (typeof document === 'undefined') return;

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const parts: string[] = [`${encodeURIComponent(name)}=`, 'expires=Thu, 01 Jan 1970 00:00:00 UTC'];

	if (opts.path) {
		parts.push(`path=${opts.path}`);
	}

	if (opts.domain) {
		parts.push(`domain=${opts.domain}`);
	}

	if (opts.sameSite) {
		parts.push(`SameSite=${opts.sameSite}`);
	}

	document.cookie = parts.join('; ');
}

/**
 * Check if a cookie exists
 * @param name - Cookie name
 * @returns true if cookie exists, false otherwise
 */
export function hasCookie(name: string): boolean {
	return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 * @returns Object with all cookie key-value pairs
 */
export function getAllCookies(): Record<string, string> {
	if (typeof document === 'undefined') return {};

	const cookies: Record<string, string> = {};
	const cookieArray = document.cookie.split(';');

	for (const cookie of cookieArray) {
		const [name, value] = cookie.trim().split('=');
		if (name && value) {
			cookies[decodeURIComponent(name)] = decodeURIComponent(value);
		}
	}

	return cookies;
}

/**
 * Clear all cookies (use with caution)
 * Note: Can only delete cookies accessible to current path/domain
 */
export function clearAllCookies(): void {
	if (typeof document === 'undefined') return;

	const cookies = getAllCookies();
	for (const name in cookies) {
		deleteCookie(name);
	}
}
