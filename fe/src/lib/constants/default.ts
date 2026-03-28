import type { UserType } from '$lib/types/user';

export const localUser: UserType = {
	id: 'local-dev',
	username: 'Local Dev',
	email: 'dev@localhost',
	avatarUrl: '',
	createdAt: new Date(),
	githubId: '',
	lastLoginAt: new Date(),
	twoFactorEnabled: false,
	twoFactorEmail: undefined
};
