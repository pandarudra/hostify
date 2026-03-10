import { API_URL } from './env';

// API Endpoints - Matches backend implementation
export const API_ENDPOINTS = {
	auth: {
		github: `${API_URL}/api/auth/github`,
		githubCallback: `${API_URL}/api/auth/github/callback`,
		me: `${API_URL}/api/auth/me`,
		logout: `${API_URL}/api/auth/logout`
	},
	repo: {
		list: `${API_URL}/api/repositories`
		// Note: sync endpoint not yet implemented in backend
	},
	deploy: {
		list: `${API_URL}/api/deployments`,
		create: `${API_URL}/api/v1/deploy`,
		details: (id: string) => `${API_URL}/api/deployments/${id}`,
		delete: (id: string) => `${API_URL}/api/deployments/${id}`
	},
	git: {
		webhook: (token: string) => `${API_URL}/api/git/webhook/${token}`
	}
} as const;
