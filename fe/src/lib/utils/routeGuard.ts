import { isAuthenticated } from '$lib';

/**
 * Route guard utilities for protecting routes
 * Use in onMount() to redirect users based on authentication status
 */

/**
 * Protect a route - redirect to auth page if not authenticated
 * Use on protected pages like dashboard, deploy, etc.
 *
 * @param redirectTo - Optional custom redirect URL (defaults to '/auth')
 */
export function requireAuth(redirectTo: string = '/auth'): boolean {
	if (typeof window === 'undefined') return true; // SSR

	if (!isAuthenticated()) {
		window.location.href = redirectTo;
		return false;
	}

	return true;
}

/**
 * Redirect authenticated users away (e.g., from auth page)
 * Use on pages like login/auth that authenticated users shouldn't access
 *
 * @param redirectTo - Optional custom redirect URL (defaults to '/dash')
 */
export function redirectIfAuthenticated(redirectTo: string = '/dash'): boolean {
	if (typeof window === 'undefined') return true; // SSR

	if (isAuthenticated()) {
		window.location.href = redirectTo;
		return false;
	}

	return true;
}

/**
 * Check authentication status without redirecting
 * Useful for conditional rendering or logic
 */
export function checkAuth(): boolean {
	if (typeof window === 'undefined') return false; // SSR
	return isAuthenticated();
}

/**
 * Route guard configuration type
 */
export type RouteGuardConfig = {
	requireAuth?: boolean;
	redirectIfAuth?: boolean;
	authRedirect?: string;
	noAuthRedirect?: string;
};

/**
 * Universal route guard with configuration
 *
 * @example
 * ```typescript
 * // Protect dashboard - require authentication
 * onMount(() => {
 *   applyRouteGuard({ requireAuth: true });
 * });
 *
 * // Protect auth page - redirect if authenticated
 * onMount(() => {
 *   applyRouteGuard({ redirectIfAuth: true });
 * });
 * ```
 */
export function applyRouteGuard(config: RouteGuardConfig = {}): boolean {
	if (typeof window === 'undefined') return true; // SSR

	const {
		requireAuth: needsAuth = false,
		redirectIfAuth = false,
		authRedirect = '/dash',
		noAuthRedirect = '/auth'
	} = config;

	const authenticated = isAuthenticated();

	// Redirect authenticated users away from public pages
	if (redirectIfAuth && authenticated) {
		window.location.href = authRedirect;
		return false;
	}

	// Redirect unauthenticated users to auth page
	if (needsAuth && !authenticated) {
		window.location.href = noAuthRedirect;
		return false;
	}

	return true;
}
