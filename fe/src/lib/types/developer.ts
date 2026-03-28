export type AzureConfig = {
	accountName: string;
	containerName: string;
	sasToken: string;
};

export type CloudflareConfig = {
	accountId: string;
	apiToken: string;
	namespaceId: string;
};

export type DomainEntry = {
	id: string;
	domain: string;
	target?: string;
};

export type DeveloperConfig = {
	azure: AzureConfig;
	cloudflare: CloudflareConfig;
	domains: DomainEntry[];
};
