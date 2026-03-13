import { setCookie, getCookie, deleteCookie } from '$lib/utils/cookies';
import { AUTH_TOKEN_COOKIE_NAME, COOKIE_MAX_AGE_DAYS, ENV } from './env';

// Helper function to get authorization headers
export function getAuthHeaders(tokenOverride?: string): HeadersInit {
	const token = tokenOverride || getAuthToken();
	return {
		'Content-Type': 'application/json',
		...(token && { Authorization: `Bearer ${token}` })
	};
}

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
	return !!getAuthToken();
}

// Helper function to get auth token from cookie
export function getAuthToken(): string | null {
	return getCookie(AUTH_TOKEN_COOKIE_NAME);
}

// Helper function to set auth token in cookie with security settings
export function setAuthToken(token: string): void {
	setCookie(AUTH_TOKEN_COOKIE_NAME, token, {
		maxAge: COOKIE_MAX_AGE_DAYS,
		path: '/',
		secure: ENV === 'production', // Only HTTPS in production
		sameSite: 'Strict' // CSRF protection
	});
}

// Helper function to clear auth token cookie
export function clearAuthToken(): void {
	deleteCookie(AUTH_TOKEN_COOKIE_NAME);
}
