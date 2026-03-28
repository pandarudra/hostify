export interface UserType {
	id: string;
	username: string;
	email: string;
	avatarUrl?: string;
	createdAt: Date;
	githubId?: string;
	lastLoginAt: Date;
	twoFactorEmail?: string;
	twoFactorEnabled: boolean;
}
