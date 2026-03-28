export interface RepositoryType {
	cloneUrl: string;
	defaultBranch: string;
	description: string | null;
	id: string;
	fullName: string;
	htmlUrl: string;
	isDeployed: boolean;
	isPrivate: boolean;
	language: string | null;
	name: string;
	owner: string;
	stars: number;
	updatedAt: Date;
}
export interface DeploymentType {
	branch: string;
	createdAt: Date;
	deploymentUrl: string;
	id: string;
	lastDeployedAt: Date;
	repoName: string;
	repoUrl: string;
	status: 'active' | 'inactive' | 'failed' | 'deploying';
	repoOwner: string;
	subdomain: string;
	webhookUrl: string;
}
