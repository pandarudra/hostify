import type { DeploymentType } from './gh';

export interface DeploymentResultType {
	success: boolean;
	message: string;
	url?: string;
}
export interface DeploymentHistoryType {
	deployingCount: number;
	deployments: DeploymentType[];
	failedCount: number;
	fullName: string;
	liveCount: number;
	repoName: string;
	repoUrl: string;
	totalCount: number;
}
