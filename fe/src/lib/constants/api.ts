import { API_URL } from './env';

// API Endpoints - Matches backend implementation
export const API_ENDPOINTS = {
	auth: {
		github: `${API_URL}/api/auth/github`,
		githubCallback: `${API_URL}/api/auth/github/callback`,
		me: `${API_URL}/api/auth/me`,
		logout: `${API_URL}/api/auth/logout`,
		twoFactorVerify: `${API_URL}/api/auth/2fa/verify`
	},
	repo: {
		list: `${API_URL}/api/repositories`
		// Note: sync endpoint not yet implemented in backend
	},
	deploy: {
		list: `${API_URL}/api/deployments`,
		create: `${API_URL}/api/v1/deploy`,
		checkSubdomain: `${API_URL}/api/v1/deploy/check-subdomain`,
		details: (id: string) => `${API_URL}/api/deployments/${id}`,
		delete: (id: string) => `${API_URL}/api/deployments/${id}`
	},
	settings: {
		base: `${API_URL}/api/settings`,
		twoFactorInitiate: `${API_URL}/api/settings/2fa/initiate`,
		twoFactorVerify: `${API_URL}/api/settings/2fa/verify`,
		twoFactorDisable: `${API_URL}/api/settings/2fa/disable`
	},
	notifications: {
		email: `${API_URL}/api/notifications/email`
	},
	git: {
		webhook: (token: string) => `${API_URL}/api/git/webhook/${token}`
	}
} as const;
