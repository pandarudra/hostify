export const ROUTES = {
	home: '/',
	auth: '/auth',
	dashboard: '/dash',
	deploy: '/deploy',
	settings: '/settings',
	developerSettings: '/settings/developer'
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
